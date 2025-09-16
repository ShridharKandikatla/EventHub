import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Star, Heart } from 'lucide-react';

const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const getLowestPrice = () => {
    if (!event.pricing?.tiers || event.pricing.tiers.length === 0) return 'Free';
    const prices = event.pricing.tiers.map(tier => tier.price);
    const minPrice = Math.min(...prices);
    return minPrice === 0 ? 'Free' : `$${minPrice}`;
  };

  const getAvailableTickets = () => {
    if (!event.pricing?.tiers) return 0;
    return event.pricing.tiers.reduce((total, tier) => {
      const sold = tier.sold || 0;
      const quantity = tier.quantity || 0;
      return total + Math.max(0, quantity - sold);
    }, 0);
  };

  const getAverageRating = () => {
    if (!event.reviews || event.reviews.length === 0) return 0;
    const sum = event.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / event.reviews.length).toFixed(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.media?.images?.[0] || 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {event.category}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors duration-200">
            <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
          </button>
        </div>
        {getAvailableTickets() < 10 && getAvailableTickets() > 0 && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              Only {getAvailableTickets()} left!
            </span>
          </div>
        )}
      </div>

      {/* Event Content */}
      <div className="p-6">
        {/* Date and Time */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{formatDate(event.dateTime.start)} • {formatTime(event.dateTime.start)}</span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
          {event.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm truncate">{event.venue.name}, {event.venue.city}</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Attendees */}
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              <span>{event.attendees?.length || 0}</span>
            </div>

            {/* Rating */}
            {event.reviews && event.reviews.length > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                <span>{getAverageRating()}</span>
                <span className="ml-1">({event.reviews.length})</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            <span className="text-lg font-bold text-indigo-600">
              {getLowestPrice()}
            </span>
            {getLowestPrice() !== 'Free' && (
              <p className="text-xs text-gray-500">Starting from</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/events/${event._id}`}
          className="block w-full bg-indigo-600 text-white text-center py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default EventCard;