// Calendar Service Tests for V-Mail v1.6.0

import { CalendarService } from '../calendarService';
import {
  CalendarProvider,
  EventStatus,
  CalendarAccount,
  CreateEventPayload
} from '../../types/calendar';

describe('CalendarService', () => {
  let calendarService: CalendarService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Get fresh instance
    calendarService = CalendarService.getInstance();
  });

  describe('Account Management', () => {
    test('should add a new calendar account', async () => {
      const account: CalendarAccount = {
        id: 'account-1',
        provider: CalendarProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/calendar'],
        isActive: true,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await calendarService.addAccount(account);

      const accounts = calendarService.getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toEqual(account);
    });

    test('should remove a calendar account', async () => {
      const account: CalendarAccount = {
        id: 'account-1',
        provider: CalendarProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/calendar'],
        isActive: true,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await calendarService.addAccount(account);
      await calendarService.removeAccount('account-1');

      const accounts = calendarService.getAccounts();
      expect(accounts).toHaveLength(0);
    });

    test('should get account by ID', async () => {
      const account: CalendarAccount = {
        id: 'account-1',
        provider: CalendarProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/calendar'],
        isActive: true,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await calendarService.addAccount(account);
      const retrievedAccount = calendarService.getAccount('account-1');

      expect(retrievedAccount).toEqual(account);
    });

    test('should throw error when removing non-existent account', async () => {
      await expect(calendarService.removeAccount('non-existent')).rejects.toThrow('Account not found');
    });
  });

  describe('Calendar Management', () => {
    beforeEach(async () => {
      const account: CalendarAccount = {
        id: 'account-1',
        provider: CalendarProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/calendar'],
        isActive: true,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await calendarService.addAccount(account);
    });

    test('should get all calendars', () => {
      const calendars = calendarService.getCalendars();
      expect(calendars.length).toBeGreaterThan(0);
    });

    test('should get calendar by ID', async () => {
      const calendars = calendarService.getCalendars();
      const firstCalendar = calendars[0];

      if (firstCalendar) {
        const retrievedCalendar = calendarService.getCalendar(firstCalendar.id);
        expect(retrievedCalendar).toEqual(firstCalendar);
      }
    });
  });

  describe('Event Management', () => {
    beforeEach(async () => {
      const account: CalendarAccount = {
        id: 'account-1',
        provider: CalendarProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/calendar'],
        isActive: true,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await calendarService.addAccount(account);
    });

    test('should create a new event', async () => {
      const calendars = calendarService.getCalendars();
      const calendarId = calendars[0].id;

      const payload: CreateEventPayload = {
        calendarId,
        summary: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString()
        }
      };

      const event = await calendarService.createEvent(payload);

      expect(event).toBeDefined();
      expect(event.summary).toBe('Test Event');
      expect(event.description).toBe('Test Description');
      expect(event.location).toBe('Test Location');
      expect(event.status).toBe('confirmed');
    });

    test('should get events for a calendar', async () => {
      const calendars = calendarService.getCalendars();
      const calendarId = calendars[0].id;

      const payload: CreateEventPayload = {
        calendarId,
        summary: 'Test Event',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString()
        }
      };

      await calendarService.createEvent(payload);

      const events = await calendarService.getEvents(calendarId);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].summary).toBe('Test Event');
    });

    test('should update an existing event', async () => {
      const calendars = calendarService.getCalendars();
      const calendarId = calendars[0].id;

      const createPayload: CreateEventPayload = {
        calendarId,
        summary: 'Test Event',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString()
        }
      };

      const event = await calendarService.createEvent(createPayload);

      const updatedEvent = await calendarService.updateEvent(event.id, {
        eventId: event.id,
        summary: 'Updated Event'
      });

      expect(updatedEvent.summary).toBe('Updated Event');
    });

    test('should delete an event', async () => {
      const calendars = calendarService.getCalendars();
      const calendarId = calendars[0].id;

      const payload: CreateEventPayload = {
        calendarId,
        summary: 'Test Event',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString()
        }
      };

      const event = await calendarService.createEvent(payload);
      await calendarService.deleteEvent(event.id);

      const events = await calendarService.getEvents(calendarId);
      const deletedEvent = events.find((e) => e.id === event.id);
      expect(deletedEvent).toBeUndefined();
    });

    test('should throw error when updating non-existent event', async () => {
      await expect(
        calendarService.updateEvent('non-existent', { eventId: 'non-existent' })
      ).rejects.toThrow('Event not found');
    });

    test('should throw error when deleting non-existent event', async () => {
      await expect(calendarService.deleteEvent('non-existent')).rejects.toThrow('Event not found');
    });
  });

  describe('Event Filtering', () => {
    beforeEach(async () => {
      const account: CalendarAccount = {
        id: 'account-1',
        provider: CalendarProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/calendar'],
        isActive: true,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await calendarService.addAccount(account);
    });

    test('should filter events by status', async () => {
      const calendars = calendarService.getCalendars();
      const calendarId = calendars[0].id;

      const payload1: CreateEventPayload = {
        calendarId,
        summary: 'Confirmed Event',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString()
        }
      };

      const payload2: CreateEventPayload = {
        calendarId,
        summary: 'Cancelled Event',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString()
        }
      };

      await calendarService.createEvent(payload1);
      const cancelledEvent = await calendarService.createEvent(payload2);
      await calendarService.updateEvent(cancelledEvent.id, {
        eventId: cancelledEvent.id,
        status: EventStatus.CANCELLED
      });

      const confirmedEvents = await calendarService.getEvents(calendarId, {
        status: EventStatus.CONFIRMED
      });

      expect(confirmedEvents.every((e) => e.status === EventStatus.CONFIRMED)).toBe(true);
    });

    test('should filter events by query', async () => {
      const calendars = calendarService.getCalendars();
      const calendarId = calendars[0].id;

      const payload1: CreateEventPayload = {
        calendarId,
        summary: 'Meeting with Team',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString()
        }
      };

      const payload2: CreateEventPayload = {
        calendarId,
        summary: 'Lunch with Client',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString()
        }
      };

      await calendarService.createEvent(payload1);
      await calendarService.createEvent(payload2);

      const events = await calendarService.getEvents(calendarId, {
        q: 'Meeting'
      });

      expect(events.every((e) => e.summary.includes('Meeting'))).toBe(true);
    });

    test('should filter events by date range', async () => {
      const calendars = calendarService.getCalendars();
      const calendarId = calendars[0].id;

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const payload: CreateEventPayload = {
        calendarId,
        summary: 'Future Event',
        start: {
          dateTime: tomorrow.toISOString()
        },
        end: {
          dateTime: new Date(tomorrow.getTime() + 3600000).toISOString()
        }
      };

      await calendarService.createEvent(payload);

      const events = await calendarService.getEvents(calendarId, {
        timeMin: now.toISOString(),
        timeMax: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
      });

      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      const account: CalendarAccount = {
        id: 'account-1',
        provider: CalendarProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/calendar'],
        isActive: true,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await calendarService.addAccount(account);
    });

    test('should get calendar statistics', async () => {
      const statistics = await calendarService.getStatistics();

      expect(statistics).toBeDefined();
      expect(statistics.totalEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.upcomingEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.pastEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.todayEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.thisWeekEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.thisMonthEvents).toBeGreaterThanOrEqual(0);
      expect(statistics.eventsByStatus).toBeDefined();
      expect(statistics.eventsByCalendar).toBeDefined();
    });
  });

  describe('Email to Event Conversion', () => {
    beforeEach(async () => {
      const account: CalendarAccount = {
        id: 'account-1',
        provider: CalendarProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/calendar'],
        isActive: true,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await calendarService.addAccount(account);
    });

    test('should create event from email', async () => {
      const email = {
        id: 'email-1',
        subject: 'Team Meeting Tomorrow',
        from: { email: 'sender@example.com', name: 'Sender' },
        to: [{ email: 'recipient@example.com' }],
        body: 'Meeting tomorrow at 10 AM',
        textBody: 'Meeting tomorrow at 10 AM'
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

      const event = await calendarService.createEventFromEmail(email, options);

      expect(event).toBeDefined();
      expect(event.summary).toBe('Team Meeting Tomorrow');
      expect(event.sourceEmailId).toBe('email-1');
    });
  });

  describe('Integration Options', () => {
    test('should update integration options', () => {
      const newOptions = {
        syncInterval: 600000,
        autoSync: false
      };

      calendarService.updateOptions(newOptions);

      const options = calendarService.getOptions();
      expect(options.syncInterval).toBe(600000);
      expect(options.autoSync).toBe(false);
    });

    test('should get integration options', () => {
      const options = calendarService.getOptions();

      expect(options).toBeDefined();
      expect(options.enabledProviders).toBeDefined();
      expect(options.syncInterval).toBeDefined();
      expect(options.autoSync).toBeDefined();
    });
  });
});
