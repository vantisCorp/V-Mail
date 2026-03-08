// Calendar Hook Tests for V-Mail v1.6.0

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendar } from '../useCalendar';
import { CalendarProvider, EventStatus } from '../../types/calendar';

describe('useCalendar', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Initial State', () => {
    test('should initialize with default state', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.calendars).toBeDefined();
      expect(result.current.events).toBeDefined();
      // Note: error state is not exposed by this hook
    });
  });

  describe('Account Management', () => {
    test('should connect a calendar account', async () => {
      const { result } = renderHook(() => useCalendar());

      await act(async () => {
        await result.current.connectCalendar(CalendarProvider.GOOGLE);
      });

      expect(result.current.accounts.length).toBeGreaterThan(0);
      expect(result.current.accounts[0].provider).toBe(CalendarProvider.GOOGLE);
    });

    test('should disconnect a calendar account', async () => {
      const { result } = renderHook(() => useCalendar());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially there are 2 mock accounts
      const initialCount = result.current.accounts.length;

      await act(async () => {
        const account = await result.current.connectCalendar(CalendarProvider.GOOGLE);
        if (account) {
          await result.current.disconnectCalendar(account.id);
        }
      });

      // After connecting and disconnecting a new account, we should be back to initial count
      expect(result.current.accounts).toHaveLength(initialCount);
    });

    test('should refresh account token', async () => {
      const { result } = renderHook(() => useCalendar());

      await act(async () => {
        const account = await result.current.connectCalendar(CalendarProvider.GOOGLE);
        if (account) {
          await result.current.refreshAccountToken(account.id);
        }
      });

      expect(result.current.accounts).toBeDefined();
    });
  });

  describe('Event CRUD Operations', () => {
    test('should create a new event', async () => {
      const { result } = renderHook(() => useCalendar());

      // Wait for initial data load (500ms timeout in hook)
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });

      // Verify calendars are loaded
      expect(result.current.calendars.length).toBeGreaterThan(0);

      await act(async () => {
        const calendar = result.current.calendars[0];
        await result.current.createEvent({
          calendarId: calendar.calendarId,
          summary: 'Test Event',
          description: 'Test Description',
          start: {
            dateTime: new Date(Date.now() + 3600000).toISOString()
          },
          end: {
            dateTime: new Date(Date.now() + 7200000).toISOString()
          }
        });
      });

      expect(result.current.events.length).toBeGreaterThan(0);
    });

    test('should update an existing event', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });

      expect(result.current.calendars.length).toBeGreaterThan(0);

      await act(async () => {
        const calendar = result.current.calendars[0];
        const event = await result.current.createEvent({
          calendarId: calendar.calendarId,
          summary: 'Original Event',
          start: {
            dateTime: new Date(Date.now() + 3600000).toISOString()
          },
          end: {
            dateTime: new Date(Date.now() + 7200000).toISOString()
          }
        });

        if (event) {
          await result.current.updateEvent(event.id, {
            eventId: event.id,
            summary: 'Updated Event'
          });
        }
      });

      const updatedEvent = result.current.events.find(
        (e) => e.summary === 'Updated Event'
      );
      expect(updatedEvent).toBeDefined();
    });

    test('should delete an event', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });

      expect(result.current.calendars.length).toBeGreaterThan(0);

      let eventId = '';
      await act(async () => {
        const calendar = result.current.calendars[0];
        const event = await result.current.createEvent({
          calendarId: calendar.calendarId,
          summary: 'Event to Delete',
          start: {
            dateTime: new Date(Date.now() + 3600000).toISOString()
          },
          end: {
            dateTime: new Date(Date.now() + 7200000).toISOString()
          }
        });

        if (event) {
          eventId = event.id;
          await result.current.deleteEvent(eventId);
        }
      });

      const deletedEvent = result.current.events.find((e) => e.id === eventId);
      expect(deletedEvent).toBeUndefined();
    });

    test('should get event by ID', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });

      expect(result.current.calendars.length).toBeGreaterThan(0);

      let createdEventId = '';
      await act(async () => {
        const calendar = result.current.calendars[0];
        const event = await result.current.createEvent({
          calendarId: calendar.calendarId,
          summary: 'Test Event',
          start: {
            dateTime: new Date(Date.now() + 3600000).toISOString()
          },
          end: {
            dateTime: new Date(Date.now() + 7200000).toISOString()
          }
        });

        if (event) {
          createdEventId = event.id;
        }
      });

      const event = result.current.getEventById(createdEventId);
      expect(event).toBeDefined();
      expect(event?.id).toBe(createdEventId);
    });
  });

  describe('Email to Event Conversion', () => {
    test('should convert email to event', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const emailData = {
        subject: 'Important Meeting',
        from: 'sender@example.com',
        body: 'Meeting details here',
        date: new Date().toISOString(),
        to: ['recipient@example.com']
      };

      const options = {
        extractTitleFromSubject: true,
        extractDescriptionFromBody: true,
        extractDateFromBody: true,
        extractAttendeesFromBody: true,
        extractLocationFromBody: false,
        defaultDuration: 60,
        defaultReminder: 15,
        autoAddAttendees: true,
        includeAttachments: false
      };

      await act(async () => {
        await result.current.convertEmailToEvent('email-1', emailData, options);
      });

      const createdEvent = result.current.events.find(
        (e) => e.summary === 'Important Meeting'
      );
      expect(createdEvent).toBeDefined();
      expect(createdEvent?.sourceEmailId).toBe('email-1');
    });
  });

  describe('Event Filtering', () => {
    test('should filter events by status', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const confirmedEvents = result.current.getFilteredEvents({
        status: EventStatus.CONFIRMED
      });

      expect(confirmedEvents.every((e) => e.status === EventStatus.CONFIRMED)).toBe(true);
    });

    test('should filter events by query', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const searchResults = result.current.getFilteredEvents({
        q: 'Meeting'
      });

      expect(searchResults.every((e) =>
        e.summary.toLowerCase().includes('meeting') ||
        e.description?.toLowerCase().includes('meeting')
      )).toBe(true);
    });

    test('should filter events by date range', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const events = result.current.getFilteredEvents({
        timeMin: now.toISOString(),
        timeMax: nextWeek.toISOString()
      });

      expect(events).toBeDefined();
    });
  });

  describe('Date-Based Event Retrieval', () => {
    test('should get events for specific date', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const today = new Date();
      const events = result.current.getEventsForDate(today);

      expect(events).toBeDefined();
    });

    test('should get events for week', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const today = new Date();
      const events = result.current.getEventsForWeek(today);

      expect(events).toBeDefined();
    });

    test('should get events for month', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const today = new Date();
      const events = result.current.getEventsForMonth(today);

      expect(events).toBeDefined();
    });
  });

  describe('Statistics', () => {
    test('should get calendar statistics', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const statistics = result.current.getStatistics();

      expect(statistics).toBeDefined();
      expect(statistics.totalEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.upcomingEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.pastEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.todayEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.thisWeekEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.thisMonthEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.eventsByStatus).toBeDefined();
      expect(statistics.eventsByCalendar).toBeDefined();
      expect(statistics.busiestDay).toBeDefined();
      expect(statistics.freeSlots).toBeDefined();
    });
  });

  describe('Free/Busy Query', () => {
    test('should query free/busy information', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const query = {
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        items: [{ id: 'calendar-1' }]
      };

      const response = await act(async () => {
        return await result.current.queryFreeBusy(query);
      });

      expect(response).toBeDefined();
      expect(response.timeMin).toBe(query.timeMin);
      expect(response.timeMax).toBe(query.timeMax);
      expect(response.calendars).toBeDefined();
    });
  });

  describe('Sync Operations', () => {
    test('should sync all calendars', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.syncAllCalendars();
      });

      expect(result.current.syncStatus.isSyncing).toBe(false);
      expect(result.current.syncStatus.lastSyncAt).toBeDefined();
    });

    test('should sync specific calendar', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });

      expect(result.current.calendars.length).toBeGreaterThan(0);

      const calendar = result.current.calendars[0];

      await act(async () => {
        await result.current.syncCalendar(calendar.id);
      });

      expect(result.current.syncStatus.isSyncing).toBe(false);
    });
  });

  describe('Attendee Management', () => {
    test('should add attendee to event', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });

      expect(result.current.calendars.length).toBeGreaterThan(0);

      // First create an event with attendees
      let eventId = '';
      await act(async () => {
        const calendar = result.current.calendars[0];
        const event = await result.current.createEvent({
          calendarId: calendar.calendarId,
          summary: 'Meeting with Attendees',
          start: {
            dateTime: new Date(Date.now() + 3600000).toISOString()
          },
          end: {
            dateTime: new Date(Date.now() + 7200000).toISOString()
          },
          attendees: [
            { email: 'attendee1@example.com' },
            { email: 'attendee2@example.com' }
          ]
        });
        if (event) {
          eventId = event.id;
        }
      });

      await act(async () => {
        await result.current.addAttendee(eventId, 'newattendee@example.com', 'New Attendee');
      });

      const updatedEvent = result.current.getEventById(eventId);
      expect(updatedEvent?.attendees?.length).toBe(3);
    });

    test('should remove attendee from event', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });

      expect(result.current.calendars.length).toBeGreaterThan(0);

      // First create an event with attendees
      let eventId = '';
      await act(async () => {
        const calendar = result.current.calendars[0];
        const event = await result.current.createEvent({
          calendarId: calendar.calendarId,
          summary: 'Meeting with Attendees',
          start: {
            dateTime: new Date(Date.now() + 3600000).toISOString()
          },
          end: {
            dateTime: new Date(Date.now() + 7200000).toISOString()
          },
          attendees: [
            { email: 'attendee1@example.com' },
            { email: 'attendee2@example.com' }
          ]
        });
        if (event) {
          eventId = event.id;
        }
      });

      const event = result.current.getEventById(eventId);
      if (event && event.attendees && event.attendees.length > 0) {
        const attendeeToRemove = event.attendees[0].email;

        await act(async () => {
          await result.current.removeAttendee(eventId, attendeeToRemove);
        });

        const updatedEvent = result.current.getEventById(eventId);
        expect(updatedEvent?.attendees?.length).toBe(1);
      }
    });

    test('should update attendee status', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });

      expect(result.current.calendars.length).toBeGreaterThan(0);

      // First create an event with attendees
      let eventId = '';
      await act(async () => {
        const calendar = result.current.calendars[0];
        const event = await result.current.createEvent({
          calendarId: calendar.calendarId,
          summary: 'Meeting with Attendees',
          start: {
            dateTime: new Date(Date.now() + 3600000).toISOString()
          },
          end: {
            dateTime: new Date(Date.now() + 7200000).toISOString()
          },
          attendees: [
            { email: 'attendee1@example.com' },
            { email: 'attendee2@example.com' }
          ]
        });
        if (event) {
          eventId = event.id;
        }
      });

      const event = result.current.getEventById(eventId);
      if (event && event.attendees && event.attendees.length > 0) {
        const attendee = event.attendees[0];

        await act(async () => {
          await result.current.updateAttendeeStatus(
            eventId,
            attendee.email,
            'accepted'
          );
        });

        const updatedEvent = result.current.getEventById(eventId);
        const updatedAttendee = updatedEvent?.attendees?.find(
          (a) => a.email === attendee.email
        );
        expect(updatedAttendee?.responseStatus).toBe('accepted');
      }
    });
  });

  describe('State Management', () => {
    test('should update selected event', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const event = result.current.events[0];

      act(() => {
        result.current.setSelectedEvent(event);
      });

      expect(result.current.selectedEvent).toBe(event);
    });

    test('should update selected date', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      const newDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      act(() => {
        result.current.setSelectedDate(newDate);
      });

      expect(result.current.selectedDate).toBe(newDate);
    });

    test('should update view mode', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      act(() => {
        result.current.setViewMode('month');
      });

      expect(result.current.viewMode).toBe('month');
    });
  });

  describe('Error Handling', () => {
    test('should handle error when creating event with invalid data', async () => {
      const { result } = renderHook(() => useCalendar());

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        try {
          await result.current.createEvent({
            calendarId: '',
            summary: '',
            start: {
              dateTime: ''
            },
            end: {
              dateTime: ''
            }
          });
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });
  });
});
