'use client';

import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: 'call_status_update' | 'call_ended' | 'call_started';
  callId: string;
  status?: string;
  duration?: number;
  recordingUrl?: string;
  disposition?: string;
}

class CallWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private listeners: Map<string, (message: WebSocketMessage) => void> = new Map();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/calls/';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {

        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {

        }
      };

      this.ws.onclose = () => {

        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {

      };
    } catch (error) {

      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;


      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {

    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Broadcast to all listeners
    this.listeners.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {

      }
    });
  }

  subscribe(callId: string, callback: (message: WebSocketMessage) => void) {
    const key = `${callId}_${Date.now()}`;
    this.listeners.set(key, callback);

    return () => {
      this.listeners.delete(key);
    };
  }

  sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {

    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const callWebSocketService = new CallWebSocketService();

// React hook for WebSocket connection
export function useCallWebSocket(callId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    callWebSocketService.connect();
    setIsConnected(true);

    // Subscribe to messages if callId is provided
    let unsubscribe: (() => void) | undefined;
    if (callId) {
      unsubscribe = callWebSocketService.subscribe(callId, (message) => {
        setLastMessage(message);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Don't disconnect the WebSocket as it might be used by other components
    };
  }, [callId]);

  const sendMessage = (message: any) => {
    callWebSocketService.sendMessage(message);
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}

// Fallback polling service for when WebSocket is not available
export class CallPollingService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  startPolling(callId: string, callback: (status: any) => void, interval = 2000) {
    if (this.intervals.has(callId)) {
      return; // Already polling
    }

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/telecalling/call-requests/${callId}/status/`);
        if (response.ok) {
          const status = await response.json();
          callback(status);
        }
      } catch (error) {

      }
    }, interval);

    this.intervals.set(callId, intervalId);
  }

  stopPolling(callId: string) {
    const intervalId = this.intervals.get(callId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(callId);
    }
  }

  stopAllPolling() {
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
  }
}

export const callPollingService = new CallPollingService();
