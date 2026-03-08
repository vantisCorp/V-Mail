import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface AutoReplyRule {
  id: string;
  enabled: boolean;
  trigger: 'all' | 'sender' | 'subject' | 'keywords';
  triggerValue?: string;
  subject: string;
  body: string;
  delayMinutes: number;
  schedule: {
    enabled: boolean;
    startDate?: string;
    endDate?: string;
    weekdays?: number[];
    startTime?: string;
    endTime?: string;
  };
}

interface AutoReplySettingsProps {
  onClose: () => void;
}

export const AutoReplySettings: React.FC<AutoReplySettingsProps> = ({ onClose }) => {
  const { addNotification } = useNotifications();
  const [rules, setRules] = useState<AutoReplyRule[]>([
    {
      id: '1',
      enabled: true,
      trigger: 'all',
      subject: 'Out of Office',
      body: 'Thank you for your email. I am currently out of the office and will respond as soon as possible.',
      delayMinutes: 60,
      schedule: {
        enabled: false
      }
    }
  ]);
  const [selectedRule, setSelectedRule] = useState<AutoReplyRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddRule = () => {
    const newRule: AutoReplyRule = {
      id: Date.now().toString(),
      enabled: true,
      trigger: 'all',
      subject: '',
      body: '',
      delayMinutes: 0,
      schedule: {
        enabled: false
      }
    };
    setRules([...rules, newRule]);
    setSelectedRule(newRule);
    setIsEditing(true);
  };

  const handleEditRule = (rule: AutoReplyRule) => {
    setSelectedRule(rule);
    setIsEditing(true);
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    if (selectedRule?.id === id) {
      setSelectedRule(null);
      setIsEditing(false);
    }
    addNotification('success', 'Auto-reply rule deleted');
  };

  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    );
    const rule = rules.find((r) => r.id === id);
    addNotification('success', `Auto-reply rule ${rule?.enabled ? 'disabled' : 'enabled'}`);
  };

  const handleSaveRule = (updatedRule: AutoReplyRule) => {
    setRules(
      rules.map((r) => (r.id === updatedRule.id ? updatedRule : r))
    );
    setIsEditing(false);
    setSelectedRule(null);
    addNotification('success', 'Auto-reply rule saved');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedRule(null);
  };

  return (
    <div className="auto-reply-settings">
      <div className="auto-reply-settings-header">
        <h2>Auto-Reply Settings</h2>
        <button className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="auto-reply-settings-content">
        {isEditing && selectedRule ? (
          <EditRuleForm
            rule={selectedRule}
            onSave={handleSaveRule}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            <div className="rules-list">
              <div className="rules-list-header">
                <h3>Auto-Reply Rules</h3>
                <button className="btn-primary" onClick={handleAddRule}>
                  Add Rule
                </button>
              </div>

              {rules.length === 0 ? (
                <div className="no-rules">
                  <p>No auto-reply rules configured</p>
                  <button className="btn-primary" onClick={handleAddRule}>
                    Create First Rule
                  </button>
                </div>
              ) : (
                <div className="rules-grid">
                  {rules.map((rule) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      onEdit={() => handleEditRule(rule)}
                      onDelete={() => handleDeleteRule(rule.id)}
                      onToggle={() => handleToggleRule(rule.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="auto-reply-info">
              <h3>About Auto-Reply</h3>
              <p>
                Auto-reply rules automatically send responses to incoming emails based on
                your configured conditions. This is useful for:
              </p>
              <ul>
                <li>Out of office notifications</li>
                <li>Automatic acknowledgments</li>
                <li>Customer service responses</li>
                <li>FAQ responses</li>
              </ul>
              <h4>Trigger Types:</h4>
              <ul>
                <li>
                  <strong>All:</strong> Respond to all incoming emails
                </li>
                <li>
                  <strong>Sender:</strong> Respond only to specific senders
                </li>
                <li>
                  <strong>Subject:</strong> Respond to emails with specific subject keywords
                </li>
                <li>
                  <strong>Keywords:</strong> Respond to emails containing specific keywords
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface RuleCardProps {
  rule: AutoReplyRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

const RuleCard: React.FC<RuleCardProps> = ({ rule, onEdit, onDelete, onToggle }) => {
  return (
    <div className={`rule-card ${rule.enabled ? 'enabled' : 'disabled'}`}>
      <div className="rule-card-header">
        <div className="rule-card-title">
          <h4>{rule.subject || 'Untitled Rule'}</h4>
          <span className={`rule-status ${rule.enabled ? 'enabled' : 'disabled'}`}>
            {rule.enabled ? 'Active' : 'Inactive'}
          </span>
        </div>
        <button className="btn-toggle" onClick={onToggle}>
          {rule.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      <div className="rule-card-body">
        <div className="rule-info">
          <strong>Trigger:</strong> {rule.trigger}
        </div>
        {rule.triggerValue && (
          <div className="rule-info">
            <strong>Value:</strong> {rule.triggerValue}
          </div>
        )}
        <div className="rule-info">
          <strong>Delay:</strong> {rule.delayMinutes} minutes
        </div>
        {rule.schedule.enabled && (
          <div className="rule-info">
            <strong>Scheduled:</strong> Yes
          </div>
        )}
        <div className="rule-preview">
          <strong>Preview:</strong>
          <p>{rule.body.substring(0, 100)}...</p>
        </div>
      </div>

      <div className="rule-card-footer">
        <button className="btn-secondary" onClick={onEdit}>
          Edit
        </button>
        <button className="btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

interface EditRuleFormProps {
  rule: AutoReplyRule;
  onSave: (rule: AutoReplyRule) => void;
  onCancel: () => void;
}

const EditRuleForm: React.FC<EditRuleFormProps> = ({ rule, onSave, onCancel }) => {
  const [formData, setFormData] = useState<AutoReplyRule>(rule);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="edit-rule-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>{formData.id === rule.id ? 'Edit Rule' : 'Create Rule'}</h3>
      </div>

      <div className="form-fields">
        <div className="form-field">
          <label htmlFor="subject">Subject *</label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="trigger">Trigger Type *</label>
          <select
            id="trigger"
            value={formData.trigger}
            onChange={(e) =>
              setFormData({
                ...formData,
                trigger: e.target.value as AutoReplyRule['trigger']
              })
            }
            required
          >
            <option value="all">All Emails</option>
            <option value="sender">Specific Sender</option>
            <option value="subject">Subject Contains</option>
            <option value="keywords">Keywords</option>
          </select>
        </div>

        {(formData.trigger === 'sender' ||
          formData.trigger === 'subject' ||
          formData.trigger === 'keywords') && (
          <div className="form-field">
            <label htmlFor="triggerValue">Trigger Value *</label>
            <input
              id="triggerValue"
              type="text"
              value={formData.triggerValue || ''}
              onChange={(e) =>
                setFormData({ ...formData, triggerValue: e.target.value })
              }
              required
              placeholder={
                formData.trigger === 'sender'
                  ? 'email@example.com'
                  : 'keyword, another keyword'
              }
            />
          </div>
        )}

        <div className="form-field">
          <label htmlFor="body">Response Body *</label>
          <textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            required
            rows={6}
            placeholder="Enter your auto-reply message..."
          />
          <small>Use {'{title}'} to include the original email subject</small>
        </div>

        <div className="form-field">
          <label htmlFor="delay">Delay (minutes) *</label>
          <input
            id="delay"
            type="number"
            min="0"
            value={formData.delayMinutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                delayMinutes: parseInt(e.target.value)
              })
            }
            required
          />
        </div>

        <div className="form-field checkbox">
          <input
            id="scheduleEnabled"
            type="checkbox"
            checked={formData.schedule.enabled}
            onChange={(e) =>
              setFormData({
                ...formData,
                schedule: { ...formData.schedule, enabled: e.target.checked }
              })
            }
          />
          <label htmlFor="scheduleEnabled">Enable Schedule</label>
        </div>

        {formData.schedule.enabled && (
          <div className="schedule-settings">
            <div className="form-field">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                type="date"
                value={formData.schedule.startDate || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, startDate: e.target.value }
                  })
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                type="date"
                value={formData.schedule.endDate || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, endDate: e.target.value }
                  })
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="startTime">Start Time</label>
              <input
                id="startTime"
                type="time"
                value={formData.schedule.startTime || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, startTime: e.target.value }
                  })
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="endTime">End Time</label>
              <input
                id="endTime"
                type="time"
                value={formData.schedule.endTime || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, endTime: e.target.value }
                  })
                }
              />
            </div>

            <div className="form-field">
              <label>Weekdays</label>
              <div className="weekdays-selector">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                  <label key={day}>
                    <input
                      type="checkbox"
                      checked={formData.schedule.weekdays?.includes(idx) || false}
                      onChange={(e) => {
                        const weekdays = formData.schedule.weekdays || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            schedule: {
                              ...formData.schedule,
                              weekdays: [...weekdays, idx].sort()
                            }
                          });
                        } else {
                          setFormData({
                            ...formData,
                            schedule: {
                              ...formData.schedule,
                              weekdays: weekdays.filter((d) => d !== idx)
                            }
                          });
                        }
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save Rule
        </button>
      </div>
    </form>
  );
};
