import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskManagement } from '../../src/hooks/useTaskManagement';
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
  CreateTaskPayload,
  UpdateTaskPayload,
  CreateCommentPayload,
  CreateSubTaskPayload,
  CreateReminderPayload,
} from '../../src/types/taskManagement';

describe('useTaskManagement', () => {
  describe('Initialization and State', () => {
    it('should initialize with loading state and then load data', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      // Initially loading
      expect(result.current.isLoading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.tasks.length).toBeGreaterThan(0);
      expect(result.current.projects.length).toBeGreaterThan(0);
      expect(result.current.selectedTask).toBeNull();
    });
  });

  describe('Task CRUD Operations', () => {
    it('should create a new task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const initialTaskCount = result.current.tasks.length;
      
      const newTaskPayload: CreateTaskPayload = {
        title: 'Test Task',
        description: 'Test task description',
        type: TaskType.TASK,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assignedTo: ['user1'],
        assignedBy: 'admin',
        progress: 0,
      };
      
      await act(async () => {
        const createdTask = await result.current.createTask(newTaskPayload);
        expect(createdTask).not.toBeNull();
        expect(createdTask?.title).toBe(newTaskPayload.title);
        expect(createdTask?.type).toBe(newTaskPayload.type);
        expect(createdTask?.status).toBe(newTaskPayload.status);
        expect(createdTask?.priority).toBe(newTaskPayload.priority);
      });
      
      expect(result.current.tasks.length).toBe(initialTaskCount + 1);
    });

    it('should update an existing task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const taskToUpdate = result.current.tasks[0];
      
      await act(async () => {
        const updatedTask = await result.current.updateTask(taskToUpdate.id, {
          title: 'Updated Task Title',
          priority: TaskPriority.HIGH,
        });
        expect(updatedTask).not.toBeNull();
      });
      
      // Check the state after update
      const taskInState = result.current.tasks.find(t => t.id === taskToUpdate.id);
      expect(taskInState?.title).toBe('Updated Task Title');
      expect(taskInState?.priority).toBe(TaskPriority.HIGH);
    });

    it('should delete a task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const taskToDelete = result.current.tasks[0];
      const initialTaskCount = result.current.tasks.length;
      
      await act(async () => {
        const success = await result.current.deleteTask(taskToDelete.id);
        expect(success).toBe(true);
      });
      
      expect(result.current.tasks.length).toBe(initialTaskCount - 1);
      expect(result.current.tasks.find(t => t.id === taskToDelete.id)).toBeUndefined();
    });

    it('should get task by id', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const task = result.current.tasks[0];
      const foundTask = result.current.getTaskById(task.id);
      
      expect(foundTask).not.toBeNull();
      expect(foundTask?.id).toBe(task.id);
      expect(foundTask?.title).toBe(task.title);
    });

    it('should get tasks by email id', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // The mock data has a task with sourceEmailId: 'email-123'
      const emailTasks = result.current.getTasksByEmailId('email-123');
      expect(emailTasks.length).toBeGreaterThan(0);
      expect(emailTasks[0].sourceEmailId).toBe('email-123');
    });
  });

  describe('Email to Task Conversion', () => {
    it('should convert email to task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const emailId = 'test-email-456';
      const emailData = {
        subject: 'Important Meeting Request',
        from: 'john@example.com',
        to: 'admin@example.com',
        date: '2024-01-15T10:00:00Z',
        body: 'Please schedule a meeting for next week.',
      };
      
      const options = {
        extractTitleFromSubject: true,
        extractDescriptionFromBody: true,
        includeAttachments: false,
        defaultType: TaskType.FOLLOW_UP,
        defaultPriority: TaskPriority.MEDIUM,
        autoAssign: [],
      };
      
      await act(async () => {
        const task = await result.current.convertEmailToTask(emailId, emailData, options);
        expect(task).not.toBeNull();
        expect(task?.sourceEmailId).toBe(emailId);
        expect(task?.title).toBe(emailData.subject);
        expect(task?.description).toBe(emailData.body);
      });
      
      const emailTasks = result.current.getTasksByEmailId(emailId);
      expect(emailTasks.length).toBeGreaterThan(0);
    });

    it('should convert email to task without extracting body', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const emailId = 'test-email-789';
      const emailData = {
        subject: 'Quick Task',
        from: 'jane@example.com',
      };
      
      await act(async () => {
        const task = await result.current.convertEmailToTask(emailId, emailData, {
          extractTitleFromSubject: true,
          extractDescriptionFromBody: false,
          defaultType: TaskType.TASK,
          defaultPriority: TaskPriority.LOW,
          autoAssign: [],
        });
        expect(task).not.toBeNull();
        expect(task?.description).toBe('');
      });
    });
  });

  describe('Subtask Management', () => {
    it('should create a subtask', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const parentTask = result.current.tasks[0];
      const initialSubtaskCount = parentTask.subtasks.length;
      
      const subtaskPayload: CreateSubTaskPayload = {
        title: 'Test Subtask',
        status: TaskStatus.TODO,
        completed: false,
      };
      
      await act(async () => {
        const subtask = await result.current.createSubTask(
          parentTask.id,
          subtaskPayload
        );
        expect(subtask).not.toBeNull();
        expect(subtask?.title).toBe('Test Subtask');
        expect(subtask?.completed).toBe(false);
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === parentTask.id);
      expect(updatedTask?.subtasks.length).toBe(initialSubtaskCount + 1);
    });

    it('should update a subtask', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const parentTask = result.current.tasks.find(t => t.subtasks.length > 0);
      if (!parentTask) {
        // Skip if no task with subtasks
        return;
      }
      
      const subtask = parentTask.subtasks[0];
      
      await act(async () => {
        const success = await result.current.updateSubTask(
          parentTask.id,
          subtask.id,
          { title: 'Updated Subtask', completed: true }
        );
        expect(success).toBe(true);
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === parentTask.id);
      const updatedSubtask = updatedTask?.subtasks.find(st => st.id === subtask.id);
      expect(updatedSubtask?.title).toBe('Updated Subtask');
      expect(updatedSubtask?.completed).toBe(true);
    });

    it('should delete a subtask', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const parentTask = result.current.tasks.find(t => t.subtasks.length > 0);
      if (!parentTask) {
        return;
      }
      
      const subtask = parentTask.subtasks[0];
      const initialSubtaskCount = parentTask.subtasks.length;
      
      await act(async () => {
        const success = await result.current.deleteSubTask(
          parentTask.id,
          subtask.id
        );
        expect(success).toBe(true);
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === parentTask.id);
      expect(updatedTask?.subtasks.length).toBe(initialSubtaskCount - 1);
    });
  });

  describe('Comment Management', () => {
    it('should add a comment to a task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const task = result.current.tasks[0];
      const initialCommentCount = task.comments.length;
      
      const commentPayload: CreateCommentPayload = {
        content: 'This is a test comment',
        authorId: 'user1',
        authorName: 'Test User',
      };
      
      await act(async () => {
        const comment = await result.current.addComment(
          task.id,
          commentPayload
        );
        expect(comment).not.toBeNull();
        expect(comment?.content).toBe('This is a test comment');
        expect(comment?.authorId).toBe('user1');
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.comments.length).toBe(initialCommentCount + 1);
    });
  });

  describe('Checklist Management', () => {
    it('should create a checklist item', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const task = result.current.tasks[0];
      const initialChecklistCount = task.checklist.length;
      
      await act(async () => {
        const item = await result.current.createChecklistItem(
          task.id,
          'Checklist Item 1',
          initialChecklistCount
        );
        expect(item).not.toBeNull();
        expect(item?.text).toBe('Checklist Item 1');
        expect(item?.completed).toBe(false);
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.checklist.length).toBe(initialChecklistCount + 1);
    });

    it('should toggle a checklist item', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const task = result.current.tasks[0];
      
      // Create a checklist item first
      let createdItem: any;
      await act(async () => {
        createdItem = await result.current.createChecklistItem(task.id, 'Item to Toggle', 0);
        expect(createdItem).not.toBeNull();
        expect(createdItem?.completed).toBe(false);
      });
      
      if (!createdItem) {
        return;
      }
      
      // Verify the item was added to the task
      const taskWithItem = result.current.getTaskById(task.id);
      const itemInTask = taskWithItem?.checklist.find(i => i.id === createdItem.id);
      expect(itemInTask).toBeDefined();
      expect(itemInTask?.completed).toBe(false);
      
      await act(async () => {
        const success = await result.current.toggleChecklistItem(
          task.id,
          createdItem.id
        );
        expect(success).toBe(true);
      });
      
      // Re-fetch the task to get updated checklist
      const updatedTask = result.current.getTaskById(task.id);
      const updatedItem = updatedTask?.checklist.find(i => i.id === createdItem.id);
      expect(updatedItem).toBeDefined();
      // The toggle function toggles the 'completed' field
      expect(updatedItem?.completed).toBe(true);
    });

    it('should delete a checklist item', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const task = result.current.tasks[0];
      
      // Create a checklist item first
      await act(async () => {
        await result.current.createChecklistItem(task.id, 'Item to Delete', 0);
      });
      
      const taskWithItem = result.current.tasks.find(t => t.id === task.id);
      const item = taskWithItem?.checklist[taskWithItem.checklist.length - 1];
      
      if (!item) {
        return;
      }
      
      const initialChecklistCount = taskWithItem!.checklist.length;
      
      await act(async () => {
        const success = await result.current.deleteChecklistItem(task.id, item.id);
        expect(success).toBe(true);
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.checklist.length).toBe(initialChecklistCount - 1);
    });
  });

  describe('Reminder Management', () => {
    it('should create a reminder for a task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const task = result.current.tasks[0];
      const initialReminderCount = task.reminders.length;
      
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 1);
      
      const reminderPayload: CreateReminderPayload = {
        date: reminderDate.toISOString(),
        message: 'Remember to follow up',
      };
      
      await act(async () => {
        const reminder = await result.current.createReminder(
          task.id,
          reminderPayload
        );
        expect(reminder).not.toBeNull();
        expect(reminder?.date).toBe(reminderDate.toISOString());
        expect(reminder?.message).toBe('Remember to follow up');
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === task.id);
      expect(updatedTask?.reminders.length).toBe(initialReminderCount + 1);
    });
  });

  describe('Task Statistics', () => {
    it('should calculate task statistics', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const stats = result.current.getTaskStatistics();
      
      expect(stats).not.toBeNull();
      expect(stats.totalTasks).toBeGreaterThanOrEqual(0);
      expect(stats.completedTasks).toBeGreaterThanOrEqual(0);
      expect(stats.inProgressTasks).toBeGreaterThanOrEqual(0);
      expect(stats.overdueTasks).toBeGreaterThanOrEqual(0);
      expect(stats.dueThisWeek).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Filtering and Searching', () => {
    it('should filter tasks by status', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const filteredTasks = result.current.getFilteredTasks({
        status: TaskStatus.TODO,
      });
      
      expect(filteredTasks.length).toBeGreaterThanOrEqual(0);
      filteredTasks.forEach(task => {
        expect(task.status).toBe(TaskStatus.TODO);
      });
    });

    it('should filter tasks by priority', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const filteredTasks = result.current.getFilteredTasks({
        priority: TaskPriority.HIGH,
      });
      
      expect(filteredTasks.length).toBeGreaterThanOrEqual(0);
      filteredTasks.forEach(task => {
        expect(task.priority).toBe(TaskPriority.HIGH);
      });
    });

    it('should filter tasks by type', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const filteredTasks = result.current.getFilteredTasks({
        type: TaskType.TASK,
      });
      
      expect(filteredTasks.length).toBeGreaterThanOrEqual(0);
      filteredTasks.forEach(task => {
        expect(task.type).toBe(TaskType.TASK);
      });
    });

    it('should filter tasks by assigned user', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // The mock data has tasks assigned to 'user-1'
      const filteredTasks = result.current.getFilteredTasks({
        assignedTo: 'user-1',
      });
      
      expect(filteredTasks.length).toBeGreaterThanOrEqual(0);
      filteredTasks.forEach(task => {
        expect(task.assignedTo.includes('user-1')).toBe(true);
      });
    });

    it('should search tasks by term', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Search for a term that exists in mock data
      const searchTerm = 'Marketing';
      const filteredTasks = result.current.getFilteredTasks({
        search: searchTerm,
      });
      
      expect(filteredTasks.length).toBeGreaterThanOrEqual(0);
      filteredTasks.forEach(task => {
        const matchesTitle = task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDescription = task.description?.toLowerCase().includes(searchTerm.toLowerCase());
        expect(matchesTitle || matchesDescription).toBe(true);
      });
    });

    it('should filter with multiple criteria', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const filteredTasks = result.current.getFilteredTasks({
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
      });
      
      expect(filteredTasks.length).toBeGreaterThanOrEqual(0);
      filteredTasks.forEach(task => {
        expect(task.status).toBe(TaskStatus.IN_PROGRESS);
        expect(task.priority).toBe(TaskPriority.HIGH);
      });
    });
  });

  describe('Sorting Tasks', () => {
    it('should sort tasks by priority', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const sortedTasks = result.current.getSortedTasks(result.current.tasks, { field: 'priority', order: 'asc' });
      
      expect(sortedTasks.length).toBeGreaterThan(0);
      expect(Array.isArray(sortedTasks)).toBe(true);
    });

    it('should sort tasks by due date', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const sortedTasks = result.current.getSortedTasks(result.current.tasks, { field: 'dueDate', order: 'asc' });
      
      expect(sortedTasks.length).toBeGreaterThan(0);
      expect(Array.isArray(sortedTasks)).toBe(true);
    });

    it('should sort tasks by created date', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const sortedTasks = result.current.getSortedTasks(result.current.tasks, { field: 'createdAt', order: 'asc' });
      
      expect(sortedTasks.length).toBeGreaterThan(0);
      expect(Array.isArray(sortedTasks)).toBe(true);
    });

    it('should sort tasks by progress', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const sortedTasks = result.current.getSortedTasks(result.current.tasks, { field: 'progress', order: 'asc' });
      
      expect(sortedTasks.length).toBeGreaterThan(0);
      expect(Array.isArray(sortedTasks)).toBe(true);
    });
  });

  describe('Project Management', () => {
    it('should create a new project', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const initialProjectCount = result.current.projects.length;
      
      const projectData = {
        name: 'Test Project',
        description: 'Test project description',
        color: '#FF5733',
        owner: 'user1',
      };
      
      await act(async () => {
        const project = await result.current.createProject(projectData);
        expect(project).not.toBeNull();
        expect(project?.name).toBe(projectData.name);
        expect(project?.description).toBe(projectData.description);
        expect(project?.color).toBe(projectData.color);
        expect(project?.owner).toBe(projectData.owner);
      });
      
      expect(result.current.projects.length).toBe(initialProjectCount + 1);
    });
  });

  describe('Task Selection', () => {
    it('should select a task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const task = result.current.tasks[0];
      
      act(() => {
        result.current.setSelectedTask(task);
      });
      
      expect(result.current.selectedTask).not.toBeNull();
      expect(result.current.selectedTask?.id).toBe(task.id);
    });

    it('should clear selected task', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const task = result.current.tasks[0];
      
      act(() => {
        result.current.setSelectedTask(task);
      });
      
      expect(result.current.selectedTask).not.toBeNull();
      
      act(() => {
        result.current.setSelectedTask(null);
      });
      
      expect(result.current.selectedTask).toBeNull();
    });
  });

  describe('Refresh Functions', () => {
    it('should refresh tasks', async () => {
      const { result } = renderHook(() => useTaskManagement());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await act(async () => {
        await result.current.refreshTasks();
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.tasks.length).toBeGreaterThan(0);
    });
  });
});