import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { User } from '../../types/api';
import { FocusTrap } from '../../utils/accessibility';

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
  const menuRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<FocusTrap | null>(null);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      focusTrapRef.current = new FocusTrap(menuRef.current);
      focusTrapRef.current.activate();
      
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      return () => {
        focusTrapRef.current?.deactivate();
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await onLogout();
    onClose();
  };

  return (
    <div 
      className="mobile-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
      id="mobile-menu"
    >
      <div
        className="mobile-menu-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="mobile-menu-content" ref={menuRef}>
        <div className="mobile-menu-header">
          <h2 className="mobile-menu-title" id="mobile-menu-title">Menu</h2>
          <button
            onClick={onClose}
            className="mobile-menu-close"
            aria-label="Close menu"
          >
            <XMarkIcon aria-hidden="true" />
          </button>
        </div>

        <nav className="mobile-menu-nav" aria-label="Mobile navigation">
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
                data-testid="logout-button"
                aria-label="Log out of your account"
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
