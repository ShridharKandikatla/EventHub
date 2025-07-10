import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  Calendar, 
  User, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  Settings,
  Ticket,
  BarChart3,
  Plus
} from 'lucide-react';
import NotificationDropdown from '../notifications/NotificationDropdown';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, logout, isAuthenticated, isOrganizer } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">EventHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/events" 
              className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
            >
              Events
            </Link>
            
            <Link 
              to="/forums" 
              className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
            >
              Forums
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                >
                  Dashboard
                </Link>
                
                {isOrganizer && (
                  <>
                    <Link 
                      to="/create-event" 
                      className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Event</span>
                    </Link>
                    <Link 
                      to="/analytics" 
                      className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                    >
                      Analytics
                    </Link>
                  </>
                )}

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                  >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {isNotificationsOpen && (
                    <NotificationDropdown 
                      onClose={() => setIsNotificationsOpen(false)} 
                    />
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <span className="font-medium">{user?.firstName}</span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                      <Link
                        to="/my-tickets"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Ticket className="h-4 w-4" />
                        <span>My Tickets</span>
                      </Link>
                      {isOrganizer && (
                        <Link
                          to="/analytics"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span>Analytics</span>
                        </Link>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/events" 
                className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Events
              </Link>
              
              <Link 
                to="/forums" 
                className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Forums
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/my-tickets" 
                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Tickets
                  </Link>
                  <Link 
                    to="/profile" 
                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {isOrganizer && (
                    <>
                      <Link 
                        to="/create-event" 
                        className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Create Event
                      </Link>
                      <Link 
                        to="/analytics" 
                        className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Analytics
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-red-600 hover:text-red-700 transition-colors duration-200 font-medium text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;