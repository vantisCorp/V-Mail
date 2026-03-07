/**
 * useTaskManagement Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskManagement } from '../useTaskManagement';
import {
  TaskPriority,
  TaskStatus,
  TaskType,
  AssignmentType,
  RecurrenceType,
} from '../../types/taskManagement';

// Mock timers
vi.useFakeTimers();

describe('useTaskManagement', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  describe('initial state', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useTaskManagement());
      
      expect(result.current.isLoading).toBe(true);
    });

    it('should load tasks after initialization', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.tasks.length).toBeGreaterThan(0);
    });

    it('should load projects after initialization', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.projects.length).toBeGreaterThan(0);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const initialCount = result.current.tasks.length;

      let newTask: any;
      await act(async () => {
        newTask = await result.current.createTask({
          title: 'Test Task',
          description: 'A test task',
          type: TaskType.TASK,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          assignedTo: ['user-1'],
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
          activityLog: [],
        });
      });

      expect(newTask).toBeDefined();
      expect(newTask.title).toBe('Test Task');
      expect(result.current.tasks.length).toBe(initialCount + 1);
    });

    it('should add activity log entry on creation', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      let newTask: any;
      await act(async () => {
        newTask = await result.current.createTask({
          title: 'Activity Test',
          description: 'Test',
          type: TaskType.TASK,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          assignedTo: [],
          assignedBy: 'admin',
          assignmentType: AssignmentType.SELF,
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
          activityLog: [],
        });
      });

      expect(newTask.activityLog.length).toBe(1);
      expect(newTask.activityLog[0].type).toBe('created');
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks[0];
      
      await act(async () => {
        await result.current.updateTask(task.id, {
          title: 'Updated Title',
          assignedBy: 'admin',
        });
      });

      // Verify the task was updated in the tasks array
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.title).toBe('Updated Title');
    });

    it('should add activity log for status changes', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks.find(t => t.status !== TaskStatus.COMPLETED);
      if (!task) {
        expect(true).toBe(true);
        return;
      }

      const initialLogCount = task.activityLog.length;

      await act(async () => {
        await result.current.updateTask(task.id, {
          status: TaskStatus.COMPLETED,
          assignedBy: 'admin',
        });
      });

      const updatedTask = result.current.getTaskById(task.id);
      expect(updatedTask?.activityLog.length).toBeGreaterThan(initialLogCount);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // Create a task to delete
      let newTask: any;
      await act(async () => {
        newTask = await result.current.createTask({
          title: 'To Delete',
          description: 'Will be deleted',
          type: TaskType.TASK,
          status: TaskStatus.TODO,
          priority: TaskPriority.LOW,
          assignedTo: [],
          assignedBy: 'admin',
          assignmentType: AssignmentType.SELF,
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
          activityLog: [],
        });
      });

      const initialCount = result.current.tasks.length;

      await act(async () => {
        const success = await result.current.deleteTask(newTask.id);
        expect(success).toBe(true);
      });

      expect(result.current.tasks.length).toBe(initialCount - 1);
    });
  });

  describe('convertEmailToTask', () => {
    it('should convert email to task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const emailData = {
        subject: 'Important Email',
        body: 'This is the email body content',
        attachments: [{ name: 'doc.pdf', url: 'http://example.com/doc.pdf' }],
      };

      let newTask: any;
      await act(async () => {
        newTask = await result.current.convertEmailToTask('email-123', emailData, {
          extractTitleFromSubject: true,
          extractDescriptionFromBody: true,
          includeAttachments: true,
          defaultPriority: TaskPriority.HIGH,
          defaultType: TaskType.TASK,
          createSubtasks: false,
          createChecklist: false,
        });
      });

      expect(newTask).toBeDefined();
      expect(newTask.title).toBe('Important Email');
      expect(newTask.description).toBe('This is the email body content');
      expect(newTask.sourceEmailId).toBe('email-123');
      expect(newTask.attachments.length).toBe(1);
    });

    it('should apply default due date offset', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      let newTask: any;
      await act(async () => {
        newTask = await result.current.convertEmailToTask('email-456', { subject: 'Test' }, {
          extractTitleFromSubject: true,
          extractDescriptionFromBody: false,
          includeAttachments: false,
          defaultPriority: TaskPriority.MEDIUM,
          defaultType: TaskType.TASK,
          createSubtasks: false,
          createChecklist: false,
          defaultDueDateOffset: 7,
        });
      });

      expect(newTask.dueDate).toBeDefined();
    });
  });

  describe('subtask management', () => {
    it('should create a subtask', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks[0];

      let newSubTask: any;
      await act(async () => {
        newSubTask = await result.current.createSubTask(task.id, {
          title: 'New Subtask',
          status: TaskStatus.TODO,
          completed: false,
        });
      });

      expect(newSubTask).toBeDefined();
      expect(newSubTask.title).toBe('New Subtask');
    });

    it('should update a subtask', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks.find(t => t.subtasks.length > 0);
      if (!task) {
        expect(true).toBe(true);
        return;
      }

      const subtaskId = task.subtasks[0].id;

      await act(async () => {
        const success = await result.current.updateSubTask(task.id, subtaskId, {
          completed: true,
        });
        expect(success).toBe(true);
      });
    });

    it('should delete a subtask', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks.find(t => t.subtasks.length > 0);
      if (!task) {
        expect(true).toBe(true);
        return;
      }

      const subtaskId = task.subtasks[0].id;
      const initialCount = task.subtasks.length;

      await act(async () => {
        const success = await result.current.deleteSubTask(task.id, subtaskId);
        expect(success).toBe(true);
      });

      const updatedTask = result.current.getTaskById(task.id);
      expect(updatedTask?.subtasks.length).toBe(initialCount - 1);
    });
  });

  describe('comment management', () => {
    it('should add a comment', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks[0];
      const initialCommentCount = task.comments.length;

      let newComment: any;
      await act(async () => {
        newComment = await result.current.addComment(task.id, {
          content: 'Test comment',
          authorId: 'user-1',
          authorName: 'Test User',
          mentions: [],
          attachments: [],
        });
      });

      expect(newComment).toBeDefined();
      expect(newComment.content).toBe('Test comment');

      const updatedTask = result.current.getTaskById(task.id);
      expect(updatedTask?.comments.length).toBe(initialCommentCount + 1);
    });

    it('should add activity log entry for comment', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks[0];
      const initialLogCount = task.activityLog.length;

      await act(async () => {
        await result.current.addComment(task.id, {
          content: 'Another comment',
          authorId: 'user-1',
          authorName: 'Test User',
          mentions: [],
          attachments: [],
        });
      });

      const updatedTask = result.current.getTaskById(task.id);
      const commentLog = updatedTask?.activityLog.find(log => log.type === 'comment_added');
      expect(commentLog).toBeDefined();
    });
  });

  describe('checklist management', () => {
    it('should create a checklist item', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks[0];

      let newItem: any;
      await act(async () => {
        newItem = await result.current.createChecklistItem(task.id, 'Check this', 1);
      });

      expect(newItem).toBeDefined();
      expect(newItem.text).toBe('Check this');
      expect(newItem.completed).toBe(false);
    });

    it('should toggle a checklist item', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks.find(t => t.checklist.length > 0);
      if (!task) {
        expect(true).toBe(true);
        return;
      }

      const itemId = task.checklist[0].id;
      const initialState = task.checklist[0].completed;

      await act(async () => {
        const success = await result.current.toggleChecklistItem(task.id, itemId);
        expect(success).toBe(true);
      });

      const updatedTask = result.current.getTaskById(task.id);
      const item = updatedTask?.checklist.find(i => i.id === itemId);
      expect(item?.completed).toBe(!initialState);
    });

    it('should delete a checklist item', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks.find(t => t.checklist.length > 0);
      if (!task) {
        expect(true).toBe(true);
        return;
      }

      const itemId = task.checklist[0].id;
      const initialCount = task.checklist.length;

      await act(async () => {
        const success = await result.current.deleteChecklistItem(task.id, itemId);
        expect(success).toBe(true);
      });

      const updatedTask = result.current.getTaskById(task.id);
      expect(updatedTask?.checklist.length).toBe(initialCount - 1);
    });
  });

  describe('reminder management', () => {
    it('should create a reminder', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks[0];

      let newReminder: any;
      await act(async () => {
        newReminder = await result.current.createReminder(task.id, {
          type: 'email',
          reminderTime: new Date().toISOString(),
          message: 'Task due soon',
        });
      });

      expect(newReminder).toBeDefined();
      expect(newReminder.type).toBe('email');
      expect(newReminder.sent).toBe(false);
    });
  });

  describe('getTaskStatistics', () => {
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
      const completedFromStatus = stats.tasksByStatus[TaskStatus.COMPLETED] || 0;

      expect(stats.completedTasks).toBe(completedFromStatus);
    });
  });

  describe('getFilteredTasks', () => {
    it('should filter by status', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const filtered = result.current.getFilteredTasks({
        status: TaskStatus.TODO,
      });

      expect(filtered.every(t => t.status === TaskStatus.TODO)).toBe(true);
    });

    it('should filter by priority', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const filtered = result.current.getFilteredTasks({
        priority: TaskPriority.HIGH,
      });

      expect(filtered.every(t => t.priority === TaskPriority.HIGH)).toBe(true);
    });

    it('should filter by type', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const filtered = result.current.getFilteredTasks({
        type: TaskType.BUG,
      });

      expect(filtered.every(t => t.type === TaskType.BUG)).toBe(true);
    });

    it('should filter by search query', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const filtered = result.current.getFilteredTasks({
        search: 'Marketing',
      });

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some(t => 
        t.title.toLowerCase().includes('marketing') || 
        t.description?.toLowerCase().includes('marketing')
      )).toBe(true);
    });

    it('should filter by project', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const project = result.current.projects[0];
      const filtered = result.current.getFilteredTasks({
        projectId: project.id,
      });

      expect(filtered.every(t => t.projectId === project.id)).toBe(true);
    });
  });

  describe('getSortedTasks', () => {
    it('should sort by title ascending', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const sorted = result.current.getSortedTasks(result.current.tasks, {
        field: 'title',
        order: 'asc',
      });

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].title.toLowerCase() >= sorted[i-1].title.toLowerCase()).toBe(true);
      }
    });

    it('should sort by priority descending', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const sorted = result.current.getSortedTasks(result.current.tasks, {
        field: 'priority',
        order: 'desc',
      });

      const priorityOrder = [TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW];
      
      for (let i = 1; i < sorted.length; i++) {
        const prevPriority = priorityOrder.indexOf(sorted[i-1].priority);
        const currPriority = priorityOrder.indexOf(sorted[i].priority);
        expect(prevPriority >= currPriority).toBe(true);
      }
    });
  });

  describe('utility functions', () => {
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

      const found = result.current.getTaskById('non-existent');
      expect(found).toBeNull();
    });

    it('should get tasks by email ID', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const tasks = result.current.getTasksByEmailId('email-123');
      expect(tasks.every(t => t.sourceEmailId === 'email-123')).toBe(true);
    });
  });

  describe('project management', () => {
    it('should create a new project', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const initialCount = result.current.projects.length;

      let newProject: any;
      await act(async () => {
        newProject = await result.current.createProject({
          name: 'Test Project',
          description: 'A test project',
          color: '#FF0000',
          icon: '📁',
        });
      });

      expect(newProject).toBeDefined();
      expect(newProject.name).toBe('Test Project');
      expect(result.current.projects.length).toBe(initialCount + 1);
    });
  });

  describe('selectedTask', () => {
    it('should set selected task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks[0];

      act(() => {
        result.current.setSelectedTask(task);
      });

      expect(result.current.selectedTask).toBeDefined();
      expect(result.current.selectedTask?.id).toBe(task.id);
    });

    it('should clear selected task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const task = result.current.tasks[0];

      act(() => {
        result.current.setSelectedTask(task);
      });

      expect(result.current.selectedTask).toBeDefined();

      act(() => {
        result.current.setSelectedTask(null);
      });

      expect(result.current.selectedTask).toBeNull();
    });
  });

  describe('refreshTasks', () => {
    it('should refresh tasks', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      await act(async () => {
        result.current.refreshTasks();
        vi.advanceTimersByTime(600);
      });

      expect(result.current.tasks.length).toBeGreaterThan(0);
    });
  });
});