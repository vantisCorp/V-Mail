/**
 * Email Automation & Rules Manager Component
 * Manages automation rules, conditions, actions, and execution
 */

import React, { useState, useEffect } from 'react';
import { useEmailAutomation } from '../hooks/useEmailAutomation';
import { RuleStatus, RulePriority, ActionType, TriggerType, ConditionOperator } from '../types/emailAutomation';
import '../styles/email-automation.css';

interface EmailAutomationManagerProps {
  onRuleSelect?: (ruleId: string) => void;
}

const EmailAutomationManager: React.FC<EmailAutomationManagerProps> = ({ onRuleSelect }) => {
  const {
    isLoading,
    rules,
    executionLogs,
    categories,
    createRule,
    updateRule,
    deleteRule,
    duplicateRule,
    activateRule,
    pauseRule,
    disableRule,
    testRule,
    validateRule,
    getRuleStatistics,
    getFilteredRules,
    createCategory,
    getRuleById,
    getExecutionLogs,
    refreshRules,
    refreshExecutionLogs
  } = useEmailAutomation();

  const [activeTab, setActiveTab] = useState<'rules' | 'categories' | 'logs' | 'analytics'>('rules');
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<RuleStatus | undefined>(undefined);
  const [filterPriority, setFilterPriority] = useState<RulePriority | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  const filteredRules = getFilteredRules({
    status: filterStatus,
    priority: filterPriority,
    search: searchTerm || undefined
  });

  const handleRuleSelect = (ruleId: string) => {
    setSelectedRule(ruleId);
    onRuleSelect?.(ruleId);
  };

  const handleCreateRule = async (ruleData: any) => {
    await createRule(ruleData);
    setShowCreateModal(false);
  };

  const handleDuplicateRule = async (ruleId: string) => {
    await duplicateRule(ruleId);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      await deleteRule(ruleId);
      if (selectedRule === ruleId) {
        setSelectedRule(null);
      }
    }
  };

  const handleToggleRuleStatus = async (ruleId: string, currentStatus: RuleStatus) => {
    if (currentStatus === RuleStatus.ACTIVE) {
      await pauseRule(ruleId);
    } else {
      await activateRule(ruleId);
    }
  };

  const getPriorityColor = (priority: RulePriority) => {
    switch (priority) {
      case RulePriority.URGENT: return '#FF6B6B';
      case RulePriority.HIGH: return '#FFA06B';
      case RulePriority.NORMAL: return '#4ECDC4';
      case RulePriority.LOW: return '#95E1D3';
      default: return '#95E1D3';
    }
  };

  const getStatusBadge = (status: RuleStatus) => {
    const statusConfig = {
      [RuleStatus.ACTIVE]: { color: '#10B981', icon: '⚡', label: 'Active' },
      [RuleStatus.PAUSED]: { color: '#F59E0B', icon: '⏸️', label: 'Paused' },
      [RuleStatus.DISABLED]: { color: '#6B7280', icon: '🚫', label: 'Disabled' },
      [RuleStatus.TESTING]: { color: '#8B5CF6', icon: '🧪', label: 'Testing' }
    };
    const config = statusConfig[status];
    return (
      <span
        className="status-badge"
        style={{ backgroundColor: `${config.color}20`, color: config.color, border: `1px solid ${config.color}40` }}
      >
        {config.icon} {config.label}
      </span>
    );
  };

  const getActionIcon = (actionType: ActionType) => {
    const icons: Record<ActionType, string> = {
      [ActionType.MOVE_TO_FOLDER]: '📁',
      [ActionType.COPY_TO_FOLDER]: '📋',
      [ActionType.MOVE_TO_SHARED_FOLDER]: '📂',
      [ActionType.ADD_LABEL]: '🏷️',
      [ActionType.REMOVE_LABEL]: '❌',
      [ActionType.SET_LABEL]: '🏷️',
      [ActionType.REPLY]: '↩️',
      [ActionType.REPLY_ALL]: '↪️',
      [ActionType.FORWARD]: '➡️',
      [ActionType.AUTO_REPLY]: '🤖',
      [ActionType.DELETE]: '🗑️',
      [ActionType.ARCHIVE]: '📦',
      [ActionType.MOVE_TO_TRASH]: '🗑️',
      [ActionType.MARK_READ]: '👁️',
      [ActionType.MARK_UNREAD]: '📧',
      [ActionType.FLAG]: '🚩',
      [ActionType.UNFLAG]: '🏳️',
      [ActionType.USE_TEMPLATE]: '📄',
      [ActionType.SEND_TEMPLATE]: '📨',
      [ActionType.ADD_TAG]: '🔖',
      [ActionType.REMOVE_TAG]: '🏷️',
      [ActionType.SET_IMPORTANCE]: '⭐',
      [ActionType.ADD_HEADER]: '➕',
      [ActionType.REMOVE_HEADER]: '➖',
      [ActionType.MODIFY_SUBJECT]: '✏️',
      [ActionType.EXTRACT_DATA]: '📊',
      [ActionType.WEBHOOK]: '🔗',
      [ActionType.CUSTOM_SCRIPT]: '⚙️'
    };
    return icons[actionType] || '⚙️';
  };

  const getTriggerIcon = (triggerType: TriggerType) => {
    const icons: Record<TriggerType, string> = {
      [TriggerType.FROM]: '👤',
      [TriggerType.TO]: '📧',
      [TriggerType.CC]: '📤',
      [TriggerType.BCC]: '📥',
      [TriggerType.SUBJECT]: '📝',
      [TriggerType.BODY]: '📄',
      [TriggerType.ATTACHMENT]: '📎',
      [TriggerType.IMPORTANCE]: '⭐',
      [TriggerType.FLAGGED]: '🚩',
      [TriggerType.READ]: '👁️',
      [TriggerType.UNREAD]: '📧',
      [TriggerType.RECEIVED]: '📥',
      [TriggerType.SENT]: '📤',
      [TriggerType.DATE]: '📅',
      [TriggerType.HEADER]: '📋',
      [TriggerType.TAG]: '🔖',
      [TriggerType.LABEL]: '🏷️'
    };
    return icons[triggerType] || '⚙️';
  };

  const RuleCard = ({ rule }: { rule: any }) => {
    const statistics = getRuleStatistics(rule.id);
    const isSelected = selectedRule === rule.id;

    return (
      <div
        className={`rule-card ${isSelected ? 'selected' : ''}`}
        onClick={() => handleRuleSelect(rule.id)}
      >
        <div className="rule-header">
          <div className="rule-title-section">
            <span className="rule-icon">{getTriggerIcon(rule.triggerType)}</span>
            <h3 className="rule-name">{rule.name}</h3>
          </div>
          <div className="rule-actions">
            {getStatusBadge(rule.status)}
            <div
              className="priority-indicator"
              style={{ backgroundColor: getPriorityColor(rule.priority) }}
              title={`Priority: ${rule.priority}`}
            />
          </div>
        </div>

        {rule.description && (
          <p className="rule-description">{rule.description}</p>
        )}

        <div className="rule-stats">
          <div className="stat-item">
            <span className="stat-icon">⚡</span>
            <span className="stat-value">{rule.executionCount}</span>
            <span className="stat-label">executions</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">✅</span>
            <span className="stat-value">{rule.successCount}</span>
            <span className="stat-label">success</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">❌</span>
            <span className="stat-value">{rule.failureCount}</span>
            <span className="stat-label">failures</span>
          </div>
        </div>

        <div className="rule-details">
          <div className="detail-section">
            <span className="detail-label">Conditions:</span>
            <div className="conditions-list">
              {rule.conditions.slice(0, 2).map((condition: any, index: number) => (
                <span key={index} className="condition-tag">
                  {condition.field} {condition.operator} {typeof condition.value === 'string' ? condition.value.substring(0, 20) : condition.value}
                </span>
              ))}
              {rule.conditions.length > 2 && (
                <span className="condition-tag">+{rule.conditions.length - 2} more</span>
              )}
            </div>
          </div>

          <div className="detail-section">
            <span className="detail-label">Actions:</span>
            <div className="actions-list">
              {rule.actions.slice(0, 3).map((action: any, index: number) => (
                <span key={index} className="action-tag" title={action.type}>
                  {getActionIcon(action.type)}
                </span>
              ))}
              {rule.actions.length > 3 && (
                <span className="action-tag">+{rule.actions.length - 3}</span>
              )}
            </div>
          </div>
        </div>

        <div className="rule-footer">
          <div className="rule-meta">
            {rule.lastExecutedAt && (
              <span className="last-executed">
                Last: {new Date(rule.lastExecutedAt).toLocaleDateString()}
              </span>
            )}
            <span className="created-at">
              Created: {new Date(rule.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="rule-controls">
            <button
              className="control-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleRuleStatus(rule.id, rule.status);
              }}
              title={rule.status === RuleStatus.ACTIVE ? 'Pause' : 'Activate'}
            >
              {rule.status === RuleStatus.ACTIVE ? '⏸️' : '▶️'}
            </button>
            <button
              className="control-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicateRule(rule.id);
              }}
              title="Duplicate"
            >
              📋
            </button>
            <button
              className="control-btn delete"
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
      </div>
    );
  };

  const CategoryCard = ({ category }: { category: any }) => {
    const categoryRules = rules.filter(r => r.categoryId === category.id);

    return (
      <div className="category-card">
        <div className="category-header">
          <div
            className="category-icon"
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
          >
            {category.icon}
          </div>
          <div className="category-info">
            <h3 className="category-name">{category.name}</h3>
            <span className="category-count">{categoryRules.length} rules</span>
          </div>
        </div>
        {category.description && (
          <p className="category-description">{category.description}</p>
        )}
      </div>
    );
  };

  const LogEntry = ({ log }: { log: any }) => {
    const rule = getRuleById(log.ruleId);

    return (
      <div className="log-entry">
        <div className="log-header">
          <span className={`log-status ${log.status}`}>
            {log.status === 'success' ? '✅' : '❌'}
          </span>
          <span className="log-rule-name">{log.ruleName}</span>
          <span className="log-time">
            {new Date(log.executedAt).toLocaleString()}
          </span>
        </div>
        {log.emailSubject && (
          <div className="log-email-subject">{log.emailSubject}</div>
        )}
        <div className="log-details">
          <span className="log-duration">{log.totalDuration}ms</span>
          <span className="log-actions-count">
            {log.executedActions.length} actions
          </span>
        </div>
      </div>
    );
  };

  const AnalyticsCard = ({ rule }: { rule: any }) => {
    const statistics = getRuleStatistics(rule.id);

    return (
      <div className="analytics-card">
        <div className="analytics-header">
          <span className="analytics-icon">{getTriggerIcon(rule.triggerType)}</span>
          <h3 className="analytics-title">{rule.name}</h3>
          {getStatusBadge(rule.status)}
        </div>
        <div className="analytics-stats">
          <div className="analytics-stat">
            <span className="stat-label">Total Executions</span>
            <span className="stat-value">{statistics?.totalExecutions || 0}</span>
          </div>
          <div className="analytics-stat">
            <span className="stat-label">Success Rate</span>
            <span className="stat-value">
              {statistics?.successRate ? statistics.successRate.toFixed(1) : 0}%
            </span>
          </div>
          <div className="analytics-stat">
            <span className="stat-label">Avg. Duration</span>
            <span className="stat-value">
              {statistics?.averageExecutionTime ? statistics.averageExecutionTime.toFixed(0) : 0}ms
            </span>
          </div>
        </div>
        {statistics?.recentErrors && statistics.recentErrors.length > 0 && (
          <div className="analytics-errors">
            <h4>Recent Errors</h4>
            {statistics.recentErrors.slice(0, 3).map((error, index) => (
              <div key={index} className="error-item">
                <span className="error-time">
                  {new Date(error.timestamp).toLocaleString()}
                </span>
                <span className="error-message">{error.error}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="automation-manager loading">
        <div className="spinner"></div>
        <p>Loading automation rules...</p>
      </div>
    );
  }

  return (
    <div className="automation-manager">
      <div className="automation-header">
        <h1>🤖 Email Automation & Rules</h1>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Create Rule
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => refreshRules()}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          ⚡ Rules ({rules.length})
        </button>
        <button
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📁 Categories ({categories.length})
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Execution Logs ({executionLogs.length})
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search rules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value as RuleStatus | undefined)}
        >
          <option value="">All Statuses</option>
          <option value={RuleStatus.ACTIVE}>Active</option>
          <option value={RuleStatus.PAUSED}>Paused</option>
          <option value={RuleStatus.DISABLED}>Disabled</option>
          <option value={RuleStatus.TESTING}>Testing</option>
        </select>
        <select
          className="filter-select"
          value={filterPriority || ''}
          onChange={(e) => setFilterPriority(e.target.value as RulePriority | undefined)}
        >
          <option value="">All Priorities</option>
          <option value={RulePriority.URGENT}>Urgent</option>
          <option value={RulePriority.HIGH}>High</option>
          <option value={RulePriority.NORMAL}>Normal</option>
          <option value={RulePriority.LOW}>Low</option>
        </select>
      </div>

      <div className="content">
        {activeTab === 'rules' && (
          <div className="rules-grid">
            {filteredRules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
            {filteredRules.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>No automation rules found</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create your first rule
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="categories-grid">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
            <div
              className="category-card add-category"
              onClick={() => {/* TODO: Implement category creation */}}
            >
              <div className="add-category-content">
                <span className="add-icon">➕</span>
                <span>Add Category</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-container">
            {executionLogs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
            {executionLogs.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <p>No execution logs found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-grid">
            {rules.map((rule) => (
              <AnalyticsCard key={rule.id} rule={rule} />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create Automation Rule</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Rule creation form will be implemented here</p>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailAutomationManager;