/**
 * Task Management Integration Hook
 * Manages tasks, subtasks, comments, and email-to-task conversion
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
  AssignmentType,
  RecurrenceType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DependencyType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TaskAttachment,
  TaskComment,
  SubTask,
  ChecklistItem,
  TaskReminder,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TaskActivity,
  TaskStatistics,
  TaskProject,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TaskEpic,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TaskSprint,
  CreateTaskPayload,
  UpdateTaskPayload,
  CreateCommentPayload,
  CreateSubTaskPayload,
  CreateReminderPayload,
  CreateProjectPayload,
  TaskFilter,
  TaskSort,
  EmailToTaskOptions
} from '../types/taskManagement';

// Mock data generators
const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateMockTasks = (): Task[] => {
  return [
    {
      id: 'task-1',
      title: 'Review Q1 Marketing Campaign',
      description: 'Review and provide feedback on the upcoming Q1 marketing campaign materials',
      type: TaskType.TASK,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assignedTo: ['user-1'],
      assignedBy: 'admin',
      assignmentType: AssignmentType.SINGLE,
      dueDate: '2024-01-25T18:00:00Z',
      startDate: '2024-01-15T09:00:00Z',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      progress: 60,
      estimatedHours: 8,
      actualHours: 5,
      sourceEmailId: 'email-123',
      dependsOn: [],
      blocks: [],
      labels: ['Marketing', 'Q1'],
      tags: ['review', 'campaign'],
      attachments: [],
      comments: [
        {
          id: 'comment-1',
          content: 'Started reviewing the materials. Will have feedback by end of day.',
          authorId: 'user-1',
          authorName: 'John Doe',
          createdAt: '2024-01-16T10:30:00Z',
          mentions: [],
          attachments: []
        }
      ],
      subtasks: [
        {
          id: 'subtask-1',
          title: 'Review email templates',
          description: 'Check all email templates for accuracy and brand consistency',
          status: TaskStatus.COMPLETED,
          completed: true,
          completedAt: '2024-01-17T15:00:00Z',
          assignedTo: 'user-1',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-17T15:00:00Z'
        },
        {
          id: 'subtask-2',
          title: 'Review landing pages',
          description: 'Review all landing page designs and copy',
          status: TaskStatus.IN_PROGRESS,
          completed: false,
          assignedTo: 'user-1',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-20T14:30:00Z'
        },
        {
          id: 'subtask-3',
          title: 'Provide feedback summary',
          description: 'Compile all feedback into a summary document',
          status: TaskStatus.TODO,
          completed: false,
          assignedTo: 'user-1',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z'
        }
      ],
      checklist: [
        {
          id: 'check-1',
          text: 'Review brand guidelines',
          completed: true,
          completedAt: '2024-01-16T12:00:00Z',
          order: 1
        },
        {
          id: 'check-2',
          text: 'Check email templates',
          completed: true,
          completedAt: '2024-01-17T15:00:00Z',
          order: 2
        },
        {
          id: 'check-3',
          text: 'Review landing page designs',
          completed: false,
          order: 3
        },
        {
          id: 'check-4',
          text: 'Compile feedback summary',
          completed: false,
          order: 4
        }
      ],
      reminders: [
        {
          id: 'remind-1',
          type: 'email',
          reminderTime: '2024-01-24T09:00:00Z',
          message: 'Task due tomorrow. Please complete review.',
          sent: false
        }
      ],
      activityLog: [
        {
          id: 'activity-1',
          type: 'created',
          userId: 'admin',
          userName: 'Admin',
          timestamp: '2024-01-15T09:00:00Z',
          description: 'Task created from email'
        },
        {
          id: 'activity-2',
          type: 'assigned',
          userId: 'admin',
          userName: 'Admin',
          timestamp: '2024-01-15T09:00:00Z',
          description: 'Assigned to John Doe'
        }
      ],
      projectId: 'project-1'
    },
    {
      id: 'task-2',
      title: 'Fix login page authentication bug',
      description: 'Users are experiencing issues logging in when using special characters in their passwords',
      type: TaskType.BUG,
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      assignedTo: ['user-2'],
      assignedBy: 'admin',
      assignmentType: AssignmentType.SINGLE,
      dueDate: '2024-01-18T18:00:00Z',
      createdAt: '2024-01-16T14:00:00Z',
      updatedAt: '2024-01-16T14:00:00Z',
      progress: 0,
      estimatedHours: 4,
      dependsOn: [],
      blocks: [],
      labels: ['Bug', 'Authentication'],
      tags: ['urgent', 'security'],
      attachments: [],
      comments: [],
      subtasks: [],
      checklist: [],
      reminders: [],
      activityLog: [
        {
          id: 'activity-3',
          type: 'created',
          userId: 'admin',
          userName: 'Admin',
          timestamp: '2024-01-16T14:00:00Z',
          description: 'Bug task created from support ticket'
        }
      ]
    },
    {
      id: 'task-3',
      title: 'Implement dark mode support',
      description: 'Add dark mode theme support to the entire application',
      type: TaskType.FEATURE,
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.MEDIUM,
      assignedTo: ['user-3', 'user-4'],
      assignedBy: 'admin',
      assignmentType: AssignmentType.MULTIPLE,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
      progress: 0,
      estimatedHours: 20,
      dependsOn: [],
      blocks: [],
      labels: ['Feature', 'UI/UX'],
      tags: ['dark-mode', 'theme'],
      attachments: [],
      comments: [],
      subtasks: [],
      checklist: [],
      reminders: [],
      activityLog: [],
      projectId: 'project-2'
    },
    {
      id: 'task-4',
      title: 'Update documentation for v1.3.0',
      description: 'Update all documentation for the upcoming v1.3.0 release',
      type: TaskType.DOCUMENTATION,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      assignedTo: ['user-1'],
      assignedBy: 'admin',
      assignmentType: AssignmentType.SINGLE,
      dueDate: '2024-02-01T18:00:00Z',
      createdAt: '2024-01-12T09:00:00Z',
      updatedAt: '2024-01-12T09:00:00Z',
      progress: 0,
      estimatedHours: 6,
      dependsOn: [],
      blocks: [],
      labels: ['Documentation', 'v1.3.0'],
      tags: ['docs', 'release'],
      attachments: [],
      comments: [],
      subtasks: [],
      checklist: [],
      reminders: [],
      activityLog: []
    },
    {
      id: 'task-5',
      title: 'Schedule weekly team meeting',
      description: 'Coordinate and schedule the weekly team meeting for all departments',
      type: TaskType.MEETING,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      assignedTo: ['user-1'],
      assignedBy: 'admin',
      assignmentType: AssignmentType.SINGLE,
      dueDate: '2024-01-22T14:00:00Z',
      startDate: '2024-01-20T09:00:00Z',
      createdAt: '2024-01-20T09:00:00Z',
      updatedAt: '2024-01-20T14:00:00Z',
      progress: 50,
      estimatedHours: 2,
      actualHours: 1,
      recurrence: {
        type: RecurrenceType.WEEKLY,
        interval: 1,
        daysOfWeek: [1] // Monday
      },
      dependsOn: [],
      blocks: [],
      labels: ['Meeting', 'Weekly'],
      tags: ['team', 'sync'],
      attachments: [],
      comments: [],
      subtasks: [
        {
          id: 'subtask-4',
          title: 'Book conference room',
          description: 'Reserve the main conference room',
          status: TaskStatus.COMPLETED,
          completed: true,
          completedAt: '2024-01-20T10:00:00Z',
          createdAt: '2024-01-20T09:00:00Z',
          updatedAt: '2024-01-20T10:00:00Z'
        },
        {
          id: 'subtask-5',
          title: 'Send calendar invites',
          description: 'Send calendar invitations to all team members',
          status: TaskStatus.IN_PROGRESS,
          completed: false,
          createdAt: '2024-01-20T09:00:00Z',
          updatedAt: '2024-01-20T14:00:00Z'
        }
      ],
      checklist: [
        {
          id: 'check-5',
          text: 'Book conference room',
          completed: true,
          completedAt: '2024-01-20T10:00:00Z',
          order: 1
        },
        {
          id: 'check-6',
          text: 'Send calendar invites',
          completed: false,
          order: 2
        }
      ],
      reminders: [],
      activityLog: []
    }
  ];
};

const generateMockProjects = (): TaskProject[] => {
  return [
    {
      id: 'project-1',
      name: 'Q1 Marketing Campaign',
      description: 'Planning and execution of Q1 marketing initiatives',
      color: '#FF6B6B',
      icon: '📢',
      taskCount: 12,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-20T14:00:00Z'
    },
    {
      id: 'project-2',
      name: 'Platform Improvements',
      description: 'Ongoing improvements to the V-Mail platform',
      color: '#4ECDC4',
      icon: '🚀',
      taskCount: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'project-3',
      name: 'Customer Support',
      description: 'Customer support and issue resolution',
      color: '#FFE66D',
      icon: '🎧',
      taskCount: 5,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-18T16:00:00Z'
    }
  ];
};

export const useTaskManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Initialize data
  useEffect(() => {
    const initialize = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTasks(generateMockTasks());
      setProjects(generateMockProjects());
      setIsLoading(false);
    };
    initialize();
  }, []);

  // Task CRUD Operations
  const createTask = useCallback(async (payload: CreateTaskPayload): Promise<Task | null> => {
    const newTask: Task = {
      ...payload,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activityLog: [
        {
          id: generateId(),
          type: 'created',
          userId: payload.assignedBy,
          userName: 'User',
          timestamp: new Date().toISOString(),
          description: 'Task created'
        }
      ]
    };

    setTasks((prev) => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback(
    async (id: string, payload: UpdateTaskPayload): Promise<Task | null> => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === id) {
            const updatedTask = {
              ...task,
              ...payload,
              updatedAt: new Date().toISOString()
            };

            // Add activity log for status changes
            if (payload.status && payload.status !== task.status) {
              updatedTask.activityLog.push({
                id: generateId(),
                type: 'status_changed',
                userId: payload.assignedBy || task.assignedBy,
                userName: 'User',
                timestamp: new Date().toISOString(),
                description: `Status changed from ${task.status} to ${payload.status}`
              });
            }

            return updatedTask;
          }
          return task;
        })
      );

      return tasks.find((t) => t.id === id) || null;
    },
    [tasks]
  );

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    return true;
  }, []);

  // Email to Task Conversion
  const convertEmailToTask = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (emailId: string, emailData: Record<string, any>, options: EmailToTaskOptions): Promise<Task | null> => {
      const title = options.extractTitleFromSubject ? emailData.subject || 'Task from Email' : 'Task from Email';

      const description = options.extractDescriptionFromBody ? emailData.body || '' : '';

      const task: CreateTaskPayload = {
        title,
        description,
        type: options.defaultType,
        status: TaskStatus.TODO,
        priority: options.defaultPriority,
        assignedTo: options.autoAssign || [],
        assignedBy: 'current-user',
        assignmentType: AssignmentType.SINGLE,
        progress: 0,
        sourceEmailId: emailId,
        emailConversation: [emailId],
        dependsOn: [],
        blocks: [],
        labels: [],
        tags: [],
        attachments:
          options.includeAttachments && emailData.attachments
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              emailData.attachments.map((att: any, idx: number) => ({
                id: generateId(),
                name: att.name || `attachment-${idx}`,
                url: att.url || '',
                size: att.size,
                mimeType: att.mimeType,
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'current-user'
              }))
            : [],
        comments: [],
        subtasks: [],
        checklist: [],
        reminders: []
      };

      // Set due date if specified
      if (options.defaultDueDateOffset) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + options.defaultDueDateOffset);
        task.dueDate = dueDate.toISOString();
      }

      return await createTask(task);
    },
    [createTask]
  );

  // Subtask Management
  const createSubTask = useCallback(async (taskId: string, payload: CreateSubTaskPayload): Promise<SubTask | null> => {
    const newSubTask: SubTask = {
      ...payload,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: [...task.subtasks, newSubTask],
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      })
    );

    return newSubTask;
  }, []);

  const updateSubTask = useCallback(
    async (taskId: string, subTaskId: string, updates: Partial<SubTask>): Promise<boolean> => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              subtasks: task.subtasks.map((st) =>
                st.id === subTaskId ? { ...st, ...updates, updatedAt: new Date().toISOString() } : st
              ),
              updatedAt: new Date().toISOString()
            };
          }
          return task;
        })
      );
      return true;
    },
    []
  );

  const deleteSubTask = useCallback(async (taskId: string, subTaskId: string): Promise<boolean> => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.filter((st) => st.id !== subTaskId),
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      })
    );
    return true;
  }, []);

  // Comment Management
  const addComment = useCallback(async (taskId: string, payload: CreateCommentPayload): Promise<TaskComment | null> => {
    const newComment: TaskComment = {
      ...payload,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            comments: [...task.comments, newComment],
            activityLog: [
              ...task.activityLog,
              {
                id: generateId(),
                type: 'comment_added',
                userId: payload.authorId,
                userName: payload.authorName,
                timestamp: new Date().toISOString(),
                description: 'Comment added'
              }
            ],
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      })
    );

    return newComment;
  }, []);

  // Checklist Management
  const createChecklistItem = useCallback(
    async (taskId: string, text: string, order: number): Promise<ChecklistItem | null> => {
      const newItem: ChecklistItem = {
        id: generateId(),
        text,
        completed: false,
        order
      };

      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              checklist: [...task.checklist, newItem],
              updatedAt: new Date().toISOString()
            };
          }
          return task;
        })
      );

      return newItem;
    },
    []
  );

  const toggleChecklistItem = useCallback(async (taskId: string, itemId: string): Promise<boolean> => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            checklist: task.checklist.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    completed: !item.completed,
                    completedAt: !item.completed ? new Date().toISOString() : undefined
                  }
                : item
            ),
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      })
    );
    return true;
  }, []);

  const deleteChecklistItem = useCallback(async (taskId: string, itemId: string): Promise<boolean> => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            checklist: task.checklist.filter((item) => item.id !== itemId),
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      })
    );
    return true;
  }, []);

  // Reminder Management
  const createReminder = useCallback(
    async (taskId: string, payload: CreateReminderPayload): Promise<TaskReminder | null> => {
      const newReminder: TaskReminder = {
        ...payload,
        id: generateId(),
        sent: false
      };

      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              reminders: [...task.reminders, newReminder],
              updatedAt: new Date().toISOString()
            };
          }
          return task;
        })
      );

      return newReminder;
    },
    []
  );

  // Task Statistics
  const getTaskStatistics = useCallback((): TaskStatistics => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.COMPLETED
    ).length;

    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueThisWeek = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) <= weekFromNow
    ).length;

    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<TaskStatus, number>
    );

    const tasksByPriority = tasks.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {} as Record<TaskPriority, number>
    );

    const tasksByType = tasks.reduce(
      (acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      },
      {} as Record<TaskType, number>
    );

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      dueThisWeek,
      averageCompletionTime: 0,
      tasksByStatus,
      tasksByPriority,
      tasksByType
    };
  }, [tasks]);

  // Filter and search
  const getFilteredTasks = useCallback(
    (filter?: TaskFilter): Task[] => {
      let filtered = [...tasks];

      if (filter?.status) {
        filtered = filtered.filter((t) => t.status === filter.status);
      }

      if (filter?.priority) {
        filtered = filtered.filter((t) => t.priority === filter.priority);
      }

      if (filter?.type) {
        filtered = filtered.filter((t) => t.type === filter.type);
      }

      if (filter?.assignedTo) {
        const assignedTo = filter.assignedTo;
        filtered = filtered.filter((t) => t.assignedTo.includes(assignedTo));
      }

      if (filter?.projectId) {
        filtered = filtered.filter((t) => t.projectId === filter.projectId);
      }

      if (filter?.dueDateRange) {
        const dateRange = filter.dueDateRange;
        filtered = filtered.filter((t) => {
          if (!t.dueDate) {
            return false;
          }
          const dueDate = new Date(t.dueDate);
          const from = dateRange.from ? new Date(dateRange.from) : null;
          const to = dateRange.to ? new Date(dateRange.to) : null;
          return (!from || dueDate >= from) && (!to || dueDate <= to);
        });
      }

      if (filter?.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = filtered.filter(
          (t) => t.title.toLowerCase().includes(searchLower) || t.description?.toLowerCase().includes(searchLower)
        );
      }

      if (filter?.labels && filter.labels.length > 0) {
        filtered = filtered.filter((t) => filter.labels!.some((label) => t.labels.includes(label)));
      }

      if (filter?.tags && filter.tags.length > 0) {
        filtered = filtered.filter((t) => filter.tags!.some((tag) => t.tags.includes(tag)));
      }

      return filtered;
    },
    [tasks]
  );

  // Sort tasks
  const getSortedTasks = useCallback((tasks: Task[], sort?: TaskSort): Task[] => {
    if (!sort) {
      return tasks;
    }

    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'dueDate':
          if (!a.dueDate) {
            return 1;
          }
          if (!b.dueDate) {
            return -1;
          }
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority': {
          const priorityOrder = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT];
          comparison = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
          break;
        }
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        default:
          comparison = 0;
      }

      return sort.order === 'desc' ? -comparison : comparison;
    });
  }, []);

  // Utility functions
  const getTaskById = useCallback(
    (id: string): Task | null => {
      return tasks.find((t) => t.id === id) || null;
    },
    [tasks]
  );

  const getTasksByEmailId = useCallback(
    (emailId: string): Task[] => {
      return tasks.filter((t) => t.sourceEmailId === emailId);
    },
    [tasks]
  );

  // Project management
  const createProject = useCallback(async (payload: CreateProjectPayload): Promise<TaskProject> => {
    const newProject: TaskProject = {
      ...payload,
      id: generateId(),
      taskCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setProjects((prev) => [...prev, newProject]);
    return newProject;
  }, []);

  // Refresh functions
  const refreshTasks = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setTasks(generateMockTasks());
    setIsLoading(false);
  }, []);

  return {
    // State
    isLoading,
    tasks,
    projects,
    selectedTask,
    setSelectedTask,

    // Task CRUD
    createTask,
    updateTask,
    deleteTask,

    // Email to task conversion
    convertEmailToTask,

    // Subtask management
    createSubTask,
    updateSubTask,
    deleteSubTask,

    // Comment management
    addComment,

    // Checklist management
    createChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,

    // Reminder management
    createReminder,

    // Statistics
    getTaskStatistics,

    // Filter and search
    getFilteredTasks,
    getSortedTasks,

    // Utility functions
    getTaskById,
    getTasksByEmailId,

    // Project management
    createProject,

    // Refresh functions
    refreshTasks
  };
};
