import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSvgStore } from './useSvgStore';

describe('useSvgStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test so we start fresh
    localStorage.clear();
    // We mock timers because persistence and history logic use setTimeouts (debouncing)
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('initializes cleanly and exposes API surface', () => {
    const { result } = renderHook(() => useSvgStore());
    
    expect(result.current.activeProject).toBeNull();
    expect(typeof result.current.createProject).toBe('function');
    expect(typeof result.current.addElement).toBe('function');
  });

  it('creates and sets valid projects', () => {
    const { result } = renderHook(() => useSvgStore());
    
    let projectId = '';
    act(() => {
      projectId = result.current.createProject('Test Moodboard', 'moodboard', { width: 1000, height: 1000 });
    });

    act(() => {
      result.current.loadProject(projectId);
    });

    expect(result.current.activeProject).not.toBeNull();
    expect(result.current.activeProject?.mode).toBe('moodboard');
    expect(result.current.activeProject?.name).toBe('Test Moodboard');
    expect(result.current.elements).toEqual([]);
  });

  it('handles debounced history states cleanly (Undo / Redo)', () => {
    const { result } = renderHook(() => useSvgStore());
    
    // Create & active
    let projectId = '';
    act(() => {
      projectId = result.current.createProject('Test Designer', 'designer', { width: 1000, height: 1000 });
      result.current.loadProject(projectId);
    });

    // First action
    act(() => {
      result.current.addElement('rect');
    });

    // Advance timers so `pushToHistory` debounce (500ms) completes
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.elements.length).toBe(1);

    // Call Undo
    act(() => {
      result.current.undo();
    });

    // Elements should revert to initial empty array `[]`
    expect(result.current.elements.length).toBe(0);

    // Call Redo
    act(() => {
      result.current.redo();
    });

    // Elements should restore
    expect(result.current.elements.length).toBe(1);
    expect(result.current.elements[0].type).toBe('rect');
  });
});
