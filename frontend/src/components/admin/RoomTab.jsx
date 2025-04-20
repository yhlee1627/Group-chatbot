import React, { useEffect, useState } from "react";
import SectionTitle from "./shared/SectionTitle";
import ClassDropdown from "./shared/ClassDropdown";
import theme from "../../styles/theme";
import { formatDate, formatTimestamp, formatDatetime } from "../chat/chatUtils";

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

      // 생성 날짜를 기준으로 내림차순 정렬 (최신순)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      setRooms(sortedData);
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
      // 1. 먼저 채팅방의 메시지를 삭제
      await fetch(`${backend}/messages?room_id=eq.${roomId}`, {
        method: "DELETE",
        headers,
      });
      
      // 2. 그 다음 채팅방 삭제
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
    
    // 각 주제 내에서 채팅방을 날짜순으로 정렬
    Object.keys(roomsByTopic).forEach(topicId => {
      roomsByTopic[topicId].rooms.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA; // 내림차순 (최신순)
      });
    });
    
    return roomsByTopic;
  };
  
  const toggleRoomExpand = (roomId) => {
    setExpandedRoom(expandedRoom === roomId ? null : roomId);
  };
  
  // 날짜 형식화 함수
  const formatCreatedAt = (dateString) => {
    if (!dateString) return "-";
    return formatDatetime(dateString);
  };

  // 종료 날짜 형식화 함수
  const formatClosedAt = (dateString) => {
    if (!dateString) return "-";
    return formatDatetime(dateString);
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
                        <div style={styles.roomInfo}>
                          <h4 style={styles.roomTitle}>{room.title || "제목 없음"}</h4>
                          <div style={styles.roomMeta}>
                            {getGroupNumber(room) > 0 && (
                              <span style={styles.groupTag}>
                                {getGroupNumber(room)}조
                              </span>
                            )}
                            <span style={styles.createdAt}>
                              {formatCreatedAt(room.created_at)}
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
                            <span style={styles.detailValue}>{formatCreatedAt(room.created_at)}</span>
                          </div>
                          <button 
                            onClick={() => deleteRoom(room.room_id)} 
                            style={styles.deleteButton}
                            disabled={isDeleting}
                          >
                            채팅방 삭제
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
    padding: "20px",
    backgroundColor: "#FFFFFF",
    borderRadius: theme.ROUNDED_LG,
    width: "100%",
    boxShadow: theme.SHADOW_SM,
  },
  header: {
    marginBottom: "24px",
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
    borderRadius: theme.ROUNDED_LG,
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    overflow: "hidden",
    boxShadow: theme.SHADOW_XS,
    transition: "all 0.2s ease",
    "&:hover": {
      boxShadow: theme.SHADOW_SM,
    }
  },
  topicHeader: {
    display: "flex",
    alignItems: "center",
    padding: "20px 24px",
    backgroundColor: "#F9F9FB",
    borderBottom: `1px solid ${theme.NEUTRAL_BORDER}`,
  },
  topicTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
    margin: 0,
    flex: 1,
  },
  roomCount: {
    fontSize: "14px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "4px 10px",
    boxShadow: theme.SHADOW_XS,
  },
  // 채팅방 스타일
  roomGrid: {
    display: "flex",
    flexDirection: "column",
  },
  roomCard: {
    borderBottom: `1px solid ${theme.NEUTRAL_BORDER}`,
    backgroundColor: "white",
    transition: "background-color 0.2s ease",
  },
  roomHeader: {
    display: "flex",
    alignItems: "center",
    padding: "16px 24px",
    cursor: "pointer",
    position: "relative",
    "&:hover": {
      backgroundColor: "#F9F9FB",
    }
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
    margin: "0 0 4px 0",
  },
  roomMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  createdAt: {
    fontSize: "14px",
    color: theme.NEUTRAL_LIGHT_TEXT,
  },
  groupTag: {
    fontSize: "14px",
    color: theme.NEUTRAL_TEXT,
    backgroundColor: "#F5F5F5",
    padding: "2px 8px",
    borderRadius: theme.ROUNDED_SM,
    fontWeight: "500",
  },
  expandIcon: {
    color: theme.MAIN_COLOR,
    fontSize: "14px",
    transition: "transform 0.3s ease",
  },
  roomDetails: {
    padding: "16px 24px",
    borderTop: `1px solid ${theme.NEUTRAL_BORDER}`,
    backgroundColor: "#F9F9FB",
  },
  detailItem: {
    display: "flex",
    margin: "0 0 12px 0",
  },
  detailLabel: {
    width: "80px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    fontSize: "14px",
  },
  detailValue: {
    color: theme.NEUTRAL_TEXT,
    fontSize: "14px",
    fontWeight: "500",
  },
  deleteButton: {
    width: "100%",
    backgroundColor: "transparent",
    color: theme.ERROR,
    border: `1px solid ${theme.ERROR}`,
    borderRadius: theme.ROUNDED_MD,
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "16px",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(237, 73, 86, 0.1)",
    }
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 24px",
    backgroundColor: "white",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: theme.ROUNDED_LG,
    marginBottom: "16px",
    boxShadow: theme.SHADOW_SM,
  },
  emptyText: {
    fontSize: "18px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
    margin: "0 0 8px 0",
  },
  emptySubtext: {
    fontSize: "14px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    margin: 0,
  },
};

export default RoomTab;