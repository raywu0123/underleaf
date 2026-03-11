import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App component', () => {
  it('renders the Dashboard by default', () => {
    render(<App />);
    expect(screen.getByText(/Create New Document/i)).toBeInTheDocument();
  });
});
