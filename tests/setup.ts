// Browser Mock for Unit Tests
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }
}

class BroadcastChannelMock {
  name: string;
  onmessage: ((event: any) => void) | null = null;
  private static channels: Map<string, Set<BroadcastChannelMock>> = new Map();

  constructor(name: string) {
    this.name = name;
    if (!BroadcastChannelMock.channels.has(name)) {
      BroadcastChannelMock.channels.set(name, new Set());
    }
    BroadcastChannelMock.channels.get(name)!.add(this);
  }

  postMessage(data: any) {
    const list = BroadcastChannelMock.channels.get(this.name);
    if (list) {
      list.forEach((ch) => {
        if (ch !== this && ch.onmessage) {
          ch.onmessage({ data });
        }
      });
    }
  }

  close() {
    const list = BroadcastChannelMock.channels.get(this.name);
    if (list) {
      list.delete(this);
    }
  }
}

// Global window & storage polyfill for node test environment
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}

const mockStorage = new LocalStorageMock();
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window.localStorage = mockStorage;
(globalThis as any).BroadcastChannel = BroadcastChannelMock;
(globalThis as any).window.BroadcastChannel = BroadcastChannelMock;
