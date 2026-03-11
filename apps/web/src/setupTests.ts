import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@monaco-editor/react', () => {
  return {
    default: () => 'Monaco Editor Mock'
  };
});

vi.mock('y-monaco', () => ({
  MonacoBinding: class {
    destroy() {}
  }
}));

// Mock Worker for JSDOM
class WorkerMock {
  onmessage: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
  onerror = null;
}
window.Worker = WorkerMock as unknown as typeof Worker;

// Mock queryCommandSupported for Monaco editor imports in JSDOM
if (typeof document !== 'undefined' && !document.queryCommandSupported) {
  document.queryCommandSupported = vi.fn().mockReturnValue(true);
}
