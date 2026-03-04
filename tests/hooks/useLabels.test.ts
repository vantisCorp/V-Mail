import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLabels } from '../../src/hooks/useLabels';
import type { Label } from '../../src/types/labels';

// Mock the useNotifications hook
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn(),
  }),
}));

describe('useLabels', () => {
  it('should initialize with empty labels', () => {
    const { result } = renderHook(() => useLabels());

    expect(result.current.labels).toEqual([]);
    expect(result.current.labeledEmails).toEqual([]);
    expect(result.current.stats).toEqual({
      totalLabels: 0,
      totalLabeledEmails: 0,
    });
  });

  it('should add a new label', () => {
    const { result } = renderHook(() => useLabels());

    const newLabel = {
      name: 'Important',
      color: '#ef4444',
      description: 'Important emails',
    };

    act(() => {
      result.current.addLabel(newLabel);
    });

    expect(result.current.labels).toHaveLength(1);
    expect(result.current.labels[0].name).toBe('Important');
    expect(result.current.labels[0].id).toBeDefined();
    expect(result.current.labels[0].color).toBe('#ef4444');
    expect(result.current.labels[0].createdAt).toBeDefined();
  });

  it('should assign random color if not provided', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Random Color',
        color: '',
        description: 'Test',
      });
    });

    expect(result.current.labels[0].color).toBeTruthy();
    expect(result.current.labels[0].color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should update an existing label', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Original',
        color: '#ef4444',
        description: 'Original description',
      });
    });

    const labelId = result.current.labels[0].id;

    act(() => {
      result.current.updateLabel(labelId, { name: 'Updated', color: '#22c55e' });
    });

    expect(result.current.labels[0].name).toBe('Updated');
    expect(result.current.labels[0].color).toBe('#22c55e');
    expect(result.current.labels[0].description).toBe('Original description');
  });

  it('should delete a label', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'To Delete',
        color: '#ef4444',
      });
    });

    const labelId = result.current.labels[0].id;

    act(() => {
      result.current.deleteLabel(labelId);
    });

    expect(result.current.labels).toHaveLength(0);
  });

  it('should delete label associations when label is deleted', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Test Label',
        color: '#ef4444',
      });
    });

    const labelId = result.current.labels[0].id;

    act(() => {
      result.current.applyLabelToEmail('email-1', labelId);
    });

    expect(result.current.labeledEmails).toHaveLength(1);

    act(() => {
      result.current.deleteLabel(labelId);
    });

    expect(result.current.labels).toHaveLength(0);
    expect(result.current.labeledEmails).toHaveLength(0);
  });

  it('should apply label to email', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Work',
        color: '#3b82f6',
      });
    });

    const labelId = result.current.labels[0].id;

    act(() => {
      result.current.applyLabelToEmail('email-1', labelId);
    });

    expect(result.current.labeledEmails).toHaveLength(1);
    expect(result.current.labeledEmails[0].emailId).toBe('email-1');
    expect(result.current.labeledEmails[0].labelId).toBe(labelId);
    expect(result.current.labeledEmails[0].appliedAt).toBeDefined();
  });

  it('should not apply duplicate label to email', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Duplicate',
        color: '#ef4444',
      });
    });

    const labelId = result.current.labels[0].id;

    act(() => {
      result.current.applyLabelToEmail('email-1', labelId);
    });

    // Try to apply the same label again - should not duplicate
    act(() => {
      result.current.applyLabelToEmail('email-1', labelId);
    });

    expect(result.current.labeledEmails).toHaveLength(1);
  });

  it('should remove label from email', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Remove Me',
        color: '#ef4444',
      });
    });

    const labelId = result.current.labels[0].id;

    act(() => {
      result.current.applyLabelToEmail('email-1', labelId);
    });

    expect(result.current.labeledEmails).toHaveLength(1);

    act(() => {
      result.current.removeLabelFromEmail('email-1', labelId);
    });

    expect(result.current.labeledEmails).toHaveLength(0);
  });

  it('should toggle label on email', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Toggle',
        color: '#ef4444',
      });
    });

    const labelId = result.current.labels[0].id;

    // Apply label
    act(() => {
      result.current.toggleLabelOnEmail('email-1', labelId);
    });

    expect(result.current.labeledEmails).toHaveLength(1);

    // Remove label
    act(() => {
      result.current.toggleLabelOnEmail('email-1', labelId);
    });

    expect(result.current.labeledEmails).toHaveLength(0);

    // Apply again
    act(() => {
      result.current.toggleLabelOnEmail('email-1', labelId);
    });

    expect(result.current.labeledEmails).toHaveLength(1);
  });

  it('should get email labels', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Label 1',
        color: '#ef4444',
      });
      result.current.addLabel({
        name: 'Label 2',
        color: '#22c55e',
      });
    });

    const label1Id = result.current.labels[0].id;
    const label2Id = result.current.labels[1].id;

    act(() => {
      result.current.applyLabelToEmail('email-1', label1Id);
      result.current.applyLabelToEmail('email-1', label2Id);
    });

    const emailLabels = result.current.getEmailLabels('email-1');

    expect(emailLabels).toHaveLength(2);
    expect(emailLabels.some((l) => l.id === label1Id)).toBe(true);
    expect(emailLabels.some((l) => l.id === label2Id)).toBe(true);
  });

  it('should get label emails', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Shared Label',
        color: '#ef4444',
      });
    });

    const labelId = result.current.labels[0].id;

    act(() => {
      result.current.applyLabelToEmail('email-1', labelId);
      result.current.applyLabelToEmail('email-2', labelId);
      result.current.applyLabelToEmail('email-3', labelId);
    });

    const labelEmails = result.current.getLabelEmails(labelId);

    expect(labelEmails).toHaveLength(3);
    expect(labelEmails).toContain('email-1');
    expect(labelEmails).toContain('email-2');
    expect(labelEmails).toContain('email-3');
  });

  it('should update stats correctly', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Label 1',
        color: '#ef4444',
      });
      result.current.addLabel({
        name: 'Label 2',
        color: '#22c55e',
      });
    });

    expect(result.current.stats.totalLabels).toBe(2);

    act(() => {
      result.current.applyLabelToEmail('email-1', result.current.labels[0].id);
      result.current.applyLabelToEmail('email-2', result.current.labels[0].id);
      result.current.applyLabelToEmail('email-2', result.current.labels[1].id);
    });

    // 2 unique emails labeled
    expect(result.current.stats.totalLabeledEmails).toBe(2);
  });

  it('should duplicate a label', () => {
    const { result } = renderHook(() => useLabels());

    act(() => {
      result.current.addLabel({
        name: 'Original',
        color: '#ef4444',
        description: 'Original description',
      });
    });

    const originalId = result.current.labels[0].id;

    act(() => {
      result.current.duplicateLabel(originalId);
    });

    expect(result.current.labels).toHaveLength(2);
    expect(result.current.labels[1].name).toBe('Original (Copy)');
    expect(result.current.labels[1].id).not.toBe(originalId);
    expect(result.current.labels[1].color).toBe('#ef4444');
  });
});