import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  SignatureType,
  SignaturePosition,
  SignatureProvider,
  EmailSignature,
  SignatureTemplate,
  SignatureSocialLink,
  CreateSignaturePayload,
  UpdateSignaturePayload,
  SignatureFilterOptions,
  SignaturePreviewOptions,
  SignatureStats,
  SignatureUsageLog
} from '../types/emailSignatures';

const STORAGE_KEY = 'v-mail-signatures';
const TEMPLATES_KEY = 'v-mail-signature-templates';

/**
 * Default signature templates
 */
const DEFAULT_TEMPLATES: SignatureTemplate[] = [
  {
    id: 'tpl-professional-1',
    name: 'Professional Classic',
    description: 'Clean and professional signature layout',
    category: 'professional',
    htmlTemplate: `<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif;">
      <tr><td style="padding-bottom: 5px;"><strong>{{fullName}}</strong></td></tr>
      <tr><td style="color: #666;">{{title}} | {{company}}</td></tr>
      <tr><td style="padding-top: 10px;">
        <a href="tel:{{phone}}">{{phone}}</a> |
        <a href="mailto:{{email}}">{{email}}</a>
      </td></tr>
    </table>`,
    plainTextTemplate: '{{fullName}}\n{{title}} | {{company}}\n{{phone}} | {{email}}',
    variables: ['fullName', 'title', 'company', 'phone', 'email'],
    isPremium: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tpl-minimal-1',
    name: 'Minimal',
    description: 'Simple and elegant signature',
    category: 'minimal',
    htmlTemplate: `<div style="font-family: Helvetica, sans-serif;">
      <strong>{{fullName}}</strong><br>
      <span style="color: #888;">{{title}}</span><br>
      <a href="mailto:{{email}}" style="color: #0066cc;">{{email}}</a>
    </div>`,
    plainTextTemplate: '{{fullName}}\n{{title}}\n{{email}}',
    variables: ['fullName', 'title', 'email'],
    isPremium: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tpl-corporate-1',
    name: 'Corporate',
    description: 'Full-featured corporate signature with logo',
    category: 'corporate',
    htmlTemplate: `<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif;">
      <tr>
        <td style="padding-right: 15px;">
          <img src="{{logoUrl}}" alt="{{company}}" style="width: 80px; height: auto;">
        </td>
        <td>
          <strong style="font-size: 16px;">{{fullName}}</strong><br>
          <span style="color: #666;">{{title}}</span><br>
          <span style="color: #888;">{{department}} | {{company}}</span><br><br>
          <span style="font-size: 12px;">
            📞 {{phone}} | 📱 {{mobile}}<br>
            ✉️ <a href="mailto:{{email}}">{{email}}</a><br>
            🌐 <a href="{{website}}">{{website}}</a>
          </span>
        </td>
      </tr>
    </table>`,
    plainTextTemplate: '{{fullName}}\n{{title}}\n{{department}} | {{company}}\n{{phone}} | {{mobile}}\n{{email}}\n{{website}}',
    variables: ['fullName', 'title', 'department', 'company', 'phone', 'mobile', 'email', 'website', 'logoUrl'],
    isPremium: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tpl-creative-1',
    name: 'Creative Colorful',
    description: 'Vibrant and creative signature',
    category: 'creative',
    htmlTemplate: `<div style="font-family: Georgia, serif; border-left: 4px solid {{primaryColor}}; padding-left: 15px;">
      <strong style="font-size: 18px; color: {{primaryColor}};">{{fullName}}</strong><br>
      <span style="color: #666; font-style: italic;">{{title}}</span><br><br>
      <span style="font-size: 14px;">
        📍 {{company}}<br>
        ✉️ <a href="mailto:{{email}}" style="color: {{primaryColor}};">{{email}}</a>
      </span>
    </div>`,
    plainTextTemplate: '{{fullName}}\n{{title}}\n{{company}}\n{{email}}',
    variables: ['fullName', 'title', 'company', 'email', 'primaryColor'],
    isPremium: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

/**
 * Generate a unique ID
 */
const generateId = (): string => {
  return `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * useEmailSignatures Hook
 */
export function useEmailSignatures() {
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [templates, setTemplates] = useState<SignatureTemplate[]>(DEFAULT_TEMPLATES);
  const [usageLogs, setUsageLogs] = useState<SignatureUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load signatures from storage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSignatures(JSON.parse(stored));
        }

        const storedLogs = localStorage.getItem(`${STORAGE_KEY}-logs`);
        if (storedLogs) {
          setUsageLogs(JSON.parse(storedLogs));
        }
      } catch (err) {
        console.error('Failed to load signatures:', err);
        setError('Failed to load signatures');
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Save signatures to storage
  const saveSignatures = useCallback((sigs: EmailSignature[] | ((prev: EmailSignature[]) => EmailSignature[])) => {
    if (typeof sigs === 'function') {
      setSignatures(prev => {
        const newSigs = sigs(prev);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSigs));
        return newSigs;
      });
    } else {
      setSignatures(sigs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sigs));
    }
  }, []);

  // Save usage logs to storage
  const saveUsageLogs = useCallback((logs: SignatureUsageLog[] | ((prev: SignatureUsageLog[]) => SignatureUsageLog[])) => {
    if (typeof logs === 'function') {
      setUsageLogs(prev => {
        const newLogs = logs(prev);
        localStorage.setItem(`${STORAGE_KEY}-logs`, JSON.stringify(newLogs));
        return newLogs;
      });
    } else {
      setUsageLogs(logs);
      localStorage.setItem(`${STORAGE_KEY}-logs`, JSON.stringify(logs));
    }
  }, []);

  // Create a new signature
  const createSignature = useCallback(async (payload: CreateSignaturePayload): Promise<EmailSignature> => {
    const now = new Date().toISOString();
    const newSignature: EmailSignature = {
      id: generateId(),
      name: payload.name,
      description: payload.description,
      type: payload.type,
      position: payload.position || SignaturePosition.BOTTOM,
      isDefault: payload.isDefault || false,
      isActive: true,
      htmlContent: payload.htmlContent,
      plainTextContent: payload.plainTextContent,
      fullName: payload.fullName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      title: payload.title,
      company: payload.company,
      department: payload.department,
      contactInfo: {
        phone: payload.contactInfo?.phone,
        mobile: payload.contactInfo?.mobile,
        fax: payload.contactInfo?.fax,
        email: payload.contactInfo?.email,
        website: payload.contactInfo?.website,
        address: payload.contactInfo?.address
      },
      socialLinks: (payload.socialLinks || []).map((link, index) => ({
        id: `social-${index}`,
        ...link
      })),
      logoUrl: payload.logoUrl,
      photoUrl: payload.photoUrl,
      bannerUrl: payload.bannerUrl,
      primaryColor: payload.primaryColor,
      secondaryColor: payload.secondaryColor,
      fontFamily: payload.fontFamily,
      templateId: payload.templateId,
      provider: payload.provider,
      providerAccountId: payload.providerAccountId,
      autoInsert: payload.autoInsert ?? true,
      insertForNew: payload.insertForNew ?? true,
      insertForReply: payload.insertForReply ?? false,
      insertForForward: payload.insertForForward ?? false,
      tags: payload.tags || [],
      createdAt: now,
      updatedAt: now,
      usageCount: 0
    };

    // If this is set as default, remove default from others
    if (newSignature.isDefault) {
      saveSignatures(prev => {
        const updated = prev.map(s => ({ ...s, isDefault: false }));
        updated.push(newSignature);
        return updated;
      });
    } else {
      saveSignatures(prev => [...prev, newSignature]);
    }

    return newSignature;
  }, [saveSignatures]);

  // Update an existing signature
  const updateSignature = useCallback(async (id: string, payload: UpdateSignaturePayload): Promise<EmailSignature | null> => {
    let updatedSignature: EmailSignature | null = null;

    saveSignatures(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1) {
return prev;
}

      const updated: EmailSignature = {
        ...prev[index],
        ...payload,
        updatedAt: new Date().toISOString()
      };
      updatedSignature = updated;

      // If setting as default, remove default from others
      if (payload.isDefault) {
        const updatedSignatures = prev.map(s => ({ ...s, isDefault: false }));
        updatedSignatures[index] = updated;
        return updatedSignatures;
      } else {
        const updatedSignatures = [...prev];
        updatedSignatures[index] = updated;
        return updatedSignatures;
      }
    });

    return updatedSignature;
  }, [saveSignatures]);

  // Delete a signature
  const deleteSignature = useCallback(async (id: string): Promise<boolean> => {
    let deleted = false;

    saveSignatures(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length !== prev.length) {
        deleted = true;
      }
      return filtered;
    });

    return deleted;
  }, [saveSignatures]);

  // Set default signature
  const setDefaultSignature = useCallback(async (id: string): Promise<boolean> => {
    let found = false;

    saveSignatures(prev => {
      const signature = prev.find(s => s.id === id);
      if (!signature) {
return prev;
}
      found = true;

      return prev.map(s => ({
        ...s,
        isDefault: s.id === id
      }));
    });

    return found;
  }, [saveSignatures]);

  // Toggle signature active state
  const toggleSignatureActive = useCallback(async (id: string, active?: boolean): Promise<boolean> => {
    let found = false;

    saveSignatures(prev => {
      const signature = prev.find(s => s.id === id);
      if (!signature) {
return prev;
}
      found = true;

      return prev.map(s =>
        s.id === id ? { ...s, isActive: active !== undefined ? active : !s.isActive, updatedAt: new Date().toISOString() } : s
      );
    });

    return found;
  }, [saveSignatures]);

  // Duplicate a signature
  const duplicateSignature = useCallback(async (id: string): Promise<EmailSignature | null> => {
    let duplicated: EmailSignature | null = null;

    saveSignatures(prev => {
      const signature = prev.find(s => s.id === id);
      if (!signature) {
return prev;
}

      const now = new Date().toISOString();
      duplicated = {
        ...signature,
        id: generateId(),
        name: `${signature.name} (Copy)`,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
        usageCount: 0
      };

      return [...prev, duplicated!];
    });

    return duplicated;
  }, [saveSignatures]);

  // Get signature by ID
  const getSignatureById = useCallback((id: string): EmailSignature | null => {
    return signatures.find(s => s.id === id) || null;
  }, [signatures]);

  // Get default signature
  const getDefaultSignature = useCallback((): EmailSignature | null => {
    return signatures.find(s => s.isDefault && s.isActive) || null;
  }, [signatures]);

  // Get signatures by provider
  const getSignaturesByProvider = useCallback((provider: SignatureProvider): EmailSignature[] => {
    return signatures.filter(s => s.provider === provider);
  }, [signatures]);

  // Get active signatures
  const getActiveSignatures = useCallback((): EmailSignature[] => {
    return signatures.filter(s => s.isActive);
  }, [signatures]);

  // Filter signatures
  const filterSignatures = useCallback((options: SignatureFilterOptions): EmailSignature[] => {
    let filtered = [...signatures];

    if (options.type !== undefined) {
      filtered = filtered.filter(s => s.type === options.type);
    }
    if (options.isDefault !== undefined) {
      filtered = filtered.filter(s => s.isDefault === options.isDefault);
    }
    if (options.isActive !== undefined) {
      filtered = filtered.filter(s => s.isActive === options.isActive);
    }
    if (options.provider !== undefined) {
      filtered = filtered.filter(s => s.provider === options.provider);
    }
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.fullName.toLowerCase().includes(query) ||
        s.company?.toLowerCase().includes(query) ||
        s.title?.toLowerCase().includes(query)
      );
    }
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(s =>
        options.tags!.some(tag => s.tags.includes(tag))
      );
    }

    return filtered;
  }, [signatures]);

  // Render signature with variables replaced
  const renderSignature = useCallback((signature: EmailSignature, format: 'html' | 'plain' = 'html'): string => {
    const template = format === 'html' ? signature.htmlContent : signature.plainTextContent;

    let rendered = template;

    // Replace variables
    rendered = rendered.replace(/\{\{fullName\}\}/g, signature.fullName);
    rendered = rendered.replace(/\{\{firstName\}\}/g, signature.firstName || '');
    rendered = rendered.replace(/\{\{lastName\}\}/g, signature.lastName || '');
    rendered = rendered.replace(/\{\{title\}\}/g, signature.title || '');
    rendered = rendered.replace(/\{\{company\}\}/g, signature.company || '');
    rendered = rendered.replace(/\{\{department\}\}/g, signature.department || '');
    rendered = rendered.replace(/\{\{phone\}\}/g, signature.contactInfo.phone || '');
    rendered = rendered.replace(/\{\{mobile\}\}/g, signature.contactInfo.mobile || '');
    rendered = rendered.replace(/\{\{email\}\}/g, signature.contactInfo.email || '');
    rendered = rendered.replace(/\{\{website\}\}/g, signature.contactInfo.website || '');
    rendered = rendered.replace(/\{\{address\}\}/g, signature.contactInfo.address || '');
    rendered = rendered.replace(/\{\{logoUrl\}\}/g, signature.logoUrl || '');
    rendered = rendered.replace(/\{\{photoUrl\}\}/g, signature.photoUrl || '');
    rendered = rendered.replace(/\{\{primaryColor\}\}/g, signature.primaryColor || '#0066cc');
    rendered = rendered.replace(/\{\{secondaryColor\}\}/g, signature.secondaryColor || '#666666');

    return rendered;
  }, []);

  // Render signature by ID
  const renderSignatureById = useCallback((signatureId: string, format: 'html' | 'plain' = 'html'): string => {
    const signature = signatures.find(s => s.id === signatureId);
    if (!signature) {
return '';
}

    const template = format === 'html' ? signature.htmlContent : signature.plainTextContent;
    if (!template) {
return '';
}

    let rendered = template;

    // Replace variables
    rendered = rendered.replace(/{{fullName}}/g, signature.fullName || '');
    rendered = rendered.replace(/{{firstName}}/g, signature.firstName || '');
    rendered = rendered.replace(/{{lastName}}/g, signature.lastName || '');
    rendered = rendered.replace(/{{title}}/g, signature.title || '');
    rendered = rendered.replace(/{{company}}/g, signature.company || '');
    rendered = rendered.replace(/{{department}}/g, signature.department || '');
    rendered = rendered.replace(/{{phone}}/g, signature.contactInfo?.phone || '');
    rendered = rendered.replace(/{{mobile}}/g, signature.contactInfo?.mobile || '');
    rendered = rendered.replace(/{{email}}/g, signature.contactInfo?.email || '');
    rendered = rendered.replace(/{{website}}/g, signature.contactInfo?.website || '');
    rendered = rendered.replace(/{{address}}/g, signature.contactInfo?.address || '');
    rendered = rendered.replace(/{{logoUrl}}/g, signature.logoUrl || '');
    rendered = rendered.replace(/{{photoUrl}}/g, signature.photoUrl || '');
    rendered = rendered.replace(/{{primaryColor}}/g, signature.primaryColor || '#0066cc');
    rendered = rendered.replace(/{{secondaryColor}}/g, signature.secondaryColor || '#666666');

    return rendered;
  }, [signatures]);

  // Preview signature with custom data
  const previewSignature = useCallback((template: string, data: Record<string, string>): string => {
    let rendered = template;

    // Replace all provided variables
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, data[key] || '');
    });

    return rendered;
  }, []);

  // Log signature usage
  const logUsage = useCallback((signatureId: string, emailId: string, emailType: 'new' | 'reply' | 'forward', recipientEmail: string): void => {
    const now = new Date().toISOString();

    // Find the signature first to get its name
    const signature = signatures.find(s => s.id === signatureId);
    if (!signature) {
return;
}

    // Update usage count
    saveSignatures(prev => prev.map(s =>
      s.id === signatureId
        ? { ...s, usageCount: s.usageCount + 1, lastUsed: now }
        : s
    ));

    // Add usage log
    const log: SignatureUsageLog = {
      id: `log-${Date.now()}`,
      signatureId,
      signatureName: signature.name,
      emailId,
      emailType,
      recipientEmail,
      usedAt: now
    };
    saveUsageLogs(prev => [log, ...prev].slice(0, 100)); // Keep last 100 logs
  }, [signatures, saveSignatures, saveUsageLogs]);

  // Get signature statistics
  const getStats = useCallback((): SignatureStats => {
    const active = signatures.filter(s => s.isActive);
    const defaultSig = signatures.find(s => s.isDefault);

    const usageByProvider: Record<string, number> = {};
    signatures.forEach(s => {
      const provider = s.provider || 'custom';
      usageByProvider[provider] = (usageByProvider[provider] || 0) + s.usageCount;
    });

    const totalUsage = signatures.reduce((sum, s) => sum + s.usageCount, 0);
    const mostUsed = [...signatures].sort((a, b) => b.usageCount - a.usageCount)[0];

    const recentlyUsed = usageLogs
      .slice(0, 5)
      .map(log => ({
        signatureId: log.signatureId,
        signatureName: log.signatureName,
        usedAt: log.usedAt
      }));

    return {
      totalSignatures: signatures.length,
      activeSignatures: active.length,
      defaultSignature: defaultSig?.id,
      totalUsage,
      usageByProvider,
      mostUsedSignature: mostUsed?.id,
      recentlyUsed
    };
  }, [signatures, usageLogs]);

  // Get template by ID
  const getTemplateById = useCallback((id: string): SignatureTemplate | null => {
    return templates.find(t => t.id === id) || null;
  }, [templates]);

  // Get templates by category
  const getTemplatesByCategory = useCallback((category: SignatureTemplate['category']): SignatureTemplate[] => {
    return templates.filter(t => t.category === category);
  }, [templates]);

  // Create signature from template
  const createFromTemplate = useCallback(async (templateId: string, data: Partial<CreateSignaturePayload>): Promise<EmailSignature | null> => {
    const template = templates.find(t => t.id === templateId);
    if (!template) {
return null;
}

    const payload: CreateSignaturePayload = {
      name: data.name || template.name,
      description: data.description || template.description,
      type: SignatureType.HTML,
      htmlContent: template.htmlTemplate,
      plainTextContent: template.plainTextTemplate,
      fullName: data.fullName || '',
      title: data.title,
      company: data.company,
      contactInfo: data.contactInfo,
      templateId,
      ...data
    };

    return createSignature(payload);
  }, [templates, createSignature]);

  // Add social link to signature
  const addSocialLink = useCallback(async (signatureId: string, link: Omit<SignatureSocialLink, 'id'>): Promise<boolean> => {
    let found = false;

    saveSignatures(prev => {
      const signature = prev.find(s => s.id === signatureId);
      if (!signature) {
return prev;
}
      found = true;

      const newLink: SignatureSocialLink = {
        id: `social-${Date.now()}`,
        ...link
      };

      return prev.map(s =>
        s.id === signatureId
          ? { ...s, socialLinks: [...s.socialLinks, newLink], updatedAt: new Date().toISOString() }
          : s
      );
    });

    return found;
  }, [saveSignatures]);

  // Remove social link from signature
  const removeSocialLink = useCallback(async (signatureId: string, linkId: string): Promise<boolean> => {
    let found = false;

    saveSignatures(prev => {
      const signature = prev.find(s => s.id === signatureId);
      if (!signature) {
return prev;
}
      found = true;

      return prev.map(s =>
        s.id === signatureId
          ? { ...s, socialLinks: s.socialLinks.filter(l => l.id !== linkId), updatedAt: new Date().toISOString() }
          : s
      );
    });

    return found;
  }, [saveSignatures]);

  // Export signatures
  const exportSignatures = useCallback((): string => {
    return JSON.stringify(signatures, null, 2);
  }, [signatures]);

  // Import signatures
  const importSignatures = useCallback(async (jsonData: string): Promise<number> => {
    try {
      const imported: EmailSignature[] = JSON.parse(jsonData);
      const valid = imported.filter(s => s.id && s.name && s.fullName);

      if (valid.length === 0) {
return 0;
}

      // Generate new IDs to avoid conflicts
      const withNewIds = valid.map(s => ({
        ...s,
        id: generateId(),
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      saveSignatures(prev => [...prev, ...withNewIds]);
      return withNewIds.length;
    } catch (err) {
      console.error('Failed to import signatures:', err);
      return 0;
    }
  }, [saveSignatures]);

  // Clear all signatures
  const clearAllSignatures = useCallback(async (): Promise<void> => {
    saveSignatures([]);
    saveUsageLogs([]);
  }, [saveSignatures, saveUsageLogs]);

  return {
    // State
    isLoading,
    signatures,
    templates,
    usageLogs,
    error,

    // CRUD operations
    createSignature,
    updateSignature,
    deleteSignature,
    duplicateSignature,

    // Query operations
    getSignatureById,
    getDefaultSignature,
    getSignaturesByProvider,
    getActiveSignatures,
    filterSignatures,

    // Settings
    setDefaultSignature,
    toggleSignatureActive,

    // Rendering
    renderSignature,
    renderSignatureById,
    previewSignature,

    // Usage tracking
    logUsage,
    getStats,
    getUsageLogs: () => usageLogs,

    // Templates
    getTemplateById,
    getTemplatesByCategory,
    createFromTemplate,

    // Social links
    addSocialLink,
    removeSocialLink,

    // Import/Export
    exportSignatures,
    importSignatures,
    clearAllSignatures
  };
}
