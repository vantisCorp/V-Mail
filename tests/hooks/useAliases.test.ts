import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAliases } from '../../src/hooks/useAliases';

describe('useAliases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useAliases());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.aliases).toHaveLength(0);
    });

    it('should load mock aliases after timeout', async () => {
      const { result } = renderHook(() => useAliases());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.aliases).toHaveLength(4);
    });

    it('should have correct mock alias data', async () => {
      const { result } = renderHook(() => useAliases());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const aliases = result.current.aliases;
      expect(aliases[0].email).toBe('phantom1@vantis-phantom.com');
      expect(aliases[0].domain).toBe('vantis-phantom.com');
      expect(aliases[0].id).toBe('1');

      expect(aliases[2].email).toBe('ghost@secure-mail.io');
      expect(aliases[2].domain).toBe('secure-mail.io');

      expect(aliases[3].email).toBe('shadow@encrypted-mail.net');
      expect(aliases[3].domain).toBe('encrypted-mail.net');
    });

    it('should have createdAt dates on all aliases', async () => {
      const { result } = renderHook(() => useAliases());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      result.current.aliases.forEach((alias) => {
        expect(alias.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('createAlias', () => {
    it('should create a new alias with the given domain', async () => {
      const { result } = renderHook(() => useAliases());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      let newAlias;
      await act(async () => {
        newAlias = await result.current.createAlias('test-domain.com');
      });

      expect(result.current.aliases).toHaveLength(5);
      expect(newAlias).toBeDefined();
      expect(newAlias!.domain).toBe('test-domain.com');
      expect(newAlias!.email).toContain('@test-domain.com');
      expect(newAlias!.id).toBeDefined();
      expect(newAlias!.createdAt).toBeInstanceOf(Date);
    });

    it('should add alias to the end of the list', async () => {
      const { result } = renderHook(() => useAliases());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      await act(async () => {
        await result.current.createAlias('new-domain.com');
      });

      const lastAlias = result.current.aliases[result.current.aliases.length - 1];
      expect(lastAlias.domain).toBe('new-domain.com');
    });

    it('should create multiple aliases', async () => {
      const { result } = renderHook(() => useAliases());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      await act(async () => {
        await result.current.createAlias('domain1.com');
      });
      await act(async () => {
        await result.current.createAlias('domain2.com');
      });

      expect(result.current.aliases).toHaveLength(6);
    });
  });

  describe('deleteAlias', () => {
    it('should delete an alias by id', async () => {
      const { result } = renderHook(() => useAliases());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.aliases).toHaveLength(4);

      await act(async () => {
        await result.current.deleteAlias('1');
      });

      expect(result.current.aliases).toHaveLength(3);
      expect(result.current.aliases.find((a) => a.id === '1')).toBeUndefined();
    });

    it('should not affect other aliases when deleting', async () => {
      const { result } = renderHook(() => useAliases());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      await act(async () => {
        await result.current.deleteAlias('2');
      });

      expect(result.current.aliases).toHaveLength(3);
      expect(result.current.aliases.find((a) => a.id === '1')).toBeDefined();
      expect(result.current.aliases.find((a) => a.id === '3')).toBeDefined();
      expect(result.current.aliases.find((a) => a.id === '4')).toBeDefined();
    });

    it('should handle deleting non-existent alias gracefully', async () => {
      const { result } = renderHook(() => useAliases());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      await act(async () => {
        await result.current.deleteAlias('non-existent');
      });

      expect(result.current.aliases).toHaveLength(4);
    });

    it('should be able to delete a newly created alias', async () => {
      const { result } = renderHook(() => useAliases());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      let newAlias;
      await act(async () => {
        newAlias = await result.current.createAlias('temp.com');
      });
      expect(result.current.aliases).toHaveLength(5);

      await act(async () => {
        await result.current.deleteAlias(newAlias!.id);
      });
      expect(result.current.aliases).toHaveLength(4);
    });
  });
});
