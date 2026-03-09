import { useState, useCallback, useEffect } from 'react';
import {
  TemplateType,
  TemplatePermission,
  VariableType,
  TemplateVariable,
  TemplateVersion,
  TemplateAnalytics,
  EmailTemplate,
  TemplateCategory,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  CloneTemplatePayload,
  PreviewTemplatePayload,
  TemplateFilter,
  TemplateUsageLog,
  TemplateValidation
} from '../types/emailTemplates';

/**
 * Default template categories
 */
const DEFAULT_CATEGORIES: TemplateCategory[] = [
  {
    id: 'cat1',
    name: 'General',
    description: 'General purpose templates',
    color: '#6b7280',
    icon: '📧',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cat2',
    name: 'Marketing',
    description: 'Marketing and promotional emails',
    color: '#8b5cf6',
    icon: '📢',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cat3',
    name: 'Transactional',
    description: 'Transactional and automated emails',
    color: '#10b981',
    icon: '⚙️',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cat4',
    name: 'Support',
    description: 'Customer support templates',
    color: '#3b82f6',
    icon: '💬',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cat5',
    name: 'Personal',
    description: 'Personal templates',
    color: '#f59e0b',
    icon: '👤',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

/**
 * System templates
 */
const SYSTEM_TEMPLATES: EmailTemplate[] = [
  {
    id: 'sys1',
    name: 'Welcome Email',
    description: 'Default welcome email for new users',
    type: TemplateType.TRANSACTIONAL,
    permission: TemplatePermission.ORGANIZATION_SHARED,
    categoryId: 'cat3',
    ownerUserId: 'system',
    ownerUserName: 'System',
    ownerUserEmail: 'noreply@vantis.ai',
    content:
      "<h1>Welcome, {{recipient_name}}!</h1><p>Thank you for joining V-Mail. We're excited to have you on board.</p><p>Best regards,<br/>The V-Mail Team</p>",
    variables: [
      {
        id: 'v1',
        name: 'Recipient Name',
        key: 'recipient_name',
        description: 'The name of the email recipient',
        type: VariableType.TEXT,
        isRequired: true,
        example: 'John Doe'
      }
    ],
    sections: [],
    tags: ['welcome', 'onboarding'],
    isFavorite: false,
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    versions: [],
    currentVersionId: '1.0.0',
    analytics: {
      templateId: 'sys1',
      templateName: 'Welcome Email',
      totalUses: 1250,
      usesThisWeek: 45,
      usesThisMonth: 180,
      lastUsed: '2025-03-01T10:00:00Z',
      topUsers: []
    }
  },
  {
    id: 'sys2',
    name: 'Password Reset',
    description: 'Password reset email template',
    type: TemplateType.TRANSACTIONAL,
    permission: TemplatePermission.ORGANIZATION_SHARED,
    categoryId: 'cat3',
    ownerUserId: 'system',
    ownerUserName: 'System',
    ownerUserEmail: 'noreply@vantis.ai',
    content:
      '<h1>Password Reset Request</h1><p>Hello {{recipient_name}},</p><p>We received a request to reset your password. Click the link below to proceed:</p><p><a href="{{reset_link}}">Reset Password</a></p><p>This link will expire in {{expiration_hours}} hours.</p>',
    variables: [
      {
        id: 'v1',
        name: 'Recipient Name',
        key: 'recipient_name',
        description: 'The name of the email recipient',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v2',
        name: 'Reset Link',
        key: 'reset_link',
        description: 'The password reset link',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v3',
        name: 'Expiration Hours',
        key: 'expiration_hours',
        description: 'Hours until link expires',
        type: VariableType.NUMBER,
        isRequired: false,
        defaultValue: '24'
      }
    ],
    sections: [],
    tags: ['security', 'password'],
    isFavorite: false,
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    versions: [],
    currentVersionId: '1.0.0',
    analytics: {
      templateId: 'sys2',
      templateName: 'Password Reset',
      totalUses: 850,
      usesThisWeek: 20,
      usesThisMonth: 65,
      lastUsed: '2025-03-02T14:30:00Z',
      topUsers: []
    }
  },
  {
    id: 'sys3',
    name: 'Meeting Invitation',
    description: 'Meeting invitation template',
    type: TemplateType.STANDARD,
    permission: TemplatePermission.ORGANIZATION_SHARED,
    categoryId: 'cat1',
    ownerUserId: 'system',
    ownerUserName: 'System',
    ownerUserEmail: 'noreply@vantis.ai',
    content:
      '<h1>Meeting Invitation: {{meeting_title}}</h1><p>Dear {{recipient_name}},</p><p>You are invited to attend a meeting:</p><ul><li><strong>Date:</strong> {{meeting_date}}</li><li><strong>Time:</strong> {{meeting_time}}</li><li><strong>Location:</strong> {{meeting_location}}</li><li><strong>Duration:</strong> {{meeting_duration}}</li></ul><p>Agenda:</p><p>{{meeting_agenda}}</p>',
    variables: [
      {
        id: 'v1',
        name: 'Recipient Name',
        key: 'recipient_name',
        description: 'The name of the email recipient',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v2',
        name: 'Meeting Title',
        key: 'meeting_title',
        description: 'The title of the meeting',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v3',
        name: 'Meeting Date',
        key: 'meeting_date',
        description: 'The date of the meeting',
        type: VariableType.DATE,
        isRequired: true
      },
      {
        id: 'v4',
        name: 'Meeting Time',
        key: 'meeting_time',
        description: 'The time of the meeting',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v5',
        name: 'Meeting Location',
        key: 'meeting_location',
        description: 'The location or meeting link',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v6',
        name: 'Meeting Duration',
        key: 'meeting_duration',
        description: 'Duration of the meeting',
        type: VariableType.TEXT,
        isRequired: false,
        defaultValue: '1 hour'
      },
      {
        id: 'v7',
        name: 'Meeting Agenda',
        key: 'meeting_agenda',
        description: 'Meeting agenda items',
        type: VariableType.TEXT,
        isRequired: false
      }
    ],
    sections: [],
    tags: ['meeting', 'calendar'],
    isFavorite: false,
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    versions: [],
    currentVersionId: '1.0.0',
    analytics: {
      templateId: 'sys3',
      templateName: 'Meeting Invitation',
      totalUses: 450,
      usesThisWeek: 15,
      usesThisMonth: 52,
      lastUsed: '2025-03-03T09:00:00Z',
      topUsers: []
    }
  }
];

/**
 * Mock data generators
 */
const generateMockTemplates = (): EmailTemplate[] => [
  {
    id: 'tpl1',
    name: 'Project Update',
    description: 'Weekly project status update template',
    type: TemplateType.STANDARD,
    permission: TemplatePermission.TEAM_SHARED,
    categoryId: 'cat1',
    ownerUserId: 'u1',
    ownerUserName: 'John Smith',
    ownerUserEmail: 'john.smith@example.com',
    content:
      "<h1>Project Status Update - {{project_name}}</h1><p>Hi Team,</p><p>Here's the weekly update for {{project_name}}:</p><h2>Progress: {{progress_percentage}}%</h2><p><strong>Completed this week:</strong></p><p>{{completed_tasks}}</p><p><strong>Planned for next week:</strong></p><p>{{planned_tasks}}</p><p><strong>Blockers:</strong></p><p>{{blockers}}</p>",
    variables: [
      {
        id: 'v1',
        name: 'Project Name',
        key: 'project_name',
        description: 'Name of the project',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v2',
        name: 'Progress Percentage',
        key: 'progress_percentage',
        description: 'Project completion percentage',
        type: VariableType.NUMBER,
        isRequired: true
      },
      {
        id: 'v3',
        name: 'Completed Tasks',
        key: 'completed_tasks',
        description: 'Tasks completed this week',
        type: VariableType.TEXT,
        isRequired: false
      },
      {
        id: 'v4',
        name: 'Planned Tasks',
        key: 'planned_tasks',
        description: 'Tasks planned for next week',
        type: VariableType.TEXT,
        isRequired: false
      },
      {
        id: 'v5',
        name: 'Blockers',
        key: 'blockers',
        description: 'Current blockers',
        type: VariableType.TEXT,
        isRequired: false
      }
    ],
    sections: [],
    tags: ['project', 'weekly', 'status'],
    isFavorite: true,
    isSystem: false,
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2025-02-20T14:30:00Z',
    versions: [
      {
        id: 'ver1',
        version: '1.0.0',
        content: 'Initial version',
        variables: [],
        sections: [],
        createdAt: '2024-02-15T10:00:00Z',
        createdBy: 'u1',
        createdByName: 'John Smith',
        changeLog: 'Initial creation',
        isCurrent: false
      },
      {
        id: 'ver2',
        version: '1.1.0',
        content: 'Updated template',
        variables: [],
        sections: [],
        createdAt: '2025-02-20T14:30:00Z',
        createdBy: 'u1',
        createdByName: 'John Smith',
        changeLog: 'Added blockers section',
        isCurrent: true
      }
    ],
    currentVersionId: 'ver2',
    analytics: {
      templateId: 'tpl1',
      templateName: 'Project Update',
      totalUses: 156,
      usesThisWeek: 12,
      usesThisMonth: 45,
      lastUsed: '2025-03-01T09:00:00Z',
      topUsers: [{ userId: 'u1', userName: 'John Smith', useCount: 89 }]
    }
  },
  {
    id: 'tpl2',
    name: 'Newsletter',
    description: 'Monthly newsletter template',
    type: TemplateType.MARKETING,
    permission: TemplatePermission.ORGANIZATION_SHARED,
    categoryId: 'cat2',
    ownerUserId: 'u2',
    ownerUserName: 'Jane Doe',
    ownerUserEmail: 'jane.doe@example.com',
    content:
      '<h1>{{newsletter_title}}</h1><p>{{date}}</p><hr/><h2>Featured</h2><p>{{featured_content}}</p><h2>Updates</h2><p>{{updates}}</p><hr/><p><a href="{{unsubscribe_link}}">Unsubscribe</a></p>',
    variables: [
      {
        id: 'v1',
        name: 'Newsletter Title',
        key: 'newsletter_title',
        description: 'Title of the newsletter',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v2',
        name: 'Date',
        key: 'date',
        description: 'Newsletter date',
        type: VariableType.DATE,
        isRequired: true
      },
      {
        id: 'v3',
        name: 'Featured Content',
        key: 'featured_content',
        description: 'Featured content section',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v4',
        name: 'Updates',
        key: 'updates',
        description: 'Updates section',
        type: VariableType.TEXT,
        isRequired: false
      },
      {
        id: 'v5',
        name: 'Unsubscribe Link',
        key: 'unsubscribe_link',
        description: 'Unsubscribe link',
        type: VariableType.TEXT,
        isRequired: true
      }
    ],
    sections: [],
    tags: ['newsletter', 'monthly', 'marketing'],
    isFavorite: false,
    isSystem: false,
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-01T08:00:00Z',
    versions: [],
    currentVersionId: '1.0.0',
    analytics: {
      templateId: 'tpl2',
      templateName: 'Newsletter',
      totalUses: 24,
      usesThisWeek: 0,
      usesThisMonth: 2,
      lastUsed: '2025-02-28T10:00:00Z',
      topUsers: [{ userId: 'u2', userName: 'Jane Doe', useCount: 24 }]
    }
  },
  {
    id: 'tpl3',
    name: 'Support Response',
    description: 'Customer support response template',
    type: TemplateType.TRANSACTIONAL,
    permission: TemplatePermission.TEAM_SHARED,
    categoryId: 'cat4',
    ownerUserId: 'u3',
    ownerUserName: 'Bob Johnson',
    ownerUserEmail: 'bob.johnson@example.com',
    content:
      "<p>Dear {{customer_name}},</p><p>Thank you for contacting us. We have received your inquiry regarding {{ticket_subject}}.</p><p>Our support team has reviewed your case and here's our response:</p><p>{{response_content}}</p><p>If you have any further questions, please don't hesitate to reply to this email.</p><p>Best regards,<br/>{{agent_name}}<br/>Support Team</p><p>Ticket #{{ticket_id}}</p>",
    variables: [
      {
        id: 'v1',
        name: 'Customer Name',
        key: 'customer_name',
        description: 'Customer name',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v2',
        name: 'Ticket Subject',
        key: 'ticket_subject',
        description: 'Subject of the ticket',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v3',
        name: 'Response Content',
        key: 'response_content',
        description: 'The support response',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v4',
        name: 'Agent Name',
        key: 'agent_name',
        description: 'Support agent name',
        type: VariableType.TEXT,
        isRequired: true
      },
      {
        id: 'v5',
        name: 'Ticket ID',
        key: 'ticket_id',
        description: 'Ticket reference ID',
        type: VariableType.TEXT,
        isRequired: true
      }
    ],
    sections: [],
    tags: ['support', 'customer-service'],
    isFavorite: true,
    isSystem: false,
    createdAt: '2024-04-10T11:00:00Z',
    updatedAt: '2025-01-15T09:30:00Z',
    versions: [],
    currentVersionId: '1.0.0',
    analytics: {
      templateId: 'tpl3',
      templateName: 'Support Response',
      totalUses: 520,
      usesThisWeek: 35,
      usesThisMonth: 142,
      lastUsed: '2025-03-03T16:45:00Z',
      topUsers: [{ userId: 'u3', userName: 'Bob Johnson', useCount: 520 }]
    }
  }
];

const generateMockUsageLogs = (): TemplateUsageLog[] => [
  {
    id: 'log1',
    templateId: 'tpl1',
    templateName: 'Project Update',
    templateVersion: '1.1.0',
    userId: 'u1',
    userName: 'John Smith',
    userEmail: 'john.smith@example.com',
    recipientEmail: 'team@example.com',
    subject: 'Weekly Project Update',
    usedAt: '2025-03-01T09:00:00Z'
  },
  {
    id: 'log2',
    templateId: 'tpl3',
    templateName: 'Support Response',
    templateVersion: '1.0.0',
    userId: 'u3',
    userName: 'Bob Johnson',
    userEmail: 'bob.johnson@example.com',
    recipientEmail: 'customer@example.com',
    subject: 'Re: Account Issue',
    usedAt: '2025-03-03T16:45:00Z'
  }
];

export const useEmailTemplates = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>(DEFAULT_CATEGORIES);
  const [usageLogs, setUsageLogs] = useState<TemplateUsageLog[]>([]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTemplates([...SYSTEM_TEMPLATES, ...generateMockTemplates()]);
      setUsageLogs(generateMockUsageLogs());
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  // Template CRUD operations
  const createTemplate = useCallback(
    async (payload: CreateTemplatePayload): Promise<EmailTemplate | null> => {
      const newTemplate: EmailTemplate = {
        id: `tpl_${Date.now()}`,
        name: payload.name,
        description: payload.description,
        type: payload.type,
        permission: payload.permission,
        categoryId: payload.categoryId,
        ownerUserId: 'current_user',
        ownerUserName: 'Current User',
        ownerUserEmail: 'current@example.com',
        content: payload.content,
        variables: payload.variables || [],
        sections: payload.sections || [],
        tags: payload.tags || [],
        isFavorite: false,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: [],
        currentVersionId: '1.0.0',
        analytics: {
          templateId: `tpl_${Date.now()}`,
          templateName: payload.name,
          totalUses: 0,
          usesThisWeek: 0,
          usesThisMonth: 0,
          lastUsed: new Date().toISOString(),
          topUsers: []
        }
      };
      setTemplates([...templates, newTemplate]);
      return newTemplate;
    },
    [templates]
  );

  const updateTemplate = useCallback(
    async (id: string, payload: UpdateTemplatePayload): Promise<EmailTemplate | null> => {
      const index = templates.findIndex((t) => t.id === id);
      if (index === -1) {
        return null;
      }

      const updated: EmailTemplate = {
        ...templates[index],
        ...payload,
        updatedAt: new Date().toISOString()
      };
      const updatedTemplates = [...templates];
      updatedTemplates[index] = updated;
      setTemplates(updatedTemplates);
      return updated;
    },
    [templates]
  );

  const deleteTemplate = useCallback(
    async (id: string): Promise<boolean> => {
      const index = templates.findIndex((t) => t.id === id);
      if (index === -1) {
        return false;
      }
      if (templates[index].isSystem) {
        return false;
      } // Cannot delete system templates

      const updated = templates.filter((t) => t.id !== id);
      setTemplates(updated);
      return true;
    },
    [templates]
  );

  const cloneTemplate = useCallback(
    async (payload: CloneTemplatePayload): Promise<EmailTemplate | null> => {
      const source = templates.find((t) => t.id === payload.sourceTemplateId);
      if (!source) {
        return null;
      }

      const cloned: EmailTemplate = {
        ...source,
        id: `tpl_${Date.now()}`,
        name: payload.name,
        description: payload.description || source.description,
        permission: payload.permission || source.permission,
        ownerUserId: 'current_user',
        ownerUserName: 'Current User',
        ownerUserEmail: 'current@example.com',
        isSystem: false,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: [],
        analytics: {
          templateId: `tpl_${Date.now()}`,
          templateName: payload.name,
          totalUses: 0,
          usesThisWeek: 0,
          usesThisMonth: 0,
          lastUsed: new Date().toISOString(),
          topUsers: []
        }
      };
      setTemplates([...templates, cloned]);
      return cloned;
    },
    [templates]
  );

  // Variable operations
  const addVariable = useCallback(
    async (templateId: string, variable: Omit<TemplateVariable, 'id'>): Promise<TemplateVariable | null> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        return null;
      }

      const newVariable: TemplateVariable = {
        ...variable,
        id: `var_${Date.now()}`
      };
      const updatedVariables = [...template.variables, newVariable];

      await updateTemplate(templateId, { variables: updatedVariables });
      return newVariable;
    },
    [templates, updateTemplate]
  );

  const updateVariable = useCallback(
    async (templateId: string, variableId: string, updates: Partial<TemplateVariable>): Promise<boolean> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        return false;
      }

      const index = template.variables.findIndex((v) => v.id === variableId);
      if (index === -1) {
        return false;
      }

      const updatedVariables = [...template.variables];
      updatedVariables[index] = { ...updatedVariables[index], ...updates };

      await updateTemplate(templateId, { variables: updatedVariables });
      return true;
    },
    [templates, updateTemplate]
  );

  const removeVariable = useCallback(
    async (templateId: string, variableId: string): Promise<boolean> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        return false;
      }

      const updatedVariables = template.variables.filter((v) => v.id !== variableId);
      await updateTemplate(templateId, { variables: updatedVariables });
      return true;
    },
    [templates, updateTemplate]
  );

  // Preview and validation
  const previewTemplate = useCallback(
    (payload: PreviewTemplatePayload): string => {
      const template = templates.find((t) => t.id === payload.templateId);
      if (!template) {
        return '';
      }

      let content = template.content;
      Object.entries(payload.variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      return content;
    },
    [templates]
  );

  const validateTemplate = useCallback((content: string): TemplateValidation => {
    const errors: TemplateValidation['errors'] = [];
    const warnings: TemplateValidation['warnings'] = [];

    // Check for unbalanced braces
    const openBraces = (content.match(/{{/g) || []).length;
    const closeBraces = (content.match(/}}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({
        field: 'content',
        message: 'Unbalanced template variable braces detected'
      });
    }

    // Check for empty variables
    const emptyVars = content.match(/{{\s*}}/g);
    if (emptyVars) {
      errors.push({
        field: 'content',
        message: 'Empty template variables found'
      });
    }

    // Check for potentially broken HTML
    if (content.includes('<') && !content.includes('>')) {
      warnings.push({
        field: 'content',
        message: 'Potentially unclosed HTML tag detected'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  // Filter and search
  const getFilteredTemplates = useCallback(
    (filter?: TemplateFilter): EmailTemplate[] => {
      let filtered = [...templates];

      if (filter?.type) {
        filtered = filtered.filter((t) => t.type === filter.type);
      }
      if (filter?.permission) {
        filtered = filtered.filter((t) => t.permission === filter.permission);
      }
      if (filter?.categoryId) {
        filtered = filtered.filter((t) => t.categoryId === filter.categoryId);
      }
      if (filter?.tags && filter.tags.length > 0) {
        filtered = filtered.filter((t) => t.tags.some((tag) => filter.tags!.includes(tag)));
      }
      if (filter?.isFavorite !== undefined) {
        filtered = filtered.filter((t) => t.isFavorite === filter.isFavorite);
      }
      if (filter?.isSystem !== undefined) {
        filtered = filtered.filter((t) => t.isSystem === filter.isSystem);
      }
      if (filter?.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      // Sorting
      if (filter?.sortBy) {
        filtered.sort((a, b) => {
          let aVal: string | number = '';
          let bVal: string | number = '';

          switch (filter.sortBy) {
            case 'name':
              aVal = a.name.toLowerCase();
              bVal = b.name.toLowerCase();
              break;
            case 'createdAt':
              aVal = new Date(a.createdAt).getTime();
              bVal = new Date(b.createdAt).getTime();
              break;
            case 'updatedAt':
              aVal = new Date(a.updatedAt).getTime();
              bVal = new Date(b.updatedAt).getTime();
              break;
            case 'totalUses':
              aVal = a.analytics.totalUses;
              bVal = b.analytics.totalUses;
              break;
          }

          if (filter.sortOrder === 'desc') {
            return aVal > bVal ? -1 : 1;
          }
          return aVal < bVal ? -1 : 1;
        });
      }

      return filtered;
    },
    [templates]
  );

  // Favorites
  const toggleFavorite = useCallback(
    async (templateId: string): Promise<boolean> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        return false;
      }

      await updateTemplate(templateId, { isFavorite: !template.isFavorite });
      return true;
    },
    [templates, updateTemplate]
  );

  // Version management
  const createVersion = useCallback(
    async (templateId: string, changeLog: string): Promise<TemplateVersion | null> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        return null;
      }

      const newVersion: TemplateVersion = {
        id: `ver_${Date.now()}`,
        version: `${template.versions.length + 1}.0.0`,
        content: template.content,
        variables: template.variables,
        sections: template.sections,
        createdAt: new Date().toISOString(),
        createdBy: 'current_user',
        createdByName: 'Current User',
        changeLog,
        isCurrent: true
      };

      const updatedVersions = template.versions.map((v) => ({ ...v, isCurrent: false }));
      updatedVersions.push(newVersion);

      await updateTemplate(templateId, { versions: updatedVersions, currentVersionId: newVersion.id });
      return newVersion;
    },
    [templates, updateTemplate]
  );

  const restoreVersion = useCallback(
    async (templateId: string, versionId: string): Promise<boolean> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        return false;
      }

      const version = template.versions.find((v) => v.id === versionId);
      if (!version) {
        return false;
      }

      await updateTemplate(templateId, {
        content: version.content,
        variables: version.variables,
        sections: version.sections,
        currentVersionId: versionId
      });
      return true;
    },
    [templates, updateTemplate]
  );

  // Category management
  const createCategory = useCallback(
    async (category: Omit<TemplateCategory, 'id' | 'createdAt'>): Promise<TemplateCategory> => {
      const newCategory: TemplateCategory = {
        ...category,
        id: `cat_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setCategories([...categories, newCategory]);
      return newCategory;
    },
    [categories]
  );

  // Analytics
  const getTemplateAnalytics = useCallback(
    (templateId: string): TemplateAnalytics | null => {
      const template = templates.find((t) => t.id === templateId);
      return template?.analytics || null;
    },
    [templates]
  );

  const getUsageLogs = useCallback(
    (templateId?: string): TemplateUsageLog[] => {
      if (templateId) {
        return usageLogs.filter((log) => log.templateId === templateId);
      }
      return usageLogs;
    },
    [usageLogs]
  );

  // Utility functions
  const getTemplateById = useCallback(
    (id: string): EmailTemplate | null => {
      return templates.find((t) => t.id === id) || null;
    },
    [templates]
  );

  const getTemplatesByCategory = useCallback(
    (categoryId: string): EmailTemplate[] => {
      return templates.filter((t) => t.categoryId === categoryId);
    },
    [templates]
  );

  const getTemplatesByTag = useCallback(
    (tag: string): EmailTemplate[] => {
      return templates.filter((t) => t.tags.includes(tag));
    },
    [templates]
  );

  const getFavorites = useCallback((): EmailTemplate[] => {
    return templates.filter((t) => t.isFavorite);
  }, [templates]);

  const getSystemTemplates = useCallback((): EmailTemplate[] => {
    return templates.filter((t) => t.isSystem);
  }, [templates]);

  const getUserTemplates = useCallback((): EmailTemplate[] => {
    return templates.filter((t) => !t.isSystem);
  }, [templates]);

  // Refresh functions
  const refreshTemplates = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setTemplates([...SYSTEM_TEMPLATES, ...generateMockTemplates()]);
    setIsLoading(false);
  }, []);

  const refreshUsageLogs = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setUsageLogs(generateMockUsageLogs());
  }, []);

  return {
    // State
    isLoading,
    templates,
    categories,
    usageLogs,

    // CRUD operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    cloneTemplate,

    // Variable operations
    addVariable,
    updateVariable,
    removeVariable,

    // Preview and validation
    previewTemplate,
    validateTemplate,

    // Filter and search
    getFilteredTemplates,

    // Favorites
    toggleFavorite,

    // Version management
    createVersion,
    restoreVersion,

    // Category management
    createCategory,

    // Analytics
    getTemplateAnalytics,
    getUsageLogs,

    // Utility functions
    getTemplateById,
    getTemplatesByCategory,
    getTemplatesByTag,
    getFavorites,
    getSystemTemplates,
    getUserTemplates,

    // Refresh functions
    refreshTemplates,
    refreshUsageLogs
  };
};
