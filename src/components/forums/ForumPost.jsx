import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Reply,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ForumPost = ({ post, onLike, onReply, onEdit, onDelete, onReport }) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAuthor = user && post.author._id === user.id;
  const isLiked = post.likes && post.likes.includes(user?.id);

  const handleLike = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await onLike(post._id);
    } catch (error) {
      console.error('Failed to like post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    setLoading(true);
    try {
      await onReply(post._id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Failed to reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Forum Post',
        text: post.content.substring(0, 100) + '...',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
            {post.author.avatar ? (
              <img 
                src={post.author.avatar} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-medium">
                {post.author.firstName?.[0]}{post.author.lastName?.[0]}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {post.author.firstName} {post.author.lastName}
            </h4>
            <p className="text-sm text-gray-500">
              {format(new Date(post.createdAt), 'MMM dd, yyyy • h:mm a')}
              {post.createdAt !== post.updatedAt && (
                <span className="ml-2 text-xs">(edited)</span>
              )}
            </p>
          </div>
        </div>

        {/* Post Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              {isAuthor && (
                <>
                  <button
                    onClick={() => {
                      onEdit(post._id);
                      setShowActions(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-3" />
                    Edit Post
                  </button>
                  <button
                    onClick={() => {
                      onDelete(post._id);
                      setShowActions(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-3" />
                    Delete Post
                  </button>
                </>
              )}
              {!isAuthor && (
                <button
                  onClick={() => {
                    onReport(post._id);
                    setShowActions(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  <Flag className="h-4 w-4 mr-3" />
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {post.attachments.map((attachment, index) => (
              <div key={index} className="relative">
                {attachment.type === 'image' ? (
                  <img
                    src={attachment.url}
                    alt="Attachment"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-sm">{attachment.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={loading || !user}
            className={`flex items-center space-x-2 text-sm ${
              isLiked 
                ? 'text-red-600 hover:text-red-700' 
                : 'text-gray-600 hover:text-red-600'
            } transition-colors duration-200`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{post.likes?.length || 0}</span>
          </button>

          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Reply</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>

        {post.replies && post.replies.length > 0 && (
          <span className="text-sm text-gray-500">
            {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
          </span>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && user && (
        <form onSubmit={handleReply} className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Your avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {user.firstName?.[0]}
                </span>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !replyContent.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Replies */}
      {post.replies && post.replies.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {post.replies.map((reply) => (
            <div key={reply._id} className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                {reply.author.avatar ? (
                  <img 
                    src={reply.author.avatar} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-medium">
                    {reply.author.firstName?.[0]}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {reply.author.firstName} {reply.author.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(reply.createdAt), 'MMM dd • h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumPost;