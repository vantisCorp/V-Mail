/**
 * Task Manager Component
 * Manages tasks, subtasks, comments, and email-to-task conversion
 */

import React, { useState, useEffect } from 'react';
import { useTaskManagement } from '../hooks/useTaskManagement';
import { TaskPriority, TaskStatus, TaskType, AssignmentType, RecurrenceType } from '../types/taskManagement';
import '../styles/task-management.css';

interface TaskManagerProps {
  onTaskSelect?: (taskId: string) => void;
  emailData?: Record<string, any>;
}

const TaskManager: React.FC<TaskManagerProps> = ({ onTaskSelect, emailData }) => {
  const {
    isLoading,
    tasks,
    projects,
    selectedTask,
    setSelectedTask,
    createTask,
    updateTask,
    deleteTask,
    convertEmailToTask,
    createSubTask,
    updateSubTask,
    addComment,
    createChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    getTaskStatistics,
    getFilteredTasks,
    getSortedTasks,
    getTaskById,
    getTasksByEmailId
  } = useTaskManagement();

  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'statistics'>('tasks');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | undefined>(undefined);
  const [filterPriority, setFilterPriority] = useState<TaskPriority | undefined>(undefined);
  const [filterType, setFilterType] = useState<TaskType | undefined>(undefined);
  const [filterProject, setFilterProject] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt' | 'title' | 'progress'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const statistics = getTaskStatistics();
  const filteredTasks = getFilteredTasks({
    status: filterStatus,
    priority: filterPriority,
    type: filterType,
    projectId: filterProject,
    search: searchTerm || undefined
  });
  const sortedTasks = getSortedTasks(filteredTasks, { field: sortBy, order: sortOrder });

  const handleTaskSelect = (taskId: string) => {
    setSelectedTask(getTaskById(taskId));
    onTaskSelect?.(taskId);
  };

  const handleCreateTask = async (taskData: any) => {
    await createTask(taskData);
    setShowCreateModal(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    }
  };

  const handleConvertEmailToTask = async (options: any) => {
    if (emailData) {
      await convertEmailToTask('current-email', emailData, options);
      setShowConvertModal(false);
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string, completed: boolean) => {
    await updateSubTask(taskId, subtaskId, {
      status: completed ? TaskStatus.COMPLETED : TaskStatus.TODO,
      completed: completed,
      completedAt: completed ? new Date().toISOString() : undefined
    });
  };

  const handleToggleChecklistItem = async (taskId: string, itemId: string) => {
    await toggleChecklistItem(taskId, itemId);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus, assignedBy: 'current-user' });
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return '#EF4444';
      case TaskPriority.HIGH:
        return '#F59E0B';
      case TaskPriority.MEDIUM:
        return '#10B981';
      case TaskPriority.LOW:
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.BACKLOG:
        return '#9CA3AF';
      case TaskStatus.TODO:
        return '#6B7280';
      case TaskStatus.IN_PROGRESS:
        return '#3B82F6';
      case TaskStatus.IN_REVIEW:
        return '#F59E0B';
      case TaskStatus.COMPLETED:
        return '#10B981';
      case TaskStatus.CANCELLED:
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getTypeIcon = (type: TaskType) => {
    const icons: Record<TaskType, string> = {
      [TaskType.TASK]: '📋',
      [TaskType.BUG]: '🐛',
      [TaskType.FEATURE]: '✨',
      [TaskType.IMPROVEMENT]: '🔧',
      [TaskType.DOCUMENTATION]: '📚',
      [TaskType.SUPPORT]: '💬',
      [TaskType.MEETING]: '📅',
      [TaskType.FOLLOW_UP]: '🔄'
    };
    return icons[type] || '📋';
  };

  const TaskCard = ({ task }: { task: any }) => {
    const isSelected = selectedTask?.id === task.id;
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;

    return (
      <div
        className={`task-card ${isSelected ? 'selected' : ''} ${isOverdue ? 'overdue' : ''}`}
        onClick={() => handleTaskSelect(task.id)}
      >
        <div className="task-header">
          <div className="task-title-section">
            <span className="task-icon">{getTypeIcon(task.type)}</span>
            <h3 className="task-title">{task.title}</h3>
          </div>
          <div className="task-actions">
            <span
              className="priority-badge"
              style={{
                backgroundColor: `${getPriorityColor(task.priority)}20`,
                color: getPriorityColor(task.priority)
              }}
            >
              {task.priority}
            </span>
          </div>
        </div>

        {task.description && <p className="task-description">{task.description.substring(0, 100)}...</p>}

        <div className="task-meta">
          <div className="meta-item">
            <span className="meta-label">Status:</span>
            <span
              className="status-badge"
              style={{ backgroundColor: `${getStatusColor(task.status)}20`, color: getStatusColor(task.status) }}
            >
              {task.status.replace('_', ' ')}
            </span>
          </div>
          {task.dueDate && (
            <div className="meta-item">
              <span className="meta-label">Due:</span>
              <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}
          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="meta-item">
              <span className="meta-label">Assigned:</span>
              <span className="assignees">{task.assignedTo.length}</span>
            </div>
          )}
        </div>

        <div className="task-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${task.progress}%`, backgroundColor: getStatusColor(task.status) }}
            />
          </div>
          <span className="progress-text">{task.progress}%</span>
        </div>

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="task-subtasks">
            <span className="subtasks-count">
              {task.subtasks.filter((st: any) => st.completed).length}/{task.subtasks.length} subtasks
            </span>
          </div>
        )}

        {task.checklist && task.checklist.length > 0 && (
          <div className="task-checklist">
            <span className="checklist-count">
              {task.checklist.filter((item: any) => item.completed).length}/{task.checklist.length} checklist items
            </span>
          </div>
        )}

        <div className="task-footer">
          <div className="task-labels">
            {task.labels.slice(0, 2).map((label: string, index: number) => (
              <span key={index} className="label-tag">
                {label}
              </span>
            ))}
            {task.labels.length > 2 && <span className="label-tag">+{task.labels.length - 2}</span>}
          </div>
          <div className="task-controls">
            <button
              className="control-btn delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTask(task.id);
              }}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TaskDetail = ({ task }: { task: any }) => {
    return (
      <div className="task-detail">
        <div className="task-detail-header">
          <h2 className="task-detail-title">{task.title}</h2>
          <button className="close-btn" onClick={() => setSelectedTask(null)}>
            ✕
          </button>
        </div>

        <div className="task-detail-meta">
          <div className="detail-meta-item">
            <span className="meta-label">Type:</span>
            <span className="meta-value">
              {getTypeIcon(task.type)} {task.type}
            </span>
          </div>
          <div className="detail-meta-item">
            <span className="meta-label">Priority:</span>
            <span className="meta-value" style={{ color: getPriorityColor(task.priority) }}>
              {task.priority}
            </span>
          </div>
          <div className="detail-meta-item">
            <span className="meta-label">Status:</span>
            <span className="meta-value" style={{ color: getStatusColor(task.status) }}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {task.description && (
          <div className="task-detail-section">
            <h3>Description</h3>
            <p>{task.description}</p>
          </div>
        )}

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="task-detail-section">
            <h3>Subtasks</h3>
            <div className="subtasks-list">
              {task.subtasks.map((subtask: any) => (
                <div key={subtask.id} className="subtask-item">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={(e) => handleToggleSubtask(task.id, subtask.id, e.target.checked)}
                  />
                  <span className={`subtask-text ${subtask.completed ? 'completed' : ''}`}>{subtask.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {task.checklist && task.checklist.length > 0 && (
          <div className="task-detail-section">
            <h3>Checklist</h3>
            <div className="checklist-list">
              {task.checklist.map((item: any) => (
                <div key={item.id} className="checklist-item">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleChecklistItem(task.id, item.id)}
                  />
                  <span className={`checklist-text ${item.completed ? 'completed' : ''}`}>{item.text}</span>
                  <button className="remove-btn" onClick={() => deleteChecklistItem(task.id, item.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {task.comments && task.comments.length > 0 && (
          <div className="task-detail-section">
            <h3>Comments</h3>
            <div className="comments-list">
              {task.comments.map((comment: any) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{comment.authorName}</span>
                    <span className="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="task-detail-actions">
          <button
            className="btn btn-secondary"
            onClick={() => {
              const statuses = Object.values(TaskStatus);
              const currentIndex = statuses.indexOf(task.status);
              const nextStatus = statuses[(currentIndex + 1) % statuses.length];
              handleStatusChange(task.id, nextStatus);
            }}
          >
            Change Status
          </button>
        </div>
      </div>
    );
  };

  const ProjectCard = ({ project }: { project: any }) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);

    return (
      <div className="project-card">
        <div className="project-header">
          <div className="project-icon" style={{ backgroundColor: `${project.color}20`, color: project.color }}>
            {project.icon}
          </div>
          <div className="project-info">
            <h3 className="project-name">{project.name}</h3>
            <span className="project-count">{projectTasks.length} tasks</span>
          </div>
        </div>
        {project.description && <p className="project-description">{project.description}</p>}
      </div>
    );
  };

  const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className="stat-card" style={{ borderColor: `${color}40` }}>
      <span className="stat-value" style={{ color }}>
        {value}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="task-manager loading">
        <div className="spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="task-manager">
      <div className="task-manager-header">
        <h1>📋 Task Management</h1>
        <div className="header-actions">
          {emailData && (
            <button className="btn btn-primary" onClick={() => setShowConvertModal(true)}>
              📧 Convert Email to Task
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Create Task
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          📋 Tasks ({tasks.length})
        </button>
        <button className={`tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
          📁 Projects ({projects.length})
        </button>
        <button
          className={`tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          📊 Statistics
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | undefined)}
        >
          <option value="">All Statuses</option>
          <option value={TaskStatus.BACKLOG}>Backlog</option>
          <option value={TaskStatus.TODO}>To Do</option>
          <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
          <option value={TaskStatus.IN_REVIEW}>In Review</option>
          <option value={TaskStatus.COMPLETED}>Completed</option>
          <option value={TaskStatus.CANCELLED}>Cancelled</option>
        </select>
        <select
          className="filter-select"
          value={filterPriority || ''}
          onChange={(e) => setFilterPriority(e.target.value as TaskPriority | undefined)}
        >
          <option value="">All Priorities</option>
          <option value={TaskPriority.URGENT}>Urgent</option>
          <option value={TaskPriority.HIGH}>High</option>
          <option value={TaskPriority.MEDIUM}>Medium</option>
          <option value={TaskPriority.LOW}>Low</option>
        </select>
        <select
          className="filter-select"
          value={filterType || ''}
          onChange={(e) => setFilterType(e.target.value as TaskType | undefined)}
        >
          <option value="">All Types</option>
          <option value={TaskType.TASK}>Task</option>
          <option value={TaskType.BUG}>Bug</option>
          <option value={TaskType.FEATURE}>Feature</option>
          <option value={TaskType.IMPROVEMENT}>Improvement</option>
          <option value={TaskType.DOCUMENTATION}>Documentation</option>
          <option value={TaskType.SUPPORT}>Support</option>
          <option value={TaskType.MEETING}>Meeting</option>
          <option value={TaskType.FOLLOW_UP}>Follow Up</option>
        </select>
        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="dueDate">Sort by Due Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="createdAt">Sort by Created</option>
          <option value="title">Sort by Title</option>
          <option value="progress">Sort by Progress</option>
        </select>
        <button className="sort-toggle" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
          {sortOrder === 'asc' ? '⬆️' : '⬇️'}
        </button>
      </div>

      <div className="content">
        <div className="main-content">
          {activeTab === 'tasks' && (
            <div className="tasks-grid">
              {sortedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {sortedTasks.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>No tasks found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="projects-grid">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="statistics-grid">
              <StatCard label="Total Tasks" value={statistics.totalTasks} color="#3B82F6" />
              <StatCard label="Completed" value={statistics.completedTasks} color="#10B981" />
              <StatCard label="In Progress" value={statistics.inProgressTasks} color="#F59E0B" />
              <StatCard label="Overdue" value={statistics.overdueTasks} color="#EF4444" />
              <StatCard label="Due This Week" value={statistics.dueThisWeek} color="#8B5CF6" />
            </div>
          )}
        </div>

        {selectedTask && (
          <div className="task-detail-panel">
            <TaskDetail task={selectedTask} />
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create Task</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Task creation form will be implemented here</p>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showConvertModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Convert Email to Task</h2>
              <button className="close-btn" onClick={() => setShowConvertModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Email to task conversion form will be implemented here</p>
              <button className="btn btn-secondary" onClick={() => setShowConvertModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
