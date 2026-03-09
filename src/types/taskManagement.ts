/**
 * Task Management Integration Type Definitions
 * Supports task creation from emails, email-to-task conversion, and task tracking
 */

// Task priority levels
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Task status
export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Task types
export enum TaskType {
  TASK = 'task',
  BUG = 'bug',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  DOCUMENTATION = 'documentation',
  SUPPORT = 'support',
  MEETING = 'meeting',
  FOLLOW_UP = 'follow_up'
}

// Task assignment type
export enum AssignmentType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  TEAM = 'team',
  SELF = 'self'
}

// Task recurrence
export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

// Task dependency type
export enum DependencyType {
  FINISH_TO_START = 'finish_to_start',
  START_TO_START = 'start_to_start',
  FINISH_TO_FINISH = 'finish_to_finish',
  START_TO_FINISH = 'start_to_finish'
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;

  // Task classification
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;

  // Assignment
  assignedTo: string[];
  assignedBy: string;
  assignmentType: AssignmentType;

  // Dates
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Progress
  progress: number;
  estimatedHours?: number;
  actualHours?: number;

  // Email integration
  sourceEmailId?: string;
  emailConversation?: string[];

  // Dependencies
  dependsOn: string[];
  blocks: string[];

  // Recurrence
  recurrence?: {
    type: RecurrenceType;
    interval?: number;
    daysOfWeek?: number[];
    endDate?: string;
  };

  // Labels and tags
  labels: string[];
  tags: string[];

  // Attachments
  attachments: TaskAttachment[];

  // Comments
  comments: TaskComment[];

  // Subtasks
  subtasks: SubTask[];

  // Checklist
  checklist: ChecklistItem[];

  // Reminders
  reminders: TaskReminder[];

  // Activity log
  activityLog: TaskActivity[];

  // Custom fields
  customFields?: Record<string, unknown>;

  // Metadata
  projectId?: string;
  epicId?: string;
  sprintId?: string;
  category?: string;
  location?: string;
  color?: string;
}

// Task attachment
export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Task comment
export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  mentions: string[];
  attachments: TaskAttachment[];
}

// Subtask
export interface SubTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  completed: boolean;
  completedAt?: string;
  dueDate?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

// Checklist item
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  order: number;
}

// Task reminder
export interface TaskReminder {
  id: string;
  type: 'email' | 'push' | 'sms' | 'slack';
  reminderTime: string;
  message?: string;
  sent: boolean;
  sentAt?: string;
}

// Task activity
export interface TaskActivity {
  id: string;
  type: 'created' | 'updated' | 'assigned' | 'comment_added' | 'status_changed' | 'completed';
  userId: string;
  userName: string;
  timestamp: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// Task statistics
export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  dueThisWeek: number;
  averageCompletionTime: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByType: Record<TaskType, number>;
}

// Email to task conversion options
export interface EmailToTaskOptions {
  extractTitleFromSubject: boolean;
  extractDescriptionFromBody: boolean;
  includeAttachments: boolean;
  autoAssign?: string[];
  defaultPriority: TaskPriority;
  defaultType: TaskType;
  defaultDueDateOffset?: number; // days from now
  createSubtasks: boolean;
  createChecklist: boolean;
}

// Task filter
export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assignedTo?: string;
  projectId?: string;
  dueDateRange?: {
    from?: string;
    to?: string;
  };
  search?: string;
  labels?: string[];
  tags?: string[];
}

// Task sort options
export interface TaskSort {
  field: 'dueDate' | 'priority' | 'createdAt' | 'title' | 'progress';
  order: 'asc' | 'desc';
}

// Task project
export interface TaskProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

// Task epic
export interface TaskEpic {
  id: string;
  name: string;
  description?: string;
  color: string;
  taskCount: number;
  completedCount: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// Task sprint
export interface TaskSprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed';
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

// Payload types for operations
export type CreateTaskPayload = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'activityLog'>;

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export type CreateCommentPayload = Omit<TaskComment, 'id' | 'createdAt'>;

export type CreateSubTaskPayload = Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>;

export type CreateReminderPayload = Omit<TaskReminder, 'id' | 'sent' | 'sentAt'>;

export type CreateProjectPayload = Omit<TaskProject, 'id' | 'createdAt' | 'updatedAt' | 'taskCount'>;

export type CreateEpicPayload = Omit<
  TaskEpic,
  'id' | 'createdAt' | 'updatedAt' | 'taskCount' | 'completedCount' | 'progress'
>;

export type CreateSprintPayload = Omit<TaskSprint, 'id' | 'createdAt' | 'updatedAt' | 'taskCount'>;
