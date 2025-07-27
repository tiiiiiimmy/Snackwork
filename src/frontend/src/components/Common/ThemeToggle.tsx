import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
    const { theme, setTheme, isDark } = useTheme();

    const getIcon = () => {
        if (theme === 'system') return '🖥️';
        return isDark ? '🌙' : '☀️';
    };

    const getNextTheme = () => {
        switch (theme) {
            case 'light': return 'dark';
            case 'dark': return 'system';
            case 'system': return 'light';
            default: return 'light';
        }
    };

    const getThemeLabel = () => {
        switch (theme) {
            case 'light': return 'Light mode';
            case 'dark': return 'Dark mode';
            case 'system': return 'System mode';
            default: return 'Light mode';
        }
    };

    return (
        <button
            onClick={() => setTheme(getNextTheme())}
            className="theme-toggle"
            aria-label={`Switch theme. Current: ${getThemeLabel()}`}
            title={`Switch theme. Current: ${getThemeLabel()}`}
        >
            <span className="theme-toggle__icon" role="img" aria-hidden="true">
                {getIcon()}
            </span>
            <span className="theme-toggle__label sr-only">
                {getThemeLabel()}
            </span>
        </button>
    );
}; 