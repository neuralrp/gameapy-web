import { useEffect, useRef, useCallback, useState } from 'react';
import type { WebSocketMessageIn, WebSocketMessageOut } from '../types/api';
import { API_BASE_URL } from '../utils/constants';

interface UseGroupWebSocketOptions {
  groupId: number | null;
  onMessage?: (message: WebSocketMessageIn) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onAuthRequired?: () => void;
  onMaxReconnectAttemptsReached?: () => void;
}

function getWebSocketBaseUrl(): string {
  try {
    const apiUrl = API_BASE_URL;
    const url = new URL(apiUrl);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${url.host}`;
  } catch {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}`;
  }
}

export function useGroupWebSocket({
  groupId,
  onMessage,
  onConnected,
  onDisconnected,
  onAuthRequired,
  onMaxReconnectAttemptsReached,
}: UseGroupWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<number[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const onMessageRef = useRef(onMessage);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);
  const onAuthRequiredRef = useRef(onAuthRequired);
  const onMaxReconnectRef = useRef(onMaxReconnectAttemptsReached);
  
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalDisconnectRef = useRef(false);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
    onAuthRequiredRef.current = onAuthRequired;
    onMaxReconnectRef.current = onMaxReconnectAttemptsReached;
  }, [onMessage, onConnected, onDisconnected, onAuthRequired, onMaxReconnectAttemptsReached]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const getReconnectDelay = useCallback(() => {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current), maxDelay);
    const jitter = delay * 0.1 * Math.random();
    return delay + jitter;
  }, []);

  const connect = useCallback(() => {
    if (!groupId) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const token = localStorage.getItem('gameapy_auth_token');
    if (!token) {
      onAuthRequiredRef.current?.();
      return;
    }

    const wsBaseUrl = getWebSocketBaseUrl();
    const wsUrl = `${wsBaseUrl}/api/v1/groups/${groupId}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    intentionalDisconnectRef.current = false;

    ws.onopen = () => {
      setIsAuthenticating(true);
      ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessageIn = JSON.parse(event.data);
        
        if (message.type === 'connected') {
          setIsConnected(true);
          setIsAuthenticating(false);
          reconnectAttemptsRef.current = 0;
          setConnectedUsers(message.connected_users || []);
          onConnectedRef.current?.();
        } else if (message.type === 'auth_required') {
          setIsAuthenticating(false);
          setIsConnected(false);
          onAuthRequiredRef.current?.();
          ws.close();
        } else if (message.type === 'user_joined') {
          setConnectedUsers(prev => {
            if (prev.includes(message.user_id!)) return prev;
            return [...prev, message.user_id!];
          });
        } else if (message.type === 'user_left') {
          setConnectedUsers(prev => prev.filter(id => id !== message.user_id));
        }
        
        onMessageRef.current?.(message);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsAuthenticating(false);
      wsRef.current = null;
      onDisconnectedRef.current?.();
      
      if (!intentionalDisconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = getReconnectDelay();
        reconnectAttemptsRef.current++;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else if (!intentionalDisconnectRef.current && reconnectAttemptsRef.current >= maxReconnectAttempts) {
        onMaxReconnectRef.current?.();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [groupId, getReconnectDelay]);

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    clearReconnectTimeout();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsAuthenticating(false);
    setConnectedUsers([]);
    reconnectAttemptsRef.current = 0;
  }, [clearReconnectTimeout]);

  const send = useCallback((message: WebSocketMessageOut) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendChatMessage = useCallback((content: string) => {
    send({ type: 'chat_message', content });
  }, [send]);

  const sendTyping = useCallback((isTyping: boolean) => {
    send({ type: 'typing', is_typing: isTyping });
  }, [send]);

  const sendPlayCard = useCallback((slot: string, cardType: string, cardId: number) => {
    send({ type: 'play_card', slot, card_type: cardType, card_id: cardId });
  }, [send]);

  const sendRemoveCard = useCallback((slot: string) => {
    send({ type: 'remove_card', slot });
  }, [send]);

  const sendClearTable = useCallback(() => {
    send({ type: 'clear_table' });
  }, [send]);

  useEffect(() => {
    if (groupId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [groupId, connect, disconnect]);

  return {
    isConnected,
    isAuthenticating,
    connectedUsers,
    send,
    sendChatMessage,
    sendTyping,
    sendPlayCard,
    sendRemoveCard,
    sendClearTable,
    connect,
    disconnect,
  };
}
