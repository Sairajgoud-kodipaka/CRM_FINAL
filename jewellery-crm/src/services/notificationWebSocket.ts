'use client';

import type { Notification } from '@/types';

interface WebSocketMessage {
  type: 'new_notification' | 'notification_batch' | 'notification_read' | 'pong';
  notification?: Notification;
  notifications?: Notification[];
  notification_id?: number;
}

type NotificationCallback = (notification: Notification) => void;
type NotificationBatchCallback = (notifications: Notification[]) => void;
type NotificationReadCallback = (notificationId: number) => void;

class NotificationWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private notificationListeners: Set<NotificationCallback> = new Set();
  private batchListeners: Set<NotificationBatchCallback> = new Set();
  private readListeners: Set<NotificationReadCallback> = new Set();
  private isIntentionalDisconnect = false;

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      // Get WebSocket URL from environment or default
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:/, '') || window.location.host;
      const wsUrl = `${protocol}//${host}/ws/notifications/?token=${token}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        console.log('Notification WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        if (!this.isIntentionalDisconnect) {
          console.log('Notification WebSocket closed, attempting reconnect...');
          this.attemptReconnect(token);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating Notification WebSocket:', error);
      this.attemptReconnect(token);
    }
  }

  private attemptReconnect(token: string) {
    if (this.isIntentionalDisconnect) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      // Exponential backoff
      const backoffDelay = Math.min(
        this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
        30000
      );

      this.reconnectTimeout = setTimeout(() => {
        this.connect(token);
      }, backoffDelay);
    } else {
      console.error('Max reconnect attempts reached, WebSocket connection failed');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.type === 'new_notification' && message.notification) {
      this.notificationListeners.forEach((callback) => {
        try {
          callback(message.notification!);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
    } else if (message.type === 'notification_batch' && message.notifications) {
      this.batchListeners.forEach((callback) => {
        try {
          callback(message.notifications!);
        } catch (error) {
          console.error('Error in batch listener:', error);
        }
      });
    } else if (message.type === 'notification_read' && message.notification_id) {
      this.readListeners.forEach((callback) => {
        try {
          callback(message.notification_id!);
        } catch (error) {
          console.error('Error in read listener:', error);
        }
      });
    }
  }

  // Subscribe to new notifications
  onNotification(callback: NotificationCallback): () => void {
    this.notificationListeners.add(callback);

    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  // Subscribe to notification batches
  onNotificationBatch(callback: NotificationBatchCallback): () => void {
    this.batchListeners.add(callback);

    return () => {
      this.batchListeners.delete(callback);
    };
  }

  // Subscribe to notification read events
  onNotificationRead(callback: NotificationReadCallback): () => void {
    this.readListeners.add(callback);

    return () => {
      this.readListeners.delete(callback);
    };
  }

  sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message, WebSocket not connected');
    }
  }

  // Send ping to keep connection alive
  ping() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'ping' });
    }
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.notificationListeners.clear();
    this.batchListeners.clear();
    this.readListeners.clear();
    this.reconnectAttempts = 0;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const notificationWebSocket = new NotificationWebSocketService();

// Periodic ping to keep connection alive (every 30 seconds)
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (notificationWebSocket.isConnected) {
      notificationWebSocket.ping();
    }
  }, 30000);
}

