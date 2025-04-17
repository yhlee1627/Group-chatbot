import React, { useEffect, useState } from "react";
import SectionTitle from "./shared/SectionTitle";
import ClassDropdown from "./shared/ClassDropdown";

function RoomTab({ backend, headers, classes, selectedClassId, setSelectedClassId, topics }) {
  const [rooms, setRooms] = useState([]);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedClassId && topics.length > 0) fetchRoomsByClass();
  }, [selectedClassId, topics]);

  const fetchRoomsByClass = async () => {
    const topicIds = topics
      .filter((t) => t.class_id === selectedClassId)
      .map((t) => `topic_id.eq.${t.topic_id}`);

    if (topicIds.length === 0) {
      setRooms([]);
      return;
    }

    const filter = topicIds.join(",");
    try {
      const res = await fetch(`${backend}/rooms?or=(${filter})`, { headers });
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("❌ rooms 응답이 배열이 아님:", data);
        setRooms([]);
        return;
      }

      setRooms(data);
    } catch (err) {
      console.error("❌ 채팅방 불러오기 오류:", err);
      setRooms([]);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm("정말 이 채팅방을 삭제하시겠습니까?")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const res = await fetch(`${backend}/rooms?room_id=eq.${roomId}`, {
        method: "DELETE",
        headers,
      });
      
      if (res.ok) {
        alert("✅ 채팅방이 삭제되었습니다.");
        fetchRoomsByClass();
      } else {
        alert("❌ 채팅방 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 채팅방 삭제 오류:", error);
      alert("채팅방 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getTopicName = (topicId) => {
    const topic = topics.find(t => t.topic_id === topicId);
    return topic ? topic.name : '알 수 없는 주제';
  };
  
  const getGroupNumber = (room) => {
    // 방 제목에서 조 번호 추출 (예: "3조 토론방" -> 3)
    const titleMatch = room.title && room.title.match(/^(\d+)조/);
    if (titleMatch) {
      return parseInt(titleMatch[1], 10);
    }
    
    // room_id에서 조 번호 추출 (예: "r3-1" -> 3)
    const idMatch = room.room_id && room.room_id.match(/^r(\d+)-/);
    if (idMatch) {
      return parseInt(idMatch[1], 10);
    }
    
    return 0; // 기본값
  };
  
  // 주제별로 채팅방 그룹화
  const getRoomsByTopic = () => {
    // 먼저 각 방을 관련 주제 아래에 그룹화
    const roomsByTopic = {};
    
    // 선택된 클래스의 주제들을 미리 준비
    const classTopics = topics.filter(t => t.class_id === selectedClassId);
    
    // 각 주제에 대한 빈 배열 초기화
    classTopics.forEach(topic => {
      roomsByTopic[topic.topic_id] = {
        topicName: topic.name,
        rooms: []
      };
    });
    
    // 각 방을 해당 주제 그룹에 추가
    rooms.forEach(room => {
      if (roomsByTopic[room.topic_id]) {
        roomsByTopic[room.topic_id].rooms.push(room);
      }
    });
    
    return roomsByTopic;
  };
  
  const toggleRoomExpand = (roomId) => {
    setExpandedRoom(expandedRoom === roomId ? null : roomId);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 주제별 그룹화된 채팅방 데이터
  const roomsByTopic = getRoomsByTopic();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <SectionTitle>채팅방 관리</SectionTitle>
        
        <div style={styles.controlPanel}>
          <ClassDropdown
            classes={classes}
            selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId}
          />
        </div>
      </div>

      {rooms.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📚</div>
          <p style={styles.emptyText}>채팅방이 없습니다.</p>
          <p style={styles.emptySubtext}>
            {selectedClassId ? 
              "해당 클래스에 생성된 채팅방이 없습니다." : 
              "클래스를 선택해주세요."}
          </p>
        </div>
      ) : (
        <div style={styles.topicGroupsContainer}>
          {Object.entries(roomsByTopic).map(([topicId, topicData]) => (
            topicData.rooms.length > 0 && (
              <div key={topicId} style={styles.topicGroup}>
                <div style={styles.topicHeader}>
                  <div style={styles.topicIcon}>📋</div>
                  <h3 style={styles.topicTitle}>{topicData.topicName}</h3>
                  <div style={styles.roomCount}>{topicData.rooms.length}개의 방</div>
                </div>
                
                <div style={styles.roomGrid}>
                  {topicData.rooms.map((room) => (
                    <div key={room.room_id} style={styles.roomCard}>
                      <div 
                        style={styles.roomHeader}
                        onClick={() => toggleRoomExpand(room.room_id)}
                      >
                        <div style={styles.roomIcon}>💬</div>
                        <div style={styles.roomInfo}>
                          <h4 style={styles.roomTitle}>{room.title || "제목 없음"}</h4>
                          <div style={styles.roomMeta}>
                            {getGroupNumber(room) > 0 && (
                              <span style={styles.groupTag}>
                                {getGroupNumber(room)}조
                              </span>
                            )}
                            <span style={styles.createdAt}>
                              {formatDate(room.created_at).split(' ')[0]}
                            </span>
                          </div>
                        </div>
                        <span style={styles.expandIcon}>
                          {expandedRoom === room.room_id ? "▲" : "▼"}
                        </span>
                      </div>
                      
                      {expandedRoom === room.room_id && (
                        <div style={styles.roomDetails}>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>방 ID:</span>
                            <span style={styles.detailValue}>{room.room_id}</span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>생성일:</span>
                            <span style={styles.detailValue}>{formatDate(room.created_at)}</span>
                          </div>
                          <button 
                            onClick={() => deleteRoom(room.room_id)} 
                            style={styles.deleteButton}
                            disabled={isDeleting}
                          >
                            🗑️ 채팅방 삭제
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "10px",
    backgroundColor: "#FAFAFA",
    borderRadius: "8px",
    width: "100%",
  },
  header: {
    marginBottom: "20px",
  },
  controlPanel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px",
    flexWrap: "wrap",
    gap: "12px",
  },
  // 주제 그룹 스타일
  topicGroupsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  topicGroup: {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #DBDBDB",
    overflow: "hidden",
  },
  topicHeader: {
    display: "flex",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "#F5F5F5",
    borderBottom: "1px solid #DBDBDB",
  },
  topicIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    marginRight: "12px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  topicTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#262626",
    margin: 0,
    flex: 1,
  },
  roomCount: {
    fontSize: "14px",
    color: "#8E8E8E",
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "4px 8px",
  },
  // 채팅방 스타일
  roomGrid: {
    display: "flex",
    flexDirection: "column",
  },
  roomCard: {
    borderBottom: "1px solid #EFEFEF",
    backgroundColor: "white",
    transition: "background-color 0.2s ease",
  },
  roomHeader: {
    display: "flex",
    alignItems: "center",
    padding: "16px",
    cursor: "pointer",
    position: "relative",
  },
  roomIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#F5F5F5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    marginRight: "12px",
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#262626",
    margin: "0 0 4px 0",
  },
  roomMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  createdAt: {
    fontSize: "14px",
    color: "#8E8E8E",
  },
  groupTag: {
    fontSize: "14px",
    color: "#8E8E8E",
    backgroundColor: "#F5F5F5",
    padding: "2px 4px",
    borderRadius: "4px",
  },
  expandIcon: {
    color: "#8E8E8E",
    fontSize: "12px",
  },
  roomDetails: {
    padding: "16px",
    borderTop: "1px solid #EFEFEF",
    backgroundColor: "#FAFAFA",
  },
  detailItem: {
    display: "flex",
    margin: "0 0 8px 0",
  },
  detailLabel: {
    width: "80px",
    color: "#8E8E8E",
    fontSize: "14px",
  },
  detailValue: {
    color: "#262626",
    fontSize: "14px",
    fontWeight: "500",
  },
  deleteButton: {
    width: "100%",
    backgroundColor: "transparent",
    color: "#ED4956",
    border: "1px solid #ED4956",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
    transition: "background-color 0.2s",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "white",
    border: "1px solid #DBDBDB",
    borderRadius: "8px",
    marginBottom: "16px",
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
    margin: 0,
  },
};

export default RoomTab;