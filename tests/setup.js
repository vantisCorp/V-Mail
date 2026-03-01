// Test setup file for Vitest
import { expect, afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  // Clean up any DOM elements created during tests
  document.body.innerHTML = '';
});

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage with proper behavior
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value.toString();
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};
global.localStorage = localStorageMock;

// Mock sessionStorage with proper behavior
const sessionStorageMock = {
  store: {},
  getItem: vi.fn((key) => sessionStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    sessionStorageMock.store[key] = value.toString();
  }),
  removeItem: vi.fn((key) => {
    delete sessionStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    sessionStorageMock.store = {};
  }),
};
global.sessionStorage = sessionStorageMock;

// Mock ClipboardEvent
global.ClipboardEvent = class ClipboardEvent extends Event {
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.clipboardData = eventInitDict.clipboardData || null;
  }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};