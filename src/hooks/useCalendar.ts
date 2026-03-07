/**
 * Calendar Integration Hook
 * Manages Google Calendar and Microsoft Outlook/Exchange integration
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  CalendarEvent,
  CalendarProvider,
  EventStatus,
  EventVisibility,
  RecurrenceFrequency,
  Calendar,
  CalendarAccount,
  CreateEventPayload,
  UpdateEventPayload,
  EventFilterOptions,
  EmailToEventOptions,
  CalendarStatistics,
  FreeBusyQuery,
  FreeBusyResponse,
  CalendarSyncStatus,
  EventAttendee,
  RecurrenceRule,
} from '../types/calendar';

// Generate unique ID
const generateId = () => `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Mock calendar accounts
const generateMockAccounts = (): CalendarAccount[] => {
  return [
    {
      id: 'account-1',
      provider: CalendarProvider.GOOGLE,
      userId: 'user-1',
      email: 'john.doe@gmail.com',
      displayName: 'John Doe',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      scopes: ['https://www.googleapis.com/auth/calendar'],
      isActive: true,
      isPrimary: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'account-2',
      provider: CalendarProvider.OUTLOOK,
      userId: 'user-1',
      email: 'john.doe@outlook.com',
      displayName: 'John Doe',
      accessToken: 'mock-outlook-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      scopes: ['Calendars.ReadWrite'],
      isActive: true,
      isPrimary: false,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
  ];
};

// Mock calendars
const generateMockCalendars = (): Calendar[] => {
  return [
    {
      id: 'calendar-1',
      provider: CalendarProvider.GOOGLE,
      accountId: 'account-1',
      calendarId: 'primary',
      name: 'Primary Calendar',
      description: 'My primary calendar',
      timezone: 'America/New_York',
      primary: true,
      selected: true,
      hidden: false,
      color: '#4285F4',
      backgroundColor: '#4285F4',
      foregroundColor: '#ffffff',
      accessRole: 'owner',
    },
    {
      id: 'calendar-2',
      provider: CalendarProvider.GOOGLE,
      accountId: 'account-1',
      calendarId: 'work@group.calendar.google.com',
      name: 'Work Calendar',
      description: 'Work-related events',
      timezone: 'America/New_York',
      primary: false,
      selected: true,
      hidden: false,
      color: '#EA4335',
      backgroundColor: '#EA4335',
      foregroundColor: '#ffffff',
      accessRole: 'writer',
    },
    {
      id: 'calendar-3',
      provider: CalendarProvider.OUTLOOK,
      accountId: 'account-2',
      calendarId: 'AAMkAGI2T...',
      name: 'Calendar',
      timezone: 'America/New_York',
      primary: true,
      selected: true,
      hidden: false,
      color: '#0078D4',
      backgroundColor: '#0078D4',
      foregroundColor: '#ffffff',
      accessRole: 'owner',
    },
  ];
};

// Mock events
const generateMockEvents = (): CalendarEvent[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return [
    {
      id: 'event-1',
      provider: CalendarProvider.GOOGLE,
      providerEventId: 'google-event-123',
      summary: 'Team Stand-up Meeting',
      description: 'Daily stand-up meeting for the development team',
      location: 'Google Meet',
      status: EventStatus.CONFIRMED,
      visibility: EventVisibility.DEFAULT,
      start: {
        dateTime: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: 'team@company.com', displayName: 'Team', responseStatus: 'accepted' },
        { email: 'user@example.com', displayName: 'User', responseStatus: 'accepted' },
      ],
      reminders: [
        { method: 'popup', minutes: 10 },
      ],
      created: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      creator: { email: 'john.doe@gmail.com', displayName: 'John Doe' },
      organizer: { email: 'john.doe@gmail.com', displayName: 'John Doe' },
      hangoutLink: 'https://meet.google.com/abc-defg-hij',
    },
    {
      id: 'event-2',
      provider: CalendarProvider.GOOGLE,
      providerEventId: 'google-event-456',
      summary: 'Project Review',
      description: 'Review Q1 project milestones and progress',
      location: 'Conference Room A',
      status: EventStatus.CONFIRMED,
      visibility: EventVisibility.DEFAULT,
      start: {
        dateTime: new Date(today.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: new Date(today.getTime() + 15 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: 'manager@company.com', displayName: 'Manager', responseStatus: 'accepted' },
        { email: 'stakeholder@company.com', displayName: 'Stakeholder', responseStatus: 'tentative' },
      ],
      reminders: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
      created: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-3',
      provider: CalendarProvider.OUTLOOK,
      providerEventId: 'outlook-event-789',
      summary: 'Client Call',
      description: 'Quarterly review call with client',
      location: 'Microsoft Teams',
      status: EventStatus.TENTATIVE,
      visibility: EventVisibility.PRIVATE,
      start: {
        dateTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: 'client@external.com', displayName: 'Client', responseStatus: 'needsAction' },
      ],
      reminders: [
        { method: 'popup', minutes: 30 },
      ],
      created: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-4',
      provider: CalendarProvider.GOOGLE,
      providerEventId: 'google-event-101',
      summary: 'All-Day Workshop',
      description: 'Annual team building workshop',
      location: 'Off-site Venue',
      status: EventStatus.CONFIRMED,
      visibility: EventVisibility.PUBLIC,
      start: {
        date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      end: {
        date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      reminders: [
        { method: 'email', minutes: 1440 }, // 1 day before
      ],
      created: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

export const useCalendar = () => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'agenda'>('week');
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus>({
    lastSyncAt: '',
    isSyncing: false,
    syncErrors: [],
  });

  // Load mock data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setAccounts(generateMockAccounts());
      setCalendars(generateMockCalendars());
      setEvents(generateMockEvents());
      setSyncStatus({
        lastSyncAt: new Date().toISOString(),
        isSyncing: false,
        syncErrors: [],
      });
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Account Management
  const connectCalendar = useCallback(async (
    provider: CalendarProvider,
    authCode?: string
  ): Promise<CalendarAccount | null> => {
    // Mock OAuth flow
    const newAccount: CalendarAccount = {
      id: generateId(),
      provider,
      userId: 'user-1',
      email: `user@${provider === CalendarProvider.GOOGLE ? 'gmail.com' : 'outlook.com'}`,
      displayName: 'User',
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      scopes: provider === CalendarProvider.GOOGLE 
        ? ['https://www.googleapis.com/auth/calendar']
        : ['Calendars.ReadWrite'],
      isActive: true,
      isPrimary: accounts.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setAccounts(prev => [...prev, newAccount]);
    return newAccount;
  }, [accounts.length]);

  const disconnectCalendar = useCallback(async (accountId: string): Promise<boolean> => {
    setAccounts(prev => prev.filter(a => a.id !== accountId));
    setCalendars(prev => prev.filter(c => c.accountId !== accountId));
    setEvents(prev => prev.filter(e => {
      const eventAccount = accounts.find(a => a.id === accountId);
      return e.provider !== eventAccount?.provider;
    }));
    return true;
  }, [accounts]);

  const refreshAccountToken = useCallback(async (accountId: string): Promise<boolean> => {
    setAccounts(prev => prev.map(account => {
      if (account.id === accountId) {
        return {
          ...account,
          accessToken: 'new-mock-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return account;
    }));
    return true;
  }, []);

  // Event CRUD Operations
  const createEvent = useCallback(async (payload: CreateEventPayload): Promise<CalendarEvent | null> => {
    const calendar = calendars.find(c => c.calendarId === payload.calendarId);
    
    const newEvent: CalendarEvent = {
      id: generateId(),
      provider: calendar?.provider || CalendarProvider.GOOGLE,
      providerEventId: `event-${Date.now()}`,
      summary: payload.summary,
      description: payload.description,
      location: payload.location,
      status: EventStatus.CONFIRMED,
      visibility: payload.visibility || EventVisibility.DEFAULT,
      start: payload.start,
      end: payload.end,
      recurrence: payload.recurrence,
      attendees: payload.attendees?.map(a => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: 'needsAction' as const,
      })),
      reminders: payload.reminders?.useDefault 
        ? [{ method: 'popup', minutes: 30 }]
        : payload.reminders?.overrides,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      conferenceData: payload.conferenceData,
    };
    
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, [calendars]);

  const updateEvent = useCallback(async (eventId: string, payload: UpdateEventPayload): Promise<CalendarEvent | null> => {
    let updatedEvent: CalendarEvent | null = null;

    setEvents(prev => {
      const found = prev.find(e => e.id === eventId);
      if (found) {
        updatedEvent = {
          ...found,
          ...payload,
          start: payload.start || found.start,
          end: payload.end || found.end,
          attendees: payload.attendees?.map(a => ({
            ...a,
            responseStatus: a.responseStatus || 'needsAction' as const
          })) || found.attendees,
          reminders: payload.reminders?.useDefault 
            ? [{ method: 'popup' as const, minutes: 30 }]
            : payload.reminders?.overrides || found.reminders,
          updated: new Date().toISOString(),
        };
        return prev.map(e => e.id === eventId ? updatedEvent! : e);
      }
      return prev;
    });

    return updatedEvent;
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    return true;
  }, []);

  const getEventById = useCallback((eventId: string): CalendarEvent | null => {
    return events.find(e => e.id === eventId) || null;
  }, [events]);

  // Email to Event Conversion
  const convertEmailToEvent = useCallback(async (
    emailId: string,
    emailData: {
      subject: string;
      from: string;
      body?: string;
      date: string;
      to?: string[];
    },
    options: EmailToEventOptions
  ): Promise<CalendarEvent | null> => {
    // Extract event details from email
    let summary = 'Event from Email';
    let description = '';
    let location = '';
    const attendees: EventAttendee[] = [];
    let eventDate = new Date();
    
    // Extract title from subject
    if (options.extractTitleFromSubject && emailData.subject) {
      summary = emailData.subject;
    }
    
    // Extract description from body
    if (options.extractDescriptionFromBody && emailData.body) {
      description = emailData.body;
    }
    
    // Extract date from body (simplified - would use NLP in production)
    if (options.extractDateFromBody && emailData.body) {
      const datePatterns = [
        /(\d{1,2}\/\d{1,2}\/\d{4})/,
        /(\d{4}-\d{2}-\d{2})/,
        /(tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      ];
      
      for (const pattern of datePatterns) {
        const match = emailData.body.match(pattern);
        if (match) {
          // Parse date (simplified)
          if (match[1] === 'tomorrow') {
            eventDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
          }
          break;
        }
      }
    }
    
    // Extract attendees from body
    if (options.extractAttendeesFromBody && emailData.body) {
      const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
      const extractedEmails = emailData.body.match(emailPattern) || [];
      extractedEmails.forEach(email => {
        if (!attendees.find(a => a.email === email)) {
          attendees.push({
            email,
            responseStatus: 'needsAction',
          });
        }
      });
    }
    
    // Auto-add email sender and recipients
    if (options.autoAddAttendees) {
      attendees.push({
        email: emailData.from,
        responseStatus: 'needsAction',
      });
      if (emailData.to) {
        emailData.to.forEach(toEmail => {
          if (!attendees.find(a => a.email === toEmail)) {
            attendees.push({
              email: toEmail,
              responseStatus: 'needsAction',
            });
          }
        });
      }
    }
    
    // Create event
    const startDate = eventDate;
    const endDate = new Date(startDate.getTime() + options.defaultDuration * 60 * 1000);
    
    const calendar = calendars.find(c => c.primary);
    
    const newEvent: CalendarEvent = {
      id: generateId(),
      provider: calendar?.provider || CalendarProvider.GOOGLE,
      providerEventId: `event-${Date.now()}`,
      summary,
      description,
      location,
      status: EventStatus.TENTATIVE,
      visibility: EventVisibility.PRIVATE,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: [...new Map(attendees.map(a => [a.email, a])).values()],
      reminders: [{ method: 'popup', minutes: options.defaultReminder }],
      sourceEmailId: emailId,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, [calendars]);

  // Event Filtering
  const getFilteredEvents = useCallback((filter?: EventFilterOptions): CalendarEvent[] => {
    let filtered = [...events];
    
    if (filter?.timeMin) {
      const timeMin = new Date(filter.timeMin);
      filtered = filtered.filter(e => {
        const start = e.start.dateTime ? new Date(e.start.dateTime) : new Date(e.start.date!);
        return start >= timeMin;
      });
    }
    
    if (filter?.timeMax) {
      const timeMax = new Date(filter.timeMax);
      filtered = filtered.filter(e => {
        const start = e.start.dateTime ? new Date(e.start.dateTime) : new Date(e.start.date!);
        return start <= timeMax;
      });
    }
    
    if (filter?.status) {
      filtered = filtered.filter(e => e.status === filter.status);
    }
    
    if (filter?.q) {
      const query = filter.q.toLowerCase();
      filtered = filtered.filter(e => 
        e.summary.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.location?.toLowerCase().includes(query)
      );
    }
    
    if (filter?.calendarIds && filter.calendarIds.length > 0) {
      // Map calendar IDs to events
      const calendarMap = new Map(calendars.map(c => [c.calendarId, c.id]));
      filtered = filtered.filter(e => {
        const calendar = calendars.find(c => c.provider === e.provider);
        return calendar && filter.calendarIds!.includes(calendar.calendarId);
      });
    }
    
    if (filter?.orderBy === 'startTime') {
      filtered.sort((a, b) => {
        const aStart = a.start.dateTime ? new Date(a.start.dateTime).getTime() : new Date(a.start.date!).getTime();
        const bStart = b.start.dateTime ? new Date(b.start.dateTime).getTime() : new Date(b.start.date!).getTime();
        return aStart - bStart;
      });
    }
    
    if (filter?.maxResults) {
      filtered = filtered.slice(0, filter.maxResults);
    }
    
    return filtered;
  }, [events, calendars]);

  // Calendar Statistics
  const getStatistics = useCallback((): CalendarStatistics => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let upcomingEvents = 0;
    let pastEvents = 0;
    let todayEvents = 0;
    let thisWeekEvents = 0;
    let thisMonthEvents = 0;
    
    const eventsByStatus: Record<EventStatus, number> = {
      [EventStatus.CONFIRMED]: 0,
      [EventStatus.TENTATIVE]: 0,
      [EventStatus.CANCELLED]: 0,
    };
    
    const eventsByCalendar: Record<string, number> = {};
    
    events.forEach(event => {
      const start = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!);
      
      if (start > now) upcomingEvents++;
      else pastEvents++;
      
      if (start >= today && start < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
        todayEvents++;
      }
      
      if (start >= today && start < weekFromNow) {
        thisWeekEvents++;
      }
      
      if (start >= today && start < monthFromNow) {
        thisMonthEvents++;
      }
      
      eventsByStatus[event.status]++;
      
      const calendar = calendars.find(c => c.provider === event.provider);
      if (calendar) {
        eventsByCalendar[calendar.id] = (eventsByCalendar[calendar.id] || 0) + 1;
      }
    });
    
    // Find busiest day
    const eventsByDate: Record<string, number> = {};
    events.forEach(event => {
      const date = event.start.dateTime 
        ? new Date(event.start.dateTime).toDateString()
        : event.start.date!;
      eventsByDate[date] = (eventsByDate[date] || 0) + 1;
    });
    
    const busiestDay = Object.entries(eventsByDate)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    
    // Find free slots
    const freeSlots: CalendarStatistics['freeSlots'] = [];
    // Simplified - would calculate actual free slots based on events
    
    return {
      totalEvents: events.length,
      upcomingEvents,
      pastEvents,
      todayEvents,
      thisWeekEvents,
      thisMonthEvents,
      eventsByStatus,
      eventsByCalendar,
      averageEventsPerDay: events.length / 30, // Simplified
      busiestDay,
      freeSlots,
    };
  }, [events, calendars]);

  // Free/Busy Query
  const queryFreeBusy = useCallback(async (query: FreeBusyQuery): Promise<FreeBusyResponse> => {
    // Mock implementation
    return {
      timeMin: query.timeMin,
      timeMax: query.timeMax,
      calendars: {},
    };
  }, []);

  // Sync Functions
  const syncAllCalendars = useCallback(async (): Promise<boolean> => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSyncStatus({
      lastSyncAt: new Date().toISOString(),
      isSyncing: false,
      syncErrors: [],
    });
    
    return true;
  }, []);

  const syncCalendar = useCallback(async (calendarId: string): Promise<boolean> => {
    // Mock sync for specific calendar
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }, []);

  // Attendee Management
  const addAttendee = useCallback(async (
    eventId: string,
    email: string,
    displayName?: string
  ): Promise<EventAttendee | null> => {
    const newAttendee: EventAttendee = {
      email,
      displayName,
      responseStatus: 'needsAction',
    };
    
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          attendees: [...(event.attendees || []), newAttendee],
          updated: new Date().toISOString(),
        };
      }
      return event;
    }));
    
    return newAttendee;
  }, []);

  const removeAttendee = useCallback(async (eventId: string, email: string): Promise<boolean> => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          attendees: event.attendees?.filter(a => a.email !== email) || [],
          updated: new Date().toISOString(),
        };
      }
      return event;
    }));
    
    return true;
  }, []);

  const updateAttendeeStatus = useCallback(async (
    eventId: string,
    email: string,
    status: 'accepted' | 'declined' | 'tentative'
  ): Promise<boolean> => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          attendees: event.attendees?.map(a => 
            a.email === email ? { ...a, responseStatus: status } : a
          ),
          updated: new Date().toISOString(),
        };
      }
      return event;
    }));
    
    return true;
  }, []);

  // Get events for specific date range
  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    return events.filter(event => {
      const eventStart = event.start.dateTime 
        ? new Date(event.start.dateTime)
        : new Date(event.start.date!);
      const eventEnd = event.end.dateTime
        ? new Date(event.end.dateTime)
        : new Date(event.end.date!);
      
      return eventStart < endOfDay && eventEnd > startOfDay;
    });
  }, [events]);

  // Get events for week
  const getEventsForWeek = useCallback((date: Date): CalendarEvent[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return events.filter(event => {
      const eventStart = event.start.dateTime 
        ? new Date(event.start.dateTime)
        : new Date(event.start.date!);
      
      return eventStart >= startOfWeek && eventStart < endOfWeek;
    });
  }, [events]);

  // Get events for month
  const getEventsForMonth = useCallback((date: Date): CalendarEvent[] => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    return events.filter(event => {
      const eventStart = event.start.dateTime 
        ? new Date(event.start.dateTime)
        : new Date(event.start.date!);
      
      return eventStart >= startOfMonth && eventStart <= endOfMonth;
    });
  }, [events]);

  return {
    // State
    isLoading,
    accounts,
    calendars,
    events,
    selectedEvent,
    selectedDate,
    viewMode,
    syncStatus,
    
    // Setters
    setSelectedEvent,
    setSelectedDate,
    setViewMode,
    
    // Account Management
    connectCalendar,
    disconnectCalendar,
    refreshAccountToken,
    
    // Event CRUD
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    
    // Email Integration
    convertEmailToEvent,
    
    // Filtering
    getFilteredEvents,
    getEventsForDate,
    getEventsForWeek,
    getEventsForMonth,
    
    // Statistics
    getStatistics,
    
    // Free/Busy
    queryFreeBusy,
    
    // Sync
    syncAllCalendars,
    syncCalendar,
    
    // Attendee Management
    addAttendee,
    removeAttendee,
    updateAttendeeStatus,
  };
};