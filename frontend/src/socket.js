// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

export const socket = io(SOCKET_URL, {
  path: "/ws/socket.io",
  transports: ["websocket"],
  autoConnect: true,
});

console.log("✅ WebSocket 연결 주소:", SOCKET_URL);