import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  Star,
  Heart,
  Share2,
  Clock,
  DollarSign,
  Ticket,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
  Settings,
  MessageCircle,
} from "lucide-react";
import { eventsAPI, ticketsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import EventForum from "../components/events/EventForum";
import PaymentModal from "../components/payments/PaymentModal";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketType, setSelectedTicketType] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getEvent(id);
      setEvent(response.data);
      if (response.data.pricing?.tiers?.length > 0) {
        setSelectedTicketType(response.data.pricing.tiers[0].name);
      }
    } catch (error) {
      console.error("Failed to fetch event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookTicket = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setBookingLoading(true);
    try {
      const selectedTier = event.pricing.tiers.find(
        (tier) => tier.name === selectedTicketType
      );
      const totalAmount = selectedTier.price * quantity;

      const bookingData = {
        eventId: event._id,
        ticketType: selectedTicketType,
        quantity,
        paymentMethod: "stripe", // Default to stripe
      };

      const response = await ticketsAPI.bookTicket(bookingData);
      console.log(response, "ticket response");

      // Handle successful booking
      alert("Ticket booked successfully!");
      setShowBookingModal(false);
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookTicket1 = (ticketType) => {
    // console.log(ticketType, "handleBookTicket1 ticketType");
    setSelectedTicketType(ticketType);
    setShowPaymentModal(true);
  };

  const handleUpdateEvent = () => {
    navigate(`/events/${event._id}/edit`);
  };

  const handleDeleteEvent = async () => {
    setDeleteLoading(true);
    try {
      await eventsAPI.deleteEvent(event._id);
      alert("Event deleted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const addToWishlist = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await eventsAPI.addToWishlist(event._id);
      alert("Added to wishlist!");
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
    }
  };

  const shareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Event link copied to clipboard!");
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "EEEE, MMMM dd, yyyy");
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), "h:mm a");
  };

  const getAvailableTickets = (tierName) => {
    // console.log(tierName, "getAvailableTickets tierName");
    const tier = event.pricing.tiers.find((t) => t.name === tierName);
    if (!tier) return 0;

    // If sold property doesn't exist, assume 0 sold
    const sold = tier.sold || 0;
    const quantity = tier.quantity || 0;
    // console.log(Math.max(0, quantity - sold), "available tickets");

    return Math.max(0, quantity - sold);
  };

  const getAverageRating = () => {
    if (!event.reviews || event.reviews.length === 0) return 0;
    const sum = event.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / event.reviews.length).toFixed(1);
  };

  const isEventOrganizer = () => {
    return (
      user &&
      event &&
      (user.id === event.organizer?._id || user.id === event.organizer)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Event not found
          </h2>
          <button
            onClick={() => navigate("/events")}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={
            event.media?.images?.[0] ||
            "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop"
          }
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors duration-200 shadow-lg"
        >
          <ArrowLeft className="h-6 w-6 text-gray-900" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex space-x-3">
          {/* Organizer Actions - More Prominent */}
          {isEventOrganizer() && (
            <>
              <button
                onClick={handleUpdateEvent}
                className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors duration-200 shadow-lg flex items-center space-x-2"
                title="Edit Event"
              >
                <Edit className="h-6 w-6" />
                <span className="hidden sm:inline font-medium">Edit</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors duration-200 shadow-lg"
                  title="More Actions"
                >
                  <MoreVertical className="h-6 w-6 text-gray-900" />
                </button>

                {showActionsMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowActionsMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <Trash2 className="h-5 w-5 mr-3" />
                      Delete Event
                    </button>
                    <button
                      onClick={() => {
                        navigate("/analytics");
                        setShowActionsMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Settings className="h-5 w-5 mr-3" />
                      View Analytics
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Regular User Actions */}
          {!isEventOrganizer() && (
            <>
              <button
                onClick={addToWishlist}
                className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors duration-200 shadow-lg"
                title="Add to Wishlist"
              >
                <Heart className="h-6 w-6 text-gray-900" />
              </button>
              <button
                onClick={shareEvent}
                className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors duration-200 shadow-lg"
                title="Share Event"
              >
                <Share2 className="h-6 w-6 text-gray-900" />
              </button>
            </>
          )}
        </div>

        {/* Event Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-indigo-600 px-3 py-1 rounded-full text-sm font-medium">
                {event.category}
              </span>
              {event.reviews && event.reviews.length > 0 && (
                <div className="flex items-center bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm">
                    {getAverageRating()} ({event.reviews.length})
                  </span>
                </div>
              )}
              {isEventOrganizer() && (
                <div className="flex items-center bg-green-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Your Event</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center space-x-6 text-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{formatDate(event.dateTime.start)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span>{formatTime(event.dateTime.start)}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                <span>
                  {event.venue.name}, {event.venue.city}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Organizer Actions for Mobile */}
            {isEventOrganizer() && (
              <div className="lg:hidden bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <Settings className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Event Management
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleUpdateEvent}
                    className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    Edit Event
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete Event
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About This Event
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Venue Details */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Venue Information
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {event.venue.name}
                  </h3>
                  <p className="text-gray-600">{event.venue.address}</p>
                  <p className="text-gray-600">
                    {event.venue.city}, {event.venue.country}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-700">
                      Capacity: {event.venue.capacity}
                    </span>
                  </div>
                  {event.venue.accessibility?.wheelchairAccessible && (
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">
                        Wheelchair Accessible
                      </span>
                    </div>
                  )}
                  {event.venue.accessibility?.parkingAvailable && (
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Parking Available</span>
                    </div>
                  )}
                  {event.venue.accessibility?.publicTransport && (
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">
                        Public Transport Access
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Organizer */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Organizer
              </h2>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {event.organizer?.firstName?.[0]}
                    {event.organizer?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {event.organizer?.firstName} {event.organizer?.lastName}
                  </h3>
                  <p className="text-gray-600">Event Organizer</p>
                </div>
              </div>
            </div>

            {/* Event Forum */}
            <EventForum eventId={event._id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Booking - Only show if not organizer */}
            {!isEventOrganizer() && (
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Get Your Tickets
                </h3>

                {event.pricing?.tiers && event.pricing.tiers.length > 0 ? (
                  <div className="space-y-4">
                    {/* Ticket Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ticket Type
                      </label>
                      <select
                        value={selectedTicketType}
                        onChange={(e) => setSelectedTicketType(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {event.pricing.tiers.map((tier) => (
                          <option key={tier.name} value={tier.name}>
                            {tier.name} - ${tier.price}(
                            {getAvailableTickets(tier.name)} available)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {[
                          ...Array(
                            Math.min(
                              10,
                              getAvailableTickets(selectedTicketType)
                            )
                          ),
                        ]
                          .map((_, i) =>
                            i + 1 <= getAvailableTickets(selectedTicketType) ? (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ) : null
                          )
                          .filter(Boolean)}
                      </select>
                    </div>

                    {/* Total Price */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-gray-900">
                          Total:
                        </span>
                        <span className="text-2xl font-bold text-indigo-600">
                          $
                          {(
                            event.pricing.tiers.find(
                              (t) => t.name === selectedTicketType
                            )?.price * quantity || 0
                          ).toFixed(2)}
                        </span>
                      </div>

                      {getAvailableTickets(selectedTicketType) > 0 ? (
                        <button
                          onClick={() => {
                            setTicketQuantity(quantity);
                            const selectedTier = event.pricing.tiers.find(
                              (t) => t.name === selectedTicketType
                            );
                            handleBookTicket1(selectedTier?.name);
                          }}
                          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center"
                        >
                          <Ticket className="h-5 w-5 mr-2" />
                          Book Now
                        </button>
                      ) : (
                        <div className="text-center">
                          <div className="flex items-center justify-center text-red-600 mb-2">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Sold Out</span>
                          </div>
                          <button
                            onClick={() =>
                              eventsAPI.joinWaitlist(
                                event._id,
                                selectedTicketType
                              )
                            }
                            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200"
                          >
                            Join Waitlist
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">This is a free event!</p>
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                    >
                      Register for Free
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Event Management - Desktop (Only for organizers) */}
            {isEventOrganizer() && (
              <div className="hidden lg:block bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 sticky top-4">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <Settings className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Event Management
                  </h3>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleUpdateEvent}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    Edit Event
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete Event
                  </button>
                  <button
                    onClick={() => navigate("/analytics")}
                    className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    View Analytics
                  </button>
                </div>
              </div>
            )}

            {/* Event Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Event Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Attendees</span>
                  <span className="font-semibold">
                    {event.attendees?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold">
                    {event.analytics?.views || 0}
                  </span>
                </div>
                {event.reviews && event.reviews.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-semibold">
                        {getAverageRating()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Booking
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Event:</span>
                <span className="font-semibold">{event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ticket Type:</span>
                <span className="font-semibold">{selectedTicketType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold">{quantity}</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold text-indigo-600">
                  $
                  {(
                    event.pricing?.tiers?.find(
                      (t) => t.name === selectedTicketType
                    )?.price * quantity || 0
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBookTicket1}
                disabled={bookingLoading}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50"
              >
                {bookingLoading ? "Processing..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Event</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{event.title}"? This action
              cannot be undone and will:
            </p>

            <ul className="text-sm text-gray-600 mb-6 space-y-1">
              <li>• Cancel all existing tickets</li>
              <li>• Remove the event from all searches</li>
              <li>• Delete all event data permanently</li>
            </ul>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            // setSelectedTicketType(null);
          }}
          event={event}
          ticketType={selectedTicketType}
          quantity={ticketQuantity}
        />
      )}
    </div>
  );
};

export default EventDetails;
