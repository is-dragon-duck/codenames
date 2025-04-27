import { useEffect, useRef } from "react";

export function useWebSocket(gameId: string, onMessage: (data: any) => void) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    ws.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join', gameId }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        onMessage(data.payload);
      }
    };

    return () => {
      socket.close();
    };
  }, [gameId, onMessage]);

  const send = (payload: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'update', gameId, payload }));
    }
  };

  return { send };
}
