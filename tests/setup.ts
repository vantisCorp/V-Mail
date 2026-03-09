import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    addListener: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeListener: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    addEventListener: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeEventListener: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    dispatchEvent: () => {}
  })
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe() {}
  takeRecords() {
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock DataTransfer
global.DataTransfer = class DataTransfer {
  constructor() {
    this.items = [];
    this.files = [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  files: File[];
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setData(_format: string, _data: string) {}
  getData(_format: string): string {
    return '';
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearData(_format?: string) {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
  setDragImage(_image: any, _x: number, _y: number) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock ClipboardEvent
global.ClipboardEvent = class ClipboardEvent extends Event {
  clipboardData: DataTransfer;

  constructor(type: string, eventInitDict?: ClipboardEventInit) {
    super(type, eventInitDict);
    this.clipboardData = eventInitDict?.clipboardData || new DataTransfer();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
