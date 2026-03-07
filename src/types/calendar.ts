/**
 * Calendar Integration Type Definitions
 * Supports Google Calendar and Microsoft Outlook/Exchange integration
 */

// Calendar Provider Types
export enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  EXCHANGE = 'exchange',
}

// Calendar Event Status
export enum EventStatus {
  CONFIRMED = 'confirmed',
  TENTATIVE = 'tentative',
  CANCELLED = 'cancelled',
}

// Calendar Event Visibility
export enum EventVisibility {
  DEFAULT = 'default',
  PUBLIC = 'public',
  PRIVATE = 'private',
  CONFIDENTIAL = 'confidential',
}

// Recurrence Types
export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// Calendar Event Interface
export interface CalendarEvent {
  id: string;
  provider: CalendarProvider;
  providerEventId: string;
  summary: string;
  description?: string;
  location?: string;
  status: EventStatus;
  visibility: EventVisibility;
  
  // Dates
  start: {
    dateTime?: string; // ISO 8601 format with timezone
    date?: string; // Date only (all-day event)
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  
  // Recurrence
  recurrence?: RecurrenceRule[];
  
  // Attendees
  attendees?: EventAttendee[];
  
  // Reminders
  reminders?: EventReminder[];
  
  // Email integration
  sourceEmailId?: string;
  
  // Metadata
  created: string;
  updated: string;
  creator?: EventCreator;
  organizer?: EventOrganizer;
  
  // Colors and display
  colorId?: string;
  hangoutLink?: string;
  conferenceData?: ConferenceData;
}

// Event Attendee
export interface EventAttendee {
  email: string;
  displayName?: string;
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
  comment?: string;
  isSelf?: boolean;
}

// Event Creator
export interface EventCreator {
  id?: string;
  email?: string;
  displayName?: string;
  self?: boolean;
}

// Event Organizer
export interface EventOrganizer {
  id?: string;
  email?: string;
  displayName?: string;
  self?: boolean;
}

// Recurrence Rule
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  until?: string; // ISO date
  count?: number;
  byDay?: string[]; // e.g., ['MO', 'TU', 'WE']
  byMonth?: number[];
  byMonthDay?: number[];
  bySetPos?: number[];
}

// Event Reminder
export interface EventReminder {
  method: 'email' | 'popup';
  minutes: number;
}

// Conference Data
export interface ConferenceData {
  createRequest?: {
    requestId: string;
    conferenceSolutionKey?: {
      type: string;
    };
  };
  conferenceSolution?: {
    key: {
      type: string;
    };
    name: string;
    iconUri: string;
  };
  entryPoints?: Array<{
    entryPointType: string;
    uri: string;
    label?: string;
    pin?: string;
    accessCode?: string;
    meetingCode?: string;
    password?: string;
  }>;
  conferenceId?: string;
  signature?: string;
  notes?: string;
}

// Calendar Account Interface
export interface CalendarAccount {
  id: string;
  provider: CalendarProvider;
  userId: string;
  email: string;
  displayName?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scopes: string[];
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// Calendar Interface
export interface Calendar {
  id: string;
  provider: CalendarProvider;
  accountId: string;
  calendarId: string;
  name: string;
  description?: string;
  location?: string;
  timezone: string;
  primary: boolean;
  selected: boolean;
  hidden: boolean;
  color?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole: string;
  kind?: string;
}

// Event Filter Options
export interface EventFilterOptions {
  calendarIds?: string[];
  status?: EventStatus;
  timeMin?: string;
  timeMax?: string;
  q?: string; // Search query
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
  maxResults?: number;
}

// Event Creation Payload
export interface CreateEventPayload {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurrence?: RecurrenceRule[];
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  visibility?: EventVisibility;
  transparency?: 'opaque' | 'transparent';
  colorId?: string;
  conferenceData?: ConferenceData;
}

// Event Update Payload
export interface UpdateEventPayload {
  eventId: string;
  calendarId?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: EventStatus;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  visibility?: EventVisibility;
}

// Email to Event Options
export interface EmailToEventOptions {
  extractTitleFromSubject: boolean;
  extractDescriptionFromBody: boolean;
  extractDateFromBody: boolean;
  extractAttendeesFromBody: boolean;
  extractLocationFromBody: boolean;
  defaultDuration: number; // minutes
  defaultReminder: number; // minutes
  autoAddAttendees: boolean;
  includeAttachments: boolean;
}

// Calendar Statistics
export interface CalendarStatistics {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  todayEvents: number;
  thisWeekEvents: number;
  thisMonthEvents: number;
  eventsByStatus: Record<EventStatus, number>;
  eventsByCalendar: Record<string, number>;
  averageEventsPerDay: number;
  busiestDay: string;
  freeSlots: {
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
  }[];
}

// Free/Busy Query
export interface FreeBusyQuery {
  timeMin: string;
  timeMax: string;
  items: Array<{
    id: string;
  }>;
  timeZone?: string;
}

// Free/Busy Response
export interface FreeBusyResponse {
  timeMin: string;
  timeMax: string;
  calendars: Record<string, {
    busy: Array<{
      start: string;
      end: string;
    }>;
    errors?: Array<{
      domain: string;
      reason: string;
    }>;
  }>;
}

// Calendar Sync Status
export interface CalendarSyncStatus {
  lastSyncAt: string;
  isSyncing: boolean;
  nextToken?: string;
  syncErrors: Array<{
    calendarId: string;
    error: string;
    timestamp: string;
  }>;
}

// API Configuration
export interface CalendarApiConfig {
  google: {
    clientId: string;
    apiKey: string;
    scopes: string[];
    discoveryUrl: string;
  };
  outlook: {
    clientId: string;
    scopes: string[];
    authority: string;
  };
}

// Calendar Integration Options
export interface CalendarIntegrationOptions {
  enabledProviders: CalendarProvider[];
  syncInterval: number; // milliseconds
  autoSync: boolean;
  syncOnStartup: boolean;
  backgroundSync: boolean;
  notifyOnNewEvents: boolean;
  notifyOnEventUpdates: boolean;
  notifyOnEventReminders: boolean;
}