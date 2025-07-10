import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { forumsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  MessageCircle, 
  Users, 
  Pin, 
  Lock, 
  Globe,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import ForumPost from '../components/forums/ForumPost';

const ForumDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchForumDetails();
  }, [id]);

  const fetchForumDetails = async () => {
    try {
      setLoading(true);
      const response = await forumsAPI.getForum(id);
      setForum(response.data.forum);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch forum details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setPostLoading(true);
    try {
      await forumsAPI.addPost(id, newPostContent, []);
      setNewPostContent('');
      setShowNewPostForm(false);
      fetchForumDetails(); // Refresh posts
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setPostLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await forumsAPI.likePost(id, postId);
      fetchForumDetails(); // Refresh to update likes
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleReplyToPost = async (postId, content) => {
    try {
      await forumsAPI.replyToPost(id, postId, content);
      fetchForumDetails(); // Refresh to show new reply
    } catch (error) {
      console.error('Failed to reply to post:', error);
    }
  };

  const handleEditPost = (postId) => {
    // Implement edit functionality
    console.log('Edit post:', postId);
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await forumsAPI.deletePost(id, postId);
      fetchForumDetails(); // Refresh posts
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleReportPost = (postId) => {
    // Implement report functionality
    console.log('Report post:', postId);
    alert('Post reported. Thank you for helping keep our community safe.');
  };

  const getParticipantCount = () => {
    if (!posts || posts.length === 0) return 1;
    
    const uniqueUsers = new Set();
    posts.forEach(post => {
      uniqueUsers.add(post.author._id);
      if (post.replies) {
        post.replies.forEach(reply => {
          uniqueUsers.add(reply.author._id);
        });
      }
    });
    return uniqueUsers.size;
  };

  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;
    return post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.author.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.author.lastName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'popular':
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      case 'replies':
        return (b.replies?.length || 0) - (a.replies?.length || 0);
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Forum not found</h2>
          <button
            onClick={() => navigate('/forums')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Forums
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/forums')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{forum.title}</h1>
                {forum.isPinned && (
                  <Pin className="h-5 w-5 text-indigo-600" />
                )}
                {forum.isPrivate ? (
                  <Lock className="h-5 w-5 text-orange-600" />
                ) : (
                  <Globe className="h-5 w-5 text-green-600" />
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {forum.category}
                </span>
              </div>
              {forum.description && (
                <p className="text-gray-600">{forum.description}</p>
              )}
            </div>
          </div>

          {/* Forum Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" />
              <span>{posts.length} posts</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{getParticipantCount()} participants</span>
            </div>
            <div className="flex items-center">
              <span>Created by {forum.creator?.firstName} {forum.creator?.lastName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          {/* Search and Sort */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Liked</option>
              <option value="replies">Most Replies</option>
            </select>
          </div>

          {/* New Post Button */}
          {isAuthenticated && (
            <button
              onClick={() => setShowNewPostForm(!showNewPostForm)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </button>
          )}
        </div>

        {/* New Post Form */}
        {showNewPostForm && isAuthenticated && (
          <form onSubmit={handleCreatePost} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Post</h3>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Your avatar" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium">
                    {user.firstName?.[0]}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind? Share your thoughts with the community..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewPostForm(false);
                      setNewPostContent('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={postLoading || !newPostContent.trim()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {postLoading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Posts List */}
        {sortedPosts.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No posts found' : 'No posts yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Be the first to start the conversation!'
              }
            </p>
            {isAuthenticated && !searchQuery && (
              <button
                onClick={() => setShowNewPostForm(true)}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedPosts.map((post) => (
              <ForumPost
                key={post._id}
                post={post}
                onLike={handleLikePost}
                onReply={handleReplyToPost}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                onReport={handleReportPost}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumDetails;