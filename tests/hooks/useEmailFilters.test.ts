import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmailFilters } from '../../src/hooks/useEmailFilters';
import type { EmailFilter, FilterConditionField, FilterActionType } from '../../src/types/filters';

// Mock the useNotifications hook
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn()
  })
}));

describe('useEmailFilters', () => {
  it('should initialize with empty filters', () => {
    const { result } = renderHook(() => useEmailFilters());

    expect(result.current.filters).toEqual([]);
    expect(result.current.stats).toEqual({
      totalRules: 0,
      activeRules: 0,
      emailsProcessed: 0
    });
  });

  it('should add a new filter', () => {
    const { result } = renderHook(() => useEmailFilters());

    const newFilter = {
      name: 'Work Filter',
      conditions: [
        { id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: '@work.com' }
      ],
      actions: [{ id: 'act-1', type: 'move_to_folder' as FilterActionType, value: 'Work' }],
      enabled: true,
      priority: 1,
      matchAll: false
    };

    act(() => {
      result.current.addFilter(newFilter);
    });

    expect(result.current.filters).toHaveLength(1);
    expect(result.current.filters[0].name).toBe('Work Filter');
    expect(result.current.filters[0].id).toBeDefined();
    expect(result.current.filters[0].createdAt).toBeDefined();
  });

  it('should update an existing filter', () => {
    const { result } = renderHook(() => useEmailFilters());

    // Add a filter first
    act(() => {
      result.current.addFilter({
        name: 'Original Name',
        conditions: [{ id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: 'test' }],
        actions: [{ id: 'act-1', type: 'mark_as_read' as FilterActionType }],
        enabled: true,
        priority: 1,
        matchAll: false
      });
    });

    const filterId = result.current.filters[0].id;

    // Update the filter
    act(() => {
      result.current.updateFilter(filterId, { name: 'Updated Name' });
    });

    expect(result.current.filters[0].name).toBe('Updated Name');
    expect(result.current.filters[0].conditions).toHaveLength(1); // Should preserve other fields
  });

  it('should delete a filter', () => {
    const { result } = renderHook(() => useEmailFilters());

    // Add a filter first
    act(() => {
      result.current.addFilter({
        name: 'Filter to Delete',
        conditions: [{ id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: 'delete' }],
        actions: [{ id: 'act-1', type: 'delete' as FilterActionType }],
        enabled: true,
        priority: 1,
        matchAll: false
      });
    });

    const filterId = result.current.filters[0].id;

    // Delete the filter
    act(() => {
      result.current.deleteFilter(filterId);
    });

    expect(result.current.filters).toHaveLength(0);
  });

  it('should toggle filter enabled state', () => {
    const { result } = renderHook(() => useEmailFilters());

    // Add a filter first
    act(() => {
      result.current.addFilter({
        name: 'Toggle Test',
        conditions: [{ id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: 'toggle' }],
        actions: [{ id: 'act-1', type: 'mark_as_read' as FilterActionType }],
        enabled: true,
        priority: 1,
        matchAll: false
      });
    });

    const filterId = result.current.filters[0].id;

    // Toggle to disable
    act(() => {
      result.current.toggleFilter(filterId);
    });

    expect(result.current.filters[0].enabled).toBe(false);

    // Toggle back to enable
    act(() => {
      result.current.toggleFilter(filterId);
    });

    expect(result.current.filters[0].enabled).toBe(true);
  });

  it('should duplicate a filter', () => {
    const { result } = renderHook(() => useEmailFilters());

    // Add a filter first
    act(() => {
      result.current.addFilter({
        name: 'Original Filter',
        conditions: [{ id: 'cond-1', field: 'subject' as FilterConditionField, operator: 'equals' as const, value: 'Test' }],
        actions: [{ id: 'act-1', type: 'label' as FilterActionType, value: 'test-label' }],
        enabled: true,
        priority: 1,
        matchAll: false
      });
    });

    const originalId = result.current.filters[0].id;

    // Duplicate the filter
    act(() => {
      result.current.duplicateFilter(originalId);
    });

    expect(result.current.filters).toHaveLength(2);
    expect(result.current.filters[1].name).toBe('Original Filter (Copy)');
    expect(result.current.filters[1].id).not.toBe(originalId);
    expect(result.current.filters[1].conditions).toEqual(result.current.filters[0].conditions);
  });

  it('should reorder filters', () => {
    const { result } = renderHook(() => useEmailFilters());

    // Add two filters
    act(() => {
      result.current.addFilter({
        name: 'Filter 1',
        conditions: [{ id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: 'filter1' }],
        actions: [{ id: 'act-1', type: 'mark_as_read' as FilterActionType }],
        enabled: true,
        priority: 1,
        matchAll: false
      });
    });

    act(() => {
      result.current.addFilter({
        name: 'Filter 2',
        conditions: [{ id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: 'filter2' }],
        actions: [{ id: 'act-1', type: 'archive' as FilterActionType }],
        enabled: true,
        priority: 2,
        matchAll: false
      });
    });

    const firstFilterId = result.current.filters[0].id;
    const secondFilterId = result.current.filters[1].id;

    // Move first filter to position 1 (after second)
    act(() => {
      result.current.reorderFilters(0, 1);
    });

    expect(result.current.filters[0].id).toBe(secondFilterId);
    expect(result.current.filters[1].id).toBe(firstFilterId);
  });

  it('should apply filters to a matching email', () => {
    const { result } = renderHook(() => useEmailFilters());

    // Add a filter that matches emails from @work.com
    act(() => {
      result.current.addFilter({
        name: 'Work Filter',
        conditions: [{ id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: '@work.com' }],
        actions: [{ id: 'act-1', type: 'move_to_folder' as FilterActionType, value: 'Work' }],
        enabled: true,
        priority: 1,
        matchAll: false
      });
    });

    const email = {
      from: 'user@work.com',
      to: 'me@example.com',
      subject: 'Test Subject',
      body: 'Test body',
      hasAttachment: false,
      size: 1024,
      priority: 'normal'
    };

    const result_obj = result.current.applyFilters(email);

    expect(result_obj).not.toBeNull();
    expect(result_obj!.actions).toHaveLength(1);
    expect(result_obj!.actions[0].type).toBe('move_to_folder');
    expect(result_obj!.actions[0].value).toBe('Work');
    expect(result_obj!.matchedFilter.name).toBe('Work Filter');
  });

  it('should not apply disabled filters', () => {
    const { result } = renderHook(() => useEmailFilters());

    // Add a disabled filter
    act(() => {
      result.current.addFilter({
        name: 'Disabled Filter',
        conditions: [{ id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: '@work.com' }],
        actions: [{ id: 'act-1', type: 'delete' as FilterActionType }],
        enabled: false,
        priority: 1,
        matchAll: false
      });
    });

    const email = {
      from: 'user@work.com',
      to: 'me@example.com',
      subject: 'Test Subject',
      body: 'Test body',
      hasAttachment: false,
      size: 1024,
      priority: 'normal'
    };

    const result_obj = result.current.applyFilters(email);

    expect(result_obj).toBeNull();
  });

  it('should handle multiple conditions with AND logic', () => {
    const { result } = renderHook(() => useEmailFilters());

    // Add a filter with multiple conditions
    act(() => {
      result.current.addFilter({
        name: 'Multi-condition Filter',
        conditions: [
          { id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: '@company.com' },
          { id: 'cond-2', field: 'subject' as FilterConditionField, operator: 'contains' as const, value: 'Important' }
        ],
        actions: [{ id: 'act-1', type: 'mark_as_important' as FilterActionType }],
        enabled: true,
        priority: 1,
        matchAll: true
      });
    });

    // Email that matches only one condition
    const partialMatchEmail = {
      from: 'user@company.com',
      to: 'me@example.com',
      subject: 'Regular Subject',
      body: 'Test body',
      hasAttachment: false,
      size: 1024,
      priority: 'normal'
    };

    const partialResult = result.current.applyFilters(partialMatchEmail);
    expect(partialResult).toBeNull();

    // Email that matches both conditions
    const fullMatchEmail = {
      from: 'user@company.com',
      to: 'me@example.com',
      subject: 'Important Update',
      body: 'Test body',
      hasAttachment: false,
      size: 1024,
      priority: 'normal'
    };

    const fullResult = result.current.applyFilters(fullMatchEmail);
    expect(fullResult).not.toBeNull();
    expect(fullResult!.matchedFilter.name).toBe('Multi-condition Filter');
  });

  it('should handle size conditions', () => {
    const { result } = renderHook(() => useEmailFilters());

    // Add a filter for large emails
    act(() => {
      result.current.addFilter({
        name: 'Large Email Filter',
        conditions: [{ id: 'cond-1', field: 'size_greater' as FilterConditionField, operator: 'equals' as const, value: '10' }],
        actions: [{ id: 'act-1', type: 'label' as FilterActionType, value: 'large' }],
        enabled: true,
        priority: 1,
        matchAll: false
      });
    });

    const largeEmail = {
      from: 'user@example.com',
      to: 'me@example.com',
      subject: 'Large Attachment',
      body: 'Test body',
      hasAttachment: true,
      size: 15 * 1024 * 1024, // 15 MB
      priority: 'normal'
    };

    const result_obj = result.current.applyFilters(largeEmail);
    expect(result_obj).not.toBeNull();
    expect(result_obj!.matchedFilter.name).toBe('Large Email Filter');
  });

  it('should update stats when filter is added', () => {
    const { result } = renderHook(() => useEmailFilters());

    act(() => {
      result.current.addFilter({
        name: 'Active Filter',
        conditions: [{ id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: '@test.com' }],
        actions: [{ id: 'act-1', type: 'archive' as FilterActionType }],
        enabled: true,
        priority: 1,
        matchAll: false
      });
    });

    expect(result.current.stats.totalRules).toBe(1);
    expect(result.current.stats.activeRules).toBe(1);
  });

  it('should update stats when filter is disabled', () => {
    const { result } = renderHook(() => useEmailFilters());

    // Add enabled filter
    act(() => {
      result.current.addFilter({
        name: 'Toggle Stats',
        conditions: [{ id: 'cond-1', field: 'from' as FilterConditionField, operator: 'contains' as const, value: '@test.com' }],
        actions: [{ id: 'act-1', type: 'archive' as FilterActionType }],
        enabled: true,
        priority: 1,
        matchAll: false
      });
    });

    expect(result.current.stats.activeRules).toBe(1);

    // Disable the filter
    const filterId = result.current.filters[0].id;
    act(() => {
      result.current.toggleFilter(filterId);
    });

    expect(result.current.stats.activeRules).toBe(0);
  });
});
