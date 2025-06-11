/**
 * Timer display component with WebSocket synchronization
 * Simplified architecture with single timer source and stable dependencies
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useWebSocketTimer } from '../../hooks/useWebSocket';

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
 * Timer display component with simplified, stable architecture
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  duration,
  initialTimeRemaining,
  onTimeUp,
  onTimeUpdate,
  examId,
  sessionId,
}) => {
  // Primary timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTimeRemaining || duration);
  const [isServerSynced, setIsServerSynced] = useState<boolean>(false);

  // Stable refs for timer management
  const mountedRef = useRef<boolean>(true);
  const timeUpHandledRef = useRef<boolean>(false);
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastSyncTimeRef = useRef<number>(Date.now());

  // Stabilize callbacks to prevent recreations
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
   * Single timer update function - simplified and stable
   */
  const updateTimeRemaining = useCallback((newTime: number, source: string = 'local') => {
    if (!mountedRef.current) return;

    const clampedTime = Math.max(0, Math.floor(newTime));
    
    console.log(`🕐 Timer update: ${clampedTime}s (${source})`);
    
    setTimeRemaining(clampedTime);
    stableOnTimeUpdate(clampedTime);

    // Handle time up condition
    if (clampedTime <= 0 && !timeUpHandledRef.current) {
      console.log('⏰ Timer reached zero');
      stableOnTimeUp();
    }
  }, [stableOnTimeUpdate, stableOnTimeUp]);

  /**
   * Local timer - runs continuously with server sync overlay
   */
  const startLocalTimer = useCallback(() => {
    if (localTimerRef.current) {
      clearInterval(localTimerRef.current);
    }

    localTimerRef.current = setInterval(() => {
      if (!mountedRef.current) return;

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      
      // Always update locally, server sync will override when available
      updateTimeRemaining(remaining, 'local');
    }, 1000);
  }, [duration, updateTimeRemaining]);

  /**
   * HTTP polling fallback for server sync
   */
  const startPollingSync = useCallback(() => {
    if (!examId || pollingTimerRef.current) return;

    const pollServerTime = async () => {
      if (!mountedRef.current) return;

      // Only poll if WebSocket is disconnected or hasn't synced recently
      const timeSinceSync = Date.now() - lastSyncTimeRef.current;
      if (isConnected && timeSinceSync < 30000) {
        console.log('⏸️ Skipping HTTP poll - WebSocket is active and recent');
        return;
      }

      try {
        const token = localStorage.getItem('auth-token');
        if (!token) return;

        const response = await fetch(`http://localhost:3000/api/timer/sync?examId=${examId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && mountedRef.current) {
            const serverTime = result.data.timeRemaining;
            if (typeof serverTime === 'number' && serverTime >= 0) {
              setIsServerSynced(true);
              lastSyncTimeRef.current = Date.now();
              updateTimeRemaining(serverTime, 'http');
              
              // Update start time for local calculations
              if (result.data.examStartTime) {
                startTimeRef.current = result.data.examStartTime;
              }
            }
          }
        }
      } catch (error) {
        // Silent fallback to local timer
        console.warn('HTTP sync failed, using local timer');
      }
    };

    // Initial sync, then periodic
    pollServerTime();
    pollingTimerRef.current = setInterval(pollServerTime, 15000); // Increased interval to 15s
  }, [examId, updateTimeRemaining]);

  /**
   * WebSocket timer hook - synchronized integration
   */
  const { isConnected } = useWebSocketTimer({
    examId,
    sessionId,
    enabled: !!examId && !!sessionId,
    onTimeSync: (data) => {
      if (!mountedRef.current) return;
      
      console.log('🔄 WebSocket sync received:', data.timeRemaining);
      setIsServerSynced(true);
      lastSyncTimeRef.current = Date.now();
      
      // Immediately update with server time
      updateTimeRemaining(data.timeRemaining, 'websocket');
      
      // Synchronize local timer with server time
      if (data.examStartTime) {
        startTimeRef.current = data.examStartTime;
      } else {
        // If no specific start time, calculate it from current server time
        const serverElapsed = duration - data.timeRemaining;
        startTimeRef.current = Date.now() - (serverElapsed * 1000);
      }
      
      console.log(`📡 Timer synchronized: ${data.timeRemaining}s remaining`);
    },
    onTimeUp: () => {
      console.log('⏰ WebSocket time up');
      stableOnTimeUp();
    },
    onConnectionChange: (connected) => {
      console.log(`🔌 WebSocket connection: ${connected ? 'connected' : 'disconnected'}`);
      if (!connected && !pollingTimerRef.current) {
        // Start HTTP fallback when WebSocket disconnects
        setTimeout(() => {
          if (mountedRef.current && !isConnected) {
            startPollingSync();
          }
        }, 1000);
      }
    }
  });

  /**
   * Initialize timer system - single effect with stable dependencies
   */
  useEffect(() => {
    // Set initial state
    const initialTime = initialTimeRemaining || duration;
    setTimeRemaining(initialTime);
    timeUpHandledRef.current = false;

    // Set start time for local calculations
    if (initialTimeRemaining && initialTimeRemaining < duration) {
      const elapsedTime = duration - initialTimeRemaining;
      startTimeRef.current = Date.now() - (elapsedTime * 1000);
    } else {
      startTimeRef.current = Date.now();
    }

    // Start local timer (always running as fallback)
    startLocalTimer();

    // Start HTTP polling if no WebSocket (after small delay)
    if (!isConnected && examId) {
      const timeout = setTimeout(() => {
        if (mountedRef.current && !isConnected) {
          startPollingSync();
        }
      }, 2000);
      
      return () => clearTimeout(timeout);
    }

    // Cleanup function
    return () => {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, []); // Empty dependency array - stable initialization

  /**
   * Handle session changes - minimal reset logic
   */
  useEffect(() => {
    if (sessionId) {
      // Reset time up flag for new sessions
      timeUpHandledRef.current = false;
      
      // Reset sync state
      setIsServerSynced(false);
      lastSyncTimeRef.current = Date.now();
      
      console.log(`🔄 Timer session updated: ${sessionId.slice(-8)}`);
    }
  }, [sessionId]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
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
    if (isConnected) {
      return (
        <div className="flex items-center text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
          <span>Thời gian thực</span>
        </div>
      );
    }
    
    if (isServerSynced) {
      return (
        <div className="flex items-center text-xs text-amber-600">
          <div className="w-2 h-2 bg-amber-500 rounded-full mr-1"></div>
          <span>Đồng bộ HTTP</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-xs text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
        <span>Cục bộ</span>
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