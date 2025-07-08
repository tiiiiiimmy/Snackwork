import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, UserIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { MobileMenu } from './MobileMenu';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="header-logo">
            <div className="logo-icon">
              <MapPinIcon />
            </div>
            <span className="logo-text">SnackSpot Auckland</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/add-snack" className="nav-link nav-link-primary">
              Add Snack
            </Link>
          </nav>

          {/* User Menu */}
          <div className="user-menu">
            {user ? (
              <div className="user-section">
                <div className="user-info">
                  <div className="user-avatar">
                    <UserIcon />
                  </div>
                  <span className="username">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="logout-button"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="auth-link">
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
            >
              <Bars3Icon />
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
