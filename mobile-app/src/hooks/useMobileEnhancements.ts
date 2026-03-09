/**
 * Mobile App Enhancements Hook
 *
 * Provides enhanced mobile app features including:
 * - Gesture support (swipe, long press, double tap)
 * - Offline mode and sync
 * - Push notifications
 * - Widget support
 * - Dark mode and accessibility
 * - Performance optimizations
 */

import { useState, useCallback, useEffect, useMemo } from '../../../node_modules/react';
import {
  GestureType,
  GestureAction,
  GestureConfig,
  EmailGestureConfig,
  HapticFeedbackType,
  AnimationType,
  AnimationConfig,
  PullToRefreshConfig,
  InfiniteScrollConfig,
  SyncStatus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  OfflineDataType,
  OfflineDataItem,
  ConflictResolutionStrategy,
  SyncConflict,
  OfflineStorageStats,
  NotificationType,
  NotificationPriority,
  PushNotification,
  NotificationSettings,
  WidgetType,
  WidgetConfig,
  DarkModeConfig,
  AccessibilitySettings,
  PerformanceMetrics,
  OptimizationSettings,
  GestureResult,
  SyncResult,
  MobileEnhancements
} from '../types/mobileEnhancements';

/**
 * Default gesture configurations
 */
const DEFAULT_GESTURE_CONFIG: EmailGestureConfig = {
  swipeLeft: {
    gesture: GestureType.SWIPE_LEFT,
    action: GestureAction.ARCHIVE,
    isEnabled: true,
    requiresConfirmation: false,
    hapticFeedback: true
  },
  swipeRight: {
    gesture: GestureType.SWIPE_RIGHT,
    action: GestureAction.MARK_READ,
    isEnabled: true,
    requiresConfirmation: false,
    hapticFeedback: true
  },
  longPress: {
    gesture: GestureType.LONG_PRESS,
    action: GestureAction.NONE,
    isEnabled: true,
    requiresConfirmation: false,
    hapticFeedback: false
  },
  doubleTap: {
    gesture: GestureType.DOUBLE_TAP,
    action: GestureAction.STAR,
    isEnabled: true,
    requiresConfirmation: false,
    hapticFeedback: true
  }
};

/**
 * Default animation configurations
 */
const DEFAULT_ANIMATION: AnimationConfig = {
  type: AnimationType.SLIDE,
  duration: 300,
  delay: 0,
  easing: 'ease-in-out'
};

/**
 * Default pull to refresh configuration
 */
const DEFAULT_PULL_TO_REFRESH: PullToRefreshConfig = {
  isEnabled: true,
  threshold: 80,
  animation: DEFAULT_ANIMATION,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refreshAction: async () => {},
  showRefreshingIndicator: true
};

/**
 * Default infinite scroll configuration
 */
const DEFAULT_INFINITE_SCROLL: InfiniteScrollConfig = {
  isEnabled: true,
  threshold: 200,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  loadMoreAction: async () => {},
  showLoadingIndicator: true
};

/**
 * Default notification settings
 */
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  isEnabled: true,
  [NotificationType.NEW_EMAIL]: {
    enabled: true,
    sound: 'default',
    vibration: true,
    priority: NotificationPriority.HIGH
  },
  [NotificationType.EMAIL_SENT]: {
    enabled: false,
    sound: 'default',
    vibration: false,
    priority: NotificationPriority.NORMAL
  },
  [NotificationType.CALENDAR_EVENT]: {
    enabled: true,
    sound: 'default',
    vibration: true,
    priority: NotificationPriority.NORMAL
  },
  [NotificationType.TASK_ASSIGNED]: {
    enabled: true,
    sound: 'default',
    vibration: true,
    priority: NotificationPriority.HIGH
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    allowUrgent: true
  }
};

/**
 * Default dark mode configuration
 */
const DEFAULT_DARK_MODE: DarkModeConfig = {
  mode: 'system',
  useSystemTheme: true,
  reduceAnimations: false,
  highContrastMode: false
};

/**
 * Default accessibility settings
 */
const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  fontSize: 'medium',
  boldText: false,
  reduceMotion: false,
  highContrast: false,
  screenReader: false,
  touchTargetsSize: 44
};

/**
 * Default optimization settings
 */
const DEFAULT_OPTIMIZATION: OptimizationSettings = {
  enableCaching: true,
  cacheSize: 100 * 1024 * 1024, // 100MB
  enableLazyLoading: true,
  enableVirtualScrolling: true,
  enableImageCompression: true,
  imageQuality: 0.8,
  prefetchStrategy: 'moderate'
};

/**
 * Mock offline storage statistics
 */
const generateMockStorageStats = (): OfflineStorageStats => {
  return {
    totalSize: 500 * 1024 * 1024, // 500MB
    usedSize: 125 * 1024 * 1024, // 125MB
    availableSize: 375 * 1024 * 1024, // 375MB
    emailsCount: 450,
    attachmentsCount: 85,
    attachmentsSize: 95 * 1024 * 1024, // 95MB
    lastSyncTime: new Date().toISOString(),
    syncStatus: SyncStatus.IDLE
  };
};

/**
 * Mock performance metrics
 */
const generateMockPerformanceMetrics = (): PerformanceMetrics => {
  return {
    appLaunchTime: 1.2, // seconds
    screenRenderTime: 0.3, // seconds
    memoryUsage: 85, // MB
    batteryUsage: 2.5, // % per hour
    networkRequests: 156,
    cacheHitRate: 87, // %
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Mobile Enhancements Hook
 */
export const useMobileEnhancements = () => {
  // Gesture state
  const [gestureConfig, setGestureConfig] = useState<EmailGestureConfig>(DEFAULT_GESTURE_CONFIG);
  const [lastGesture, setLastGesture] = useState<GestureResult | null>(null);

  // Pull to refresh state
  const [pullToRefresh, setPullToRefresh] = useState<PullToRefreshConfig>(DEFAULT_PULL_TO_REFRESH);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Infinite scroll state
  const [infiniteScroll, setInfiniteScroll] = useState<InfiniteScrollConfig>(DEFAULT_INFINITE_SCROLL);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Offline mode state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [storageStats, setStorageStats] = useState<OfflineStorageStats>(generateMockStorageStats);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [offlineData, setOfflineData] = useState<OfflineDataItem[]>([]);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);

  // Notification state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  // Widget state
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  // Dark mode state
  const [darkMode, setDarkMode] = useState<DarkModeConfig>(DEFAULT_DARK_MODE);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Accessibility state
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);

  // Performance state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [performance, setPerformance] = useState<PerformanceMetrics>(generateMockPerformanceMetrics);

  // Optimization state
  const [optimization, setOptimization] = useState<OptimizationSettings>(DEFAULT_OPTIMIZATION);

  // Initialize
  useEffect(() => {
    // Initialize widgets
    setWidgets([
      {
        id: 'widget-1',
        type: WidgetType.UNREAD_COUNT,
        title: 'Unread Emails',
        position: 0,
        size: 'small',
        refreshInterval: 300 // 5 minutes
      },
      {
        id: 'widget-2',
        type: WidgetType.STARRED_EMAILS,
        title: 'Starred',
        position: 1,
        size: 'medium',
        refreshInterval: 600 // 10 minutes
      },
      {
        id: 'widget-3',
        type: WidgetType.QUICK_COMPOSE,
        title: 'Quick Compose',
        position: 2,
        size: 'small',
        refreshInterval: 0
      }
    ]);

    // Check system dark mode preference
    if (darkMode.useSystemTheme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, [darkMode.useSystemTheme]);

  /**
   * Handle gesture execution
   */
  const executeGesture = useCallback(
    async (gesture: GestureType, _emailId: string): Promise<GestureResult> => {
      let action: GestureAction = GestureAction.NONE;

      // Find the action for the gesture
      switch (gesture) {
        case GestureType.SWIPE_LEFT:
          action = gestureConfig.swipeLeft.action;
          break;
        case GestureType.SWIPE_RIGHT:
          action = gestureConfig.swipeRight.action;
          break;
        case GestureType.LONG_PRESS:
          action = gestureConfig.longPress.action;
          break;
        case GestureType.DOUBLE_TAP:
          action = gestureConfig.doubleTap.action;
          break;
      }

      const config = Object.values(gestureConfig).find((c) => c.gesture === gesture);
      const feedback = config?.hapticFeedback ? HapticFeedbackType.LIGHT : undefined;

      // Simulate action execution
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result: GestureResult = {
        gesture,
        action,
        success: action !== GestureAction.NONE,
        feedback
      };

      setLastGesture(result);
      return result;
    },
    [gestureConfig]
  );

  /**
   * Update gesture configuration
   */
  const updateGestureConfig = useCallback((gesture: GestureType, updates: Partial<GestureConfig>) => {
    setGestureConfig((prev) => {
      let gestureKey: keyof EmailGestureConfig;
      switch (gesture) {
        case GestureType.SWIPE_LEFT:
          gestureKey = 'swipeLeft';
          break;
        case GestureType.SWIPE_RIGHT:
          gestureKey = 'swipeRight';
          break;
        case GestureType.LONG_PRESS:
          gestureKey = 'longPress';
          break;
        case GestureType.DOUBLE_TAP:
          gestureKey = 'doubleTap';
          break;
        default:
          return prev;
      }
      return {
        ...prev,
        [gestureKey]: { ...prev[gestureKey], ...updates }
      };
    });
  }, []);

  /**
   * Execute pull to refresh
   */
  const executePullToRefresh = useCallback(async () => {
    if (!pullToRefresh.isEnabled || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    await pullToRefresh.refreshAction();
    setIsRefreshing(false);
  }, [pullToRefresh, isRefreshing]);

  /**
   * Execute infinite scroll load more
   */
  const executeLoadMore = useCallback(async () => {
    if (!infiniteScroll.isEnabled || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    await infiniteScroll.loadMoreAction();
    setIsLoadingMore(false);
  }, [infiniteScroll, isLoadingMore]);

  /**
   * Sync offline data
   */
  const syncOfflineData = useCallback(async (): Promise<SyncResult> => {
    setSyncStatus(SyncStatus.SYNCING);

    // Simulate sync process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update storage stats
    setStorageStats((prev) => ({
      ...prev,
      lastSyncTime: new Date().toISOString(),
      syncStatus: SyncStatus.SUCCESS
    }));

    setSyncStatus(SyncStatus.IDLE);

    return {
      success: true,
      itemsSynced: 45,
      itemsFailed: 0,
      duration: 2000,
      conflicts: []
    };
  }, []);

  /**
   * Clear offline data
   */
  const clearOfflineData = useCallback(async () => {
    setOfflineData([]);
    setStorageStats((prev) => ({
      ...prev,
      usedSize: 0,
      emailsCount: 0,
      attachmentsCount: 0,
      attachmentsSize: 0
    }));
  }, []);

  /**
   * Resolve sync conflict
   */
  const resolveConflict = useCallback(async (conflictId: string, _resolution: ConflictResolutionStrategy) => {
    setSyncConflicts((prev) => prev.filter((c) => c.id !== conflictId));
  }, []);

  /**
   * Add notification
   */
  const addNotification = useCallback((notification: Omit<PushNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: PushNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 100));
  }, []);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
  }, []);

  /**
   * Clear all notifications
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Add widget
   */
  const addWidget = useCallback((widget: Omit<WidgetConfig, 'id'>) => {
    const newWidget: WidgetConfig = {
      ...widget,
      id: `widget-${Date.now()}`
    };

    setWidgets((prev) => [...prev, newWidget]);
  }, []);

  /**
   * Remove widget
   */
  const removeWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  }, []);

  /**
   * Update widget
   */
  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)));
  }, []);

  /**
   * Toggle dark mode
   */
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  /**
   * Update accessibility settings
   */
  const updateAccessibility = useCallback((updates: Partial<AccessibilitySettings>) => {
    setAccessibility((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update notification settings
   */
  const updateNotificationSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Get unread notification count
   */
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  /**
   * Get all mobile enhancements state
   */
  const enhancements: MobileEnhancements = useMemo(
    () => ({
      gestures: gestureConfig,
      pullToRefresh,
      infiniteScroll,
      offlineMode: {
        isEnabled: true,
        syncStatus,
        storageStats,
        conflicts: syncConflicts
      },
      notifications: {
        settings: notificationSettings,
        history: notifications
      },
      widgets,
      darkMode,
      accessibility,
      performance,
      optimization
    }),
    [
      gestureConfig,
      pullToRefresh,
      infiniteScroll,
      syncStatus,
      storageStats,
      syncConflicts,
      notificationSettings,
      notifications,
      widgets,
      darkMode,
      accessibility,
      performance,
      optimization
    ]
  );

  return {
    // State
    enhancements,
    isRefreshing,
    isLoadingMore,
    lastGesture,
    isDarkMode,
    unreadNotificationCount,

    // Gestures
    executeGesture,
    updateGestureConfig,

    // Pull to refresh & infinite scroll
    executePullToRefresh,
    executeLoadMore,

    // Offline mode
    syncOfflineData,
    clearOfflineData,
    resolveConflict,

    // Notifications
    addNotification,
    markNotificationAsRead,
    clearNotifications,
    updateNotificationSettings,

    // Widgets
    addWidget,
    removeWidget,
    updateWidget,

    // Dark mode
    toggleDarkMode,

    // Accessibility
    updateAccessibility,

    // Setters
    setPullToRefresh,
    setInfiniteScroll,
    setDarkMode,
    setOptimization
  };
};
