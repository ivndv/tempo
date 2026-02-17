import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimerState } from './useTimerState';

describe('useTimerState', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const mockSchedule = [
        { type: 'focus' as const, duration: 1500, label: 'Focus' },
        { type: 'short' as const, duration: 300, label: 'Short Break' }
    ];

    it('should initialize with default values when no saved state provided', () => {
        const { result } = renderHook(() => useTimerState({ schedule: mockSchedule, savedState: null }));

        expect(result.current.currentSessionIndex).toBe(0);
        expect(result.current.timeLeft).toBe(1500);
        expect(result.current.isActive).toBe(true);
    });

    it('should initialize with saved state values', () => {
        const now = Date.now();
        const savedState = {
            currentSessionIndex: 1,
            sessionEndTime: now + 100000, // 100 seconds left roughly
            planStartTime: new Date(now - 5000).toISOString(),
            blockStartTime: new Date(now - 5000).toISOString(),
            isActive: false, // Note: The hook forces isActive to false on restore usually
            schedule: mockSchedule,
            initialMinutes: 25,
            timeLeft: 100
        };

        const { result } = renderHook(() => useTimerState({ schedule: mockSchedule, savedState }));

        expect(result.current.currentSessionIndex).toBe(1);
        // The hook calculates timeLeft based on sessionEndTime - now
        expect(result.current.timeLeft).toBeCloseTo(100, -1);
        expect(result.current.isActive).toBe(false);
    });

    it('should update sessionEndTime when resuming (becoming active)', () => {
        const { result } = renderHook(() => useTimerState({ schedule: mockSchedule, savedState: null }));

        // Initially active. Pause it.
        act(() => {
            result.current.setIsActive(false);
        });
        expect(result.current.isActive).toBe(false);

        // Advance time a bit (user waits 10s)
        act(() => {
            vi.advanceTimersByTime(10000);
        });

        // Resume
        act(() => {
            result.current.setIsActive(true);
        });

        // sessionEndTime should be now + timeLeft (1500)
        // We can't easily check internal state variable sessionEndTime without it being returned, 
        // but it IS returned.
        const expectedEndTime = Date.now() + 1500 * 1000;
        expect(result.current.sessionEndTime).toBeCloseTo(expectedEndTime, -3); // Allow small diff
    });

    it('should sync time on visibility change', () => {
        const { result } = renderHook(() => useTimerState({ schedule: mockSchedule, savedState: null }));

        // Define getter for document.hidden
        let hidden = false;
        Object.defineProperty(document, 'hidden', {
            configurable: true,
            get: () => hidden,
        });

        // Simulate going background
        hidden = true;
        const visibilityChangeEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityChangeEvent);

        // Advance time 5 seconds
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        // Simulate coming back
        hidden = false;

        act(() => {
            document.dispatchEvent(visibilityChangeEvent);
        });

        // The logic in useTimerState says: 
        // if (!document.hidden && isActive && timeLeft > 0) -> update timeLeft based on sessionEndTime

        // sessionEndTime was set at init to Now + 1500s.
        // We advanced 5s.
        // So timeLeft should roughly be 1495.
        // NOTE: The hook logic for `sessionEndTime` init is `Date.now() + duration`.
        // So if we advanced 5s, `sessionEndTime` is constant relative to absolute time?
        // Let's check hook logic: 
        // `const [sessionEndTime, setSessionEndTime] = useState(...)` -> ONLY updated on Mount or Pause/Resume.
        // So yes, it's absolute.

        expect(result.current.timeLeft).toBe(1495);
    });
});
