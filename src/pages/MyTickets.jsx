import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ticketsAPI } from '../services/api';
import { format } from 'date-fns';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Download, 
  Share2, 
  MoreVertical,
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await ticketsAPI.getMyTickets();
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (ticketId) => {
    try {
      const response = await ticketsAPI.downloadTicket(ticketId);
      // Handle PDF download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticketId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download ticket:', error);
    }
  };

  const handleShare = (ticket) => {
    if (navigator.share) {
      navigator.share({
        title: `${ticket.event.title} - My Ticket`,
        text: `I'm attending ${ticket.event.title}!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <RefreshCw className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'refunded':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      return new Date(ticket.event.dateTime.start) > new Date() && ticket.paymentStatus === 'completed';
    }
    if (filter === 'past') {
      return new Date(ticket.event.dateTime.start) < new Date();
    }
    return ticket.paymentStatus === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all your event tickets
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Tickets' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'past', label: 'Past Events' },
                { key: 'completed', label: 'Completed' },
                { key: 'pending', label: 'Pending' },
                { key: 'processing', label: 'Processing' },
                { key: 'failed', label: 'Failed' },
                { key: 'cancelled', label: 'Cancelled' },
                { key: 'refunded', label: 'Refunded' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't purchased any tickets yet" 
                : `No ${filter} tickets found`
              }
            </p>
            <Link
              to="/events"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <div key={ticket._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {/* Event Image */}
                <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
                  <img
                    src={ticket.event.media?.images?.[0] || 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop'}
                    alt={ticket.event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.paymentStatus)}`}>
                      {getStatusIcon(ticket.paymentStatus)}
                      <span className="ml-1 capitalize">{ticket.paymentStatus}</span>
                    </span>
                  </div>
                </div>

                {/* Ticket Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {ticket.event.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {format(new Date(ticket.event.dateTime.start), 'MMM dd, yyyy • h:mm a')}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">
                        {ticket.event.venue.name}, {ticket.event.venue.city}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Ticket className="h-4 w-4 mr-2" />
                      <span>
                        {ticket.ticketType} • Qty: {ticket.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      {ticket.paymentStatus === 'completed' && (
                        <>
                          <button
                            onClick={() => handleDownload(ticket._id)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                            title="Download Ticket"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleShare(ticket)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                            title="Share"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {ticket.paymentStatus === 'completed' && (
                        <Link
                          to={`/tickets/${ticket._id}`}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      )}
                      {ticket.paymentStatus === 'failed' && (
                        <button
                          onClick={() => window.location.href = `/events/${ticket.event._id}`}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          Retry Payment
                        </button>
                      )}
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* QR Code Preview for Active Tickets */}
                  {ticket.paymentStatus === 'completed' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-center">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <QrCode className="h-8 w-8 text-gray-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Show this QR code at the event
                      </p>
                    </div>
                  )}

                  {/* Payment Failed Message */}
                  {ticket.paymentStatus === 'failed' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-red-800">Payment Failed</h4>
                            <p className="text-xs text-red-600 mt-1">
                              Your payment could not be processed. Please try booking again.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pending Payment Message */}
                  {ticket.paymentStatus === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800">Payment Pending</h4>
                            <p className="text-xs text-yellow-600 mt-1">
                              Your payment is being processed. This may take a few minutes.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing Payment Message */}
                  {ticket.paymentStatus === 'processing' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <RefreshCw className="h-5 w-5 text-blue-500 mr-2 animate-spin" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-800">Processing Payment</h4>
                            <p className="text-xs text-blue-600 mt-1">
                              Your payment is currently being processed by our payment provider.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cancelled Payment Message */}
                  {ticket.paymentStatus === 'cancelled' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <XCircle className="h-5 w-5 text-gray-500 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-800">Payment Cancelled</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              This payment was cancelled. You can book again if needed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Refunded Payment Message */}
                  {ticket.paymentStatus === 'refunded' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <RefreshCw className="h-5 w-5 text-yellow-500 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800">Payment Refunded</h4>
                            <p className="text-xs text-yellow-600 mt-1">
                              Your payment has been refunded. Please allow 3-5 business days for processing.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;