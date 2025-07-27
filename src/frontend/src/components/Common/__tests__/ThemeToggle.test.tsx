import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '../../../context/ThemeContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the useTheme hook for isolated testing
const mockSetTheme = vi.fn();
let mockThemeContext = {
    theme: 'light' as const,
    setTheme: mockSetTheme,
    isDark: false,
};

vi.mock('../../../context/ThemeContext', async () => {
    const actual = await vi.importActual('../../../context/ThemeContext');
    return {
        ...actual,
        useTheme: () => mockThemeContext,
    };
});

// Helper component for testing with full context
const ThemeToggleWithProvider = () => (
    <ThemeProvider>
        <ThemeToggle />
    </ThemeProvider>
);

describe('ThemeToggle', () => {
    beforeEach(() => {
        mockSetTheme.mockClear();
        // Reset context values
        mockThemeContext = {
            theme: 'light',
            setTheme: mockSetTheme,
            isDark: false,
        };
    });

    it('renders with light theme icon and label', () => {
        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-label', 'Switch theme. Current: Light mode');
        expect(button).toHaveTextContent('☀️');
    });

    it('renders with dark theme icon when isDark is true', () => {
        mockThemeContext.theme = 'dark';
        mockThemeContext.isDark = true;

        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Switch theme. Current: Dark mode');
        expect(button).toHaveTextContent('🌙');
    });

    it('renders with system theme icon', () => {
        mockThemeContext.theme = 'system';

        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Switch theme. Current: System mode');
        expect(button).toHaveTextContent('🖥️');
    });

    it('cycles through themes correctly on click', () => {
        const { rerender } = render(<ThemeToggle />);
        const button = screen.getByRole('button');

        // Light -> Dark
        fireEvent.click(button);
        expect(mockSetTheme).toHaveBeenCalledWith('dark');

        // Update mock context and rerender
        mockThemeContext.theme = 'dark';
        mockThemeContext.isDark = true;
        mockSetTheme.mockClear();
        rerender(<ThemeToggle />);

        // Dark -> System
        fireEvent.click(button);
        expect(mockSetTheme).toHaveBeenCalledWith('system');

        // Update mock context and rerender
        mockThemeContext.theme = 'system';
        mockThemeContext.isDark = false;
        mockSetTheme.mockClear();
        rerender(<ThemeToggle />);

        // System -> Light
        fireEvent.click(button);
        expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('has proper accessibility attributes', () => {
        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('title');

        const icon = button.querySelector('.theme-toggle__icon');
        expect(icon).toHaveAttribute('aria-hidden', 'true');

        const label = button.querySelector('.sr-only');
        expect(label).toBeInTheDocument();
    });

    it('has proper CSS classes', () => {
        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('theme-toggle');

        const icon = button.querySelector('.theme-toggle__icon');
        expect(icon).toHaveClass('theme-toggle__icon');

        const label = button.querySelector('.theme-toggle__label');
        expect(label).toHaveClass('theme-toggle__label', 'sr-only');
    });

    it('integrates properly with ThemeProvider', () => {
        // Test that it works with the actual provider
        render(<ThemeToggleWithProvider />);

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();

        // Should not throw when clicking
        expect(() => fireEvent.click(button)).not.toThrow();
    });
}); 