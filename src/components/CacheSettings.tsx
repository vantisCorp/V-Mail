/**
 * Cache Settings Component
 * UI for managing cache configuration and monitoring
 */

import React, { useState, useEffect } from 'react';
import { CacheService } from '../services/cacheService';
import { useCacheManager } from '../hooks/useCache';
import type { CacheStrategy, CachePolicy, CacheConfig } from '../types/caching';
import './cacheSettings.css';

export const CacheSettings: React.FC = () => {
  const [config, setConfig] = useState<CacheConfig | null>(null);
  const [strategy, setStrategy] = useState<CacheStrategy>('memory');
  const [policy, setPolicy] = useState<CachePolicy>('cache-first');
  const [maxEntries, setMaxEntries] = useState(1000);
  const [cleanupInterval, setCleanupInterval] = useState(60);
  const [enableCompression, setEnableCompression] = useState(false);
  const [enableMetrics, setEnableMetrics] = useState(true);

  const {
    metrics,
    events,
    clearCache,
    clearByPattern,
    addInvalidationRule,
    removeInvalidationRule,
  } = useCacheManager();

  const cacheService = CacheService.getInstance();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const currentConfig = cacheService.getConfig();
    setConfig(currentConfig);
    setStrategy(currentConfig.strategy);
    setPolicy(currentConfig.defaultPolicy);
    setMaxEntries(currentConfig.maxEntries);
    setCleanupInterval(currentConfig.cleanupInterval / 1000);
    setEnableCompression(currentConfig.enableCompression);
    setEnableMetrics(currentConfig.enableMetrics);
  };

  const handleSaveConfig = () => {
    const newConfig: Partial<CacheConfig> = {
      strategy,
      defaultPolicy: policy,
      maxEntries,
      maxSize: 50 * 1024 * 1024, // 50MB fixed for now
      cleanupInterval: cleanupInterval * 1000,
      enableCompression,
      enableMetrics,
    };

    cacheService.updateConfig(newConfig);
    loadConfig();
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear the entire cache?')) {
      await clearCache();
    }
  };

  const handleClearEmails = async () => {
    await clearByPattern(/^email_/);
  };

  const handleClearThreads = async () => {
    await clearByPattern(/^thread_/);
  };

  if (!config) {
    return <div className="cache-settings loading">Loading cache settings...</div>;
  }

  return (
    <div className="cache-settings">
      <div className="cache-settings-header">
        <h2>Cache Settings</h2>
      </div>

      {/* Configuration */}
      <div className="settings-section">
        <h3>Cache Configuration</h3>

        <div className="setting-group">
          <label>Cache Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value as CacheStrategy)}>
            <option value="memory">Memory</option>
            <option value="localStorage">Local Storage</option>
            <option value="sessionStorage">Session Storage</option>
          </select>
        </div>

        <div className="setting-group">
          <label>Default Policy</label>
          <select value={policy} onChange={(e) => setPolicy(e.target.value as CachePolicy)}>
            <option value="cache-first">Cache First</option>
            <option value="network-first">Network First</option>
            <option value="stale-while-revalidate">Stale While Revalidate</option>
            <option value="network-only">Network Only</option>
            <option value="cache-only">Cache Only</option>
          </select>
        </div>

        <div className="setting-group">
          <label>Max Entries: {maxEntries}</label>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={maxEntries}
            onChange={(e) => setMaxEntries(Number(e.target.value))}
          />
        </div>

        <div className="setting-group">
          <label>Cleanup Interval: {cleanupInterval}s</label>
          <input
            type="range"
            min="10"
            max="300"
            step="10"
            value={cleanupInterval}
            onChange={(e) => setCleanupInterval(Number(e.target.value))}
          />
        </div>

        <div className="setting-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={enableCompression}
              onChange={(e) => setEnableCompression(e.target.checked)}
            />
            Enable Compression
          </label>
        </div>

        <div className="setting-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={enableMetrics}
              onChange={(e) => setEnableMetrics(e.target.checked)}
            />
            Enable Metrics
          </label>
        </div>

        <button className="save-button" onClick={handleSaveConfig}>
          Save Configuration
        </button>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="settings-section">
          <h3>Cache Metrics</h3>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Entries</div>
              <div className="metric-value">{metrics.entries}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Size</div>
              <div className="metric-value">
                {(metrics.totalSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Hit Rate</div>
              <div className="metric-value success">
                {(metrics.hitRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Miss Rate</div>
              <div className="metric-value warning">
                {(metrics.missRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Hits</div>
              <div className="metric-value">{metrics.hits}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Misses</div>
              <div className="metric-value">{metrics.misses}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Evictions</div>
              <div className="metric-value">{metrics.evictions}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg Access Time</div>
              <div className="metric-value">
                {metrics.averageAccessTime.toFixed(2)}ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="settings-section">
        <h3>Cache Actions</h3>

        <div className="actions-grid">
          <button className="action-button danger" onClick={handleClearCache}>
            Clear All Cache
          </button>
          <button className="action-button warning" onClick={handleClearEmails}>
            Clear Emails Cache
          </button>
          <button className="action-button warning" onClick={handleClearThreads}>
            Clear Threads Cache
          </button>
        </div>
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div className="settings-section">
          <h3>Recent Events</h3>

          <div className="events-list">
            {events.slice(-10).reverse().map((event, index) => (
              <div key={index} className="event-item">
                <span className={`event-type event-type-${event.type}`}>
                  {event.type.toUpperCase()}
                </span>
                <span className="event-key">{event.key}</span>
                <span className="event-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                {event.size && (
                  <span className="event-size">
                    {(event.size / 1024).toFixed(2)} KB
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};