/**
 * Timer display component with WebSocket synchronization
 * Provides real-time timer with server synchronization and fallback mechanisms
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useWebSocketTimer } from '../hooks/useWebSocket';

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
}

/**
 * Server time response structure for HTTP fallback
 */
interface ServerTimeResponse {
  serverTime: number;
  examStartTime: number;
  examDuration: number;
  timeRemaining: number;
}

/**
 * Timer display component with WebSocket synchronization
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  duration,
  initialTimeRemaining,
  onTimeUp,
  onTimeUpdate,
  examId,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTimeRemaining || duration);
  const [serverSynced, setServerSynced] = useState<boolean>(false);

  // Refs for intervals and timing
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(Date.now());
  const timeUpHandledRef = useRef<boolean>(false);

  /**
   * WebSocket timer hook for real-time synchronization
   */
  const {
    isConnected: isWebSocketConnected,
    connectionError,
    requestTimeSync
  } = useWebSocketTimer({
    examId,
    enabled: !!examId,
    onTimeSync: (data) => {
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Timer synchronized with server:', data);
      }
      setTimeRemaining(Math.max(0, data.timeRemaining));
      setServerSynced(true);
      lastSyncRef.current = Date.now();
      
      // Update parent component
      onTimeUpdate(data.timeRemaining);
    },
    onTimeUp: () => {
      if (!timeUpHandledRef.current) {
        timeUpHandledRef.current = true;
        console.log('⏰ Timer ended by server');
        setTimeRemaining(0);
        onTimeUp();
      }
    },
    onConnectionChange: (connected) => {
      if (!connected && serverSynced) {
        console.log('🔄 WebSocket disconnected, starting HTTP fallback');
        startPollingFallback();
      }
    }
  });

  /**
   * Calculate time remaining based on local elapsed time
   */
  const calculateTimeRemaining = useCallback((): number => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    return Math.max(0, duration - elapsed);
  }, [duration]);

  /**
   * Update timer with new remaining time
   */
  const updateTimer = useCallback((remaining: number) => {
    setTimeRemaining(remaining);
    onTimeUpdate(remaining);

    // Trigger time up only once
    if (remaining <= 0 && !timeUpHandledRef.current) {
      timeUpHandledRef.current = true;
      console.log('⏰ Timer reached 0, triggering onTimeUp');
      onTimeUp();
      
      // Clear intervals when time is up
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [onTimeUpdate, onTimeUp]);

  /**
   * Handle server time synchronization response
   */
  const handleServerTimeSync = useCallback((data: ServerTimeResponse) => {
    const { timeRemaining: serverTimeRemaining, serverTime, examStartTime } = data;
    
    // Validate server response
    if (typeof serverTimeRemaining === 'number' && serverTimeRemaining >= 0) {
      // Calculate time drift compensation
      const localTime = Date.now();
      const timeDrift = localTime - serverTime;
      const adjustedTime = Math.max(0, serverTimeRemaining - Math.floor(timeDrift / 1000));
      
      console.log(`🔄 Server time sync: ${serverTimeRemaining}s, drift: ${Math.floor(timeDrift/1000)}s, adjusted: ${adjustedTime}s`);
      
      setTimeRemaining(adjustedTime);
      setServerSynced(true);
      lastSyncRef.current = Date.now();
      
      // Update parent component and handle time up via updateTimer
      updateTimer(adjustedTime);
      
      // Adjust start time for local calculations to maintain consistency
      if (examStartTime) {
        startTimeRef.current = examStartTime + timeDrift;
      } else {
        // Fallback: calculate startTime from current state
        const elapsedTime = duration - adjustedTime;
        startTimeRef.current = localTime - (elapsedTime * 1000);
      }
    }
  }, [updateTimer, duration]);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = useCallback((): boolean => {
    const token = localStorage.getItem('auth-token');
    return !!token;
  }, []);

  /**
   * Polling fallback for time synchronization when WebSocket fails
   */
  const startPollingFallback = useCallback(() => {
    if (!examId) {
      return;
    }

    if (!isAuthenticated()) {
      return;
    }

    let pollCount = 0;
    const maxFastPolls = 3; // First 3 polls are fast

    const fetchServerTime = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          // Clear polling if token is removed during session
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return;
        }

        const response = await fetch(`http://localhost:3000/api/timer/sync?examId=${examId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            handleServerTimeSync(result.data);
            pollCount++;
            
            // After getting a successful sync, adjust polling frequency
            if (pollCount >= maxFastPolls && pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              // Switch to slower polling
              pollingIntervalRef.current = setInterval(fetchServerTime, 15000);
            }
          }
        } else if (response.status === 401) {
          // Stop polling on authentication failure
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          // Fall back to local timer
          const remaining = calculateTimeRemaining();
          updateTimer(remaining);
        } else if (response.status !== 500) {
          // Don't log 500 errors - they're expected if no session exists
          const remaining = calculateTimeRemaining();
          updateTimer(remaining);
        }
      } catch (error) {
        // Use local timer as fallback
        const remaining = calculateTimeRemaining();
        updateTimer(remaining);
      }
    };

    // Clear existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Initial sync immediately
    fetchServerTime();

    // Start with fast polling for immediate response on page refresh
    pollingIntervalRef.current = setInterval(() => {
      if (pollCount < maxFastPolls) {
        fetchServerTime();
      }
    }, 2000); // Fast polling every 2 seconds initially
  }, [examId, handleServerTimeSync, calculateTimeRemaining, updateTimer]);

  /**
   * Local timer fallback (always running as backup)
   * Uses requestAnimationFrame for smoother updates and better precision
   */
  const startLocalTimer = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }
    
    let lastUpdateTime = Date.now();
    
    const updateLoop = () => {
      const now = Date.now();
      
      // Only update if at least 900ms have passed (allow for some variance)
      if (now - lastUpdateTime >= 900) {
        const timeSinceLastSync = now - lastSyncRef.current;
        
        // Only use local time if we haven't synced with server recently
        if (!serverSynced || timeSinceLastSync > 30000) { // 30 seconds threshold
          const remaining = calculateTimeRemaining();
          updateTimer(remaining);
          
          // Stop timer if time is up
          if (remaining <= 0) {
            return; // Exit the loop
          }
        }
        
        lastUpdateTime = now;
      }
      
      // Continue the loop
      intervalRef.current = setTimeout(updateLoop, 100);
    };
    
    updateLoop();
  }, [calculateTimeRemaining, updateTimer, serverSynced]);

  /**
   * Initialize timer on component mount (ONLY ONCE)
   */
  const isInitializedRef = useRef(false);
  
  useEffect(() => {
    // Prevent duplicate initialization in React strict mode
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;
    
    // Reduce logging noise in development mode
    if (process.env.NODE_ENV === 'production') {
      console.log('🕐 Initializing timer with duration:', duration);
    }
    const initialTime = initialTimeRemaining || duration;
    setTimeRemaining(initialTime);
    
    // Set start time to represent when the exam actually started
    if (initialTimeRemaining) {
      // If we have recovered time, set startTime to reflect the elapsed time
      const elapsedTime = duration - initialTimeRemaining;
      startTimeRef.current = Date.now() - (elapsedTime * 1000);
      console.log(`🔄 Recovered timer state: ${initialTimeRemaining}s remaining (${elapsedTime}s elapsed)`);
      
      // Request immediate server sync to get authoritative time
      if (examId && isAuthenticated()) {
        setTimeout(() => {
          if (isWebSocketConnected) {
            requestTimeSync();
          } else {
            startPollingFallback();
          }
        }, 100); // Small delay to let things initialize
      }
    } else {
      // New session, start from now
      startTimeRef.current = Date.now();
    }
    
    lastSyncRef.current = Date.now();
    timeUpHandledRef.current = false; // Reset time up flag
    
          // Clear any existing intervals to prevent conflicts
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    
    // Always start local timer as backup
    startLocalTimer();

    // Don't start polling fallback immediately if we have examId - wait for WebSocket
    if (examId && isWebSocketConnected) {
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Using WebSocket timer for exam:', examId);
      }
    } else if (examId && isAuthenticated()) {
      // Start HTTP polling fallback if WebSocket is not available and user is authenticated
      const fallbackTimeout = setTimeout(() => {
        if (!isWebSocketConnected && isAuthenticated()) {
          if (process.env.NODE_ENV === 'production') {
            console.log('🔄 Using HTTP polling fallback for timer');
          }
          startPollingFallback();
        }
      }, 5000); // Increased delay to give WebSocket time to connect

      return () => {
        clearTimeout(fallbackTimeout);
      };
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
    // CRITICAL: Only run on mount, not on duration changes to prevent reset loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

    /**
   * Handle initial time remaining changes (for late session recovery)
   */
  useEffect(() => {
    // Only update if we get new initial time remaining data and we haven't initialized with it yet
    if (initialTimeRemaining && !serverSynced && isInitializedRef.current) {
      console.log('⏰ Late session recovery, updating to:', initialTimeRemaining);
      const elapsedTime = duration - initialTimeRemaining;
      startTimeRef.current = Date.now() - (elapsedTime * 1000);
      setTimeRemaining(initialTimeRemaining);
      onTimeUpdate(initialTimeRemaining);
      setServerSynced(true);
      lastSyncRef.current = Date.now();
    }
  }, [initialTimeRemaining, duration, onTimeUpdate, serverSynced]); // Watch for late session recovery

  /**
   * Request manual sync when WebSocket is connected
   */
  const handleManualSync = () => {
    if (!isAuthenticated()) {
      return;
    }
    
    if (isWebSocketConnected) {
      requestTimeSync();
    } else {
      startPollingFallback();
    }
  };

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
    if (isWebSocketConnected) {
      return (
        <div className="flex items-center text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
          <span>Đồng bộ thời gian thực</span>
        </div>
      );
    }
    
    if (serverSynced) {
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
        <span>Thời gian cục bộ</span>
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
      
      {/* Connection status and manual sync */}
      <div className="flex items-center space-x-2">
        <div className="border-l border-gray-300 pl-3">
          {getConnectionStatus()}
        </div>
        
        {connectionError && (
          <button
            onClick={handleManualSync}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
            title="Đồng bộ thủ công"
          >
            Đồng bộ
          </button>
        )}
      </div>
    </div>
  );
}; 