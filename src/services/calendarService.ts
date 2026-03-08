// Calendar Service for V-Mail v1.6.0
// Handles calendar operations, event management, and provider integration

import {
  Calendar,
  CalendarEvent,
  CalendarAccount,
  EventFilterOptions,
  CreateEventPayload,
  UpdateEventPayload,
  EmailToEventOptions,
  CalendarStatistics,
  FreeBusyQuery,
  FreeBusyResponse,
  CalendarSyncStatus,
  CalendarIntegrationOptions,
  CalendarProvider,
  EventStatus,
  EventVisibility
} from '../types/calendar';

/**
 * Main calendar service class
 */
export class CalendarService {
  private static instance: CalendarService;
  private accounts: Map<string, CalendarAccount> = new Map();
  private calendars: Map<string, Calendar> = new Map();
  private events: Map<string, CalendarEvent[]> = new Map();
  private syncStatus: Map<string, CalendarSyncStatus> = new Map();
  private options: CalendarIntegrationOptions;

  private constructor() {
    this.options = {
      enabledProviders: [CalendarProvider.GOOGLE, CalendarProvider.OUTLOOK],
      syncInterval: 300000, // 5 minutes
      autoSync: true,
      syncOnStartup: true,
      backgroundSync: true,
      notifyOnNewEvents: true,
      notifyOnEventUpdates: true,
      notifyOnEventReminders: true
    };
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  /**
   * Load calendar data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const accounts = localStorage.getItem('vmail_calendar_accounts');
      if (accounts) {
        const parsedAccounts = JSON.parse(accounts);
        parsedAccounts.forEach((account: CalendarAccount) => {
          this.accounts.set(account.id, account);
        });
      }

      const calendars = localStorage.getItem('vmail_calendars');
      if (calendars) {
        const parsedCalendars = JSON.parse(calendars);
        parsedCalendars.forEach((calendar: Calendar) => {
          this.calendars.set(calendar.id, calendar);
        });
      }

      const events = localStorage.getItem('vmail_calendar_events');
      if (events) {
        this.events = JSON.parse(events);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  }

  /**
   * Save calendar data to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(
        'vmail_calendar_accounts',
        JSON.stringify(Array.from(this.accounts.values()))
      );
      localStorage.setItem(
        'vmail_calendars',
        JSON.stringify(Array.from(this.calendars.values()))
      );
      localStorage.setItem(
        'vmail_calendar_events',
        JSON.stringify(Object.fromEntries(this.events))
      );
    } catch (error) {
      console.error('Error saving calendar data:', error);
    }
  }

  /**
   * Get all connected accounts
   */
  public getAccounts(): CalendarAccount[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get account by ID
   */
  public getAccount(accountId: string): CalendarAccount | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * Add calendar account
   */
  public async addAccount(account: CalendarAccount): Promise<void> {
    this.accounts.set(account.id, account);
    this.saveToStorage();

    // Load calendars for this account
    await this.loadCalendarsForAccount(account.id);
  }

  /**
   * Remove calendar account
   */
  public async removeAccount(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Remove all calendars for this account
    const calendarsToRemove = Array.from(this.calendars.values()).filter(
      (cal) => cal.accountId === accountId
    );

    calendarsToRemove.forEach((calendar) => {
      this.calendars.delete(calendar.id);
      this.events.delete(calendar.id);
    });

    this.accounts.delete(accountId);
    this.saveToStorage();
  }

  /**
   * Get all calendars
   */
  public getCalendars(): Calendar[] {
    return Array.from(this.calendars.values());
  }

  /**
   * Get calendar by ID
   */
  public getCalendar(calendarId: string): Calendar | undefined {
    return this.calendars.get(calendarId);
  }

  /**
   * Load calendars for an account
   */
  private async loadCalendarsForAccount(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // This would call the actual provider API
    // For now, we'll simulate loading calendars
    const calendars = await this.fetchCalendarsFromProvider(account);

    calendars.forEach((calendar) => {
      this.calendars.set(calendar.id, calendar);
    });

    this.saveToStorage();
  }

  /**
   * Fetch calendars from provider (simulated)
   */
  private async fetchCalendarsFromProvider(
    account: CalendarAccount
  ): Promise<Calendar[]> {
    // This would make actual API calls to Google Calendar or Microsoft Graph
    // For demonstration, we'll return mock data

    if (account.provider === CalendarProvider.GOOGLE) {
      return [
        {
          id: `${account.id}_primary`,
          provider: account.provider,
          accountId: account.id,
          calendarId: 'primary',
          name: `${account.displayName || account.email}'s Calendar`,
          description: 'Primary calendar',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          primary: true,
          selected: true,
          hidden: false,
          color: '#3788d8',
          accessRole: 'owner'
        }
      ];
    }

    return [];
  }

  /**
   * Get events for a calendar
   */
  public async getEvents(
    calendarId: string,
    filters?: EventFilterOptions
  ): Promise<CalendarEvent[]> {
    let events = this.events.get(calendarId) || [];

    // Apply filters
    if (filters) {
      if (filters.timeMin) {
        events = events.filter(
          (event) =>
            event.start.dateTime! >= filters.timeMin! ||
            event.start.date! >= filters.timeMin!
        );
      }

      if (filters.timeMax) {
        events = events.filter(
          (event) =>
            event.end.dateTime! <= filters.timeMax! ||
            event.end.date! <= filters.timeMax!
        );
      }

      if (filters.status) {
        events = events.filter((event) => event.status === filters.status);
      }

      if (filters.q) {
        const query = filters.q.toLowerCase();
        events = events.filter(
          (event) =>
            event.summary.toLowerCase().includes(query) ||
            event.description?.toLowerCase().includes(query) ||
            event.location?.toLowerCase().includes(query)
        );
      }
    }

    return events;
  }

  /**
   * Create a new event
   */
  public async createEvent(
    payload: CreateEventPayload
  ): Promise<CalendarEvent> {
    const calendar = this.calendars.get(payload.calendarId);
    if (!calendar) {
      throw new Error('Calendar not found');
    }

    const account = this.accounts.get(calendar.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Create event object
    const event: CalendarEvent = {
      id: this.generateEventId(),
      provider: account.provider,
      providerEventId: '',
      summary: payload.summary,
      description: payload.description,
      location: payload.location,
      status: EventStatus.CONFIRMED,
      visibility: payload.visibility || EventVisibility.DEFAULT,
      start: payload.start,
      end: payload.end,
      recurrence: payload.recurrence,
      attendees: payload.attendees?.map((attendee) => ({
        email: attendee.email,
        displayName: attendee.displayName,
        responseStatus: 'needsAction',
        optional: false,
        isSelf: false
      })),
      reminders: payload.reminders?.overrides?.map((reminder) => ({
        method: reminder.method,
        minutes: reminder.minutes
      })),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      colorId: payload.colorId,
      conferenceData: payload.conferenceData
    };

    // Add to events map
    const calendarEvents = this.events.get(payload.calendarId) || [];
    calendarEvents.push(event);
    this.events.set(payload.calendarId, calendarEvents);

    this.saveToStorage();

    return event;
  }

  /**
   * Update an existing event
   */
  public async updateEvent(
    eventId: string,
    payload: UpdateEventPayload
  ): Promise<CalendarEvent> {
    // Find event in all calendars
    for (const [calendarId, events] of this.events.entries()) {
      const eventIndex = events.findIndex((e) => e.id === eventId);
      if (eventIndex !== -1) {
        const event = events[eventIndex];

        // Update event fields
        if (payload.summary) {
event.summary = payload.summary;
}
        if (payload.description) {
event.description = payload.description;
}
        if (payload.location) {
event.location = payload.location;
}
        if (payload.start) {
event.start = payload.start;
}
        if (payload.end) {
event.end = payload.end;
}
        if (payload.status) {
event.status = payload.status;
}
        if (payload.attendees) {
          event.attendees = payload.attendees.map((attendee) => ({
            ...attendee,
            responseStatus: attendee.responseStatus as any || 'needsAction',
            optional: false,
            isSelf: false
          }));
        }
        if (payload.reminders) {
          event.reminders = payload.reminders.overrides?.map((reminder) => ({
            method: reminder.method,
            minutes: reminder.minutes
          }));
        }
        if (payload.visibility) {
event.visibility = payload.visibility;
}

        event.updated = new Date().toISOString();

        this.events.set(calendarId, events);
        this.saveToStorage();

        return event;
      }
    }

    throw new Error('Event not found');
  }

  /**
   * Delete an event
   */
  public async deleteEvent(eventId: string): Promise<void> {
    for (const [calendarId, events] of this.events.entries()) {
      const eventIndex = events.findIndex((e) => e.id === eventId);
      if (eventIndex !== -1) {
        events.splice(eventIndex, 1);
        this.events.set(calendarId, events);
        this.saveToStorage();
        return;
      }
    }

    throw new Error('Event not found');
  }

  /**
   * Get events for a specific date range
   */
  public async getEventsInRange(
    start: Date,
    end: Date,
    calendarIds?: string[]
  ): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];
    const calendarsToQuery = calendarIds || Array.from(this.calendars.keys());

    for (const calendarId of calendarsToQuery) {
      const calendarEvents = await this.getEvents(calendarId, {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true
      });
      events.push(...calendarEvents);
    }

    return events.sort((a, b) =>
      new Date(a.start.dateTime || a.start.date!).getTime() -
      new Date(b.start.dateTime || b.start.date!).getTime()
    );
  }

  /**
   * Create event from email
   */
  public async createEventFromEmail(
    email: any,
    options: EmailToEventOptions
  ): Promise<CalendarEvent> {
    const calendar = this.getPrimaryCalendar();
    if (!calendar) {
      throw new Error('No primary calendar found');
    }

    // Extract event details from email
    const summary = options.extractTitleFromSubject
      ? email.subject || 'Meeting'
      : 'Meeting';

    let description = '';
    if (options.extractDescriptionFromBody) {
      description = email.body || email.textBody || '';
    }

    let location = '';
    if (options.extractLocationFromBody) {
      // Simple location extraction from email body
      const locationMatch = description.match(/(?:location|where|venue|address)[:\s]+([^\n]+)/i);
      if (locationMatch) {
        location = locationMatch[1].trim();
      }
    }

    // Extract date and time from email
    const { start, end } = await this.extractDatesFromEmail(email, options);

    // Extract attendees from email
    const attendees: Array<{ email: string; displayName?: string }> = [];
    if (options.autoAddAttendees && options.extractAttendeesFromBody) {
      // Add sender as attendee
      if (email.from && email.from.email) {
        attendees.push({
          email: email.from.email,
          displayName: email.from.name
        });
      }

      // Add recipients as attendees
      if (email.to) {
        email.to.forEach((recipient: any) => {
          if (recipient.email) {
            attendees.push({
              email: recipient.email,
              displayName: recipient.name
            });
          }
        });
      }
    }

    const payload: CreateEventPayload = {
      calendarId: calendar.id,
      summary,
      description,
      location,
      start,
      end,
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: 'email',
            minutes: options.defaultReminder
          }
        ]
      }
    };

    const event = await this.createEvent(payload);

    // Link event to email
    event.sourceEmailId = email.id;

    return event;
  }

  /**
   * Extract dates from email
   */
  private async extractDatesFromEmail(
    email: any,
    options: EmailToEventOptions
  ): Promise<{ start: { dateTime: string }; end: { dateTime: string } }> {
    // Try to extract date from subject or body
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + options.defaultDuration * 60000);

    // Simple date extraction (would be more sophisticated in production)
    const dateMatch = email.body?.match(/(?:on|at|date)[:\s]+([^\n]+)/i);
    if (dateMatch && options.extractDateFromBody) {
      try {
        const extractedDate = new Date(dateMatch[1]);
        if (!isNaN(extractedDate.getTime())) {
          const endOfMeeting = new Date(
            extractedDate.getTime() + options.defaultDuration * 60000
          );
          return {
            start: { dateTime: extractedDate.toISOString() },
            end: { dateTime: endOfMeeting.toISOString() }
          };
        }
      } catch (error) {
        // Use default if extraction fails
      }
    }

    return {
      start: { dateTime: startDate.toISOString() },
      end: { dateTime: endDate.toISOString() }
    };
  }

  /**
   * Get calendar statistics
   */
  public async getStatistics(calendarId?: string): Promise<CalendarStatistics> {
    const allEvents: CalendarEvent[] = [];
    const eventsByCalendar: Record<string, number> = {};
    const eventsByStatus = {
      confirmed: 0,
      tentative: 0,
      cancelled: 0
    };

    const calendarsToQuery = calendarId
      ? [calendarId]
      : Array.from(this.calendars.keys());

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const calId of calendarsToQuery) {
      const events = this.events.get(calId) || [];
      allEvents.push(...events);

      eventsByCalendar[calId] = events.length;

      events.forEach((event) => {
        if (event.status) {
          eventsByStatus[event.status as keyof typeof eventsByStatus]++;
        }
      });
    }

    const upcomingEvents = allEvents.filter(
      (e) => new Date(e.start.dateTime || e.start.date!) > now
    );

    const todayEvents = allEvents.filter((e) => {
      const eventDate = new Date(e.start.dateTime || e.start.date!);
      return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    const thisWeekEvents = allEvents.filter((e) => {
      const eventDate = new Date(e.start.dateTime || e.start.date!);
      return eventDate >= today && eventDate < weekEnd;
    });

    const thisMonthEvents = allEvents.filter((e) => {
      const eventDate = new Date(e.start.dateTime || e.start.date!);
      return eventDate >= today && eventDate < monthEnd;
    });

    return {
      totalEvents: allEvents.length,
      upcomingEvents: upcomingEvents.length,
      pastEvents: allEvents.length - upcomingEvents.length,
      todayEvents: todayEvents.length,
      thisWeekEvents: thisWeekEvents.length,
      thisMonthEvents: thisMonthEvents.length,
      eventsByStatus,
      eventsByCalendar,
      averageEventsPerDay: allEvents.length / 30, // Approximate
      busiestDay: 'Monday', // Would calculate based on actual data
      freeSlots: [] // Would calculate based on actual data
    };
  }

  /**
   * Query free/busy information
   */
  public async queryFreeBusy(query: FreeBusyQuery): Promise<FreeBusyResponse> {
    const calendars: FreeBusyResponse['calendars'] = {};

    for (const item of query.items) {
      const events = this.events.get(item.id) || [];
      const busy = events
        .filter((e) => e.status === 'confirmed')
        .map((e) => ({
          start: e.start.dateTime || e.start.date!,
          end: e.end.dateTime || e.end.date!
        }));

      calendars[item.id] = { busy };
    }

    return {
      timeMin: query.timeMin,
      timeMax: query.timeMax,
      calendars
    };
  }

  /**
   * Sync calendar with provider
   */
  public async syncCalendar(calendarId: string): Promise<void> {
    const calendar = this.calendars.get(calendarId);
    if (!calendar) {
      throw new Error('Calendar not found');
    }

    const account = this.accounts.get(calendar.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const syncStatus: CalendarSyncStatus = {
      lastSyncAt: new Date().toISOString(),
      isSyncing: true,
      syncErrors: []
    };

    this.syncStatus.set(calendarId, syncStatus);

    try {
      // This would make actual API calls to sync with provider
      // For demonstration, we'll simulate sync

      await new Promise((resolve) => setTimeout(resolve, 1000));

      syncStatus.lastSyncAt = new Date().toISOString();
      syncStatus.isSyncing = false;
    } catch (error) {
      syncStatus.syncErrors.push({
        calendarId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      syncStatus.isSyncing = false;
    }

    this.syncStatus.set(calendarId, syncStatus);
  }

  /**
   * Get sync status for a calendar
   */
  public getSyncStatus(calendarId: string): CalendarSyncStatus | undefined {
    return this.syncStatus.get(calendarId);
  }

  /**
   * Get primary calendar
   */
  private getPrimaryCalendar(): Calendar | undefined {
    return Array.from(this.calendars.values()).find((cal) => cal.primary);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update integration options
   */
  public updateOptions(options: Partial<CalendarIntegrationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get integration options
   */
  public getOptions(): CalendarIntegrationOptions {
    return { ...this.options };
  }
}

// Export singleton instance
export const calendarService = CalendarService.getInstance();
