import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../../src/hooks/usePagination';

describe('usePagination', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));
    
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(10);
    expect(result.current.itemsPerPage).toBe(10);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(false);
  });

  it('should go to next page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));
    
    act(() => {
      result.current.goToNextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.hasPreviousPage).toBe(true);
  });

  it('should go to previous page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100, initialPage: 3 }));
    
    act(() => {
      result.current.goToPreviousPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('should go to specific page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));
    
    act(() => {
      result.current.goToPage(5);
    });

    expect(result.current.currentPage).toBe(5);
  });

  it('should not go beyond last page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));
    
    act(() => {
      result.current.goToPage(20);
    });

    expect(result.current.currentPage).toBe(10);
  });

  it('should not go before first page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));
    
    act(() => {
      result.current.goToPage(0);
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should reset to first page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100, initialPage: 5 }));
    
    act(() => {
      result.current.reset();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should calculate correct start and end indices', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));
    
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(10);

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.startIndex).toBe(10);
    expect(result.current.endIndex).toBe(20);
  });
});
