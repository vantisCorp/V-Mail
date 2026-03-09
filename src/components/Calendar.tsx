/**
 * Calendar Integration Component
 * Displays calendar events with views for day, week, month, and agenda
 */

import React, { useState, useMemo } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import {
  CalendarProvider,
  EventStatus,
  CalendarEvent,
  CreateEventPayload
} from '../types/calendar';

interface CalendarProps {
  onEventSelect?: (event: CalendarEvent) => void;
  emailData?: {
    subject: string;
    from: string;
    body?: string;
    date: string;
  };
}

const Calendar: React.FC<CalendarProps> = ({ onEventSelect, emailData }) => {
  const {
    isLoading,
    accounts,
    calendars,
    events,
    selectedEvent,
    selectedDate,
    viewMode,
    syncStatus,
    setSelectedEvent,
    setSelectedDate,
    setViewMode,
    connectCalendar,
    disconnectCalendar,
    createEvent,
    updateEvent: _updateEvent,
    deleteEvent,
    convertEmailToEvent,
    getEventsForDate,
    getEventsForWeek,
    getEventsForMonth,
    getStatistics,
    syncAllCalendars,
    addAttendee: _addAttendee
  } = useCalendar();
  void _updateEvent;
  void _addAttendee;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  void setShowConvertModal;
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    summary: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    allDay: false
  });

  // Get events based on view mode
  const displayedEvents = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return getEventsForDate(selectedDate);
      case 'week':
        return getEventsForWeek(selectedDate);
      case 'month':
        return getEventsForMonth(selectedDate);
      case 'agenda':
        return events.filter(e => new Date(e.start.dateTime || e.start.date!) >= new Date())
          .sort((a, b) => {
            const aStart = new Date(a.start.dateTime || a.start.date!).getTime();
            const bStart = new Date(b.start.dateTime || b.start.date!).getTime();
            return aStart - bStart;
          })
          .slice(0, 20);
      default:
        return events;
    }
  }, [viewMode, selectedDate, events, getEventsForDate, getEventsForWeek, getEventsForMonth]);

  // Get status badge color
  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case EventStatus.CONFIRMED: return 'status-confirmed';
      case EventStatus.TENTATIVE: return 'status-tentative';
      case EventStatus.CANCELLED: return 'status-cancelled';
      default: return '';
    }
  };

  // Get provider badge color
  const getProviderColor = (provider: CalendarProvider) => {
    switch (provider) {
      case CalendarProvider.GOOGLE: return '#4285F4';
      case CalendarProvider.OUTLOOK: return '#0078D4';
      case CalendarProvider.EXCHANGE: return '#0078D4';
      default: return '#666';
    }
  };

  // Format event time
  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.date) {
      return 'All day';
    }
    const start = new Date(event.start.dateTime!);
    const end = new Date(event.end.dateTime!);
    const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${startTime} - ${endTime}`;
  };

  // Handle date navigation
  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(selectedDate);

    if (direction === 'today') {
      setSelectedDate(new Date());
      return;
    }

    const amount = direction === 'next' ? 1 : -1;

    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + amount);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (amount * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + amount);
        break;
    }

    setSelectedDate(newDate);
  };

  // Handle create event
  const handleCreateEvent = async () => {
    const startDate = new Date(newEventForm.startDate);
    const [startHour, startMin] = newEventForm.startTime.split(':').map(Number);
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(newEventForm.endDate || newEventForm.startDate);
    const [endHour, endMin] = newEventForm.endTime.split(':').map(Number);
    endDate.setHours(endHour, endMin, 0, 0);

    const payload: CreateEventPayload = {
      calendarId: calendars.find(c => c.primary)?.calendarId || 'primary',
      summary: newEventForm.summary,
      description: newEventForm.description,
      location: newEventForm.location,
      start: newEventForm.allDay
        ? { date: newEventForm.startDate }
        : { dateTime: startDate.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: newEventForm.allDay
        ? { date: newEventForm.endDate || newEventForm.startDate }
        : { dateTime: endDate.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      reminders: { useDefault: true }
    };

    await createEvent(payload);
    setShowCreateModal(false);
    setNewEventForm({
      summary: '',
      description: '',
      location: '',
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '10:00',
      allDay: false
    });
  };

  // Handle convert email to event
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConvertEmail = async () => {
    if (!emailData) {
return;
}

    await convertEmailToEvent('email-id', emailData, {
      extractTitleFromSubject: true,
      extractDescriptionFromBody: true,
      extractDateFromBody: true,
      extractAttendeesFromBody: true,
      extractLocationFromBody: true,
      defaultDuration: 60,
      defaultReminder: 15,
      autoAddAttendees: true,
      includeAttachments: true
    });

    setShowConvertModal(false);
  };

  // Handle connect calendar
  const handleConnectCalendar = async (provider: CalendarProvider) => {
    await connectCalendar(provider);
    setShowConnectModal(false);
  };

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="calendar-week-view">
        <div className="week-header">
          <div className="time-column-header"></div>
          {days.map((day, i) => (
            <div
              key={i}
              className={`day-header ${day.toDateString() === new Date().toDateString() ? 'today' : ''}`}
            >
              <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="day-number">{day.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="week-body">
          <div className="time-column">
            {hours.slice(6, 22).map(hour => (
              <div key={hour} className="time-slot">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="day-column">
              {hours.slice(6, 22).map(hour => (
                <div key={hour} className="hour-cell"></div>
              ))}
              {getEventsForDate(day)
                .filter(e => e.start.dateTime)
                .map(event => {
                  const startHour = new Date(event.start.dateTime!).getHours();
                  const startMin = new Date(event.start.dateTime!).getMinutes();
                  const endHour = new Date(event.end.dateTime!).getHours();
                  const endMin = new Date(event.end.dateTime!).getMinutes();

                  const top = (startHour - 6) * 60 + startMin;
                  const height = (endHour - startHour) * 60 + (endMin - startMin);

                  return (
                    <div
                      key={event.id}
                      className="week-event"
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 30)}px`,
                        backgroundColor: getProviderColor(event.provider)
                      }}
                      onClick={() => {
                        setSelectedEvent(event);
                        onEventSelect?.(event);
                      }}
                    >
                      <div className="event-title">{event.summary}</div>
                      <div className="event-time">{formatEventTime(event)}</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    const startDay = startOfMonth.getDay();
    const totalDays = endOfMonth.getDate();

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Add days from previous month
    for (let i = 0; i < startDay; i++) {
      const day = new Date(startOfMonth);
      day.setDate(day.getDate() - (startDay - i));
      currentWeek.push(day);
    }

    // Add days from current month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      currentWeek.push(date);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add days from next month
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        const day = new Date(currentWeek[currentWeek.length - 1]);
        day.setDate(day.getDate() + 1);
        currentWeek.push(day);
      }
      weeks.push(currentWeek);
    }

    return (
      <div className="calendar-month-view">
        <div className="month-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}
        </div>
        <div className="month-body">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="week-row">
              {week.map((day, dayIndex) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={dayIndex}
                    className={`month-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="day-number">{day.getDate()}</div>
                    <div className="day-events">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="month-event"
                          style={{ borderLeftColor: getProviderColor(event.provider) }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            onEventSelect?.(event);
                          }}
                        >
                          {event.summary}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="more-events">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(selectedDate);

    return (
      <div className="calendar-day-view">
        <div className="day-header">
          <div className="day-title">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="day-body">
          <div className="time-column">
            {hours.slice(6, 22).map(hour => (
              <div key={hour} className="time-slot">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          <div className="day-content">
            {hours.slice(6, 22).map(hour => (
              <div key={hour} className="hour-cell"></div>
            ))}
            {dayEvents
              .filter(e => e.start.dateTime)
              .map(event => {
                const startHour = new Date(event.start.dateTime!).getHours();
                const startMin = new Date(event.start.dateTime!).getMinutes();
                const endHour = new Date(event.end.dateTime!).getHours();
                const endMin = new Date(event.end.dateTime!).getMinutes();

                const top = (startHour - 6) * 60 + startMin;
                const height = (endHour - startHour) * 60 + (endMin - startMin);

                return (
                  <div
                    key={event.id}
                    className="day-event"
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(height, 30)}px`,
                      backgroundColor: getProviderColor(event.provider)
                    }}
                    onClick={() => {
                      setSelectedEvent(event);
                      onEventSelect?.(event);
                    }}
                  >
                    <div className="event-title">{event.summary}</div>
                    <div className="event-time">{formatEventTime(event)}</div>
                    {event.location && <div className="event-location">📍 {event.location}</div>}
                  </div>
                );
              })}
            {dayEvents
              .filter(e => e.start.date)
              .map(event => (
                <div
                  key={event.id}
                  className="all-day-event"
                  style={{ borderLeftColor: getProviderColor(event.provider) }}
                  onClick={() => {
                    setSelectedEvent(event);
                    onEventSelect?.(event);
                  }}
                >
                  {event.summary}
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  // Render agenda view
  const renderAgendaView = () => {
    return (
      <div className="calendar-agenda-view">
        <div className="agenda-header">
          <h3>Upcoming Events</h3>
        </div>
        <div className="agenda-body">
          {displayedEvents.map(event => (
            <div
              key={event.id}
              className="agenda-event"
              onClick={() => {
                setSelectedEvent(event);
                onEventSelect?.(event);
              }}
            >
              <div className="event-date">
                <div className="date-day">
                  {event.start.dateTime
                    ? new Date(event.start.dateTime).getDate()
                    : new Date(event.start.date!).getDate()}
                </div>
                <div className="date-month">
                  {event.start.dateTime
                    ? new Date(event.start.dateTime).toLocaleDateString('en-US', { month: 'short' })
                    : new Date(event.start.date!).toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>
              <div className="event-details">
                <div className="event-summary">{event.summary}</div>
                <div className="event-time">{formatEventTime(event)}</div>
                {event.location && <div className="event-location">📍 {event.location}</div>}
                <div className="event-meta">
                  <span
                    className="provider-badge"
                    style={{ backgroundColor: getProviderColor(event.provider) }}
                  >
                    {event.provider}
                  </span>
                  <span className={`status-badge ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {displayedEvents.length === 0 && (
            <div className="no-events">No upcoming events</div>
          )}
        </div>
      </div>
    );
  };

  // Render event detail panel
  const renderEventDetail = () => {
    if (!selectedEvent) {
return null;
}

    return (
      <div className="event-detail-panel">
        <div className="detail-header">
          <h3>{selectedEvent.summary}</h3>
          <button className="close-btn" onClick={() => setSelectedEvent(null)}>×</button>
        </div>
        <div className="detail-body">
          <div className="detail-row">
            <span className="label">When:</span>
            <span className="value">{formatEventTime(selectedEvent)}</span>
          </div>
          {selectedEvent.location && (
            <div className="detail-row">
              <span className="label">Where:</span>
              <span className="value">{selectedEvent.location}</span>
            </div>
          )}
          {selectedEvent.description && (
            <div className="detail-row">
              <span className="label">Description:</span>
              <span className="value">{selectedEvent.description}</span>
            </div>
          )}
          {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
            <div className="detail-section">
              <h4>Attendees</h4>
              <div className="attendees-list">
                {selectedEvent.attendees.map((attendee, i) => (
                  <div key={i} className="attendee">
                    <span className="name">{attendee.displayName || attendee.email}</span>
                    <span className={`response ${attendee.responseStatus}`}>
                      {attendee.responseStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="detail-actions">
            <button className="btn-secondary" onClick={() => deleteEvent(selectedEvent.id)}>
              Delete
            </button>
            <button className="btn-primary">
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render connect modal
  const renderConnectModal = () => {
    if (!showConnectModal) {
return null;
}

    return (
      <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Connect Calendar</h3>
            <button className="close-btn" onClick={() => setShowConnectModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <button
              className="provider-btn google"
              onClick={() => handleConnectCalendar(CalendarProvider.GOOGLE)}
            >
              <span className="provider-icon">📅</span>
              Connect Google Calendar
            </button>
            <button
              className="provider-btn outlook"
              onClick={() => handleConnectCalendar(CalendarProvider.OUTLOOK)}
            >
              <span className="provider-icon">📅</span>
              Connect Outlook Calendar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render create modal
  const renderCreateModal = () => {
    if (!showCreateModal) {
return null;
}

    return (
      <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Create Event</h3>
            <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newEventForm.summary}
                onChange={e => setNewEventForm({ ...newEventForm, summary: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newEventForm.description}
                onChange={e => setNewEventForm({ ...newEventForm, description: e.target.value })}
                placeholder="Event description"
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={newEventForm.location}
                onChange={e => setNewEventForm({ ...newEventForm, location: e.target.value })}
                placeholder="Event location"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={newEventForm.startDate}
                  onChange={e => setNewEventForm({ ...newEventForm, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={newEventForm.startTime}
                  onChange={e => setNewEventForm({ ...newEventForm, startTime: e.target.value })}
                  disabled={newEventForm.allDay}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={newEventForm.endDate}
                  onChange={e => setNewEventForm({ ...newEventForm, endDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={newEventForm.endTime}
                  onChange={e => setNewEventForm({ ...newEventForm, endTime: e.target.value })}
                  disabled={newEventForm.allDay}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newEventForm.allDay}
                  onChange={e => setNewEventForm({ ...newEventForm, allDay: e.target.checked })}
                />
                All day event
              </label>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateEvent}>
                Create Event
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Statistics
  const stats = getStatistics();

  if (isLoading) {
    return (
      <div className="calendar-loading">
        <div className="spinner"></div>
        <p>Loading calendars...</p>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-left">
          <h2>📅 Calendar</h2>
          <div className="sync-status">
            {syncStatus.isSyncing ? (
              <span className="syncing">Syncing...</span>
            ) : (
              <span className="synced">Last synced: {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {emailData && (
            <button className="btn-secondary" onClick={() => setShowConvertModal(true)}>
              📧 Convert Email to Event
            </button>
          )}
          <button className="btn-secondary" onClick={() => setShowConnectModal(true)}>
            ➕ Connect Calendar
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ New Event
          </button>
          <button className="btn-secondary" onClick={syncAllCalendars}>
            🔄 Sync
          </button>
        </div>
      </div>

      {/* Calendar Accounts */}
      <div className="calendar-accounts">
        {accounts.map(account => (
          <div key={account.id} className="account-chip">
            <span
              className="provider-icon"
              style={{ backgroundColor: getProviderColor(account.provider) }}
            >
              {account.provider === CalendarProvider.GOOGLE ? 'G' : 'O'}
            </span>
            <span className="account-email">{account.email}</span>
            <button
              className="disconnect-btn"
              onClick={() => disconnectCalendar(account.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="calendar-nav">
        <div className="nav-left">
          <button className="nav-btn" onClick={() => navigateDate('prev')}>◀</button>
          <button className="nav-btn today" onClick={() => navigateDate('today')}>Today</button>
          <button className="nav-btn" onClick={() => navigateDate('next')}>▶</button>
          <span className="current-period">
            {viewMode === 'month'
              ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="nav-right">
          <div className="view-toggle">
            {(['day', 'week', 'month', 'agenda'] as const).map(mode => (
              <button
                key={mode}
                className={`view-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="calendar-main">
        <div className="calendar-view">
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'agenda' && renderAgendaView()}
        </div>

        {/* Sidebar */}
        <div className="calendar-sidebar">
          {/* Mini Calendar */}
          <div className="mini-calendar">
            <div className="mini-header">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            {/* Mini calendar grid would go here */}
          </div>

          {/* Statistics */}
          <div className="calendar-stats">
            <h4>Statistics</h4>
            <div className="stat-item">
              <span className="stat-label">Today</span>
              <span className="stat-value">{stats.todayEvents}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">This Week</span>
              <span className="stat-value">{stats.thisWeekEvents}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">This Month</span>
              <span className="stat-value">{stats.thisMonthEvents}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Upcoming</span>
              <span className="stat-value">{stats.upcomingEvents}</span>
            </div>
          </div>

          {/* Event Detail */}
          {selectedEvent && renderEventDetail()}
        </div>
      </div>

      {/* Modals */}
      {renderConnectModal()}
      {renderCreateModal()}
    </div>
  );
};

export default Calendar;
