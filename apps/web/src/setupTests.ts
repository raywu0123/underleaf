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
  onmessage = null;
  postMessage() {}
  terminate() {}
}
window.Worker = WorkerMock as any;
