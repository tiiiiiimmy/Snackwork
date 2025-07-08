import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, UserIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { MobileMenu } from './MobileMenu';
import { announceToScreenReader } from '../../utils/accessibility';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      announceToScreenReader('Successfully logged out');
    } catch (error) {
      console.error('Logout failed:', error);
      announceToScreenReader('Logout failed. Please try again.');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="header-logo" aria-label="SnackSpot Auckland - Home">
            <div className="logo-icon" aria-hidden="true">
              <MapPinIcon />
            </div>
            <span className="logo-text">SnackSpot Auckland</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/add-snack" className="nav-link nav-link-primary">
              Add Snack
            </Link>
          </nav>

          {/* User Menu */}
          <div className="user-menu" role="region" aria-label="User account">
            {user ? (
              <div className="user-section">
                <div className="user-info">
                  <div className="user-avatar" aria-hidden="true">
                    <UserIcon />
                  </div>
                  <span className="username">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="logout-button"
                  data-testid="logout-button"
                  aria-label="Log out of your account"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="auth-link" data-testid="login-link">
                  Login
                </Link>
                <Link to="/register" className="auth-link auth-link-primary">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="mobile-menu-button"
              aria-label="Open mobile menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <Bars3Icon aria-hidden="true" />
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </header>
  );
};
