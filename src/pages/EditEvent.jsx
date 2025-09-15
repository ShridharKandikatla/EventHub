import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { eventsAPI } from '../services/api';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Clock,
  Image,
  Tag,
  FileText,
  Save,
  Eye,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

const EditEvent = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    venue: {
      name: '',
      address: '',
      city: '',
      country: '',
      capacity: ''
    },
    dateTime: {
      start: '',
      end: ''
    },
    pricing: {
      currency: 'USD',
      tiers: [
        {
          name: 'General Admission',
          price: '',
          quantity: '',
          benefits: []
        }
      ]
    },
    tags: [],
    ageRestriction: {
      minimum: '',
      maximum: ''
    },
    features: {
      hasSeating: false,
      allowsResale: false,
      hasWaitlist: true,
      supportsStreaming: false
    }
  });

  const categories = [
    'Music', 'Sports', 'Technology', 'Food', 'Art', 'Business', 
    'Health', 'Education', 'Entertainment', 'Travel', 'Fashion', 'Other'
  ];

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getEvent(id);
      const event = response.data;
      
      // Check if user is the organizer
      if (user.id !== event.organizer?._id && user.id !== event.organizer) {
        setError('You are not authorized to edit this event');
        return;
      }

      // Format dates for datetime-local input
      const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        title: event.title || '',
        description: event.description || '',
        category: event.category || '',
        venue: {
          name: event.venue?.name || '',
          address: event.venue?.address || '',
          city: event.venue?.city || '',
          country: event.venue?.country || '',
          capacity: event.venue?.capacity || ''
        },
        dateTime: {
          start: event.dateTime?.start ? formatDateForInput(event.dateTime.start) : '',
          end: event.dateTime?.end ? formatDateForInput(event.dateTime.end) : ''
        },
        pricing: {
          currency: event.pricing?.currency || 'USD',
          tiers: event.pricing?.tiers || [
            {
              name: 'General Admission',
              price: '',
              quantity: '',
              benefits: []
            }
          ]
        },
        tags: event.tags || [],
        ageRestriction: {
          minimum: event.ageRestriction?.minimum || '',
          maximum: event.ageRestriction?.maximum || ''
        },
        features: {
          hasSeating: event.features?.hasSeating || false,
          allowsResale: event.features?.allowsResale || false,
          hasWaitlist: event.features?.hasWaitlist || true,
          supportsStreaming: event.features?.supportsStreaming || false
        }
      });
    } catch (error) {
      console.error('Failed to fetch event:', error);
      setError('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      venue: {
        ...prev.venue,
        [name]: value
      }
    }));
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      dateTime: {
        ...prev.dateTime,
        [name]: value
      }
    }));
  };

  const handlePricingChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        tiers: prev.pricing.tiers.map((tier, i) => 
          i === index ? { ...tier, [field]: value } : tier
        )
      }
    }));
  };

  const addPricingTier = () => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        tiers: [
          ...prev.pricing.tiers,
          {
            name: '',
            price: '',
            quantity: '',
            benefits: []
          }
        ]
      }
    }));
  };

  const removePricingTier = (index) => {
    if (formData.pricing.tiers.length > 1) {
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          tiers: prev.pricing.tiers.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await eventsAPI.updateEvent(id, formData);
      navigate(`/events/${id}`);
    } catch (error) {
      console.error('Failed to update event:', error);
      setError('Failed to update event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    navigate(`/events/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Event
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600 mt-2">
            Update your event details
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category.toLowerCase()}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your event..."
                />
              </div>
            </div>
          </div>

          {/* Venue Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Venue Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.venue.name}
                  onChange={handleVenueChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Venue name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.venue.capacity}
                  onChange={handleVenueChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Maximum attendees"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.venue.address}
                  onChange={handleVenueChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.venue.city}
                  onChange={handleVenueChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.venue.country}
                  onChange={handleVenueChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Date & Time
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="start"
                  value={formData.dateTime.start}
                  onChange={handleDateTimeChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="end"
                  value={formData.dateTime.end}
                  onChange={handleDateTimeChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Pricing
            </h2>
            
            {formData.pricing.tiers.map((tier, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-900">Ticket Tier {index + 1}</h3>
                  {formData.pricing.tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePricingTier(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tier Name *
                    </label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handlePricingChange(index, 'name', e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., General Admission"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => handlePricingChange(index, 'price', e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={tier.quantity}
                      onChange={(e) => handlePricingChange(index, 'quantity', e.target.value)}
                      required
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Available tickets"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPricingTier}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Add Another Tier
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Eye className="h-5 w-5 mr-2" />
              Preview
            </button>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/events/${id}`)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;