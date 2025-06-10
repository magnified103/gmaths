/**
 * WebSocket hook for real-time timer synchronization
 * Provides connection management and timer sync functionality
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
 * @param options - Configuration options for WebSocket timer
 * @returns WebSocket timer state and methods
 */
export const useWebSocketTimer = ({
  examId,
  enabled = true,
  onTimeSync,
  onTimeUp,
  onConnectionChange,
}: UseWebSocketTimerOptions): UseWebSocketTimerReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<TimerSyncData | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttemptRef = useRef(0);
  const lastDisconnectTimeRef = useRef(0);
  const isCleanupRef = useRef(false);
  const initializingRef = useRef(false);

  // Stabilize callback refs to prevent unnecessary re-renders
  const onTimeSyncRef = useRef(onTimeSync);
  const onTimeUpRef = useRef(onTimeUp);
  const onConnectionChangeRef = useRef(onConnectionChange);

  // Update refs when callbacks change
  useEffect(() => {
    onTimeSyncRef.current = onTimeSync;
    onTimeUpRef.current = onTimeUp;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onTimeSync, onTimeUp, onConnectionChange]);

  /**
   * Initialize WebSocket connection with proper cleanup handling
   */
  const initializeConnection = useCallback(() => {
    if (!enabled || !examId || isCleanupRef.current || initializingRef.current) return;

    // Debounce connection attempts to handle React Strict Mode
    const now = Date.now();
    if (now - lastDisconnectTimeRef.current < 1000) {
      return; // Skip if disconnected recently
    }

    // Prevent multiple concurrent connections
    if (socketRef.current?.connected) {
      return;
    }

    // Prevent rapid successive connection attempts
    if (socketRef.current && !socketRef.current.connected) {
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        return;
      }

      initializingRef.current = true;
      connectionAttemptRef.current += 1;
      const attemptNumber = connectionAttemptRef.current;

      // Reduce logging noise in development mode
      const shouldLog = process.env.NODE_ENV === 'production' || attemptNumber <= 1;
      
      // Clean up existing connection gracefully
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (shouldLog) {
        console.log(`🔌 Initializing WebSocket for exam: ${examId}`);
      }

      // Create new socket connection with better configuration
      const socket = io('http://localhost:3000', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
        timeout: 15000, // Increased timeout
        forceNew: false, // Allow connection reuse
        reconnection: true, // Enable auto-reconnection
        reconnectionAttempts: 3, // Limit reconnection attempts
        reconnectionDelay: 2000, // Delay between reconnections
        autoConnect: true,
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        initializingRef.current = false;
        if (shouldLog) {
          console.log('✅ WebSocket connected for timer sync');
        }
        setIsConnected(true);
        setConnectionError(null);
        onConnectionChangeRef.current?.(true);

        // Request initial timer sync
        if (examId) {
          socket.emit('timer:sync', { examId });
        }
      });

      socket.on('disconnect', (reason) => {
        initializingRef.current = false;
        lastDisconnectTimeRef.current = Date.now();
        
        // Only log if it's not a normal client disconnect in development
        if (shouldLog && !reason.includes('client') && !reason.includes('disconnect')) {
          console.warn('⚠️ WebSocket disconnected:', reason);
        }
        
        setIsConnected(false);
        onConnectionChangeRef.current?.(false);

        // Only auto-reconnect for server-side disconnections, not client-side
        if (!isCleanupRef.current && reason === 'io server disconnect') {
          setConnectionError('Server disconnected');
          // Schedule reconnection
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isCleanupRef.current && shouldLog) {
              console.log('🔄 Attempting to reconnect WebSocket...');
            }
            initializeConnection();
          }, 3000);
        } else if (reason === 'transport close' || reason === 'transport error') {
          // Schedule reconnection for transport issues
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isCleanupRef.current) {
              initializeConnection();
            }
          }, 3000);
        }
      });

      socket.on('connect_error', (error) => {
        initializingRef.current = false;
        console.error('❌ WebSocket connection error:', error);
        setConnectionError(`Connection failed: ${error.message}`);
        setIsConnected(false);
        onConnectionChangeRef.current?.(false);
      });

      // Timer-specific event handlers
      socket.on('timer:sync', (data: TimerSyncData) => {
        console.log('⏱️ Timer sync received:', data);
        setLastSync(data);
        onTimeSyncRef.current?.(data);
      });

      socket.on('timer:timeUp', () => {
        console.log('⏰ Time up received from server');
        onTimeUpRef.current?.();
      });

      socket.on('timer:error', (error: { message: string }) => {
        console.error('❌ Timer error:', error);
        setConnectionError(error.message);
      });

    } catch (error) {
      initializingRef.current = false;
      console.error('❌ Failed to initialize WebSocket connection:', error);
      setConnectionError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [examId, enabled]); // Removed callback dependencies to prevent re-creation

  /**
   * Request timer synchronization
   */
  const requestTimeSync = useCallback(() => {
    if (socketRef.current?.connected && examId) {
      socketRef.current.emit('timer:sync', { examId });
    }
  }, [examId]);

  /**
   * Disconnect WebSocket with cleanup
   */
  const disconnect = useCallback(() => {
    isCleanupRef.current = true;
    initializingRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
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

  // Initialize connection when hook mounts or examId/enabled changes
  useEffect(() => {
    isCleanupRef.current = false; // Reset cleanup flag
    
    if (enabled && examId) {
      // Only initialize if we don't already have a connection for this exam
      if (!socketRef.current?.connected && !initializingRef.current) {
        // Add a small delay to prevent rapid successive connections in React Strict Mode
        const timeoutId = setTimeout(() => {
          if (!isCleanupRef.current && !initializingRef.current) {
            initializeConnection();
          }
        }, 100); // Reduced delay since we fixed the main issue
        
        return () => {
          clearTimeout(timeoutId);
        };
      }
    }

    // Cleanup on unmount or when examId changes
    return () => {
      disconnect();
    };
  }, [examId, enabled]); // Only depend on examId and enabled, not the functions

  return {
    isConnected,
    lastSync,
    connectionError,
    requestTimeSync,
    disconnect,
  };
}; 