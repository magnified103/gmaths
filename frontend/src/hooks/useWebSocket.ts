/**
 * WebSocket hook for real-time timer synchronization
 * Simplified connection management for stable timer sync
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface TimerSyncData {
  serverTime: number;
  examStartTime: number;
  examDuration: number;
  timeRemaining: number;
}

interface UseWebSocketTimerOptions {
  examId?: string;
  enabled?: boolean;
  onTimeSync?: (data: TimerSyncData) => void;
  onTimeUp?: () => void;
  onConnectionChange?: (connected: boolean) => void;
  sessionId?: string;
}

interface UseWebSocketTimerReturn {
  isConnected: boolean;
  lastSync: TimerSyncData | null;
  connectionError: string | null;
  requestTimeSync: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for WebSocket timer functionality
 * Simplified to avoid reconnection loops and session conflicts
 */
export const useWebSocketTimer = ({
  examId,
  enabled = true,
  onTimeSync,
  onTimeUp,
  onConnectionChange,
  sessionId,
}: UseWebSocketTimerOptions): UseWebSocketTimerReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<TimerSyncData | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef<boolean>(true);
  const currentSessionRef = useRef<string | undefined>(sessionId);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stabilize callback refs
  const onTimeSyncRef = useRef(onTimeSync);
  const onTimeUpRef = useRef(onTimeUp);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onTimeSyncRef.current = onTimeSync;
    onTimeUpRef.current = onTimeUp;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onTimeSync, onTimeUp, onConnectionChange]);

  /**
   * Initialize WebSocket connection
   */
  const initializeConnection = useCallback(() => {
    if (!enabled || !examId || !mountedRef.current) return;

    const token = localStorage.getItem('auth-token');
    if (!token) return;

    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log(`🔌 Connecting WebSocket for exam: ${examId}`);

    // Create new socket connection
    const socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
      timeout: 10000,
      reconnection: false, // Disable auto-reconnection to prevent loops
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (!mountedRef.current) return;
      
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
      onConnectionChangeRef.current?.(true);

      // Request immediate timer sync
      if (examId) {
        console.log(`📡 Requesting timer sync for exam: ${examId}`);
        socket.emit('timer:sync', { examId });
        
        // Set up periodic sync requests (every 30 seconds)
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
        
        syncIntervalRef.current = setInterval(() => {
          if (socketRef.current?.connected && examId && mountedRef.current) {
            socket.emit('timer:sync', { examId });
          }
        }, 30000);
      }
    });

    socket.on('disconnect', (reason) => {
      if (!mountedRef.current) return;
      
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
      onConnectionChangeRef.current?.(false);
      
      // Clear sync interval on disconnect
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    });

    socket.on('connect_error', (error) => {
      if (!mountedRef.current) return;
      
      console.warn('⚠️ WebSocket connection error:', error.message);
      setConnectionError(`Connection failed: ${error.message}`);
      setIsConnected(false);
      onConnectionChangeRef.current?.(false);
    });

    // Timer-specific events
    socket.on('timer:sync', (data: TimerSyncData) => {
      if (!mountedRef.current || currentSessionRef.current !== sessionId) return;
      
      console.log('⏱️ Timer sync received:', data.timeRemaining);
      setLastSync(data);
      onTimeSyncRef.current?.(data);
    });

    socket.on('timer:timeUp', () => {
      if (!mountedRef.current || currentSessionRef.current !== sessionId) return;
      
      console.log('⏰ Time up received from server');
      onTimeUpRef.current?.();
    });

    socket.on('timer:error', (error: { message: string }) => {
      console.error('❌ Timer error:', error);
      setConnectionError(error.message);
    });

  }, [examId, enabled, sessionId]);

  /**
   * Request timer synchronization
   */
  const requestTimeSync = useCallback(() => {
    if (socketRef.current?.connected && examId) {
      socketRef.current.emit('timer:sync', { examId });
    }
  }, [examId]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    // Clear sync interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setLastSync(null);
    setConnectionError(null);
  }, []);

  /**
   * Initialize connection when examId or sessionId changes
   */
  useEffect(() => {
    // Update session tracking
    currentSessionRef.current = sessionId;
    
    if (enabled && examId && sessionId) {
      // Small delay to prevent rapid connections in development mode
      const timeout = setTimeout(() => {
        if (mountedRef.current) {
          initializeConnection();
        }
      }, 200);
      
      return () => clearTimeout(timeout);
    }

    return disconnect;
  }, [examId, sessionId, enabled, initializeConnection, disconnect]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    lastSync,
    connectionError,
    requestTimeSync,
    disconnect,
  };
}; 