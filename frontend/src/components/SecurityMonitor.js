import { useState, useEffect, useCallback } from 'react';

const SecurityMonitor = ({
  testStarted,
  onViolation,
  onWarning,
  violationDebounceMs = 2000,
  maxViolations = 3,
  onMaxViolations,
}) => {
  const [violations, setViolations] = useState([]);
  const [lastViolationTime, setLastViolationTime] = useState(0);

  const recordViolation = useCallback(
    (type, description) => {
      if (!testStarted) return;

      const now = Date.now();
      if (now - lastViolationTime < violationDebounceMs) {
        console.log(`Debounced violation: ${type}`);
        return;
      }

      const newViolation = {
        type,
        description,
        timestamp: new Date().toISOString(),
      };

      setLastViolationTime(now);
      setViolations((prev) => [...prev, newViolation]);
      if (onViolation) {
        onViolation(newViolation);
      }

      const newViolationCount = violations.length + 1;
      if (onWarning) {
        onWarning(
          `Security violation detected: ${description}. Violation ${newViolationCount} of ${maxViolations}.`,
          newViolationCount
        );
      }

      if (newViolationCount >= maxViolations) {
        if (onMaxViolations) {
          onMaxViolations();
        }
      }
    },
    [
      testStarted,
      lastViolationTime,
      violationDebounceMs,
      onViolation,
      onWarning,
      violations.length,
      maxViolations,
      onMaxViolations,
    ]
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation(
          'tab_switch',
          'User switched to another tab or minimized the window'
        );
      }
    };

    if (testStarted) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testStarted, recordViolation]);

  return null; // This is a non-visual component
};

export default SecurityMonitor;
