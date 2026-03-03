import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationSystem } from '../../src/components/NotificationSystem';
import { useNotifications } from '../../src/hooks/useNotifications';

// Mock the useNotifications hook
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: vi.fn()
}));

describe('NotificationSystem', () => {
  it('should not render when there are no notifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearNotifications: vi.fn()
    });

    const { container } = render(<NotificationSystem />);
    expect(container.firstChild).toBeNull();
  });

  it('should render notifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [
        { id: '1', type: 'success', message: 'Success message' },
        { id: '2', type: 'error', message: 'Error message' }
      ],
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearNotifications: vi.fn()
    });

    render(<NotificationSystem />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should call removeNotification when close button is clicked', () => {
    const removeNotification = vi.fn();
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [{ id: '1', type: 'success', message: 'Test message' }],
      addNotification: vi.fn(),
      removeNotification,
      clearNotifications: vi.fn()
    });

    render(<NotificationSystem />);

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(removeNotification).toHaveBeenCalledWith('1');
  });

  it('should display correct icon for each notification type', () => {
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [
        { id: '1', type: 'success', message: 'Success' },
        { id: '2', type: 'error', message: 'Error' },
        { id: '3', type: 'warning', message: 'Warning' },
        { id: '4', type: 'info', message: 'Info' }
      ],
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearNotifications: vi.fn()
    });

    render(<NotificationSystem />);

    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });
});
