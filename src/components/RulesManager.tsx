import React, { useState, useCallback, useMemo } from 'react';
import { useEmailRules } from '../hooks/useEmailRules';
import {
  EmailRule,
  RuleStatus,
  RulePriority,
  RuleType,
  ConditionLogic,
  RuleCondition,
  RuleAction,
  RuleFilter,
  RuleTemplate
} from '../types/emailRules';

export const RulesManager: React.FC = () => {
  const {
    rules,
    templates,
    isLoading,
    selectedRule,
    setSelectedRule,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
    testRule,
    getFilteredRules,
    createRuleFromTemplate
  } = useEmailRules();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<RuleType | ''>('');
  const [filterStatus, setFilterStatus] = useState<RuleStatus | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingRule, setEditingRule] = useState<EmailRule | null>(null);

  // Filtered rules
  const filteredRules = useMemo(() => {
    return getFilteredRules({
      type: filterType || undefined,
      status: filterStatus || undefined,
      searchQuery: searchQuery || undefined
    });
  }, [getFilteredRules, filterType, filterStatus, searchQuery]);

  // Handlers
  const handleToggleStatus = useCallback(
    async (ruleId: string) => {
      await toggleRuleStatus(ruleId);
    },
    [toggleRuleStatus]
  );

  const handleDeleteRule = useCallback(
    async (ruleId: string) => {
      if (window.confirm('Are you sure you want to delete this rule?')) {
        await deleteRule(ruleId);
      }
    },
    [deleteRule]
  );

  const handleEditRule = useCallback((rule: EmailRule) => {
    setEditingRule(rule);
    setShowCreateModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
    setEditingRule(null);
  }, []);

  // Status badge class
  const getStatusClass = (status: RuleStatus): string => {
    switch (status) {
      case RuleStatus.ACTIVE:
        return 'status-active';
      case RuleStatus.PAUSED:
        return 'status-paused';
      case RuleStatus.DISABLED:
        return 'status-disabled';
      default:
        return '';
    }
  };

  // Priority badge class
  const getPriorityClass = (priority: RulePriority): string => {
    switch (priority) {
      case RulePriority.URGENT:
        return 'priority-urgent';
      case RulePriority.HIGH:
        return 'priority-high';
      case RulePriority.MEDIUM:
        return 'priority-medium';
      case RulePriority.LOW:
        return 'priority-low';
      default:
        return '';
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="automation-manager loading">
        <div className="spinner"></div>
        <span>Loading rules...</span>
      </div>
    );
  }

  return (
    <div className="automation-manager">
      {/* Header */}
      <div className="automation-header">
        <h1>Email Automation & Rules</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowTemplateModal(true)}>
            <span>📋</span> From Template
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span>+</span> Create Rule
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="automation-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as RuleType | '')}>
            <option value="">All Types</option>
            <option value={RuleType.AUTO_REPLY}>Auto-Reply</option>
            <option value={RuleType.FORWARDING}>Forwarding</option>
            <option value={RuleType.CATEGORIZATION}>Categorization</option>
            <option value={RuleType.CLEANUP}>Cleanup</option>
            <option value={RuleType.NOTIFICATION}>Notification</option>
            <option value={RuleType.CUSTOM}>Custom</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as RuleStatus | '')}>
            <option value="">All Status</option>
            <option value={RuleStatus.ACTIVE}>Active</option>
            <option value={RuleStatus.PAUSED}>Paused</option>
            <option value={RuleStatus.DISABLED}>Disabled</option>
          </select>
        </div>
        <div className="filter-info">
          Showing {filteredRules.length} of {rules.length} rules
        </div>
      </div>

      {/* Rules List */}
      <div className="rules-list">
        {filteredRules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No rules found</h3>
            <p>Create your first automation rule to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              Create Your First Rule
            </button>
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={`rule-card ${selectedRule?.id === rule.id ? 'selected' : ''}`}
              onClick={() => setSelectedRule(rule)}
            >
              <div className="rule-header">
                <div className="rule-info">
                  <h3>{rule.name}</h3>
                  <span className={`status-badge ${getStatusClass(rule.status)}`}>{rule.status}</span>
                  <span className={`priority-badge ${getPriorityClass(rule.priority)}`}>{rule.priority}</span>
                </div>
                <div className="rule-actions">
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(rule.id);
                    }}
                    title={rule.status === RuleStatus.ACTIVE ? 'Pause' : 'Activate'}
                  >
                    {rule.status === RuleStatus.ACTIVE ? '⏸️' : '▶️'}
                  </button>
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditRule(rule);
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRule(rule);
                      setShowTestModal(true);
                    }}
                    title="Test"
                  >
                    🧪
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRule(rule.id);
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="rule-description">{rule.description}</p>
              <div className="rule-meta">
                <div className="rule-condition-summary">
                  <strong>Conditions:</strong> {rule.conditions.length} condition(s) ({rule.conditionLogic})
                </div>
                <div className="rule-action-summary">
                  <strong>Actions:</strong> {rule.actions.length} action(s)
                </div>
                <div className="rule-stats">
                  <span>Executed {rule.executionCount} times</span>
                  {rule.lastExecuted && <span>Last: {new Date(rule.lastExecuted).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Rule Details */}
      {selectedRule && !showCreateModal && !showTestModal && (
        <div className="rule-details-panel">
          <div className="panel-header">
            <h2>{selectedRule.name}</h2>
            <button className="btn-close" onClick={() => setSelectedRule(null)}>
              ×
            </button>
          </div>
          <div className="panel-content">
            <div className="detail-section">
              <h4>Description</h4>
              <p>{selectedRule.description}</p>
            </div>
            <div className="detail-section">
              <h4>Conditions ({selectedRule.conditionLogic})</h4>
              <ul className="condition-list">
                {selectedRule.conditions.map((condition) => (
                  <li key={condition.id}>
                    <span className="field">{condition.field}</span>
                    <span className="operator">{condition.operator}</span>
                    <span className="value">{String(condition.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="detail-section">
              <h4>Actions</h4>
              <ul className="action-list">
                {selectedRule.actions.map((action) => (
                  <li key={action.id}>
                    <span className="action-type">{action.type}</span>
                    <span className="action-params">{JSON.stringify(action.parameters)}</span>
                    {action.stopProcessing && <span className="stop-badge">Stop</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="detail-section">
              <h4>Statistics</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{selectedRule.executionCount}</span>
                  <span className="stat-label">Executions</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {selectedRule.lastExecuted ? new Date(selectedRule.lastExecuted).toLocaleDateString() : 'Never'}
                  </span>
                  <span className="stat-label">Last Run</span>
                </div>
              </div>
            </div>
          </div>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => handleEditRule(selectedRule)}>
              Edit Rule
            </button>
            <button className="btn btn-primary" onClick={() => setShowTestModal(true)}>
              Test Rule
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <RuleBuilderModal
          rule={editingRule}
          onClose={handleCloseModal}
          onSave={async (ruleData) => {
            if (editingRule) {
              await updateRule(editingRule.id, ruleData);
            } else {
              await createRule({
                ...ruleData,
                type: ruleData.type || RuleType.CUSTOM,
                priority: ruleData.priority || RulePriority.MEDIUM
              });
            }
            handleCloseModal();
          }}
        />
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplatePickerModal
          templates={templates}
          onClose={() => setShowTemplateModal(false)}
          onSelect={async (templateId, name, priority) => {
            await createRuleFromTemplate(templateId, name, priority);
            setShowTemplateModal(false);
          }}
        />
      )}

      {/* Test Modal */}
      {showTestModal && selectedRule && (
        <RuleTesterModal rule={selectedRule} onClose={() => setShowTestModal(false)} onTest={testRule} />
      )}
    </div>
  );
};

// Rule Builder Modal Component
interface RuleBuilderModalProps {
  rule: EmailRule | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const RuleBuilderModal: React.FC<RuleBuilderModalProps> = ({ rule, onClose, onSave }) => {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [ruleType, setRuleType] = useState<RuleType>(rule?.type || RuleType.CUSTOM);
  const [priority, setPriority] = useState<RulePriority>(rule?.priority || RulePriority.MEDIUM);
  const [conditions, setConditions] = useState<RuleCondition[]>(rule?.conditions || []);
  const [conditionLogic, setConditionLogic] = useState<ConditionLogic>(rule?.conditionLogic || ConditionLogic.AND);
  const [actions, setActions] = useState<RuleAction[]>(rule?.actions || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        id: `cond-${Date.now()}`,
        field: 'from' as any,
        operator: 'contains' as any,
        value: '',
        caseSensitive: false
      }
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        id: `act-${Date.now()}`,
        type: 'add_label' as any,
        parameters: {},
        stopProcessing: false
      }
    ]);
  };

  const handleRemoveAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }
    setIsSaving(true);
    await onSave({
      name,
      description,
      type: ruleType,
      priority,
      conditions,
      conditionLogic,
      actions
    });
    setIsSaving(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal rule-builder-modal">
        <div className="modal-header">
          <h2>{rule ? 'Edit Rule' : 'Create Rule'}</h2>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Rule Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter rule name" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter rule description"
              rows={2}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Rule Type</label>
              <select value={ruleType} onChange={(e) => setRuleType(e.target.value as RuleType)}>
                <option value={RuleType.AUTO_REPLY}>Auto-Reply</option>
                <option value={RuleType.FORWARDING}>Forwarding</option>
                <option value={RuleType.CATEGORIZATION}>Categorization</option>
                <option value={RuleType.CLEANUP}>Cleanup</option>
                <option value={RuleType.NOTIFICATION}>Notification</option>
                <option value={RuleType.CUSTOM}>Custom</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as RulePriority)}>
                <option value={RulePriority.LOW}>Low</option>
                <option value={RulePriority.MEDIUM}>Medium</option>
                <option value={RulePriority.HIGH}>High</option>
                <option value={RulePriority.URGENT}>Urgent</option>
              </select>
            </div>
          </div>

          {/* Conditions Section */}
          <div className="section">
            <div className="section-header">
              <h4>Conditions</h4>
              <div className="logic-toggle">
                <label>
                  <input
                    type="radio"
                    checked={conditionLogic === ConditionLogic.AND}
                    onChange={() => setConditionLogic(ConditionLogic.AND)}
                  />
                  AND
                </label>
                <label>
                  <input
                    type="radio"
                    checked={conditionLogic === ConditionLogic.OR}
                    onChange={() => setConditionLogic(ConditionLogic.OR)}
                  />
                  OR
                </label>
              </div>
            </div>
            {conditions.map((condition, idx) => (
              <div key={condition.id} className="condition-row">
                <select
                  value={condition.field}
                  onChange={(e) => {
                    const newConditions = [...conditions];
                    newConditions[idx] = { ...condition, field: e.target.value as any };
                    setConditions(newConditions);
                  }}
                >
                  <option value="from">From</option>
                  <option value="to">To</option>
                  <option value="subject">Subject</option>
                  <option value="body">Body</option>
                  <option value="attachments">Has Attachments</option>
                  <option value="priority">Priority</option>
                  <option value="label">Label</option>
                </select>
                <select
                  value={condition.operator}
                  onChange={(e) => {
                    const newConditions = [...conditions];
                    newConditions[idx] = { ...condition, operator: e.target.value as any };
                    setConditions(newConditions);
                  }}
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="not_contains">Not Contains</option>
                  <option value="starts_with">Starts With</option>
                  <option value="ends_with">Ends With</option>
                </select>
                <input
                  type="text"
                  value={String(condition.value)}
                  onChange={(e) => {
                    const newConditions = [...conditions];
                    newConditions[idx] = { ...condition, value: e.target.value };
                    setConditions(newConditions);
                  }}
                  placeholder="Value"
                />
                <button className="btn-icon danger" onClick={() => handleRemoveCondition(condition.id)}>
                  ×
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={handleAddCondition}>
              + Add Condition
            </button>
          </div>

          {/* Actions Section */}
          <div className="section">
            <div className="section-header">
              <h4>Actions</h4>
            </div>
            {actions.map((action, idx) => (
              <div key={action.id} className="action-row">
                <select
                  value={action.type}
                  onChange={(e) => {
                    const newActions = [...actions];
                    newActions[idx] = { ...action, type: e.target.value as any, parameters: {} };
                    setActions(newActions);
                  }}
                >
                  <option value="move_to_folder">Move to Folder</option>
                  <option value="add_label">Add Label</option>
                  <option value="remove_label">Remove Label</option>
                  <option value="mark_as_read">Mark as Read</option>
                  <option value="mark_as_unread">Mark as Unread</option>
                  <option value="archive">Archive</option>
                  <option value="delete">Delete</option>
                  <option value="forward">Forward</option>
                  <option value="auto_reply">Auto Reply</option>
                </select>
                <input
                  type="text"
                  placeholder="Parameters (JSON)"
                  value={JSON.stringify(action.parameters)}
                  onChange={(e) => {
                    try {
                      const params = JSON.parse(e.target.value);
                      const newActions = [...actions];
                      newActions[idx] = { ...action, parameters: params };
                      setActions(newActions);
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={action.stopProcessing}
                    onChange={(e) => {
                      const newActions = [...actions];
                      newActions[idx] = { ...action, stopProcessing: e.target.checked };
                      setActions(newActions);
                    }}
                  />
                  Stop
                </label>
                <button className="btn-icon danger" onClick={() => handleRemoveAction(action.id)}>
                  ×
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={handleAddAction}>
              + Add Action
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Template Picker Modal
interface TemplatePickerModalProps {
  templates: RuleTemplate[];
  onClose: () => void;
  onSelect: (templateId: string, name: string, priority: RulePriority) => Promise<void>;
}

const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({ templates, onClose, onSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [priority, setPriority] = useState<RulePriority>(RulePriority.MEDIUM);

  const handleSelect = async () => {
    if (!selectedTemplate || !ruleName.trim()) {
      return;
    }
    await onSelect(selectedTemplate.id, ruleName, priority);
  };

  return (
    <div className="modal-overlay">
      <div className="modal template-picker-modal">
        <div className="modal-header">
          <h2>Create Rule from Template</h2>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="template-list">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedTemplate(template);
                  setRuleName(template.name);
                }}
              >
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <div className="template-meta">
                  <span className="category">{template.category}</span>
                  <span className="popularity">Used {template.popularity} times</span>
                </div>
              </div>
            ))}
          </div>
          {selectedTemplate && (
            <div className="template-config">
              <div className="form-group">
                <label>Rule Name *</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Enter rule name"
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as RulePriority)}>
                  <option value={RulePriority.LOW}>Low</option>
                  <option value={RulePriority.MEDIUM}>Medium</option>
                  <option value={RulePriority.HIGH}>High</option>
                  <option value={RulePriority.URGENT}>Urgent</option>
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSelect} disabled={!selectedTemplate || !ruleName.trim()}>
            Create Rule
          </button>
        </div>
      </div>
    </div>
  );
};

// Rule Tester Modal
interface RuleTesterModalProps {
  rule: EmailRule;
  onClose: () => void;
  onTest: (ruleId: string, email: any) => any;
}

const RuleTesterModal: React.FC<RuleTesterModalProps> = ({ rule, onClose, onTest }) => {
  const [testEmail, setTestEmail] = useState({
    from: 'test@example.com',
    to: 'me@company.com',
    subject: 'Test Subject',
    body: 'Test body content',
    hasAttachments: false
  });
  const [testResult, setTestResult] = useState<any>(null);

  const handleTest = () => {
    const result = onTest(rule.id, {
      id: 'test-email',
      ...testEmail,
      to: [testEmail.to],
      labels: [],
      folder: 'Inbox',
      dateReceived: new Date().toISOString(),
      size: 1000,
      isRead: false,
      isStarred: false,
      isArchived: false,
      direction: 'incoming'
    });
    setTestResult(result);
  };

  return (
    <div className="modal-overlay">
      <div className="modal rule-tester-modal">
        <div className="modal-header">
          <h2>Test Rule: {rule.name}</h2>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="test-email-form">
            <h4>Test Email</h4>
            <div className="form-group">
              <label>From</label>
              <input
                type="text"
                value={testEmail.from}
                onChange={(e) => setTestEmail({ ...testEmail, from: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>To</label>
              <input
                type="text"
                value={testEmail.to}
                onChange={(e) => setTestEmail({ ...testEmail, to: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={testEmail.subject}
                onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Body</label>
              <textarea
                value={testEmail.body}
                onChange={(e) => setTestEmail({ ...testEmail, body: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={testEmail.hasAttachments}
                  onChange={(e) => setTestEmail({ ...testEmail, hasAttachments: e.target.checked })}
                />
                Has Attachments
              </label>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleTest}>
            Run Test
          </button>
          {testResult && (
            <div className="test-result">
              <h4>Result</h4>
              <div className={`result-badge ${testResult.matches ? 'matches' : 'no-match'}`}>
                {testResult.matches ? '✓ Rule Matches' : '✗ Rule Does Not Match'}
              </div>
              {testResult.matches && (
                <div className="result-details">
                  <p>
                    <strong>Matched Conditions:</strong> {testResult.matchedConditions.length}
                  </p>
                  <p>
                    <strong>Actions to Execute:</strong>
                  </p>
                  <ul>
                    {testResult.actionsToExecute.map((action: any) => (
                      <li key={action.id}>{action.type}</li>
                    ))}
                  </ul>
                  {testResult.warnings && testResult.warnings.length > 0 && (
                    <div className="warnings">
                      <p>
                        <strong>Warnings:</strong>
                      </p>
                      <ul>
                        {testResult.warnings.map((warning: string, idx: number) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesManager;
