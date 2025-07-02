/**
 * Timer display component with simplified, reliable synchronization
 * Fixed version that completely eliminates race conditions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useWebSocketTimer } from '../../hooks/useWebSocket';
import { API_BASE_URL } from '../../api/config';

/**
 * Props for TimerDisplay component
 */
interface TimerDisplayProps {
  /** Duration in seconds */
  duration: number;
  /** Initial time remaining from session recovery */
  initialTimeRemaining?: number;
  /** Callback when time runs out */
  onTimeUp: () => void;
  /** Callback to update parent with remaining time */
  onTimeUpdate: (timeRemaining: number) => void;
  /** Optional exam ID for session-specific timer */
  examId?: string;
  /** Session ID for proper session isolation */
  sessionId?: string;
}

/**
 * Simple, reliable timer display component
 * COMPLETELY REWRITTEN - No race conditions, no multiple timers
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  duration,
  initialTimeRemaining,
  onTimeUp,
  onTimeUpdate,
  examId,
  sessionId,
}) => {
  // Single source of truth for remaining time
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTimeRemaining || duration);
  const [isServerSynced, setIsServerSynced] = useState<boolean>(false);

  // Refs for cleanup and state management
  const mountedRef = useRef<boolean>(true);
  const timeUpHandledRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastServerSyncRef = useRef<number>(0);

  // Stable callbacks
  const stableOnTimeUp = useCallback(() => {
    if (!timeUpHandledRef.current && mountedRef.current) {
      timeUpHandledRef.current = true;
      onTimeUp();
    }
  }, [onTimeUp]);

  const stableOnTimeUpdate = useCallback((time: number) => {
    if (mountedRef.current) {
      onTimeUpdate(time);
    }
  }, [onTimeUpdate]);

  /**
   * Single function to update timer - no race conditions
   */
  const updateTimer = useCallback((newTime: number, source: string) => {
    if (!mountedRef.current) return;

    const clampedTime = Math.max(0, Math.floor(newTime));
    console.log(`🕐 Timer update: ${clampedTime}s (${source})`);
    
    setTimeRemaining(clampedTime);
    stableOnTimeUpdate(clampedTime);
    lastServerSyncRef.current = Date.now();

    // Handle time up condition
    if (clampedTime <= 0 && !timeUpHandledRef.current) {
      console.log('⏰ Timer reached zero');
      stableOnTimeUp();
    }
  }, [stableOnTimeUpdate, stableOnTimeUp]);

  /**
   * Simple countdown timer - decrements by 1 every second
   */
  const startSimpleTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;

      setTimeRemaining(prevTime => {
        const newTime = Math.max(0, prevTime - 1);
        
        // Update parent and handle time up
        if (mountedRef.current) {
          stableOnTimeUpdate(newTime);
          
          if (newTime <= 0 && !timeUpHandledRef.current) {
            timeUpHandledRef.current = true;
            stableOnTimeUp();
          }
        }
        
        return newTime;
      });
    }, 1000);
  }, [stableOnTimeUpdate, stableOnTimeUp]);

  /**
   * WebSocket timer sync - overrides local timer when server data is available
   */
  const { isConnected } = useWebSocketTimer({
    examId,
    sessionId,
    enabled: !!examId && !!sessionId,
    onTimeSync: (data) => {
      if (!mountedRef.current) return;
      
      console.log('🔄 WebSocket sync received:', data.timeRemaining);
      setIsServerSynced(true);
      updateTimer(data.timeRemaining, 'websocket-sync');
    },
    onTimeUp: () => {
      console.log('⏰ WebSocket time up');
      stableOnTimeUp();
    },
    onConnectionChange: (connected) => {
      console.log(`🔌 WebSocket connection: ${connected ? 'connected' : 'disconnected'}`);
      if (!connected) {
        setIsServerSynced(false);
        // Fallback to HTTP sync will happen via effect
      }
    }
  });

  /**
   * HTTP fallback sync - only when WebSocket is disconnected
   */
  const syncWithServer = useCallback(async () => {
    if (!examId || !mountedRef.current) return;

    // Don't sync too frequently
    const timeSinceLastSync = Date.now() - lastServerSyncRef.current;
    if (timeSinceLastSync < 10000) return; // Min 10 second interval

    try {
        const token = localStorage.getItem('auth-token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/timer/sync?examId=${examId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && mountedRef.current) {
            const serverTime = result.data.timeRemaining;
            
            if (typeof serverTime === 'number' && serverTime >= 0) {
            console.log(`📡 HTTP sync: ${serverTime}s`);
              setIsServerSynced(true);
            updateTimer(serverTime, 'http-sync');
            }
          }
        }
    } catch (error) {
      console.warn('HTTP sync failed:', error);
    }
  }, [examId, updateTimer]);

  /**
   * Initialize timer on mount and when session changes
   */
  useEffect(() => {
    // Reset state
    const initialTime = initialTimeRemaining || duration;
    setTimeRemaining(initialTime);
    timeUpHandledRef.current = false;
    lastServerSyncRef.current = 0;

    console.log(`🔄 Timer initialized: ${initialTime}s`);

    // Start simple countdown timer
    startSimpleTimer();

    // Cleanup on unmount or dependency change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [duration, initialTimeRemaining, sessionId, startSimpleTimer]);

  /**
   * HTTP sync fallback when WebSocket is disconnected
   */
  useEffect(() => {
    if (!isConnected && examId) {
      // Initial sync
      const timeout = setTimeout(() => {
        if (mountedRef.current && !isConnected) {
          syncWithServer();
        }
      }, 1000);
      
      // Periodic sync every 30 seconds when disconnected
      const interval = setInterval(() => {
        if (mountedRef.current && !isConnected) {
          syncWithServer();
        }
      }, 30000);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [isConnected, examId, syncWithServer]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * Format time display
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get timer color based on remaining time
   */
  const getTimerColor = (): string => {
    if (timeRemaining <= 300) return 'text-red-600'; // Red for last 5 minutes
    if (timeRemaining <= 900) return 'text-amber-600'; // Amber for last 15 minutes
    return 'text-gray-900';
  };

  /**
   * Get connection status indicator
   */
  const getConnectionStatus = () => {
    if (isConnected && isServerSynced) {
      return (
        <div className="flex items-center text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
          <span>Đồng bộ WebSocket</span>
        </div>
      );
    }
    
    if (isServerSynced) {
      return (
        <div className="flex items-center text-xs text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
          <span>Đồng bộ HTTP</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-xs text-amber-600">
        <div className="w-2 h-2 bg-amber-400 rounded-full mr-1 animate-pulse"></div>
        <span>Chạy local timer</span>
      </div>
    );
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <ClockIcon className={`w-6 h-6 ${getTimerColor()}`} />
        <span className={`font-mono text-xl font-bold ${getTimerColor()}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
      
      <div className="border-l border-gray-300 pl-3">
        {getConnectionStatus()}
      </div>
    </div>
  );
}; 