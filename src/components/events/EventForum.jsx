import React, { useState, useEffect } from 'react';
import { forumsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Users,
  Pin,
  Send,
  Heart,
  Reply,
  MoreVertical,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import { format } from 'date-fns';

const EventForum = ({ eventId }) => {
  const { user, isAuthenticated } = useAuth();
  const [forums, setForums] = useState([]);
  const [selectedForum, setSelectedForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForum, setShowCreateForum] = useState(false);
  const [newForumData, setNewForumData] = useState({
    title: '',
    description: '',
    category: 'general'
  });

  const categories = [
    'general', 'announcements', 'networking', 'q&a', 'feedback', 'technical', 'social'
  ];

  useEffect(() => {
    fetchEventForums();
  }, [eventId]);

  useEffect(() => {
    if (selectedForum) {
      fetchForumPosts(selectedForum._id);
    }
  }, [selectedForum]);

  const fetchEventForums = async () => {
    try {
      setLoading(true);
      const response = await forumsAPI.getEventForums(eventId);
      const eventForums = response.data.forums || [];
      setForums(eventForums);
      
      // Auto-select first forum or general forum
      if (eventForums.length > 0) {
        const generalForum = eventForums.find(f => f.category === 'general') || eventForums[0];
        setSelectedForum(generalForum);
      }
    } catch (error) {
      console.error('Failed to fetch event forums:', error);
      setForums([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchForumPosts = async (forumId) => {
    try {
      const response = await forumsAPI.getPosts(forumId, { sortBy: 'recent' });
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch forum posts:', error);
      setPosts([]);
    }
  };

  const handleCreateForum = async (e) => {
    e.preventDefault();
    if (!newForumData.title.trim()) return;

    try {
      await forumsAPI.createForum({
        ...newForumData,
        eventId,
        isPrivate: true // Event forums are private by default
      });
      setNewForumData({ title: '', description: '', category: 'general' });
      setShowCreateForum(false);
      fetchEventForums();
    } catch (error) {
      console.error('Failed to create forum:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedForum) return;

    try {
      await forumsAPI.addPost(selectedForum._id, newPostContent, []);
      setNewPostContent('');
      setShowNewPostForm(false);
      fetchForumPosts(selectedForum._id);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await forumsAPI.likePost(selectedForum._id, postId);
      fetchForumPosts(selectedForum._id);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleReplyToPost = async (postId, content) => {
    try {
      await forumsAPI.replyToPost(selectedForum._id, postId, content);
      fetchForumPosts(selectedForum._id);
    } catch (error) {
      console.error('Failed to reply to post:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;
    return post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.author.firstName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Forum Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageCircle className="h-6 w-6 mr-2" />
            Event Discussions
          </h2>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreateForum(!showCreateForum)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Topic
            </button>
          )}
        </div>

        {/* Forum Tabs */}
        {forums.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {forums.map((forum) => (
              <button
                key={forum._id}
                onClick={() => setSelectedForum(forum)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  selectedForum?._id === forum._id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {forum.title}
                {forum.isPinned && <Pin className="h-3 w-3 ml-1 inline" />}
              </button>
            ))}
          </div>
        )}

        {/* Create Forum Form */}
        {showCreateForum && isAuthenticated && (
          <form onSubmit={handleCreateForum} className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Create New Discussion Topic</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={newForumData.title}
                onChange={(e) => setNewForumData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Topic title"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <select
                value={newForumData.category}
                onChange={(e) => setNewForumData(prev => ({ ...prev, category: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={newForumData.description}
              onChange={(e) => setNewForumData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description (optional)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForum(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Topic
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        {selectedForum && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Forum Content */}
      <div className="p-6">
        {forums.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No discussions yet</h3>
            <p className="text-gray-600 mb-4">
              Start the conversation! Create the first discussion topic for this event.
            </p>
            {isAuthenticated && (
              <button
                onClick={() => setShowCreateForum(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start Discussion
              </button>
            )}
          </div>
        ) : !selectedForum ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Select a discussion topic to view posts</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Forum Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{selectedForum.title}</h3>
              {selectedForum.description && (
                <p className="text-gray-600 text-sm mb-2">{selectedForum.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{filteredPosts.length} posts</span>
                <span>{new Set(filteredPosts.map(p => p.author._id)).size} participants</span>
              </div>
            </div>

            {/* New Post Form */}
            {isAuthenticated && (
              <div className="border border-gray-200 rounded-lg p-4">
                {!showNewPostForm ? (
                  <button
                    onClick={() => setShowNewPostForm(true)}
                    className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                  >
                    Share your thoughts about this event...
                  </button>
                ) : (
                  <form onSubmit={handleCreatePost}>
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="text-white text-sm font-medium">{user.firstName?.[0]}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          placeholder="What's on your mind about this event?"
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <div className="flex justify-end space-x-2 mt-3">
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
                            disabled={!newPostContent.trim()}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Posts List */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No posts found' : 'No posts yet'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Be the first to share your thoughts!'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <ForumPostCard
                    key={post._id}
                    post={post}
                    onLike={handleLikePost}
                    onReply={handleReplyToPost}
                    currentUser={user}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Simplified Forum Post Component for Event Page
const ForumPostCard = ({ post, onLike, onReply, currentUser }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const isLiked = post.likes && currentUser && post.likes.includes(currentUser.id);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    try {
      await onReply(post._id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
      {/* Post Header */}
      <div className="flex items-start space-x-3 mb-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
          {post.author.avatar ? (
            <img src={post.author.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <span className="text-white text-sm font-medium">
              {post.author.firstName?.[0]}{post.author.lastName?.[0]}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900 text-sm">
              {post.author.firstName} {post.author.lastName}
            </h4>
            <span className="text-xs text-gray-500">
              {format(new Date(post.createdAt), 'MMM dd • h:mm a')}
            </span>
          </div>
          <p className="text-gray-800 text-sm mt-1 leading-relaxed">{post.content}</p>
        </div>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onLike(post._id)}
            disabled={!currentUser}
            className={`flex items-center space-x-1 text-xs ${
              isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
            } transition-colors duration-200`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{post.likes?.length || 0}</span>
          </button>

          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors duration-200"
          >
            <Reply className="h-4 w-4" />
            <span>Reply</span>
          </button>

          {post.replies && post.replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              {showReplies ? 'Hide' : 'Show'} {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && currentUser && (
        <form onSubmit={handleReply} className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex space-x-2">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">{currentUser.firstName?.[0]}</span>
            </div>
            <div className="flex-1">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replyContent.trim()}
                  className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Replies */}
      {showReplies && post.replies && post.replies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          {post.replies.map((reply) => (
            <div key={reply._id} className="flex space-x-2">
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">{reply.author.firstName?.[0]}</span>
              </div>
              <div className="flex-1 bg-gray-50 rounded px-3 py-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-xs text-gray-900">
                    {reply.author.firstName} {reply.author.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(reply.createdAt), 'MMM dd • h:mm a')}
                  </span>
                </div>
                <p className="text-xs text-gray-800">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventForum;