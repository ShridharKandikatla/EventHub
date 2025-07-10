import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MessageCircle, Users, Clock, Pin, Lock } from 'lucide-react';

const ForumCard = ({ forum }) => {
  const getLastActivity = () => {
    if (!forum.posts || forum.posts.length === 0) {
      return format(new Date(forum.createdAt), 'MMM dd, yyyy');
    }
    
    const lastPost = forum.posts[forum.posts.length - 1];
    return format(new Date(lastPost.createdAt), 'MMM dd, yyyy');
  };

  const getPostCount = () => {
    return forum.posts ? forum.posts.length : 0;
  };

  const getParticipantCount = () => {
    if (!forum.posts || forum.posts.length === 0) return 1;
    
    const uniqueUsers = new Set();
    forum.posts.forEach(post => {
      uniqueUsers.add(post.author._id);
    });
    return uniqueUsers.size;
  };

  return (
    <Link
      to={`/forums/${forum._id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {forum.title}
            </h3>
            {forum.isPinned && (
              <Pin className="h-4 w-4 text-indigo-600" />
            )}
            {forum.isPrivate && (
              <Lock className="h-4 w-4 text-gray-500" />
            )}
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {forum.description}
          </p>
          
          {/* Forum Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" />
              <span>{getPostCount()} posts</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{getParticipantCount()} participants</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>Last activity: {getLastActivity()}</span>
            </div>
          </div>
        </div>

        {/* Category Badge */}
        <div className="ml-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {forum.category}
          </span>
        </div>
      </div>

      {/* Latest Post Preview */}
      {forum.posts && forum.posts.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">
                {forum.posts[forum.posts.length - 1].author.firstName?.[0]}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              Latest by {forum.posts[forum.posts.length - 1].author.firstName} {forum.posts[forum.posts.length - 1].author.lastName}
            </span>
          </div>
        </div>
      )}
    </Link>
  );
};

export default ForumCard;