import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, analyticsAPI } from '../services/api';
import { 
  Calendar, 
  Ticket, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Star,
  Plus,
  Eye,
  BarChart3,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user, isOrganizer } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [organizerAnalytics, setOrganizerAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    if (isOrganizer) {
      fetchOrganizerAnalytics();
    }
  }, [isOrganizer]);

  const fetchDashboardData = async () => {
    try {
      const response = await usersAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerAnalytics = async () => {
    try {
      const response = await analyticsAPI.getDashboardAnalytics();
      setOrganizerAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch organizer analytics:', error);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            {isOrganizer 
              ? "Manage your events and track your success" 
              : "Discover amazing events and manage your tickets"
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isOrganizer ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {organizerAnalytics?.totalEvents || 0}
                    </p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${organizerAnalytics?.totalRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {organizerAnalytics?.totalTicketsSold || 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Ticket className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {organizerAnalytics?.upcomingEvents || 0}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardData?.upcomingEvents?.length || 0}
                    </p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Past Events</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardData?.pastEvents?.length || 0}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${dashboardData?.totalSpent?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Loyalty Points</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardData?.loyaltyPoints || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {isOrganizer ? (
                <>
                  <Link
                    to="/create-event"
                    className="flex items-center p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
                  >
                    <Plus className="h-5 w-5 text-indigo-600 mr-3" />
                    <span className="font-medium text-indigo-700">Create New Event</span>
                  </Link>
                  <Link
                    to="/analytics"
                    className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
                  >
                    <BarChart3 className="h-5 w-5 text-green-600 mr-3" />
                    <span className="font-medium text-green-700">View Analytics</span>
                  </Link>
                  <Link
                    to="/events"
                    className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  >
                    <Eye className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium text-blue-700">Browse Events</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/events"
                    className="flex items-center p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
                  >
                    <Calendar className="h-5 w-5 text-indigo-600 mr-3" />
                    <span className="font-medium text-indigo-700">Browse Events</span>
                  </Link>
                  <Link
                    to="/my-tickets"
                    className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
                  >
                    <Ticket className="h-5 w-5 text-green-600 mr-3" />
                    <span className="font-medium text-green-700">My Tickets</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  >
                    <Users className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium text-blue-700">Update Profile</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {isOrganizer ? 'Your Upcoming Events' : 'Your Upcoming Events'}
              </h2>
              <Link
                to={isOrganizer ? '/create-event' : '/events'}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                {isOrganizer ? 'Create Event' : 'Browse More'}
              </Link>
            </div>

            {dashboardData?.upcomingEvents?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingEvents.slice(0, 3).map((ticket) => (
                  <div key={ticket._id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{ticket.event?.title}</h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(ticket.event?.dateTime?.start), 'MMM dd, yyyy • h:mm a')}
                      </p>
                      <p className="text-sm text-gray-500">{ticket.event?.venue?.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {isOrganizer 
                    ? "You don't have any upcoming events yet" 
                    : "You don't have any upcoming events"
                  }
                </p>
                <Link
                  to={isOrganizer ? '/create-event' : '/events'}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                  {isOrganizer ? (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Event
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Discover Events
                    </>
                  )}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;