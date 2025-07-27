import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { AddSnackModal } from '../components/Snacks/AddSnackModal';
import type { Snack } from '../types/api';

export const AddSnack: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location: userLocation } = useLocation();
  const [showModal, setShowModal] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Show modal when component mounts
    setShowModal(true);
  }, [user, navigate]);

  const handleSnackCreated = (snack: Snack) => {
    navigate(`/snacks/${snack.id}`);
  };

  const handleClose = () => {
    navigate('/');
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__header-title">Add New Snack</h1>
        <p className="page__header-subtitle">
          Share your favorite snacks with the community
        </p>
      </div>

      <div className="container">
        <div className="page__content">
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="btn btn--primary btn--large"
            >
              + Add Snack
            </button>
          </div>
        </div>
      </div>

      <AddSnackModal
        isOpen={showModal}
        onClose={handleClose}
        onSnackCreated={handleSnackCreated}
        userLocation={userLocation || undefined}
      />
    </div>
  );
};