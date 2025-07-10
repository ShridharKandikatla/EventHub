import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { forumsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Filter,
  Users,
  Globe,
  Lock,
  Pin,
  TrendingUp
} from 'lucide-react';
import ForumCard from '../components/forums/ForumCard';
import CreateForumModal from '../components/forums/CreateForumModal';

const Forums = () => {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: searchParams.get('category') || '',
    privacy: 'all',
    sortBy: 'recent'
  });

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

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'posts', label: 'Most Posts' },
    { value: 'participants', label: 'Most Participants' }
  ];

  useEffect(() => {
    fetchForums();
  }, [filters]);

  const fetchForums = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        privacy: filters.privacy === 'all' ? undefined : filters.privacy
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await forumsAPI.getForums(params);
      setForums(response.data.forums || []);
    } catch (error) {
      console.error('Failed to fetch forums:', error);
      setForums([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForum = async (forumData) => {
    try {
      await forumsAPI.createForum(forumData);
      fetchForums(); // Refresh the list
    } catch (error) {
      console.error('Failed to create forum:', error);
      throw error;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchForums();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Forums</h1>
              <p className="text-gray-600">
                Connect with fellow event enthusiasts, share experiences, and get answers
              </p>
            </div>

            {isAuthenticated && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Forum
              </button>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6">
            <div className="relative max-w-2xl">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search forums, topics, or discussions..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </h3>

              <div className="space-y-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Privacy Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Privacy
                  </label>
                  <select
                    value={filters.privacy}
                    onChange={(e) => handleFilterChange('privacy', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Forums</option>
                    <option value="public">Public Only</option>
                    <option value="private">Private Only</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Community Stats</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Total Forums</span>
                    <span className="font-medium">{forums.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Today</span>
                    <span className="font-medium">
                      {forums.filter(f => {
                        const today = new Date();
                        const forumDate = new Date(f.updatedAt);
                        return forumDate.toDateString() === today.toDateString();
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forums List */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {loading ? 'Loading...' : `${forums.length} Forums`}
              </h2>

              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">View:</span>
                <button className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Forums Grid */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded mb-4 w-full"></div>
                    <div className="flex space-x-4">
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                      <div className="h-3 bg-gray-300 rounded w-24"></div>
                      <div className="h-3 bg-gray-300 rounded w-28"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : forums.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No forums found</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.category 
                    ? "Try adjusting your search or filters" 
                    : "Be the first to start a discussion!"
                  }
                </p>
                {isAuthenticated && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Forum
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {forums.map((forum) => (
                  <ForumCard key={forum._id} forum={forum} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Forum Modal */}
      <CreateForumModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateForum}
      />
    </div>
  );
};

export default Forums;