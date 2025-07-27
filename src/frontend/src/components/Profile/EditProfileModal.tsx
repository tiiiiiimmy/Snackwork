import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { User, UpdateProfileRequest } from '../../types/api';

interface EditProfileModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onProfileUpdated: (user: User) => void;
}

const EMOJI_OPTIONS = [
  '🍪', '🍩', '🧁', '🍰', '🎂', '🍫', '🍬', '🍭',
  '🍯', '🍎', '🍌', '🍓', '🫐', '🥨', '🍕', '🌮',
  '🍔', '🍟', '🌭', '🥪', '🌯', '🍜', '🍱', '🍣',
  '🍤', '🥗', '🍳', '🥞', '🧇', '🥓', '🥖', '🥐'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onProfileUpdated
}) => {
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    username: user.username,
    instagramHandle: user.instagramHandle || '',
    bio: user.bio || '',
    avatarEmoji: user.avatarEmoji
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: user.username,
        instagramHandle: user.instagramHandle || '',
        bio: user.bio || '',
        avatarEmoji: user.avatarEmoji
      });
      setError(null);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username?.trim()) {
      setError('Username is required');
      return;
    }

    if (formData.username && formData.username.length > 50) {
      setError('Username must be 50 characters or less');
      return;
    }

    if (formData.bio && formData.bio.length > 200) {
      setError('Bio must be 200 characters or less');
      return;
    }

    if (formData.instagramHandle && formData.instagramHandle.length > 64) {
      setError('Instagram handle must be 64 characters or less');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedUser = await apiService.updateProfile({
        username: formData.username.trim(),
        instagramHandle: formData.instagramHandle?.trim() || undefined,
        bio: formData.bio?.trim() || undefined,
        avatarEmoji: formData.avatarEmoji
      });

      onProfileUpdated({ ...user, ...updatedUser });
      onClose();
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message ||
        'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setFormData(prev => ({ ...prev, avatarEmoji: emoji }));
    setShowEmojiPicker(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Edit Profile</h2>
          <button
            className="modal__close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          {error && (
            <div className="form__error mb-4">
              {error}
            </div>
          )}

          {/* Avatar Selection */}
          <div className="form__group">
            <label className="form__label">
              Avatar
            </label>
            <div className="avatar-selector">
              <button
                type="button"
                className="avatar-selector__current"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <span className="avatar-selector__emoji">
                  {formData.avatarEmoji}
                </span>
                <span className="avatar-selector__text">
                  Click to change
                </span>
              </button>

              {showEmojiPicker && (
                <div className="emoji-picker">
                  <div className="emoji-picker__grid">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        className={`emoji-picker__option ${emoji === formData.avatarEmoji ? 'emoji-picker__option--selected' : ''
                          }`}
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="form__group">
            <label htmlFor="username" className="form__label">
              Username *
            </label>
            <input
              id="username"
              type="text"
              className="input"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                username: e.target.value
              }))}
              placeholder="Enter your username"
              maxLength={50}
              required
            />
            <div className="form__help">
              {(formData.username || '').length}/50 characters
            </div>
          </div>

          {/* Instagram Handle */}
          <div className="form__group">
            <label htmlFor="instagram" className="form__label">
              Instagram Handle
            </label>
            <div className="input-group">
              <div className="input-group__addon input-group__addon--prepend">
                @
              </div>
              <input
                id="instagram"
                type="text"
                className="input"
                value={formData.instagramHandle}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  instagramHandle: e.target.value
                }))}
                placeholder="your_instagram_handle"
                maxLength={64}
              />
            </div>
            <div className="form__help">
              {(formData.instagramHandle || '').length}/64 characters
            </div>
          </div>

          {/* Bio */}
          <div className="form__group">
            <label htmlFor="bio" className="form__label">
              Bio
            </label>
            <textarea
              id="bio"
              className="textarea"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                bio: e.target.value
              }))}
              placeholder="Tell us about yourself..."
              maxLength={200}
              rows={4}
            />
            <div className="form__help">
              {(formData.bio || '').length}/200 characters
            </div>
          </div>

          <div className="modal__footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn--secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn--primary ${loading ? 'btn--loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};