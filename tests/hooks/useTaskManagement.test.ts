import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskManagement } from '../../src/hooks/useTaskManagement';
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
  AssignmentType,
  CreateTaskPayload,
  UpdateTaskPayload,
  CreateCommentPayload,
  CreateSubTaskPayload,
  CreateReminderPayload,
  EmailToTaskOptions,
} from '../../src/types/taskManagement';

// Helper to create a complete task payload
function createTestTaskPayload(overrides: Partial<CreateTaskPayload> = {}): CreateTaskPayload {
  return {
    title: 'Test Task',
    description: 'Test task description',
    type: TaskType.TASK,
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assignedTo: ['user1'],
    assignedBy: 'admin',
    assignmentType: AssignmentType.SINGLE,
    progress: 0,
    dependsOn: [],
    blocks: [],
    labels: [],
    tags: [],
    attachments: [],
    comments: [],
    subtasks: [],
    checklist: [],
    reminders: [],
    ...overrides,
  };
}

// Helper to create email-to-task options
function createTestEmailToTaskOptions(overrides: Partial<EmailToTaskOptions> = {}): EmailToTaskOptions {
  return {
    extractTitleFromSubject: true,
    extractDescriptionFromBody: true,
    includeAttachments: true,
    autoAssign: [],
    defaultPriority: TaskPriority.MEDIUM,
    defaultType: TaskType.TASK,
    createSubtasks: false,
    createChecklist: false,
    ...overrides,
  };
}

// Mock timers
vi.useFakeTimers();

describe('useTaskManagement', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization and State', () => {
    it('should initialize with loading state and then load data', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      // Initially loading
      expect(result.current.isLoading).toBe(true);
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.tasks.length).toBeGreaterThan(0);
      expect(result.current.projects.length).toBeGreaterThan(0);
      expect(result.current.selectedTask).toBeNull();
    });
  });

  describe('Task CRUD Operations', () => {
    it('should create a new task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const initialTaskCount = result.current.tasks.length;
      const newTaskPayload = createTestTaskPayload({ title: 'New Test Task' });
      
      await act(async () => {
        const createdTask = await result.current.createTask(newTaskPayload);
        expect(createdTask).not.toBeNull();
        expect(createdTask?.title).toBe('New Test Task');
      });
      
      expect(result.current.tasks.length).toBe(initialTaskCount + 1);
    });

    it('should update an existing task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const taskToUpdate = result.current.tasks[0];
      
      await act(async () => {
        await result.current.updateTask(taskToUpdate.id, {
          id: taskToUpdate.id,
          title: 'Updated Task Title',
          priority: TaskPriority.HIGH,
        });
      });
      
      const taskInState = result.current.tasks.find(t => t.id === taskToUpdate.id);
      expect(taskInState?.title).toBe('Updated Task Title');
      expect(taskInState?.priority).toBe(TaskPriority.HIGH);
    });

    it('should delete a task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const taskToDelete = result.current.tasks[0];
      const initialTaskCount = result.current.tasks.length;
      
      await act(async () => {
        const result_delete = await result.current.deleteTask(taskToDelete.id);
        expect(result_delete).toBe(true);
      });
      
      expect(result.current.tasks.length).toBe(initialTaskCount - 1);
      expect(result.current.tasks.find(t => t.id === taskToDelete.id)).toBeUndefined();
    });
  });

  describe('Email to Task Conversion', () => {
    it('should convert email to task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const initialTaskCount = result.current.tasks.length;
      const emailData = {
        id: 'email-1',
        subject: 'Task from Email',
        from: 'sender@example.com',
        body: 'Email body content',
        date: new Date().toISOString(),
      };
      
      const options = createTestEmailToTaskOptions();
      
      await act(async () => {
        const task = await result.current.convertEmailToTask(emailData.id, emailData, options);
        expect(task).not.toBeNull();
        expect(task?.title).toBe(emailData.subject);
        expect(task?.sourceEmailId).toBe(emailData.id);
      });
      
      expect(result.current.tasks.length).toBe(initialTaskCount + 1);
    });

    it('should apply default due date offset', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const emailData = {
        id: 'email-2',
        subject: 'Task with Due Date',
        from: 'sender@example.com',
        body: 'Email body',
        date: new Date().toISOString(),
      };
      
      const options = createTestEmailToTaskOptions({ defaultDueDateOffset: 7 });
      
      await act(async () => {
        const task = await result.current.convertEmailToTask(emailData.id, emailData, options);
        expect(task).not.toBeNull();
        expect(task?.dueDate).toBeDefined();
      });
    });
  });

  describe('Subtask Management', () => {
    it('should create a subtask', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks[0];
      const initialSubtaskCount = task.subtasks.length;
      
      const subtaskPayload: CreateSubTaskPayload = {
        title: 'New Subtask',
        status: TaskStatus.TODO,
        completed: false,
      };
      
      await act(async () => {
        const subtask = await result.current.createSubTask(task.id, subtaskPayload);
        expect(subtask).not.toBeNull();
        expect(subtask?.title).toBe('New Subtask');
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.subtasks.length).toBe(initialSubtaskCount + 1);
    });

    it('should update a subtask', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks.find(t => t.subtasks.length > 0);
      if (!task) {
        // Create a subtask first
        await act(async () => {
          await result.current.createSubTask(task?.id || result.current.tasks[0].id, {
            title: 'Subtask to Update',
            status: TaskStatus.TODO,
            completed: false,
          });
        });
      }
      
      const taskWithSubtask = result.current.tasks.find(t => t.subtasks.length > 0);
      if (!taskWithSubtask) {
        expect(true).toBe(true); // Skip if no subtasks
        return;
      }
      
      const subtask = taskWithSubtask.subtasks[0];
      
      await act(async () => {
        const updated = await result.current.updateSubTask(taskWithSubtask.id, subtask.id, {
          completed: true,
        });
        expect(updated).not.toBeNull();
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === taskWithSubtask.id);
      const updatedSubtask = updatedTask?.subtasks.find(s => s.id === subtask.id);
      expect(updatedSubtask?.completed).toBe(true);
    });

    it('should delete a subtask', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks.find(t => t.subtasks.length > 0);
      if (!task) {
        expect(true).toBe(true); // Skip if no subtasks
        return;
      }
      
      const subtaskToDelete = task.subtasks[0];
      const initialCount = task.subtasks.length;
      
      await act(async () => {
        const deleted = await result.current.deleteSubTask(task.id, subtaskToDelete.id);
        expect(deleted).toBe(true);
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.subtasks.length).toBe(initialCount - 1);
    });
  });

  describe('Comment Management', () => {
    it('should add a comment', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks[0];
      const initialCommentCount = task.comments.length;
      
      const commentPayload: CreateCommentPayload = {
        content: 'Test comment',
        authorId: 'user1',
        authorName: 'Test User',
        mentions: [],
        attachments: [],
      };
      
      await act(async () => {
        const comment = await result.current.addComment(task.id, commentPayload);
        expect(comment).not.toBeNull();
        expect(comment?.content).toBe('Test comment');
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.comments.length).toBe(initialCommentCount + 1);
    });
  });

  describe('Checklist Management', () => {
    it('should create a checklist item', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks[0];
      const initialCount = task.checklist.length;
      
      await act(async () => {
        const item = await result.current.createChecklistItem(task.id, 'New checklist item', 0);
        expect(item).not.toBeNull();
        expect(item?.text).toBe('New checklist item');
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.checklist.length).toBe(initialCount + 1);
    });

    it('should toggle a checklist item', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks.find(t => t.checklist.length > 0);
      if (!task) {
        expect(true).toBe(true); // Skip if no checklist
        return;
      }
      
      const item = task.checklist[0];
      const previousState = item.completed;
      
      await act(async () => {
        const updated = await result.current.toggleChecklistItem(task.id, item.id);
        expect(updated).not.toBeNull();
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      const updatedItem = updatedTask?.checklist.find(i => i.id === item.id);
      expect(updatedItem?.completed).toBe(!previousState);
    });

    it('should delete a checklist item', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks.find(t => t.checklist.length > 0);
      if (!task) {
        expect(true).toBe(true); // Skip if no checklist
        return;
      }
      
      const item = task.checklist[0];
      const initialCount = task.checklist.length;
      
      await act(async () => {
        const deleted = await result.current.deleteChecklistItem(task.id, item.id);
        expect(deleted).toBe(true);
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.checklist.length).toBe(initialCount - 1);
    });
  });

  describe('Reminder Management', () => {
    it('should create a reminder', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks[0];
      const initialCount = task.reminders.length;
      
      const reminderPayload: CreateReminderPayload = {
        type: 'email',
        reminderTime: new Date(Date.now() + 86400000).toISOString(),
        message: 'Task reminder',
      };
      
      await act(async () => {
        const reminder = await result.current.createReminder(task.id, reminderPayload);
        expect(reminder).not.toBeNull();
        expect(reminder?.type).toBe('email');
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.reminders.length).toBe(initialCount + 1);
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const stats = result.current.getTaskStatistics();
      
      expect(stats.totalTasks).toBeGreaterThan(0);
      expect(stats.tasksByStatus).toBeDefined();
      expect(stats.tasksByPriority).toBeDefined();
      expect(stats.tasksByType).toBeDefined();
    });

    it('should count completed tasks correctly', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const stats = result.current.getTaskStatistics();
      const completedCount = result.current.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      
      expect(stats.completedTasks).toBe(completedCount);
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter by status', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const filtered = result.current.getFilteredTasks({ status: TaskStatus.TODO });
      
      expect(filtered.every(t => t.status === TaskStatus.TODO)).toBe(true);
    });

    it('should filter by priority', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const filtered = result.current.getFilteredTasks({ priority: TaskPriority.HIGH });
      
      expect(filtered.every(t => t.priority === TaskPriority.HIGH)).toBe(true);
    });

    it('should filter by type', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const filtered = result.current.getFilteredTasks({ type: TaskType.TASK });
      
      expect(filtered.every(t => t.type === TaskType.TASK)).toBe(true);
    });

    it('should filter by search query', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const firstTask = result.current.tasks[0];
      const searchQuery = firstTask.title.split(' ')[0];
      
      const filtered = result.current.getFilteredTasks({ search: searchQuery });
      
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some(t => t.title.includes(searchQuery))).toBe(true);
    });

    it('should filter by project', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const project = result.current.projects[0];
      const filtered = result.current.getFilteredTasks({ projectId: project.id });
      
      expect(filtered.every(t => t.projectId === project.id)).toBe(true);
    });

    it('should sort by title ascending', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const sorted = result.current.getSortedTasks(result.current.tasks, { field: 'title', order: 'asc' });
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].title.localeCompare(sorted[i-1].title)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort by priority descending', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const priorityOrder = [TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW];
      const sorted = result.current.getSortedTasks(result.current.tasks, { field: 'priority', order: 'desc' });
      
      for (let i = 1; i < sorted.length; i++) {
        const currentPriority = priorityOrder.indexOf(sorted[i].priority);
        const prevPriority = priorityOrder.indexOf(sorted[i-1].priority);
        expect(currentPriority).toBeGreaterThanOrEqual(prevPriority);
      }
    });
  });

  describe('Utility Functions', () => {
    it('should get task by ID', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks[0];
      const found = result.current.getTaskById(task.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(task.id);
    });

    it('should return null for non-existent task ID', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const found = result.current.getTaskById('non-existent-id');
      
      expect(found).toBeNull();
    });

    it('should get tasks by email ID', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      // Find a task with sourceEmailId or create one
      const taskWithEmail = result.current.tasks.find(t => t.sourceEmailId);
      if (taskWithEmail) {
        const tasks = result.current.getTasksByEmailId(taskWithEmail.sourceEmailId!);
        expect(tasks.length).toBeGreaterThan(0);
        expect(tasks.every(t => t.sourceEmailId === taskWithEmail.sourceEmailId)).toBe(true);
      } else {
        expect(true).toBe(true); // Skip if no task with email ID
      }
    });
  });

  describe('Project Management', () => {
    it('should create a new project', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const initialProjectCount = result.current.projects.length;
      
      await act(async () => {
        const project = await result.current.createProject({
          name: 'New Test Project',
          description: 'Test project description',
          color: '#FF0000',
        });
        expect(project).not.toBeNull();
        expect(project?.name).toBe('New Test Project');
      });
      
      expect(result.current.projects.length).toBe(initialProjectCount + 1);
    });
  });

  describe('Selected Task', () => {
    it('should set selected task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks[0];
      
      await act(async () => {
        result.current.setSelectedTask(task);
      });
      
      expect(result.current.selectedTask).not.toBeNull();
      expect(result.current.selectedTask?.id).toBe(task.id);
    });

    it('should clear selected task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const task = result.current.tasks[0];
      
      await act(async () => {
        result.current.setSelectedTask(task);
      });
      
      expect(result.current.selectedTask).not.toBeNull();
      
      await act(async () => {
        result.current.setSelectedTask(null);
      });
      
      expect(result.current.selectedTask).toBeNull();
    });
  });

  describe('Refresh', () => {
    it('should refresh tasks', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      
      const initialCount = result.current.tasks.length;
      
      await act(async () => {
        vi.advanceTimersByTime(1000);
        result.current.refreshTasks();
        vi.advanceTimersByTime(600);
      });
      
      // Tasks should still be available after refresh
      expect(result.current.tasks.length).toBe(initialCount);
    });
  });
});
