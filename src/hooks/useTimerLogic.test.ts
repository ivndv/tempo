import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimerLogic } from './useTimerLogic';

// Mock helpers
const onSessionComplete = vi.fn();

describe('useTimerLogic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Mock Browser APIs
        // Audio needs to be a class-like structure (constructor)
        global.Audio = vi.fn(function () {
            return {
                play: vi.fn().mockResolvedValue(undefined),
                pause: vi.fn(),
                volume: 0
            };
        }) as any;

        // Notification also needs to be constructible
        const MockNotification = vi.fn(function (title, options) {
            return {
                title,
                options,
                close: vi.fn()
            };
        }) as any;
        // Static properties
        Object.defineProperty(MockNotification, 'permission', {
            get: vi.fn(() => 'granted'),
            configurable: true
        });
        MockNotification.requestPermission = vi.fn().mockResolvedValue('granted');

        global.Notification = MockNotification;
    });

    it('should generate a correct schedule for 25 minutes (1 focus session)', () => {
        const { result } = renderHook(() => useTimerLogic({ initialMinutes: 25, onSessionComplete }));

        expect(result.current.schedule.length).toBe(1);
        expect(result.current.schedule[0].type).toBe('focus');
        expect(result.current.timeLeft).toBe(25 * 60);
    });

    it('should generate a correct schedule for 30 minutes (1 focus + 1 short break)', () => {
        const { result } = renderHook(() => useTimerLogic({ initialMinutes: 30, onSessionComplete }));

        expect(result.current.schedule.length).toBe(2);
        expect(result.current.schedule[0].type).toBe('focus');
        expect(result.current.schedule[1].type).toBe('short');
    });

    it('should countdown when active', () => {
        const { result } = renderHook(() => useTimerLogic({ initialMinutes: 25, onSessionComplete }));

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.timeLeft).toBe(25 * 60 - 1);
    });

    it('should pause when toggleTimer is called', () => {
        const { result } = renderHook(() => useTimerLogic({ initialMinutes: 25, onSessionComplete }));

        act(() => {
            result.current.toggleTimer();
        });

        expect(result.current.isActive).toBe(false);

        const timeAtPause = result.current.timeLeft;
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.timeLeft).toBe(timeAtPause);
    });

    it('should complete session and move to next one', async () => {
        const { result } = renderHook(() => useTimerLogic({ initialMinutes: 30, onSessionComplete }));

        // Advance to end of first session (25 mins)
        act(() => {
            vi.advanceTimersByTime(25 * 60 * 1000);
        });

        expect(result.current.timeLeft).toBe(0);
        expect(onSessionComplete).toHaveBeenCalledWith('focus', 25, expect.any(Date));

        // Advance past the 1500ms transition timeout
        act(() => {
            vi.advanceTimersByTime(1500);
        });

        expect(result.current.currentSessionIndex).toBe(1);
        expect(result.current.currentSession.type).toBe('short');
        expect(result.current.timeLeft).toBe(5 * 60);
    });
});
