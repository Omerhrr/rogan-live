import type { WSChatMessage, WSGiftEvent, WSViewerUpdate, WSTypingEvent, WSNotification } from '@/types';

type MessageHandler = (data: any) => void;

interface WebSocketConnection {
  ws: WebSocket;
  streamId: string;
  handlers: Map<string, Set<MessageHandler>>;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  intentionalClose: boolean;
}

// Active connections keyed by streamId
const connections = new Map<string, WebSocketConnection>();

/**
 * Build the WebSocket URL for a given stream and user.
 * Format: ws://{host}/ws/{streamId}/{userId}?token={jwt}
 */
function buildWsUrl(streamId: string, userId: string, jwtToken: string): string {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}/ws/${streamId}/${userId}?token=${jwtToken}`;
}

/**
 * Connect to a stream's WebSocket endpoint.
 */
export function connectToStream(
  streamId: string,
  userId: string,
  jwtToken: string
): void {
  // If already connected to this stream, skip
  if (connections.has(streamId)) {
    return;
  }

  const url = buildWsUrl(streamId, userId, jwtToken);
  const ws = new WebSocket(url);

  const conn: WebSocketConnection = {
    ws,
    streamId,
    handlers: new Map(),
    reconnectTimer: null,
    intentionalClose: false,
  };

  connections.set(streamId, conn);

  ws.onopen = () => {
    // Notify connected handlers
    emit(conn, 'connected', { stream_id: streamId });
  };

  ws.onmessage = (event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data as string);
      const msgType: string = payload.type ?? 'unknown';
      emit(conn, msgType, payload);
    } catch {
      // Ignore malformed messages
    }
  };

  ws.onclose = () => {
    emit(conn, 'disconnected', { stream_id: streamId });
    connections.delete(streamId);

    // Auto-reconnect unless intentionally closed
    if (!conn.intentionalClose) {
      conn.reconnectTimer = setTimeout(() => {
        if (!connections.has(streamId)) {
          connectToStream(streamId, userId, jwtToken);
        }
      }, 3000);
    }
  };

  ws.onerror = () => {
    // onclose will fire after onerror, so reconnect logic lives there
  };
}

/**
 * Disconnect from a stream's WebSocket.
 */
export function disconnectFromStream(streamId: string): void {
  const conn = connections.get(streamId);
  if (conn) {
    conn.intentionalClose = true;
    if (conn.reconnectTimer) {
      clearTimeout(conn.reconnectTimer);
    }
    conn.ws.close();
    connections.delete(streamId);
  }
}

/**
 * Send a generic JSON message through the WebSocket for a given stream.
 */
function send(streamId: string, payload: Record<string, unknown>): void {
  const conn = connections.get(streamId);
  if (conn && conn.ws.readyState === WebSocket.OPEN) {
    conn.ws.send(JSON.stringify(payload));
  }
}

/**
 * Send a chat message.
 */
export function sendChatMessage(streamId: string, message: string): void {
  send(streamId, { type: 'chat_message', content: message });
}

/**
 * Send a typing indicator.
 */
export function sendTyping(streamId: string): void {
  send(streamId, { type: 'typing' });
}

/**
 * Send a join stream event.
 */
export function joinStream(streamId: string): void {
  send(streamId, { type: 'viewer_join' });
}

/**
 * Send a leave stream event.
 */
export function leaveStream(streamId: string): void {
  send(streamId, { type: 'viewer_leave' });
}

// ── Event subscription helpers ────────────────────────────────────

function ensureHandlers(conn: WebSocketConnection, event: string): Set<MessageHandler> {
  if (!conn.handlers.has(event)) {
    conn.handlers.set(event, new Set());
  }
  return conn.handlers.get(event)!;
}

function emit(conn: WebSocketConnection, event: string, data: any): void {
  const handlers = conn.handlers.get(event);
  if (handlers) {
    handlers.forEach((cb) => cb(data));
  }
}

function registerHandler(streamId: string, event: string, callback: MessageHandler): void {
  const conn = connections.get(streamId);
  if (conn) {
    ensureHandlers(conn, event).add(callback);
  }
}

function removeHandler(streamId: string, event: string, callback: MessageHandler): void {
  const conn = connections.get(streamId);
  if (conn) {
    conn.handlers.get(event)?.delete(callback);
  }
}

// ── Public event registration (stream-scoped) ────────────────────

export function onChat(streamId: string, callback: (msg: WSChatMessage) => void): void {
  registerHandler(streamId, 'chat_message', callback);
}

export function offChat(streamId: string, callback: (msg: WSChatMessage) => void): void {
  removeHandler(streamId, 'chat_message', callback);
}

export function onGift(streamId: string, callback: (gift: WSGiftEvent) => void): void {
  registerHandler(streamId, 'gift_sent', callback);
}

export function offGift(streamId: string, callback: (gift: WSGiftEvent) => void): void {
  removeHandler(streamId, 'gift_sent', callback);
}

export function onViewerUpdate(streamId: string, callback: (update: WSViewerUpdate) => void): void {
  registerHandler(streamId, 'viewer_join', callback);
  registerHandler(streamId, 'viewer_leave', callback);
}

export function offViewerUpdate(streamId: string, callback: (update: WSViewerUpdate) => void): void {
  removeHandler(streamId, 'viewer_join', callback);
  removeHandler(streamId, 'viewer_leave', callback);
}

export function onTyping(streamId: string, callback: (event: WSTypingEvent) => void): void {
  registerHandler(streamId, 'typing', callback);
}

export function offTyping(streamId: string, callback: (event: WSTypingEvent) => void): void {
  removeHandler(streamId, 'typing', callback);
}

export function onNotification(streamId: string, callback: (notification: WSNotification) => void): void {
  registerHandler(streamId, 'notification', callback);
}

export function offNotification(streamId: string, callback: (notification: WSNotification) => void): void {
  removeHandler(streamId, 'notification', callback);
}

export function onConnected(streamId: string, callback: () => void): void {
  registerHandler(streamId, 'connected', callback);
}

export function offConnected(streamId: string, callback: () => void): void {
  removeHandler(streamId, 'connected', callback);
}

/**
 * Disconnect all active WebSocket connections.
 */
export function disconnectAll(): void {
  connections.forEach((conn) => {
    conn.intentionalClose = true;
    if (conn.reconnectTimer) {
      clearTimeout(conn.reconnectTimer);
    }
    conn.ws.close();
  });
  connections.clear();
}
