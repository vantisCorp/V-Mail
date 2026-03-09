/**
 * Email Signatures Hook Tests for V-Mail v1.6.0
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useEmailSignatures } from '../useEmailSignatures';
import { SignatureType, SignaturePosition, SignatureProvider } from '../../types/emailSignatures';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useEmailSignatures', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should initialize with default state', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.signatures).toBeDefined();
      expect(result.current.signatures).toEqual([]);
      expect(result.current.templates).toBeDefined();
      expect(result.current.templates.length).toBeGreaterThan(0);
      expect(result.current.error).toBeNull();
    });

    test('should load default templates', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.templates.length).toBeGreaterThan(0);
      expect(result.current.templates[0]).toHaveProperty('id');
      expect(result.current.templates[0]).toHaveProperty('name');
      expect(result.current.templates[0]).toHaveProperty('htmlTemplate');
    });
  });

  describe('CRUD Operations', () => {
    test('should create a new signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createSignature({
          name: 'Test Signature',
          type: SignatureType.HTML,
          htmlContent: '<p>Test</p>',
          plainTextContent: 'Test',
          fullName: 'John Doe'
        });
      });

      expect(result.current.signatures.length).toBe(1);
      expect(result.current.signatures[0].name).toBe('Test Signature');
      expect(result.current.signatures[0].fullName).toBe('John Doe');
    });

    test('should create signature with all fields', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createSignature({
          name: 'Full Signature',
          description: 'A complete signature',
          type: SignatureType.HTML,
          position: SignaturePosition.BOTTOM,
          htmlContent: '<p>John Doe - Acme Corp</p>',
          plainTextContent: 'John Doe - Acme Corp',
          fullName: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          title: 'Developer',
          company: 'Acme Corp',
          department: 'Engineering',
          contactInfo: {
            phone: '+1234567890',
            email: 'john@acme.com',
            website: 'https://acme.com'
          },
          tags: ['work', 'professional']
        });
      });

      const signature = result.current.signatures[0];
      expect(signature.name).toBe('Full Signature');
      expect(signature.title).toBe('Developer');
      expect(signature.company).toBe('Acme Corp');
      expect(signature.contactInfo.phone).toBe('+1234567890');
      expect(signature.tags).toContain('work');
    });

    test('should update an existing signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Original Name',
          type: SignatureType.HTML,
          htmlContent: '<p>Original</p>',
          plainTextContent: 'Original',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      await act(async () => {
        await result.current.updateSignature(signatureId, {
          name: 'Updated Name',
          title: 'Senior Developer'
        });
      });

      expect(result.current.signatures[0].name).toBe('Updated Name');
      expect(result.current.signatures[0].title).toBe('Senior Developer');
    });

    test('should delete a signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'To Delete',
          type: SignatureType.HTML,
          htmlContent: '<p>Delete me</p>',
          plainTextContent: 'Delete me',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      expect(result.current.signatures.length).toBe(1);

      await act(async () => {
        await result.current.deleteSignature(signatureId);
      });

      expect(result.current.signatures.length).toBe(0);
    });

    test('should duplicate a signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Original',
          type: SignatureType.HTML,
          htmlContent: '<p>Content</p>',
          plainTextContent: 'Content',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      await act(async () => {
        await result.current.duplicateSignature(signatureId);
      });

      expect(result.current.signatures.length).toBe(2);
      expect(result.current.signatures[1].name).toContain('Copy');
      expect(result.current.signatures[1].htmlContent).toBe(result.current.signatures[0].htmlContent);
    });

    test('should create signature even with minimal data', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The hook creates signatures even with empty strings - it doesn't validate
      await act(async () => {
        await result.current.createSignature({
          name: '',
          type: SignatureType.HTML,
          htmlContent: '',
          plainTextContent: '',
          fullName: ''
        });
      });

      // The hook creates it anyway
      expect(result.current.signatures.length).toBe(1);
    });
  });

  describe('Query Operations', () => {
    test('should get signature by ID', async () => {
      const { result } = renderHook(() => useEmailSignatures());
      await waitFor(() => !result.current.isLoading);

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Work Signature',
          type: SignatureType.HTML,
          htmlContent: '<p>Work</p>',
          plainTextContent: 'Work',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      const signature = result.current.getSignatureById(signatureId);
      expect(signature).toBeDefined();
      expect(signature?.name).toBe('Work Signature');
    });

    test('should return null for non-existent ID', async () => {
      const { result } = renderHook(() => useEmailSignatures());
      await waitFor(() => !result.current.isLoading);

      const signature = result.current.getSignatureById('non-existent-id');
      expect(signature).toBeNull();
    });

    test('should get default signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());
      await waitFor(() => !result.current.isLoading);

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Test Signature',
          type: SignatureType.HTML,
          htmlContent: '<p>Test</p>',
          plainTextContent: 'Test',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      // Set as default
      await act(async () => {
        await result.current.setDefaultSignature(signatureId);
      });

      const defaultSignature = result.current.getDefaultSignature();
      expect(defaultSignature).toBeDefined();
      expect(defaultSignature?.id).toBe(signatureId);
    });

    test('should get signatures by provider', async () => {
      const { result } = renderHook(() => useEmailSignatures());
      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.createSignature({
          name: 'Gmail Signature',
          type: SignatureType.HTML,
          htmlContent: '<p>Gmail</p>',
          plainTextContent: 'Gmail',
          fullName: 'John Doe',
          provider: SignatureProvider.GMAIL
        });
        await result.current.createSignature({
          name: 'iCloud Signature',
          type: SignatureType.PLAIN_TEXT,
          htmlContent: '<p>iCloud</p>',
          plainTextContent: 'iCloud',
          fullName: 'John Doe',
          provider: SignatureProvider.ICLOUD
        });
      });

      const gmailSignatures = result.current.getSignaturesByProvider(SignatureProvider.GMAIL);

      expect(gmailSignatures.length).toBe(1);
      expect(gmailSignatures[0].provider).toBe(SignatureProvider.GMAIL);
    });

    test('should get active signatures', async () => {
      const { result } = renderHook(() => useEmailSignatures());
      await waitFor(() => !result.current.isLoading);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let firstId: string = '';
      let secondId: string = '';

      await act(async () => {
        const sig1 = await result.current.createSignature({
          name: 'Active',
          type: SignatureType.HTML,
          htmlContent: '<p>Active</p>',
          plainTextContent: 'Active',
          fullName: 'John Doe'
        });
        firstId = sig1!.id;

        const sig2 = await result.current.createSignature({
          name: 'Inactive',
          type: SignatureType.HTML,
          htmlContent: '<p>Inactive</p>',
          plainTextContent: 'Inactive',
          fullName: 'John Doe'
        });
        secondId = sig2!.id;
      });

      // Deactivate the second signature
      await act(async () => {
        await result.current.toggleSignatureActive(secondId, false);
      });

      const activeSignatures = result.current.getActiveSignatures();
      expect(activeSignatures.length).toBe(1);
      expect(activeSignatures[0].isActive).toBe(true);
    });

    test('should filter signatures by type', async () => {
      const { result } = renderHook(() => useEmailSignatures());
      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.createSignature({
          name: 'HTML Sig',
          type: SignatureType.HTML,
          htmlContent: '<p>HTML</p>',
          plainTextContent: 'HTML',
          fullName: 'John Doe'
        });
        await result.current.createSignature({
          name: 'Plain Sig',
          type: SignatureType.PLAIN_TEXT,
          htmlContent: '<p>Plain</p>',
          plainTextContent: 'Plain',
          fullName: 'John Doe'
        });
      });

      const filtered = result.current.filterSignatures({
        type: SignatureType.PLAIN_TEXT
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].type).toBe(SignatureType.PLAIN_TEXT);
    });

    test('should filter signatures by search query', async () => {
      const { result } = renderHook(() => useEmailSignatures());
      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.createSignature({
          name: 'Work Signature',
          type: SignatureType.HTML,
          htmlContent: '<p>Work</p>',
          plainTextContent: 'Work',
          fullName: 'John Doe'
        });
        await result.current.createSignature({
          name: 'Personal Signature',
          type: SignatureType.PLAIN_TEXT,
          htmlContent: '<p>Personal</p>',
          plainTextContent: 'Personal',
          fullName: 'John Doe'
        });
      });

      const filtered = result.current.filterSignatures({
        searchQuery: 'Work'
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Work Signature');
    });

    test('should filter signatures by tags', async () => {
      const { result } = renderHook(() => useEmailSignatures());
      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.createSignature({
          name: 'Tagged Signature',
          type: SignatureType.HTML,
          htmlContent: '<p>Tagged</p>',
          plainTextContent: 'Tagged',
          fullName: 'John Doe',
          tags: ['personal', 'important']
        });
        await result.current.createSignature({
          name: 'Other Signature',
          type: SignatureType.HTML,
          htmlContent: '<p>Other</p>',
          plainTextContent: 'Other',
          fullName: 'John Doe',
          tags: ['work']
        });
      });

      const filtered = result.current.filterSignatures({
        tags: ['personal']
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].tags).toContain('personal');
    });
  });

  describe('Settings Operations', () => {
    test('should set default signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Test',
          type: SignatureType.HTML,
          htmlContent: '<p>Test</p>',
          plainTextContent: 'Test',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      await act(async () => {
        await result.current.setDefaultSignature(signatureId);
      });

      expect(result.current.signatures[0].isDefault).toBe(true);
    });

    test('should unset previous default when setting new default', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let firstId: string = '';
      let secondId: string = '';

      await act(async () => {
        const sig1 = await result.current.createSignature({
          name: 'First',
          type: SignatureType.HTML,
          htmlContent: '<p>First</p>',
          plainTextContent: 'First',
          fullName: 'John Doe'
        });
        firstId = sig1!.id;

        const sig2 = await result.current.createSignature({
          name: 'Second',
          type: SignatureType.HTML,
          htmlContent: '<p>Second</p>',
          plainTextContent: 'Second',
          fullName: 'John Doe'
        });
        secondId = sig2!.id;
      });

      // Set first as default
      await act(async () => {
        await result.current.setDefaultSignature(firstId);
      });

      const firstSig = result.current.signatures.find((s) => s.id === firstId);
      expect(firstSig?.isDefault).toBe(true);

      // Set second as default
      await act(async () => {
        await result.current.setDefaultSignature(secondId);
      });

      const firstSigAfter = result.current.signatures.find((s) => s.id === firstId);
      const secondSigAfter = result.current.signatures.find((s) => s.id === secondId);
      expect(firstSigAfter?.isDefault).toBe(false);
      expect(secondSigAfter?.isDefault).toBe(true);
    });

    test('should toggle signature active state', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Test',
          type: SignatureType.HTML,
          htmlContent: '<p>Test</p>',
          plainTextContent: 'Test',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      expect(result.current.signatures[0].isActive).toBe(true);

      await act(async () => {
        await result.current.toggleSignatureActive(signatureId, false);
      });

      expect(result.current.signatures[0].isActive).toBe(false);
    });
  });

  describe('Rendering Operations', () => {
    test('should render signature HTML content by ID', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Test',
          type: SignatureType.HTML,
          htmlContent: '<p>Hello {{fullName}}</p>',
          plainTextContent: 'Hello {{fullName}}',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      const rendered = result.current.renderSignatureById(signatureId, 'html');
      expect(rendered).toContain('John Doe');
    });

    test('should render signature plain text content by ID', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Test',
          type: SignatureType.PLAIN_TEXT,
          htmlContent: '<p>Hello {{fullName}}</p>',
          plainTextContent: 'Hello {{fullName}}',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      const rendered = result.current.renderSignatureById(signatureId, 'plain');
      expect(rendered).toContain('John Doe');
    });

    test('should return empty string for non-existent signature ID', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rendered = result.current.renderSignatureById('non-existent', 'html');
      expect(rendered).toBe('');
    });

    test('should preview signature with custom data', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const preview = result.current.previewSignature('<p>{{fullName}} - {{title}}</p>', {
        fullName: 'Jane Doe',
        title: 'Manager'
      });

      expect(preview).toContain('Jane Doe');
      expect(preview).toContain('Manager');
    });
  });

  describe('Usage Tracking', () => {
    test('should log signature usage', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Test',
          type: SignatureType.HTML,
          htmlContent: '<p>Test</p>',
          plainTextContent: 'Test',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      await act(async () => {
        await result.current.logUsage(signatureId, 'email-123', 'new', 'recipient@example.com');
      });

      const logs = result.current.getUsageLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].signatureId).toBe(signatureId);
      expect(logs[0].emailType).toBe('new');
    });

    test('should get signature statistics', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Test',
          type: SignatureType.HTML,
          htmlContent: '<p>Test</p>',
          plainTextContent: 'Test',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      // Log usage twice
      await act(async () => {
        await result.current.logUsage(signatureId, 'email-1', 'new', 'recipient1@example.com');
      });

      await act(async () => {
        await result.current.logUsage(signatureId, 'email-2', 'reply', 'recipient2@example.com');
      });

      const stats = result.current.getStats();

      expect(stats.totalSignatures).toBe(1);
      expect(stats.activeSignatures).toBe(1);
      expect(stats.totalUsage).toBe(2);
      expect(stats.mostUsedSignature).toBe(signatureId);
    });

    test('should increment usage count on signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Test',
          type: SignatureType.HTML,
          htmlContent: '<p>Test</p>',
          plainTextContent: 'Test',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      expect(result.current.signatures[0].usageCount).toBe(0);

      await act(async () => {
        await result.current.logUsage(signatureId, 'email-1', 'new', 'recipient@example.com');
      });

      expect(result.current.signatures[0].usageCount).toBe(1);
    });
  });

  describe('Template Operations', () => {
    test('should get template by ID', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const templates = result.current.templates;
      const template = result.current.getTemplateById(templates[0].id);

      expect(template).toBeDefined();
      expect(template?.name).toBe(templates[0].name);
    });

    test('should return null for non-existent template ID', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.getTemplateById('non-existent');
      expect(template).toBeNull();
    });

    test('should get templates by category', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const professionalTemplates = result.current.getTemplatesByCategory('professional');

      expect(professionalTemplates.length).toBeGreaterThan(0);
      professionalTemplates.forEach((t) => {
        expect(t.category).toBe('professional');
      });
    });

    test('should create signature from template', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const templates = result.current.templates;
      const templateId = templates[0].id;

      await act(async () => {
        await result.current.createFromTemplate(templateId, {
          fullName: 'Jane Smith',
          title: 'Engineer',
          company: 'Tech Corp'
        });
      });

      expect(result.current.signatures.length).toBe(1);
      expect(result.current.signatures[0].fullName).toBe('Jane Smith');
      expect(result.current.signatures[0].templateId).toBe(templateId);
    });

    test('should return null when creating from non-existent template', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createFromTemplate('non-existent', {
          fullName: 'Test'
        });
      });

      expect(result.current.signatures.length).toBe(0);
    });
  });

  describe('Social Links Operations', () => {
    test('should add social link to signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Test',
          type: SignatureType.HTML,
          htmlContent: '<p>Test</p>',
          plainTextContent: 'Test',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      await act(async () => {
        await result.current.addSocialLink(signatureId, {
          platform: 'linkedin',
          url: 'https://linkedin.com/in/johndoe'
        });
      });

      expect(result.current.signatures[0].socialLinks.length).toBe(1);
      expect(result.current.signatures[0].socialLinks[0].platform).toBe('linkedin');
    });

    test('should remove social link from signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signatureId: string = '';

      await act(async () => {
        const signature = await result.current.createSignature({
          name: 'Test',
          type: SignatureType.HTML,
          htmlContent: '<p>Test</p>',
          plainTextContent: 'Test',
          fullName: 'John Doe'
        });
        signatureId = signature!.id;
      });

      await act(async () => {
        await result.current.addSocialLink(signatureId, {
          platform: 'linkedin',
          url: 'https://linkedin.com/in/johndoe'
        });
      });

      // Get link ID after state update
      await waitFor(() => {
        expect(result.current.signatures[0].socialLinks.length).toBe(1);
      });

      const linkId = result.current.signatures[0].socialLinks[0].id;

      await act(async () => {
        await result.current.removeSocialLink(signatureId, linkId);
      });

      expect(result.current.signatures[0].socialLinks.length).toBe(0);
    });

    test('should return false when adding link to non-existent signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const success = await result.current.addSocialLink('non-existent', {
        platform: 'linkedin',
        url: 'https://linkedin.com/in/johndoe'
      });

      expect(success).toBe(false);
    });

    test('should return false when removing link from non-existent signature', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const success = await result.current.removeSocialLink('non-existent', 'link-id');
      expect(success).toBe(false);
    });
  });

  describe('Import/Export Operations', () => {
    test('should export signatures', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createSignature({
          name: 'Test 1',
          type: SignatureType.HTML,
          htmlContent: '<p>Test 1</p>',
          plainTextContent: 'Test 1',
          fullName: 'John Doe'
        });
        await result.current.createSignature({
          name: 'Test 2',
          type: SignatureType.HTML,
          htmlContent: '<p>Test 2</p>',
          plainTextContent: 'Test 2',
          fullName: 'Jane Doe'
        });
      });

      const exported = result.current.exportSignatures();
      const parsed = JSON.parse(exported);

      expect(parsed.length).toBe(2);
      expect(parsed[0].name).toBe('Test 1');
      expect(parsed[1].name).toBe('Test 2');
    });

    test('should import signatures', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const importData = JSON.stringify([
        {
          id: 'imported-1',
          name: 'Imported Signature',
          type: SignatureType.HTML,
          htmlContent: '<p>Imported</p>',
          plainTextContent: 'Imported',
          fullName: 'Imported User'
        },
        {
          id: 'imported-2',
          name: 'Another Imported',
          type: SignatureType.PLAIN_TEXT,
          htmlContent: '<p>Another</p>',
          plainTextContent: 'Another',
          fullName: 'Another User'
        }
      ]);

      let importedCount: number = 0;

      await act(async () => {
        importedCount = await result.current.importSignatures(importData);
      });

      expect(importedCount).toBe(2);
      expect(result.current.signatures.length).toBe(2);
    });

    test('should handle invalid import data', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let importedCount: number = 0;

      await act(async () => {
        importedCount = await result.current.importSignatures('invalid json');
      });

      expect(importedCount).toBe(0);
      expect(result.current.signatures.length).toBe(0);
    });

    test('should filter invalid signatures on import', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const importData = JSON.stringify([
        {
          id: 'valid-1',
          name: 'Valid Signature',
          type: SignatureType.HTML,
          htmlContent: '<p>Valid</p>',
          plainTextContent: 'Valid',
          fullName: 'Valid User'
        },
        {
          // Missing required fields
          id: 'invalid-1',
          name: '',
          fullName: ''
        },
        {
          // Missing id
          name: 'Also Invalid',
          fullName: 'No ID'
        }
      ]);

      let importedCount: number = 0;

      await act(async () => {
        importedCount = await result.current.importSignatures(importData);
      });

      expect(importedCount).toBe(1);
      expect(result.current.signatures.length).toBe(1);
    });

    test('should clear all signatures', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createSignature({
          name: 'Test 1',
          type: SignatureType.HTML,
          htmlContent: '<p>Test 1</p>',
          plainTextContent: 'Test 1',
          fullName: 'John Doe'
        });
        await result.current.createSignature({
          name: 'Test 2',
          type: SignatureType.HTML,
          htmlContent: '<p>Test 2</p>',
          plainTextContent: 'Test 2',
          fullName: 'Jane Doe'
        });
      });

      expect(result.current.signatures.length).toBe(2);

      await act(async () => {
        await result.current.clearAllSignatures();
      });

      expect(result.current.signatures.length).toBe(0);
    });
  });

  describe('LocalStorage Persistence', () => {
    test('should persist signatures to localStorage', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createSignature({
          name: 'Persisted',
          type: SignatureType.HTML,
          htmlContent: '<p>Persisted</p>',
          plainTextContent: 'Persisted',
          fullName: 'John Doe'
        });
      });

      // Check that localStorage.setItem was called
      expect(localStorageMock.setItem).toHaveBeenCalled();

      // Get the last call arguments
      const calls = localStorageMock.setItem.mock.calls;
      const signatureCall = calls.find((call) => call[0] === 'v-mail-signatures');
      expect(signatureCall).toBeDefined();

      const savedData = JSON.parse(signatureCall![1]);
      expect(savedData.length).toBe(1);
      expect(savedData[0].name).toBe('Persisted');
    });

    test('should load signatures from localStorage on init', async () => {
      // Pre-populate localStorage
      const existingSignature = {
        id: 'existing-1',
        name: 'Existing Signature',
        type: SignatureType.HTML,
        position: SignaturePosition.BOTTOM,
        isDefault: false,
        isActive: true,
        htmlContent: '<p>Existing</p>',
        plainTextContent: 'Existing',
        fullName: 'Existing User',
        contactInfo: {},
        socialLinks: [],
        autoInsert: true,
        insertForNew: true,
        insertForReply: true,
        insertForForward: true,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      };

      localStorageMock.getItem = vi.fn(() => JSON.stringify([existingSignature]));

      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.signatures.length).toBe(1);
      expect(result.current.signatures[0].name).toBe('Existing Signature');
    });
  });

  describe('Error Handling', () => {
    test('should handle update on non-existent signature gracefully', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // This should not throw
      await act(async () => {
        const result_signature = await result.current.updateSignature('non-existent', {
          name: 'Updated'
        });
        expect(result_signature).toBeNull();
      });
    });

    test('should handle delete on non-existent signature gracefully', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // This should not throw
      await act(async () => {
        const success = await result.current.deleteSignature('non-existent');
        expect(success).toBe(false);
      });
    });

    test('should handle duplicate on non-existent signature gracefully', async () => {
      const { result } = renderHook(() => useEmailSignatures());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // This should not throw
      await act(async () => {
        const signature = await result.current.duplicateSignature('non-existent');
        expect(signature).toBeNull();
      });
    });
  });
});
