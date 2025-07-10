import React, { useState } from 'react';
import { X, Lock, Users, Globe } from 'lucide-react';

const CreateForumModal = ({ isOpen, onClose, onSubmit, eventId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    isPrivate: false,
    eventId: eventId || ''
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    'general',
    'announcements',
    'networking',
    'q&a',
    'feedback',
    'technical',
    'social',
    'marketplace'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        category: 'general',
        isPrivate: false,
        eventId: eventId || ''
      });
      onClose();
    } catch (error) {
      console.error('Failed to create forum:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Forum</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forum Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter forum title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe what this forum is about..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Privacy Setting
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPrivate"
                  checked={!formData.isPrivate}
                  onChange={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Public</span>
                  </div>
                  <p className="text-xs text-gray-500">Anyone can view and participate</p>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Private</span>
                  </div>
                  <p className="text-xs text-gray-500">Only event attendees can participate</p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? 'Creating...' : 'Create Forum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateForumModal;