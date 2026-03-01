import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../../src/hooks/useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
  });

  it('should add a notification', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification('success', 'Test message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      type: 'success',
      message: 'Test message',
    });
  });

  it('should remove a notification', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      const id = result.current.addNotification('error', 'Error message');
      result.current.removeNotification(id);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification('success', 'Message 1');
      result.current.addNotification('error', 'Message 2');
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should auto-remove notification after duration', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification('info', 'Auto-remove message', 3000);
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should not auto-remove notification with duration 0', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification('warning', 'Persistent message', 0);
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.notifications).toHaveLength(1);
  });
});
