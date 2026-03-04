import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCalendar } from '../../src/hooks/useCalendar';
import {
  CalendarProvider,
  EventStatus,
  EventVisibility,
  RecurrenceFrequency,
  CreateEventPayload,
  UpdateEventPayload,
  CalendarEvent,
  CalendarAccount,
} from '../../src/types/calendar';

describe('useCalendar', () => {
  describe('Initialization and State', () => {
    it('should initialize with loading state and then load data', async () => {
      const { result } = renderHook(() => useCalendar());
      
      expect(result.current.isLoading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.accounts.length).toBeGreaterThan(0);
      expect(result.current.calendars.length).toBeGreaterThan(0);
      expect(result.current.events.length).toBeGreaterThan(0);
      expect(result.current.selectedEvent).toBeNull();
    });
  });

  describe('Account Management', () => {
    it('should connect a new calendar account', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const initialAccountCount = result.current.accounts.length;
      
      await act(async () => {
        const account = await result.current.connectCalendar(CalendarProvider.GOOGLE);
        expect(account).not.toBeNull();
        expect(account?.provider).toBe(CalendarProvider.GOOGLE);
        expect(account?.isActive).toBe(true);
      });
      
      expect(result.current.accounts.length).toBe(initialAccountCount + 1);
    });

    it('should disconnect a calendar account', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const accountToDisconnect = result.current.accounts[0];
      const initialAccountCount = result.current.accounts.length;
      
      await act(async () => {
        const success = await result.current.disconnectCalendar(accountToDisconnect.id);
        expect(success).toBe(true);
      });
      
      expect(result.current.accounts.length).toBe(initialAccountCount - 1);
      expect(result.current.accounts.find(a => a.id === accountToDisconnect.id)).toBeUndefined();
    });

    it('should refresh account token', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const account = result.current.accounts[0];
      const originalExpiresAt = account.expiresAt;
      
      await act(async () => {
        const success = await result.current.refreshAccountToken(account.id);
        expect(success).toBe(true);
      });
      
      const updatedAccount = result.current.accounts.find(a => a.id === account.id);
      expect(updatedAccount?.expiresAt).not.toBe(originalExpiresAt);
    });
  });

  describe('Event CRUD Operations', () => {
    it('should create a new event', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const initialEventCount = result.current.events.length;
      const calendar = result.current.calendars.find(c => c.primary);
      
      const payload: CreateEventPayload = {
        calendarId: calendar?.calendarId || 'primary',
        summary: 'Test Event',
        description: 'Test event description',
        location: 'Test Location',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString(),
          timeZone: 'America/New_York',
        },
        reminders: { useDefault: true },
      };
      
      await act(async () => {
        const event = await result.current.createEvent(payload);
        expect(event).not.toBeNull();
        expect(event?.summary).toBe(payload.summary);
        expect(event?.location).toBe(payload.location);
      });
      
      expect(result.current.events.length).toBe(initialEventCount + 1);
    });

    it('should update an existing event', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const eventToUpdate = result.current.events[0];
      const originalSummary = eventToUpdate.summary;
      
      await act(async () => {
        await result.current.updateEvent(eventToUpdate.id, {
          summary: 'Updated Event Summary',
          status: EventStatus.TENTATIVE,
        });
      });
      
      // Wait for state to update
      await waitFor(() => {
        const eventInState = result.current.events.find(e => e.id === eventToUpdate.id);
        expect(eventInState?.summary).toBe('Updated Event Summary');
      });
      
      const eventInState = result.current.events.find(e => e.id === eventToUpdate.id);
      expect(eventInState?.summary).not.toBe(originalSummary);
    });

    it('should delete an event', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const eventToDelete = result.current.events[0];
      const initialEventCount = result.current.events.length;
      
      await act(async () => {
        const success = await result.current.deleteEvent(eventToDelete.id);
        expect(success).toBe(true);
      });
      
      expect(result.current.events.length).toBe(initialEventCount - 1);
      expect(result.current.events.find(e => e.id === eventToDelete.id)).toBeUndefined();
    });

    it('should get event by id', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const event = result.current.events[0];
      const foundEvent = result.current.getEventById(event.id);
      
      expect(foundEvent).not.toBeNull();
      expect(foundEvent?.id).toBe(event.id);
      expect(foundEvent?.summary).toBe(event.summary);
    });
  });

  describe('Email to Event Conversion', () => {
    it('should convert email to event', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const emailId = 'test-email-123';
      const emailData = {
        subject: 'Important Meeting Request',
        from: 'sender@example.com',
        date: new Date().toISOString(),
        body: 'Please schedule a meeting for tomorrow.',
        to: ['recipient@example.com'],
      };
      
      const initialEventCount = result.current.events.length;
      
      await act(async () => {
        const event = await result.current.convertEmailToEvent(emailId, emailData, {
          extractTitleFromSubject: true,
          extractDescriptionFromBody: true,
          extractDateFromBody: true,
          extractAttendeesFromBody: true,
          extractLocationFromBody: true,
          defaultDuration: 60,
          defaultReminder: 15,
          autoAddAttendees: true,
          includeAttachments: true,
        });
        expect(event).not.toBeNull();
        expect(event?.summary).toBe(emailData.subject);
        expect(event?.sourceEmailId).toBe(emailId);
        expect(event?.status).toBe(EventStatus.TENTATIVE);
      });
      
      expect(result.current.events.length).toBe(initialEventCount + 1);
    });

    it('should convert email to event without extracting attendees', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await act(async () => {
        const event = await result.current.convertEmailToEvent('email-id', {
          subject: 'Quick Meeting',
          from: 'test@example.com',
          date: new Date().toISOString(),
          body: 'Meeting details',
          to: ['recipient@example.com'],
        }, {
          extractTitleFromSubject: true,
          extractDescriptionFromBody: false,
          extractDateFromBody: false,
          extractAttendeesFromBody: false,
          extractLocationFromBody: false,
          defaultDuration: 30,
          defaultReminder: 5,
          autoAddAttendees: true,
          includeAttachments: false,
        });
        expect(event).not.toBeNull();
        // Should still have sender and recipient from autoAddAttendees
        expect(event?.attendees?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Event Filtering', () => {
    it('should filter events by time range', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const filteredEvents = result.current.getFilteredEvents({
        timeMin: now.toISOString(),
        timeMax: tomorrow.toISOString(),
      });
      
      expect(filteredEvents.length).toBeGreaterThanOrEqual(0);
      filteredEvents.forEach(event => {
        const eventStart = event.start.dateTime 
          ? new Date(event.start.dateTime)
          : new Date(event.start.date!);
        expect(eventStart >= now && eventStart <= tomorrow).toBe(true);
      });
    });

    it('should filter events by status', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const filteredEvents = result.current.getFilteredEvents({
        status: EventStatus.CONFIRMED,
      });
      
      expect(filteredEvents.length).toBeGreaterThanOrEqual(0);
      filteredEvents.forEach(event => {
        expect(event.status).toBe(EventStatus.CONFIRMED);
      });
    });

    it('should filter events by search query', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const searchTerm = 'Meeting';
      const filteredEvents = result.current.getFilteredEvents({
        q: searchTerm,
      });
      
      expect(filteredEvents.length).toBeGreaterThanOrEqual(0);
      filteredEvents.forEach(event => {
        const matchesSummary = event.summary.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDescription = event.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = event.location?.toLowerCase().includes(searchTerm.toLowerCase());
        expect(matchesSummary || matchesDescription || matchesLocation).toBe(true);
      });
    });

    it('should filter and sort events by start time', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const filteredEvents = result.current.getFilteredEvents({
        orderBy: 'startTime',
      });
      
      expect(filteredEvents.length).toBeGreaterThan(0);
      expect(Array.isArray(filteredEvents)).toBe(true);
      
      // Verify sorting
      for (let i = 1; i < filteredEvents.length; i++) {
        const prevStart = filteredEvents[i - 1].start.dateTime 
          ? new Date(filteredEvents[i - 1].start.dateTime).getTime()
          : new Date(filteredEvents[i - 1].start.date!).getTime();
        const currStart = filteredEvents[i].start.dateTime
          ? new Date(filteredEvents[i].start.dateTime).getTime()
          : new Date(filteredEvents[i].start.date!).getTime();
        expect(currStart >= prevStart).toBe(true);
      }
    });

    it('should limit filtered events', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const filteredEvents = result.current.getFilteredEvents({
        maxResults: 2,
      });
      
      expect(filteredEvents.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Event Date Retrieval', () => {
    it('should get events for a specific date', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const today = new Date();
      const eventsForToday = result.current.getEventsForDate(today);
      
      expect(eventsForToday.length).toBeGreaterThanOrEqual(0);
      eventsForToday.forEach(event => {
        const eventStart = event.start.dateTime 
          ? new Date(event.start.dateTime)
          : new Date(event.start.date!);
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        expect(eventStart >= startOfDay && eventStart < endOfDay).toBe(true);
      });
    });

    it('should get events for a specific week', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const today = new Date();
      const eventsForWeek = result.current.getEventsForWeek(today);
      
      expect(eventsForWeek.length).toBeGreaterThanOrEqual(0);
      
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      eventsForWeek.forEach(event => {
        const eventStart = event.start.dateTime 
          ? new Date(event.start.dateTime)
          : new Date(event.start.date!);
        expect(eventStart >= startOfWeek && eventStart < endOfWeek).toBe(true);
      });
    });

    it('should get events for a specific month', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const today = new Date();
      const eventsForMonth = result.current.getEventsForMonth(today);
      
      expect(eventsForMonth.length).toBeGreaterThanOrEqual(0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      eventsForMonth.forEach(event => {
        const eventStart = event.start.dateTime 
          ? new Date(event.start.dateTime)
          : new Date(event.start.date!);
        expect(eventStart >= startOfMonth && eventStart <= endOfMonth).toBe(true);
      });
    });
  });

  describe('Calendar Statistics', () => {
    it('should calculate calendar statistics', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const stats = result.current.getStatistics();
      
      expect(stats).not.toBeNull();
      expect(stats.totalEvents).toBeGreaterThanOrEqual(0);
      expect(stats.upcomingEvents).toBeGreaterThanOrEqual(0);
      expect(stats.pastEvents).toBeGreaterThanOrEqual(0);
      expect(stats.todayEvents).toBeGreaterThanOrEqual(0);
      expect(stats.thisWeekEvents).toBeGreaterThanOrEqual(0);
      expect(stats.thisMonthEvents).toBeGreaterThanOrEqual(0);
    });

    it('should calculate events by status', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const stats = result.current.getStatistics();
      
      expect(stats.eventsByStatus).toBeDefined();
      expect(stats.eventsByStatus[EventStatus.CONFIRMED]).toBeGreaterThanOrEqual(0);
      expect(stats.eventsByStatus[EventStatus.TENTATIVE]).toBeGreaterThanOrEqual(0);
      expect(stats.eventsByStatus[EventStatus.CANCELLED]).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Attendee Management', () => {
    it('should add an attendee to an event', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const event = result.current.events[0];
      const initialAttendeeCount = event.attendees?.length || 0;
      
      await act(async () => {
        const attendee = await result.current.addAttendee(
          event.id,
          'new.attendee@example.com',
          'New Attendee'
        );
        expect(attendee).not.toBeNull();
        expect(attendee?.email).toBe('new.attendee@example.com');
        expect(attendee?.responseStatus).toBe('needsAction');
      });
      
      const updatedEvent = result.current.events.find(e => e.id === event.id);
      expect(updatedEvent?.attendees?.length).toBe(initialAttendeeCount + 1);
    });

    it('should remove an attendee from an event', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const event = result.current.events.find(e => e.attendees && e.attendees.length > 0);
      if (!event) {
        return;
      }
      
      const attendeeToRemove = event.attendees[0];
      const initialAttendeeCount = event.attendees.length;
      
      await act(async () => {
        const success = await result.current.removeAttendee(event.id, attendeeToRemove.email);
        expect(success).toBe(true);
      });
      
      const updatedEvent = result.current.events.find(e => e.id === event.id);
      expect(updatedEvent?.attendees?.length).toBe(initialAttendeeCount - 1);
    });

    it('should update attendee status', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const event = result.current.events.find(e => e.attendees && e.attendees.length > 0);
      if (!event) {
        return;
      }
      
      const attendee = event.attendees[0];
      const originalStatus = attendee.responseStatus;
      
      // Update to a different status than the original
      const newStatus = originalStatus === 'accepted' ? 'declined' : 'accepted';
      
      await act(async () => {
        const success = await result.current.updateAttendeeStatus(
          event.id,
          attendee.email,
          newStatus
        );
        expect(success).toBe(true);
      });
      
      const updatedEvent = result.current.events.find(e => e.id === event.id);
      const updatedAttendee = updatedEvent?.attendees?.find(a => a.email === attendee.email);
      expect(updatedAttendee?.responseStatus).toBe(newStatus);
      expect(updatedAttendee?.responseStatus).not.toBe(originalStatus);
    });
  });

  describe('Sync Functions', () => {
    it('should sync all calendars', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const originalLastSync = result.current.syncStatus.lastSyncAt;
      
      await act(async () => {
        const success = await result.current.syncAllCalendars();
        expect(success).toBe(true);
      });
      
      expect(result.current.syncStatus.isSyncing).toBe(false);
      expect(result.current.syncStatus.syncErrors).toEqual([]);
      expect(result.current.syncStatus.lastSyncAt).not.toBe(originalLastSync);
    });

    it('should sync a specific calendar', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const calendar = result.current.calendars[0];
      
      await act(async () => {
        const success = await result.current.syncCalendar(calendar.calendarId);
        expect(success).toBe(true);
      });
    });
  });

  describe('Free/Busy Query', () => {
    it('should query free/busy information', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const now = new Date();
      const query = {
        timeMin: now.toISOString(),
        timeMax: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        items: [{ id: 'primary' }],
        timeZone: 'America/New_York',
      };
      
      await act(async () => {
        const response = await result.current.queryFreeBusy(query);
        expect(response).not.toBeNull();
        expect(response.timeMin).toBe(query.timeMin);
        expect(response.timeMax).toBe(query.timeMax);
      });
    });
  });

  describe('State Management', () => {
    it('should select an event', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const event = result.current.events[0];
      
      act(() => {
        result.current.setSelectedEvent(event);
      });
      
      expect(result.current.selectedEvent).not.toBeNull();
      expect(result.current.selectedEvent?.id).toBe(event.id);
    });

    it('should clear selected event', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const event = result.current.events[0];
      
      act(() => {
        result.current.setSelectedEvent(event);
      });
      
      expect(result.current.selectedEvent).not.toBeNull();
      
      act(() => {
        result.current.setSelectedEvent(null);
      });
      
      expect(result.current.selectedEvent).toBeNull();
    });

    it('should change selected date', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const newDate = new Date('2024-12-25');
      
      act(() => {
        result.current.setSelectedDate(newDate);
      });
      
      expect(result.current.selectedDate).toEqual(newDate);
    });

    it('should change view mode', async () => {
      const { result } = renderHook(() => useCalendar());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      act(() => {
        result.current.setViewMode('month');
      });
      
      expect(result.current.viewMode).toBe('month');
      
      act(() => {
        result.current.setViewMode('week');
      });
      
      expect(result.current.viewMode).toBe('week');
    });
  });
});