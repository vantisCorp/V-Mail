import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmailTemplates } from '../../src/hooks/useEmailTemplates';

describe('useEmailTemplates Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useEmailTemplates());

      expect(result.current.isLoading).toBe(true);
    });

    it('should load templates after initialization', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.templates.length).toBeGreaterThan(0);
      expect(result.current.categories.length).toBeGreaterThan(0);
    });

    it('should load system templates', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const systemTemplates = result.current.getSystemTemplates();
      expect(systemTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('Template CRUD Operations', () => {
    it('should create a new template', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.templates.length;

      await act(async () => {
        await result.current.createTemplate({
          name: 'Test Template',
          subject: 'Test Subject',
          body: 'Test Body',
          type: 'standard',
          permission: 'private',
          categoryId: 'cat-1',
          createdBy: 'user-1'
        });
      });

      expect(result.current.templates.length).toBe(initialCount + 1);
    });

    it('should update an existing template', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.templates[0];
      const originalName = template.name;

      await act(async () => {
        await result.current.updateTemplate(template.id, {
          name: 'Updated Template'
        });
      });

      const updated = result.current.getTemplateById(template.id);
      expect(updated?.name).toBe('Updated Template');
      expect(updated?.name).not.toBe(originalName);
    });

    it('should delete a template', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create a template first
      await act(async () => {
        await result.current.createTemplate({
          name: 'Template to Delete',
          subject: 'Test Subject',
          body: 'Test Body',
          type: 'standard',
          permission: 'private',
          categoryId: 'cat-1',
          createdBy: 'user-1'
        });
      });

      const templateToDelete = result.current.templates.find(t => t.name === 'Template to Delete');
      expect(templateToDelete).toBeDefined();

      const initialCount = result.current.templates.length;

      await act(async () => {
        await result.current.deleteTemplate(templateToDelete!.id);
      });

      expect(result.current.templates.length).toBeLessThan(initialCount);
      expect(result.current.getTemplateById(templateToDelete!.id)).toBeNull();
    });

    it('should not allow deletion of system templates', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const systemTemplate = result.current.getSystemTemplates()[0];
      expect(systemTemplate).toBeDefined();

      const initialCount = result.current.templates.length;

      await act(async () => {
        await result.current.deleteTemplate(systemTemplate.id);
      });

      expect(result.current.templates.length).toBe(initialCount);
    });

    it('should clone a template', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalTemplate = result.current.templates[0];
      const initialCount = result.current.templates.length;

      await act(async () => {
        await result.current.cloneTemplate({
          sourceTemplateId: originalTemplate.id,
          name: 'Cloned Template',
          createdBy: 'user-1'
        });
      });

      expect(result.current.templates.length).toBeGreaterThan(initialCount);
    });
  });

  describe('Template Preview and Validation', () => {
    it('should preview template with variables replaced', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.templates.find(t => t.variables.length > 0);
      expect(template).toBeDefined();

      const preview = result.current.previewTemplate({
        templateId: template!.id,
        variables: {}
      });

      expect(preview).toBeDefined();
      expect(typeof preview).toBe('string');
    });

    it('should validate template with valid content', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const validContent = 'Hello {{name}}, welcome to {{company}}';
      const validation = result.current.validateTemplate(validContent);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should validate template with invalid content', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const invalidContent = 'Hello {{name}}, welcome to {{company}';
      const validation = result.current.validateTemplate(invalidContent);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Template Filtering and Search', () => {
    it('should filter templates by type', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const filtered = result.current.getFilteredTemplates({
        type: 'standard'
      });

      expect(filtered.every(t => t.type === 'standard')).toBe(true);
    });

    it('should filter templates by category', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const category = result.current.categories[0];
      const filtered = result.current.getTemplatesByCategory(category.id);

      expect(Array.isArray(filtered)).toBe(true);
    });

    it('should search templates by tag', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const templateWithTag = result.current.templates.find(t => t.tags.length > 0);
      if (templateWithTag) {
        const filtered = result.current.getTemplatesByTag(templateWithTag.tags[0]);
        expect(filtered.every(t => t.tags.includes(templateWithTag.tags[0]))).toBe(true);
      }
    });

    it('should apply multiple filters together', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const filtered = result.current.getFilteredTemplates({
        type: 'standard',
        permission: 'public'
      });

      expect(filtered.every(t =>
        t.type === 'standard' &&
        t.permission === 'public'
      )).toBe(true);
    });
  });

  describe('Template Variables Management', () => {
    it('should add variable to template', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create a template
      await act(async () => {
        await result.current.createTemplate({
          name: 'Template with Variables',
          subject: 'Hello {{name}}',
          body: 'Welcome {{company}}',
          type: 'standard',
          permission: 'private',
          categoryId: 'cat-1',
          createdBy: 'user-1'
        });
      });

      const template = result.current.templates.find(t => t.name === 'Template with Variables');
      const initialVarCount = template!.variables.length;

      await act(async () => {
        await result.current.addVariable(template!.id, {
          name: 'customVar',
          type: 'text',
          defaultValue: 'default',
          required: true
        });
      });

      const updated = result.current.getTemplateById(template!.id);
      expect(updated?.variables.length).toBe(initialVarCount + 1);
    });

    it('should update variable in template', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.templates.find(t => t.variables.length > 0);
      expect(template).toBeDefined();

      const varToUpdate = template!.variables[0];
      const originalDefault = varToUpdate.defaultValue;

      await act(async () => {
        await result.current.updateVariable(template!.id, varToUpdate.id, {
          defaultValue: 'updated default'
        });
      });

      const updated = result.current.getTemplateById(template!.id);
      const updatedVar = updated?.variables.find(v => v.id === varToUpdate.id);
      expect(updatedVar?.defaultValue).toBe('updated default');
      expect(updatedVar?.defaultValue).not.toBe(originalDefault);
    });

    it('should remove variable from template', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.templates.find(t => t.variables.length > 0);
      expect(template).toBeDefined();

      const initialVarCount = template!.variables.length;
      const varToRemove = template!.variables[0];

      await act(async () => {
        await result.current.removeVariable(template!.id, varToRemove.id);
      });

      const updated = result.current.getTemplateById(template!.id);
      expect(updated?.variables.length).toBe(initialVarCount - 1);
      expect(updated?.variables.find(v => v.id === varToRemove.id)).toBeUndefined();
    });
  });

  describe('Template Favorites', () => {
    it('should add template to favorites', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.templates[0];
      expect(template.isFavorite).toBe(false);

      await act(async () => {
        await result.current.toggleFavorite(template.id);
      });

      const updated = result.current.getTemplateById(template.id);
      expect(updated?.isFavorite).toBe(true);
    });

    it('should remove template from favorites', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add to favorites first
      const template = result.current.templates[0];
      await act(async () => {
        await result.current.toggleFavorite(template.id);
      });

      await act(async () => {
        await result.current.toggleFavorite(template.id);
      });

      const updated = result.current.getTemplateById(template.id);
      expect(updated?.isFavorite).toBe(false);
    });

    it('should get favorite templates', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add a template to favorites
      const template = result.current.templates[0];
      await act(async () => {
        await result.current.toggleFavorite(template.id);
      });

      const favorites = result.current.getFavorites();
      expect(favorites.length).toBeGreaterThan(0);
      expect(favorites.every(t => t.isFavorite)).toBe(true);
    });
  });

  describe('Template Version Management', () => {
    it('should create a new version', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.templates[0];
      const initialVersionCount = template.versions.length;

      await act(async () => {
        await result.current.createVersion(template.id, 'Updated content');
      });

      const updated = result.current.getTemplateById(template.id);
      expect(updated?.versions.length).toBe(initialVersionCount + 1);
    });

    it('should restore a previous version', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.templates[0];
      const originalBody = template.body;

      // Create a new version with different content
      await act(async () => {
        await result.current.createVersion(template.id, 'New content');
      });

      // Restore the original version
      if (template.versions.length > 0) {
        await act(async () => {
          await result.current.restoreVersion(template.id, template.versions[template.versions.length - 1].id);
        });

        const restored = result.current.getTemplateById(template.id);
        expect(restored?.body).toBe(originalBody);
      }
    });
  });

  describe('Template Analytics', () => {
    it('should get template analytics', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.templates[0];
      const analytics = result.current.getTemplateAnalytics(template.id);

      expect(analytics).toBeDefined();
    });
  });

  describe('Usage Logs', () => {
    it('should get usage logs', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const logs = result.current.getUsageLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should get usage logs for specific template', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.templates[0];
      const logs = result.current.getUsageLogs(template.id);

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle updating non-existent template', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const updateResult = await result.current.updateTemplate('non-existent-id', {
          name: 'Updated'
        });
        expect(updateResult).toBeNull();
      });
    });

    it('should handle deleting non-existent template', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.templates.length;

      await act(async () => {
        const deleteResult = await result.current.deleteTemplate('non-existent-id');
        expect(deleteResult).toBe(false);
      });

      expect(result.current.templates.length).toBe(initialCount);
    });
  });

  describe('Refresh Functions', () => {
    it('should refresh templates', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshTemplates();
      });

      expect(result.current.templates).toBeDefined();
    });

    it('should refresh usage logs', async () => {
      const { result } = renderHook(() => useEmailTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshUsageLogs();
      });

      expect(result.current.usageLogs).toBeDefined();
    });
  });
});
