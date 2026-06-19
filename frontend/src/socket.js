import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { API_BASE } from "./api";

export function connectQueueSocket(onMessage, setSocketState) {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
    reconnectDelay: 3000,
    onConnect: () => {
      setSocketState("live");
      client.subscribe("/topic/queue", (message) => {
        try {
          onMessage(JSON.parse(message.body));
        } catch {
          onMessage(null);
        }
      });
    },
    onWebSocketClose: () => setSocketState("syncing"),
    onWebSocketError: () => setSocketState("offline"),
    onStompError: () => setSocketState("offline")
  });

  client.activate();
  return () => client.deactivate();
}
