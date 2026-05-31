import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Polyfill required by SockJS in browser environment
(window as any).global = window;

// Fallback memory storage for environments where localStorage is blocked (e.g., Firefox tracking protection)
try {
  const testKey = '__test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn('localStorage is blocked, falling back to memory storage');
  let memoryStore: { [key: string]: string } = {};
  const memoryStorageFallback = {
    getItem: (key: string) => memoryStore[key] || null,
    setItem: (key: string, value: string) => { memoryStore[key] = String(value); },
    removeItem: (key: string) => { delete memoryStore[key]; },
    clear: () => { memoryStore = {}; },
    get length() { return Object.keys(memoryStore).length; },
    key: (i: number) => Object.keys(memoryStore)[i] || null
  };
  
  try {
    Object.defineProperty(window, 'localStorage', {
      value: memoryStorageFallback,
      configurable: true,
      enumerable: true,
      writable: true
    });
  } catch (err) {
    console.error('Failed to polyfill localStorage', err);
  }
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
