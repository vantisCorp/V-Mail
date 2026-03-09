import React, { useState } from 'react';
import { useEmailTemplates } from '../hooks/useEmailTemplates';
import { TemplateType, EmailTemplate, TemplateCategory } from '../types/emailTemplates';
import '../styles/email-templates.css';

const EmailTemplatesManager: React.FC = () => {
  const {
    isLoading,
    templates,
    categories,
    usageLogs,
    deleteTemplate,
    cloneTemplate,
    getFilteredTemplates,
    toggleFavorite,
    getTemplatesByCategory
  } = useEmailTemplates();

  const [activeTab, setActiveTab] = useState<'templates' | 'categories' | 'analytics' | 'usage'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<TemplateType | ''>('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  // Sub-components
  const TemplateCard: React.FC<{ template: EmailTemplate }> = ({ template }) => (
    <div
      className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
      onClick={() => setSelectedTemplate(template)}
    >
      <div className="template-header">
        <div className="template-title">
          <h3>{template.name}</h3>
          <div className="template-badges">
            <span className={`type-badge ${template.type}`}>{template.type.replace('_', ' ')}</span>
            {template.isSystem && <span className="system-badge">System</span>}
            {template.isFavorite && <span className="favorite-badge">★</span>}
          </div>
        </div>
        <button
          className="btn-favorite"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(template.id);
          }}
        >
          {template.isFavorite ? '★' : '☆'}
        </button>
      </div>
      <p className="template-description">{template.description}</p>
      <div className="template-meta">
        <span className="meta-item">
          <span className="meta-label">Owner:</span>
          <span className="meta-value">{template.ownerUserName}</span>
        </span>
        <span className="meta-item">
          <span className="meta-label">Uses:</span>
          <span className="meta-value">{template.analytics.totalUses}</span>
        </span>
        <span className="meta-item">
          <span className="meta-label">Updated:</span>
          <span className="meta-value">{new Date(template.updatedAt).toLocaleDateString()}</span>
        </span>
      </div>
      <div className="template-tags">
        {template.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="template-actions">
        <button
          className="btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
        >
          👁️
        </button>
        <button
          className="btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            cloneTemplate({ sourceTemplateId: template.id, name: `Copy of ${template.name}` });
          }}
        >
          📋
        </button>
        {!template.isSystem && (
          <button
            className="btn-icon danger"
            onClick={(e) => {
              e.stopPropagation();
              deleteTemplate(template.id);
            }}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );

  const CategoryCard: React.FC<{ category: TemplateCategory }> = ({ category }) => {
    const count = getTemplatesByCategory(category.id).length;
    return (
      <div className="category-card">
        <div className="category-icon" style={{ background: category.color }}>
          {category.icon}
        </div>
        <div className="category-info">
          <h4>{category.name}</h4>
          <p>{category.description}</p>
          <span className="category-count">{count} templates</span>
        </div>
      </div>
    );
  };

  const AnalyticsCard: React.FC<{ template: EmailTemplate }> = ({ template }) => (
    <div className="analytics-card">
      <h4>{template.name}</h4>
      <div className="analytics-stats">
        <div className="stat">
          <span className="stat-value">{template.analytics.totalUses}</span>
          <span className="stat-label">Total Uses</span>
        </div>
        <div className="stat">
          <span className="stat-value">{template.analytics.usesThisWeek}</span>
          <span className="stat-label">This Week</span>
        </div>
        <div className="stat">
          <span className="stat-value">{template.analytics.usesThisMonth}</span>
          <span className="stat-label">This Month</span>
        </div>
      </div>
      <div className="analytics-details">
        <span>Last Used: {new Date(template.analytics.lastUsed).toLocaleDateString()}</span>
      </div>
    </div>
  );

  const UsageLogItem: React.FC<{ log: (typeof usageLogs)[0] }> = ({ log }) => (
    <div className="usage-log-item">
      <div className="log-info">
        <span className="log-template">{log.templateName}</span>
        <span className="log-user">{log.userName}</span>
        <span className="log-recipient">To: {log.recipientEmail}</span>
        <span className="log-subject">{log.subject}</span>
      </div>
      <span className="log-time">{new Date(log.usedAt).toLocaleString()}</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="email-templates-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-templates-container">
      <div className="templates-header">
        <h1>Email Templates</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCreateDialog(true)}>
            + New Template
          </button>
        </div>
      </div>

      <div className="templates-tabs">
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button className={`tab ${activeTab === 'usage' ? 'active' : ''}`} onClick={() => setActiveTab('usage')}>
          Usage Logs
        </button>
      </div>

      <div className="templates-content">
        {activeTab === 'templates' && (
          <div className="templates-section">
            <div className="templates-filters">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TemplateType | '')}
                className="filter-select"
              >
                <option value="">All Types</option>
                {Object.values(TemplateType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filterFavorites}
                  onChange={(e) => setFilterFavorites(e.target.checked)}
                />
                Favorites only
              </label>
            </div>

            <div className="templates-grid">
              {getFilteredTemplates({
                searchQuery,
                categoryId: selectedCategory || undefined,
                type: selectedType || undefined,
                isFavorite: filterFavorites || undefined,
                sortBy: 'name',
                sortOrder: 'asc'
              }).map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>

            {selectedTemplate && (
              <div className="template-detail-panel">
                <div className="panel-header">
                  <h3>Template Details</h3>
                  <button className="btn-close" onClick={() => setSelectedTemplate(null)}>
                    ×
                  </button>
                </div>
                <div className="panel-content">
                  <div className="detail-row">
                    <strong>Name:</strong> {selectedTemplate.name}
                  </div>
                  <div className="detail-row">
                    <strong>Description:</strong> {selectedTemplate.description}
                  </div>
                  <div className="detail-row">
                    <strong>Type:</strong> {selectedTemplate.type}
                  </div>
                  <div className="detail-row">
                    <strong>Permission:</strong> {selectedTemplate.permission.replace('_', ' ')}
                  </div>
                  <div className="detail-row">
                    <strong>Owner:</strong> {selectedTemplate.ownerUserName}
                  </div>
                  <div className="detail-row">
                    <strong>Variables:</strong>
                  </div>
                  <div className="variables-list">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable.id} className="variable-item">
                        <code>{variable.key}</code>
                        <span>{variable.description}</span>
                      </div>
                    ))}
                  </div>
                  <div className="detail-row">
                    <strong>Tags:</strong>
                  </div>
                  <div className="tags-list">
                    {selectedTemplate.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="detail-row">
                    <strong>Usage Stats:</strong>
                  </div>
                  <div className="stats-list">
                    <span>Total Uses: {selectedTemplate.analytics.totalUses}</span>
                    <span>This Week: {selectedTemplate.analytics.usesThisWeek}</span>
                    <span>This Month: {selectedTemplate.analytics.usesThisMonth}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="categories-section">
            <div className="categories-grid">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="analytics-grid">
              {templates
                .sort((a, b) => b.analytics.totalUses - a.analytics.totalUses)
                .slice(0, 10)
                .map((template) => (
                  <AnalyticsCard key={template.id} template={template} />
                ))}
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="usage-section">
            <div className="usage-logs-list">
              {usageLogs
                .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())
                .map((log) => (
                  <UsageLogItem key={log.id} log={log} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTemplatesManager;
