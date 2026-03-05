/**
 * Mobile App Enhancements Type Definitions
 * 
 * Provides types for enhanced mobile app features including gestures,
 * offline support, push notifications, and native integrations.
 */

/**
 * Gesture types supported in the mobile app
 */
export enum GestureType {
  SWIPE_LEFT = 'swipe_left',
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_UP = 'swipe_up',
  SWIPE_DOWN = 'swipe_down',
  TAP = 'tap',
  DOUBLE_TAP = 'double_tap',
  LONG_PRESS = 'long_press',
  PINCH = 'pinch',
  SPREAD = 'spread',
}

/**
 * Gesture action types
 */
export enum GestureAction {
  ARCHIVE = 'archive',
  DELETE = 'delete',
  STAR = 'star',
  UNSTAR = 'unstar',
  MARK_READ = 'mark_read',
  MARK_UNREAD = 'mark_unread',
  MOVE_TO_FOLDER = 'move_to_folder',
  ADD_LABEL = 'add_label',
  REMOVE_LABEL = 'remove_label',
  FORWARD = 'forward',
  REPLY = 'reply',
  REPLY_ALL = 'reply_all',
  SNOOZE = 'snooze',
  NONE = 'none',
}

/**
 * Gesture configuration
 */
export interface GestureConfig {
  gesture: GestureType;
  action: GestureAction;
  isEnabled: boolean;
  requiresConfirmation?: boolean;
  hapticFeedback?: boolean;
}

/**
 * Email gesture configuration
 */
export interface EmailGestureConfig {
  swipeLeft: GestureConfig;
  swipeRight: GestureConfig;
  longPress: GestureConfig;
  doubleTap: GestureConfig;
}

/**
 * Touch feedback type
 */
export enum HapticFeedbackType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
  IMPACT = 'impact',
}

/**
 * Animation type
 */
export enum AnimationType {
  FADE = 'fade',
  SLIDE = 'slide',
  SCALE = 'scale',
  ROTATE = 'rotate',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic',
  SPRING = 'spring',
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  type: AnimationType;
  duration: number;
  delay?: number;
  easing?: string;
}

/**
 * Pull to refresh configuration
 */
export interface PullToRefreshConfig {
  isEnabled: boolean;
  threshold: number;
  animation: AnimationConfig;
  refreshAction: () => Promise<void>;
  showRefreshingIndicator: boolean;
}

/**
 * Infinite scroll configuration
 */
export interface InfiniteScrollConfig {
  isEnabled: boolean;
  threshold: number;
  loadMoreAction: () => Promise<void>;
  showLoadingIndicator: boolean;
}

/**
 * Offline sync status
 */
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  OFFLINE = 'offline',
}

/**
 * Offline data type
 */
export enum OfflineDataType {
  EMAILS = 'emails',
  FOLDERS = 'folders',
  LABELS = 'labels',
  CONTACTS = 'contacts',
  SETTINGS = 'settings',
  ATTACHMENTS = 'attachments',
}

/**
 * Offline data item
 */
export interface OfflineDataItem {
  id: string;
  type: OfflineDataType;
  data: any;
  lastModified: string;
  size: number;
  isDirty: boolean;
}

/**
 * Sync conflict resolution strategy
 */
export enum ConflictResolutionStrategy {
  SERVER_WINS = 'server_wins',
  LOCAL_WINS = 'local_wins',
  MANUAL = 'manual',
  MERGE = 'merge',
}

/**
 * Sync conflict
 */
export interface SyncConflict {
  id: string;
  dataType: OfflineDataType;
  itemId: string;
  localVersion: any;
  serverVersion: any;
  conflictType: 'modification' | 'deletion' | 'creation';
  timestamp: string;
  resolution?: ConflictResolutionStrategy;
}

/**
 * Offline storage statistics
 */
export interface OfflineStorageStats {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  emailsCount: number;
  attachmentsCount: number;
  attachmentsSize: number;
  lastSyncTime: string;
  syncStatus: SyncStatus;
}

/**
 * Push notification type
 */
export enum NotificationType {
  NEW_EMAIL = 'new_email',
  EMAIL_SENT = 'email_sent',
  EMAIL_READ = 'email_read',
  CALENDAR_EVENT = 'calendar_event',
  TASK_ASSIGNED = 'task_assigned',
  SYSTEM = 'system',
  REMINDER = 'reminder',
}

/**
 * Push notification priority
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Push notification
 */
export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  imageUrl?: string;
  sound?: string;
  vibrationPattern?: number[];
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  isEnabled: boolean;
  [NotificationType.NEW_EMAIL]?: {
    enabled: boolean;
    sound: string;
    vibration: boolean;
    priority: NotificationPriority;
  };
  [NotificationType.EMAIL_SENT]?: {
    enabled: boolean;
    sound: string;
    vibration: boolean;
    priority: NotificationPriority;
  };
  [NotificationType.CALENDAR_EVENT]?: {
    enabled: boolean;
    sound: string;
    vibration: boolean;
    priority: NotificationPriority;
  };
  [NotificationType.TASK_ASSIGNED]?: {
    enabled: boolean;
    sound: string;
    vibration: boolean;
    priority: NotificationPriority;
  };
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    allowUrgent: boolean;
  };
}

/**
 * Widget type
 */
export enum WidgetType {
  EMAIL_COUNT = 'email_count',
  UNREAD_COUNT = 'unread_count',
  QUICK_COMPOSE = 'quick_compose',
  STARRED_EMAILS = 'starred_emails',
  UPCOMING_EVENTS = 'upcoming_events',
  TASKS = 'tasks',
  FOLDER = 'folder',
  CUSTOM = 'custom',
}

/**
 * Widget configuration
 */
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  refreshInterval: number;
  data?: Record<string, any>;
}

/**
 * Share sheet item
 */
export interface ShareSheetItem {
  id: string;
  title: string;
  icon: string;
  action: () => void;
  isEnabled: boolean;
}

/**
 * Dark mode configuration
 */
export interface DarkModeConfig {
  mode: 'system' | 'light' | 'dark';
  useSystemTheme: boolean;
  customColors?: Record<string, string>;
  reduceAnimations: boolean;
  highContrastMode: boolean;
}

/**
 * Accessibility settings
 */
export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  boldText: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
  touchTargetsSize: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  appLaunchTime: number;
  screenRenderTime: number;
  memoryUsage: number;
  batteryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
  lastUpdated: string;
}

/**
 * App optimization settings
 */
export interface OptimizationSettings {
  enableCaching: boolean;
  cacheSize: number;
  enableLazyLoading: boolean;
  enableVirtualScrolling: boolean;
  enableImageCompression: boolean;
  imageQuality: number;
  prefetchStrategy: 'aggressive' | 'moderate' | 'conservative';
}

/**
 * Mobile enhancement features
 */
export interface MobileEnhancements {
  gestures: EmailGestureConfig;
  pullToRefresh: PullToRefreshConfig;
  infiniteScroll: InfiniteScrollConfig;
  offlineMode: {
    isEnabled: boolean;
    syncStatus: SyncStatus;
    storageStats: OfflineStorageStats;
    conflicts: SyncConflict[];
  };
  notifications: {
    settings: NotificationSettings;
    history: PushNotification[];
  };
  widgets: WidgetConfig[];
  darkMode: DarkModeConfig;
  accessibility: AccessibilitySettings;
  performance: PerformanceMetrics;
  optimization: OptimizationSettings;
}

/**
 * Gesture result
 */
export interface GestureResult {
  gesture: GestureType;
  action: GestureAction;
  success: boolean;
  feedback?: HapticFeedbackType;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsFailed: number;
  duration: number;
  conflicts: SyncConflict[];
  error?: string;
}