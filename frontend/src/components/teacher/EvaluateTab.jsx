import React, { useEffect, useState } from "react";

function EvaluateTab({ backend, headers, classId }) {
  const [topics, setTopics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState({});
  const [messagesMap, setMessagesMap] = useState({});
  const [gptInterventionsMap, setGptInterventionsMap] = useState({});
  const [filterSenderMap, setFilterSenderMap] = useState({});
  const [targetStudentMap, setTargetStudentMap] = useState({});
  const [evaluationMap, setEvaluationMap] = useState({});
  const [isEvaluatingMap, setIsEvaluatingMap] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [studentsMap, setStudentsMap] = useState({});

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const evaluateApi = import.meta.env.VITE_EVALUATE_API;

  useEffect(() => {
    // 주제 목록 가져오기
    fetch(`${backend}/topics?class_id=eq.${classId}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        setTopics(data);
        
        // 초기 확장 상태 설정
        const initialExpanded = {};
        data.forEach(topic => {
          initialExpanded[topic.topic_id] = true; // 기본적으로 모두 펼침
        });
        setExpandedTopics(initialExpanded);
      });

    // 방 목록 가져오기
    fetch(`${backend}/rooms`, { headers })
      .then((res) => res.json())
      .then((data) => {
        // 방 목록 정렬
        const sortedData = data.sort((a, b) => {
          const getGroupNumber = (title) => {
            const match = title.match(/조\s*(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          
          const aNum = getGroupNumber(a.title);
          const bNum = getGroupNumber(b.title);
          return aNum - bNum;
        });
        
        setRooms(sortedData);
      });
  }, [classId]);

  const toggleTopic = (topicId) => {
    setExpandedTopics({
      ...expandedTopics,
      [topicId]: !expandedTopics[topicId]
    });
  };

  const selectRoom = async (room) => {
    // 이미 선택된 방이면 선택 취소
    if (selectedRooms[room.topic_id] === room.room_id) {
      const newSelectedRooms = { ...selectedRooms };
      delete newSelectedRooms[room.topic_id];
      setSelectedRooms(newSelectedRooms);
      return;
    }
    
    // 방 선택 상태 업데이트
    setSelectedRooms({
      ...selectedRooms,
      [room.topic_id]: room.room_id
    });
    
    // 메시지 가져오기
    await fetchMessages(room);
    
    // GPT 개입 로그 가져오기
    await fetchGptInterventions(room);
    
    // 평가 결과 가져오기
    await fetchEvaluation(room, targetStudentMap[room.room_id] || "");
  };

  const fetchMessages = async (room) => {
    try {
      const res = await fetch(
        `${backend}/messages?room_id=eq.${room.room_id}&order=timestamp.asc`,
        { headers }
      );
      const data = await res.json();
      
      setMessagesMap({
        ...messagesMap,
        [room.room_id]: data
      });
      
      // 학생 ID 추출
      const studentIds = new Set();
      data.forEach(msg => {
        if (msg.sender_id && msg.sender_id !== "gpt") {
          studentIds.add(msg.sender_id);
        }
      });
      
      // 학생 정보 가져오기 (이미 있는 ID는 제외)
      if (studentIds.size > 0) {
        const idsToFetch = Array.from(studentIds).filter(id => !studentsMap[id]);
        
        if (idsToFetch.length > 0) {
          try {
            const studentsUrl = `${supabaseUrl}/rest/v1/students?student_id=in.(${idsToFetch.join(',')})`;
            const studentsRes = await fetch(studentsUrl, {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            });
            
            const studentsData = await studentsRes.json();
            const newStudentsMap = { ...studentsMap };
            
            studentsData.forEach(student => {
              newStudentsMap[student.student_id] = student.name || `학생 ${student.student_id}`;
            });
            
            // 이름이 없는 학생은 기본값 설정
            idsToFetch.forEach(id => {
              if (!newStudentsMap[id]) {
                newStudentsMap[id] = `학생 ${id}`;
              }
            });
            
            setStudentsMap(newStudentsMap);
            console.log("학생 정보 로드 완료:", newStudentsMap);
          } catch (error) {
            console.error("학생 정보 로드 실패:", error);
          }
        }
      }
    } catch (error) {
      console.error("메시지 가져오기 실패:", error);
    }
  };
  
  const fetchGptInterventions = async (room) => {
    try {
      const url = `${supabaseUrl}/rest/v1/gpt_interventions?room_id=eq.${room.room_id}&order=timestamp.asc`;
      const res = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      const data = await res.json();
      
      setGptInterventionsMap({
        ...gptInterventionsMap,
        [room.room_id]: data
      });
      
      console.log("GPT 개입 로그:", data);
    } catch (error) {
      console.error("GPT 개입 로그 가져오기 실패:", error);
    }
  };

  const fetchEvaluation = async (room, student = "") => {
    const studentParam = student
      ? `&student_id=eq.${student}`
      : `&student_id=is.null`;

    const url = `${supabaseUrl}/gpt_chat_evaluations?room_id=eq.${room.room_id}${studentParam}&order=created_at.desc&limit=1`;

    try {
      const res = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      const data = await res.json();
      
      setEvaluationMap({
        ...evaluationMap,
        [room.room_id + (student || '')]: data[0]?.summary || ""
      });
    } catch (err) {
      console.error("❌ 평가 결과 조회 실패:", err);
      
      setEvaluationMap({
        ...evaluationMap,
        [room.room_id + (student || '')]: ""
      });
    }
  };

  const updateRubric = async (topicId) => {
    const newPrompt = document.getElementById(`rubric-${topicId}`).value;
    if (!newPrompt.trim()) {
      alert("루브릭 프롬프트를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch(`${backend}/topics?topic_id=eq.${topicId}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ rubric_prompt: newPrompt }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ 루브릭 수정 실패:", text);
        alert("❌ 루브릭 수정 실패: " + text);
        return;
      }

      // 상태 업데이트
      setTopics(topics.map(topic => 
        topic.topic_id === topicId 
          ? {...topic, rubric_prompt: newPrompt} 
          : topic
      ));

      alert("✅ 루브릭이 성공적으로 수정되었습니다.");
    } catch (err) {
      console.error("❌ 루브릭 수정 예외:", err);
      alert("❌ 루브릭 수정 중 오류가 발생했습니다.");
    }
  };

  const setFilterSender = (roomId, value) => {
    setFilterSenderMap({
      ...filterSenderMap,
      [roomId]: value
    });
  };

  const setTargetStudent = (roomId, value) => {
    setTargetStudentMap({
      ...targetStudentMap,
      [roomId]: value
    });
    
    // 방 정보 가져오기
    const roomInfo = rooms.find(r => r.room_id === roomId);
    if (roomInfo) {
      fetchEvaluation(roomInfo, value);
    }
  };

  const evaluateWithGPT = async (roomId, topicId) => {
    // 로딩 상태 설정
    setIsEvaluatingMap({
      ...isEvaluatingMap,
      [roomId]: true
    });
    
    // 임시 메시지 설정
    setEvaluationMap({
      ...evaluationMap,
      [roomId + (targetStudentMap[roomId] || '')]: "GPT가 평가 중입니다..."
    });

    try {
      const topic = topics.find((t) => t.topic_id === topicId);
      if (!topic?.rubric_prompt) {
        alert("⚠️ 해당 토픽에 루브릭 프롬프트가 없습니다.");
        setIsEvaluatingMap({
          ...isEvaluatingMap,
          [roomId]: false
        });
        return;
      }

      const targetStudent = targetStudentMap[roomId] || "";
      const messages = messagesMap[roomId] || [];
      
      const filteredMessages = !targetStudent
        ? messages
        : messages.filter((m) => m.sender_id === targetStudent);

      const res = await fetch(`${evaluateApi}/evaluate-chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          topic_id: topic.topic_id,
          rubric_prompt: topic.rubric_prompt,
          room_id: roomId,
          class_id: topic.class_id,
          target_student: targetStudent || null,
          messages: filteredMessages.map((m) => ({
            sender_id: m.sender_id,
            message: m.message,
          })),
        }),
      });

      const raw = await res.text();
      const result = JSON.parse(raw);
      
      setEvaluationMap({
        ...evaluationMap,
        [roomId + (targetStudent || '')]: result.feedback || "📭 GPT 평가 결과 없음"
      });
    } catch (error) {
      console.error("GPT 평가 오류:", error);
      
      setEvaluationMap({
        ...evaluationMap,
        [roomId + (targetStudentMap[roomId] || '')]: "❌ GPT 평가 요청 중 오류가 발생했습니다."
      });
    }

    // 로딩 상태 해제
    setIsEvaluatingMap({
      ...isEvaluatingMap,
      [roomId]: false
    });
  };

  // 특정 방의 메시지들에서 보낸 사람 목록 가져오기
  const getSenders = (roomId) => {
    const messages = messagesMap[roomId] || [];
    return [...new Set(messages.map((m) => m.sender_id))];
  };

  // 학생 ID로 이름 가져오기
  const getStudentName = (id) => {
    if (!id) return "알 수 없음";
    if (id === "gpt") return "GPT 어시스턴트";
    return studentsMap[id] || id; // 학생 이름 또는 ID 반환
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>채팅방 평가</h3>
      
      {topics.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📊</div>
          <p style={styles.emptyText}>평가할 채팅방이 없습니다.</p>
          <p style={styles.emptySubtext}>
            먼저 '채팅방 생성' 탭에서 채팅방을 만들어보세요.
          </p>
        </div>
      ) : (
        <div style={styles.topicList}>
          {topics
            .filter((t) => rooms.some((r) => r.topic_id === t.topic_id))
            .map((topic) => (
              <div key={topic.topic_id} style={styles.topicCard}>
                <div 
                  style={styles.topicHeader}
                  onClick={() => toggleTopic(topic.topic_id)}
                >
                  <div style={styles.topicInfo}>
                    <h4 style={styles.topicTitle}>{topic.title}</h4>
                    <span style={styles.roomCount}>
                      채팅방 {rooms.filter(r => r.topic_id === topic.topic_id).length}개
                    </span>
                  </div>
                  <div style={styles.expandIcon}>
                    {expandedTopics[topic.topic_id] ? '▼' : '▶'}
                  </div>
                </div>
                
                {expandedTopics[topic.topic_id] && (
                  <div style={styles.topicContent}>
                    <div style={styles.rubricSection}>
                      <label style={styles.rubricLabel}>
                        평가 루브릭 프롬프트
                      </label>
                      <textarea
                        id={`rubric-${topic.topic_id}`}
                        defaultValue={topic.rubric_prompt}
                        style={styles.textarea}
                        placeholder="학생들의 대화를 평가하기 위한 기준을 입력하세요"
                      />
                      <button 
                        onClick={() => updateRubric(topic.topic_id)} 
                        style={styles.updateButton}
                      >
                        루브릭 업데이트
                      </button>
                    </div>
                    
                    <div style={styles.roomsSection}>
                      <h5 style={styles.roomsTitle}>채팅방 목록</h5>
                      <div style={styles.roomList}>
                        {rooms
                          .filter((r) => r.topic_id === topic.topic_id)
                          .map((room) => (
                            <button
                              key={room.room_id}
                              onClick={() => selectRoom(room)}
                              style={{
                                ...styles.roomButton,
                                backgroundColor: selectedRooms[topic.topic_id] === room.room_id ? "#E0F1FD" : "#F8F8F8",
                                borderColor: selectedRooms[topic.topic_id] === room.room_id ? "#0095F6" : "#DBDBDB",
                                color: selectedRooms[topic.topic_id] === room.room_id ? "#0095F6" : "#262626"
                              }}
                            >
                              {room.title}
                            </button>
                          ))}
                      </div>
                    </div>
                    
                    {/* 선택된 채팅방이 있고, 현재 주제에 속한다면 보여줌 */}
                    {selectedRooms[topic.topic_id] && (
                      <RoomDetail
                        room={rooms.find(r => r.room_id === selectedRooms[topic.topic_id])}
                        messages={messagesMap[selectedRooms[topic.topic_id]] || []}
                        gptInterventions={gptInterventionsMap[selectedRooms[topic.topic_id]] || []}
                        filterSender={filterSenderMap[selectedRooms[topic.topic_id]] || ""}
                        setFilterSender={(value) => setFilterSender(selectedRooms[topic.topic_id], value)}
                        targetStudent={targetStudentMap[selectedRooms[topic.topic_id]] || ""}
                        setTargetStudent={(value) => setTargetStudent(selectedRooms[topic.topic_id], value)}
                        evaluation={evaluationMap[selectedRooms[topic.topic_id] + (targetStudentMap[selectedRooms[topic.topic_id]] || '')] || ""}
                        isEvaluating={isEvaluatingMap[selectedRooms[topic.topic_id]] || false}
                        evaluateWithGPT={() => evaluateWithGPT(selectedRooms[topic.topic_id], topic.topic_id)}
                        senders={getSenders(selectedRooms[topic.topic_id])}
                        formatStudentName={getStudentName}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// 채팅방 상세 컴포넌트로 분리
function RoomDetail({ 
  room, 
  messages, 
  gptInterventions,
  filterSender, 
  setFilterSender,
  targetStudent,
  setTargetStudent,
  evaluation,
  isEvaluating,
  evaluateWithGPT,
  senders,
  formatStudentName
}) {
  if (!room) return null;
  
  // 학생 이름 가져오기 함수 - props에서 받은 함수가 없으면 내부 구현 사용
  const getStudentName = (id) => {
    // 상위 컴포넌트에서 함수를 받았으면 사용
    if (formatStudentName) {
      return formatStudentName(id);
    }
    
    // 기본 구현
    if (!id) return "알 수 없음";
    if (id === "gpt") return "GPT 어시스턴트";
    
    // 학생 ID에서 번호 추출
    const match = id.match(/\d+$/);
    if (match) return `학생 ${match[0]}`;
    
    return id;
  };
  
  // 메시지 ID별로 개입 로그 매핑
  const interventionsByMessageId = {};
  
  // gptInterventions이 배열인지 확인
  if (Array.isArray(gptInterventions)) {
    gptInterventions.forEach(intervention => {
      if (intervention && intervention.message_id) {
        interventionsByMessageId[intervention.message_id] = intervention;
      }
    });
  }
  
  // 안전하게 messages 확인
  const safeMessages = Array.isArray(messages) ? messages : [];
  
  return (
    <div style={styles.chatBox}>
      <h4 style={styles.chatTitle}>💬 {room.title} 대화 내용</h4>

      {/* 화자 필터 */}
      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>화자 필터:</label>
        <select
          value={filterSender}
          onChange={(e) => setFilterSender(e.target.value)}
          style={styles.select}
        >
          <option value="">전체 보기</option>
          {senders.map((s) => (
            <option key={s} value={s}>
              {getStudentName(s)}
            </option>
          ))}
        </select>
      </div>

      {/* 메시지 출력 */}
      <div style={styles.messageList}>
        {safeMessages.length === 0 ? (
          <div style={styles.noMessages}>
            아직 대화 내용이 없습니다.
          </div>
        ) : (
          safeMessages
            .filter((m) => !filterSender || m.sender_id === filterSender)
            .map((message, i) => {
              try {
                // 필수 필드 확인
                if (!message || typeof message !== 'object') {
                  return null; // 잘못된 메시지 형식은 건너뜀
                }
                
                // 이 메시지가 GPT의 응답이라면 reasoning 정보와 개입 유형 표시
                const isGptMessage = message.sender_id === "gpt";
                const intervention = message.message_id ? interventionsByMessageId[message.message_id] : null;
                
                return (
                  <div key={i} style={isGptMessage ? styles.gptMessageItem : styles.messageItem}>
                    <div style={styles.messageSender}>
                      {getStudentName(message.sender_id)}
                    </div>
                    
                    {/* GPT 메시지의 경우 판단 근거와 개입 유형 표시 */}
                    {isGptMessage && message.reasoning && (
                      <div style={styles.gptReasoning}>
                        <span style={styles.reasoningLabel}>GPT 판단 근거:</span> {message.reasoning}
                      </div>
                    )}
                    
                    {/* 메시지 내용 */}
                    <div style={styles.messageContent}>{message.message || ""}</div>
                    
                    {/* 개입 로그에서 추가 정보 가져오기 */}
                    {isGptMessage && intervention && (
                      <div style={styles.interventionInfo}>
                        <div style={styles.interventionBadge}>
                          개입 유형: 
                          <span style={{
                            ...styles.interventionType,
                            backgroundColor: getInterventionColor(intervention.intervention_type)
                          }}>
                            {getInterventionLabel(intervention.intervention_type)}
                          </span>
                        </div>
                        
                        {intervention.target_student && (
                          <div style={styles.targetStudent}>
                            대상 학생: {getStudentName(intervention.target_student)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 귓속말 표시 */}
                    {message.whisper_to && (
                      <div style={styles.whisperBadge}>
                        귓속말: {getStudentName(message.whisper_to)}
                      </div>
                    )}
                  </div>
                );
              } catch (error) {
                console.error("메시지 렌더링 오류:", error, message);
                return (
                  <div key={i} style={styles.errorMessage}>
                    메시지 표시 중 오류가 발생했습니다.
                  </div>
                );
              }
            })
            .filter(Boolean) // null 항목 제거
        )}
      </div>

      {/* 평가 대상 + 평가 버튼 */}
      <div style={styles.evaluationSection}>
        <h5 style={styles.evaluationTitle}>GPT 평가</h5>
        
        <div style={styles.filterRow}>
          <label style={styles.filterLabel}>평가 대상:</label>
          <select
            value={targetStudent}
            onChange={(e) => setTargetStudent(e.target.value)}
            style={styles.select}
          >
            <option value="">전체 학생</option>
            {senders.map((s) => (
              <option key={s} value={s}>
                {getStudentName(s)}
              </option>
            ))}
          </select>

          <button
            onClick={evaluateWithGPT}
            disabled={isEvaluating}
            style={styles.evaluateButton}
          >
            {isEvaluating
              ? "평가 중..."
              : `GPT로 평가하기 ${targetStudent ? `(${getStudentName(targetStudent)})` : ''}`}
          </button>
        </div>

        {/* 평가 결과 */}
        {evaluation ? (
          <div style={styles.evaluationBox}>
            <h6 style={styles.evaluationResultTitle}>GPT 평가 결과</h6>
            <div style={styles.evaluationContent}>{evaluation}</div>
          </div>
        ) : (
          !isEvaluating && (
            <div style={styles.noEvaluation}>
              아직 평가 결과가 없습니다.
            </div>
          )
        )}
      </div>
    </div>
  );
}

// 개입 유형에 따른 색상 반환
function getInterventionColor(type) {
  if (!type) return '#9E9E9E'; // 기본값
  
  switch (type) {
    case 'positive':
      return '#4CAF50'; // 녹색
    case 'guidance':
      return '#2196F3'; // 파란색
    case 'individual':
      return '#FF9800'; // 주황색
    default:
      return '#9E9E9E'; // 회색
  }
}

// 개입 유형에 따른 레이블 반환
function getInterventionLabel(type) {
  if (!type) return '알 수 없음';
  
  switch (type) {
    case 'positive':
      return '긍정 피드백';
    case 'guidance':
      return '방향 제시';
    case 'individual':
      return '개인 피드백';
    default:
      return type;
  }
}

const styles = {
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    padding: "16px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#262626",
    marginBottom: "16px",
    borderBottom: "1px solid #DBDBDB",
    paddingBottom: "16px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    backgroundColor: "#FAFAFA",
    borderRadius: "8px",
    border: "1px solid #DBDBDB",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#262626",
    margin: "0 0 8px 0",
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#8E8E8E",
    margin: "0",
    textAlign: "center",
  },
  topicList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  topicCard: {
    border: "1px solid #DBDBDB",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  topicHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "#FAFAFA",
    borderBottom: "1px solid #DBDBDB",
    cursor: "pointer",
  },
  topicInfo: {
    display: "flex",
    flexDirection: "column",
  },
  topicTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#262626",
    margin: "0 0 4px 0",
  },
  roomCount: {
    fontSize: "12px",
    color: "#8E8E8E",
  },
  expandIcon: {
    color: "#8E8E8E",
    fontSize: "12px",
  },
  topicContent: {
    padding: "16px",
  },
  rubricSection: {
    marginBottom: "20px",
  },
  rubricLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#262626",
    marginBottom: "8px",
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #DBDBDB",
    borderRadius: "4px",
    backgroundColor: "#FAFAFA",
    marginBottom: "8px",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  updateButton: {
    backgroundColor: "#0095F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  roomsSection: {
    marginBottom: "20px",
    borderTop: "1px solid #EFEFEF",
    paddingTop: "16px",
  },
  roomsTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#262626",
    margin: "0 0 12px 0",
  },
  roomList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  roomButton: {
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #DBDBDB",
    backgroundColor: "#F8F8F8",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  chatBox: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DBDBDB",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "16px",
  },
  chatTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#262626",
    marginBottom: "16px",
    borderBottom: "1px solid #EFEFEF",
    paddingBottom: "8px",
  },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  filterLabel: {
    fontSize: "14px",
    color: "#262626",
    fontWeight: "500",
  },
  select: {
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #DBDBDB",
    backgroundColor: "#FAFAFA",
    fontSize: "14px",
    color: "#262626",
  },
  messageList: {
    backgroundColor: "#FAFAFA",
    borderRadius: "8px",
    border: "1px solid #EFEFEF",
    padding: "16px",
    maxHeight: "300px",
    overflowY: "auto",
    marginBottom: "16px",
  },
  noMessages: {
    fontSize: "14px",
    color: "#8E8E8E",
    fontStyle: "italic",
    textAlign: "center",
    padding: "16px",
  },
  messageItem: {
    marginBottom: "12px",
    borderBottom: "1px solid #EFEFEF",
    paddingBottom: "8px",
  },
  messageSender: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#262626",
    marginBottom: "4px",
  },
  messageContent: {
    fontSize: "14px",
    color: "#262626",
    lineHeight: "1.4",
  },
  evaluationSection: {
    borderTop: "1px solid #EFEFEF",
    paddingTop: "16px",
  },
  evaluationTitle: {
    fontSize: "16px",
    fontWeight: "600", 
    color: "#262626",
    marginBottom: "12px",
    margin: "0 0 12px 0",
  },
  evaluateButton: {
    backgroundColor: "#0095F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginLeft: "auto",
  },
  evaluationBox: {
    backgroundColor: "#F9F9F9",
    border: "1px solid #EFEFEF",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "12px",
  },
  evaluationResultTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#262626",
    marginBottom: "8px",
    margin: "0 0 8px 0",
  },
  evaluationContent: {
    fontSize: "14px",
    color: "#262626",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
  },
  noEvaluation: {
    fontSize: "14px",
    color: "#8E8E8E",
    fontStyle: "italic",
    textAlign: "center",
    padding: "16px",
    backgroundColor: "#F9F9F9",
    borderRadius: "8px",
    marginTop: "12px",
  },
  gptMessageItem: {
    marginBottom: "12px",
    borderBottom: "1px solid #EFEFEF",
    paddingBottom: "12px",
    backgroundColor: "#F1F8FF",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #E1ECFF",
  },
  gptReasoning: {
    fontSize: "12px",
    color: "#666666",
    backgroundColor: "#F9F9F9",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "8px",
    border: "1px dashed #E0E0E0",
  },
  reasoningLabel: {
    fontWeight: "600",
    color: "#444444",
  },
  interventionInfo: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
  },
  interventionBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#333333",
  },
  interventionType: {
    padding: "2px 8px",
    borderRadius: "12px",
    color: "white",
    fontWeight: "500",
    fontSize: "11px",
  },
  targetStudent: {
    fontSize: "12px",
    color: "#555555",
    backgroundColor: "#F5F5F5",
    padding: "2px 8px",
    borderRadius: "12px",
  },
  whisperBadge: {
    fontSize: "11px",
    fontStyle: "italic",
    color: "#9C27B0",
    marginTop: "4px",
  },
  errorMessage: {
    marginBottom: "12px",
    padding: "10px",
    borderRadius: "4px",
    backgroundColor: "#FFEBEE",
    color: "#D32F2F",
    border: "1px solid #FFCDD2",
    fontSize: "14px",
  },
};

export default EvaluateTab;