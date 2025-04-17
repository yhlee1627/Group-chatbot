import React, { useEffect, useState } from "react";

function ManageTab({ backend, headers, classId }) {
  const [topics, setTopics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // 방 목록 가져오기 함수 분리
  const fetchRooms = async () => {
    try {
      const res = await fetch(`${backend}/rooms`, { headers });
      const data = await res.json();
      
      // 조 번호 순서대로 정렬
      const sortedData = data.sort((a, b) => {
        // "주제 - 조 1", "주제 - 조 2" 형식에서 조 번호 추출
        const getGroupNumber = (title) => {
          const match = title.match(/조\s*(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        
        const aNum = getGroupNumber(a.title);
        const bNum = getGroupNumber(b.title);
        return aNum - bNum;
      });
      
      setRooms(sortedData);
    } catch (error) {
      console.error("채팅방 목록을 불러오는 중 오류 발생:", error);
    }
  };
  
  const fetchTopics = async () => {
    try {
      const res = await fetch(`${backend}/topics?class_id=eq.${classId}`, { headers });
      const data = await res.json();
      setTopics(data);
      
      // 초기 확장 상태 설정
      const initialExpanded = {};
      data.forEach(topic => {
        initialExpanded[topic.topic_id] = true; // 기본적으로 모두 펼침
      });
      setExpandedTopics(initialExpanded);
      
    } catch (error) {
      console.error("주제 목록을 불러오는 중 오류 발생:", error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchTopics(), fetchRooms()])
      .finally(() => setIsLoading(false));
  }, [classId]);

  const updatePrompt = async (topicId) => {
    const newPrompt = document.getElementById(`prompt-${topicId}`).value;
    if (!newPrompt.trim()) {
      alert("프롬프트를 입력해주세요.");
      return;
    }
    
    try {
      await fetch(`${backend}/topics?topic_id=eq.${topicId}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ system_prompt: newPrompt }),
      });
      alert("✅ 시스템 프롬프트 수정 완료!");
      
      // 상태 업데이트
      setTopics(topics.map(topic => 
        topic.topic_id === topicId 
          ? {...topic, system_prompt: newPrompt} 
          : topic
      ));
    } catch (error) {
      console.error("프롬프트 업데이트 중 오류 발생:", error);
      alert("❌ 프롬프트 수정 실패!");
    }
  };

  const deleteRoom = async (roomId, roomTitle) => {
    if (!window.confirm(`'${roomTitle}' 채팅방을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    
    try {
      await fetch(`${backend}/messages?room_id=eq.${roomId}`, { method: "DELETE", headers });
      await fetch(`${backend}/rooms?room_id=eq.${roomId}`, { method: "DELETE", headers });
      alert("✅ 채팅방 삭제 완료!");
      
      // 상태 직접 업데이트
      setRooms(rooms.filter(room => room.room_id !== roomId));
    } catch (error) {
      console.error("채팅방 삭제 중 오류 발생:", error);
      alert("❌ 채팅방 삭제 실패!");
    }
  };

  // 주어진 topic에 연결된 채팅방이 있는지 확인
  const hasRooms = (topicId) => {
    return rooms.some((room) => room.topic_id === topicId);
  };
  
  // 토픽 확장/축소 토글
  const toggleTopic = (topicId) => {
    setExpandedTopics({
      ...expandedTopics,
      [topicId]: !expandedTopics[topicId]
    });
  };
  
  // 주제에 속한 채팅방 개수 계산
  const getRoomCount = (topicId) => {
    return rooms.filter(room => room.topic_id === topicId).length;
  };
  
  // 특정 토픽의 채팅방 목록을 조 번호 순서대로 정렬해서 반환
  const getSortedRooms = (topicId) => {
    const topicRooms = rooms.filter(room => room.topic_id === topicId);
    
    return topicRooms.sort((a, b) => {
      // "주제 - 조 1", "주제 - 조 2" 형식에서 조 번호 추출
      const getGroupNumber = (title) => {
        const match = title.match(/조\s*(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const aNum = getGroupNumber(a.title);
      const bNum = getGroupNumber(b.title);
      return aNum - bNum;
    });
  };

  if (isLoading) {
    return <div style={styles.loading}>채팅방 목록을 불러오는 중...</div>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>채팅방 관리</h3>
      
      {topics.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📝</div>
          <p style={styles.emptyText}>아직 생성된 채팅방이 없습니다.</p>
          <p style={styles.emptySubtext}>
            '채팅방 생성' 탭에서 새 채팅방을 만들어보세요.
          </p>
        </div>
      ) : (
        <div style={styles.topicList}>
          {topics
            .filter((t) => hasRooms(t.topic_id))
            .map((topic) => (
              <div key={topic.topic_id} style={styles.topicCard}>
                <div 
                  style={styles.topicHeader}
                  onClick={() => toggleTopic(topic.topic_id)}
                >
                  <div style={styles.topicInfo}>
                    <h4 style={styles.topicTitle}>{topic.title}</h4>
                    <span style={styles.roomCount}>
                      채팅방 {getRoomCount(topic.topic_id)}개
                    </span>
                  </div>
                  <div style={styles.expandIcon}>
                    {expandedTopics[topic.topic_id] ? '▼' : '▶'}
                  </div>
                </div>
                
                {expandedTopics[topic.topic_id] && (
                  <div style={styles.topicContent}>
                    <div style={styles.promptSection}>
                      <label style={styles.promptLabel}>
                        AI 시스템 프롬프트
                      </label>
                      <textarea
                        id={`prompt-${topic.topic_id}`}
                        defaultValue={topic.system_prompt}
                        style={styles.textarea}
                        placeholder="AI 보조교사의 역할을 설명하는 프롬프트를 입력하세요"
                      />
                      <button 
                        onClick={() => updatePrompt(topic.topic_id)} 
                        style={styles.updateButton}
                      >
                        프롬프트 업데이트
                      </button>
                    </div>
                    
                    <div style={styles.roomsSection}>
                      <h5 style={styles.roomsTitle}>채팅방 목록</h5>
                      {getSortedRooms(topic.topic_id).map((room) => (
                        <div key={room.room_id} style={styles.roomItem}>
                          <div style={styles.roomIcon}>💬</div>
                          <span style={styles.roomTitle}>{room.title}</span>
                          <button 
                            onClick={() => deleteRoom(room.room_id, room.title)} 
                            style={styles.deleteButton}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
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
  loading: {
    padding: "24px",
    textAlign: "center",
    color: "#8E8E8E",
    fontSize: "14px",
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
  promptSection: {
    marginBottom: "16px",
  },
  promptLabel: {
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
    marginTop: "16px",
    borderTop: "1px solid #EFEFEF",
    paddingTop: "16px",
  },
  roomsTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#262626",
    margin: "0 0 12px 0",
  },
  roomItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    borderRadius: "4px",
    backgroundColor: "#FAFAFA",
    marginBottom: "8px",
  },
  roomIcon: {
    marginRight: "12px",
    fontSize: "16px",
  },
  roomTitle: {
    flex: 1,
    fontSize: "14px",
    color: "#262626",
  },
  deleteButton: {
    backgroundColor: "transparent",
    color: "#ED4956",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "4px 8px",
  },
};

export default ManageTab;