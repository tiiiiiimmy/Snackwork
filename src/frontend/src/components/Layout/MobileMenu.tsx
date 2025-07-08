import React from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { User } from '../../types/api';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => Promise<void> | void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
}) => {
  if (!isOpen) return null;

  const handleLogout = async () => {
    await onLogout();
    onClose();
  };

  return (
    <div className="mobile-menu-overlay">
      <div
        className="mobile-menu-backdrop"
        onClick={onClose}
      />
      <div className="mobile-menu-content">
        <div className="mobile-menu-header">
          <h2 className="mobile-menu-title">Menu</h2>
          <button
            onClick={onClose}
            className="mobile-menu-close"
          >
            <XMarkIcon />
          </button>
        </div>

        <nav className="mobile-menu-nav">
          <Link
            to="/"
            className="mobile-menu-link"
            onClick={onClose}
          >
            Home
          </Link>

          {user ? (
            <>
              <Link
                to="/add-snack"
                className="mobile-menu-link"
                onClick={onClose}
              >
                Add Snack
              </Link>
              <button
                onClick={handleLogout}
                className="mobile-menu-button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="mobile-menu-link"
                onClick={onClose}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="mobile-menu-link mobile-menu-link-primary"
                onClick={onClose}
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};
