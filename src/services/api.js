import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  verifyEmail: (token) => api.post(`/auth/verify/${token}`),
};

// Events API
export const eventsAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  addToWishlist: (id) => api.post(`/events/${id}/wishlist`),
  joinWaitlist: (id, ticketType) => api.post(`/events/${id}/waitlist`, { ticketType }),
  addReview: (id, rating, comment) => api.post(`/events/${id}/review`, { rating, comment }),
  getRecommendations: (userId) => api.get(`/events/recommendations/${userId}`),
};

// Tickets API
export const ticketsAPI = {
  bookTicket: (bookingData) => api.post('/tickets/book', bookingData),
  getMyTickets: () => api.get('/tickets/my-tickets'),
  getTicket: (id) => api.get(`/tickets/${id}`),
  cancelTicket: (id) => api.put(`/tickets/${id}/cancel`),
  transferTicket: (id, toUserEmail, reason) => api.post(`/tickets/${id}/transfer`, { toUserEmail, reason }),
  checkInTicket: (id, location) => api.post(`/tickets/${id}/checkin`, { location }),
  downloadTicket: (id) => api.get(`/tickets/${id}/download`, { responseType: 'blob' }),
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (amount, currency, paymentMethod) => 
    api.post('/payments/create-intent', { amount, currency, paymentMethod }),
  confirmPayment: (paymentIntentId, ticketId) => 
    api.post('/payments/confirm', { paymentIntentId, ticketId }),
  processRefund: (paymentId, reason) => 
    api.post('/payments/refund', { paymentId, reason }),
  getPaymentHistory: () => api.get('/payments/history'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDashboard: () => api.get('/users/dashboard'),
  updatePreferences: (preferences) => api.put('/users/preferences', { preferences }),
  getWishlist: () => api.get('/users/wishlist'),
  removeFromWishlist: (eventId) => api.delete(`/users/wishlist/${eventId}`),
};

// Notifications API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getEventAnalytics: (eventId) => api.get(`/analytics/event/${eventId}`),
  getDashboardAnalytics: () => api.get('/analytics/dashboard'),
};

// Forums API
export const forumsAPI = {
  getForums: (params) => api.get('/forums', { params }),
  getForum: (id) => api.get(`/forums/${id}`),
  createForum: (forumData) => api.post('/forums', forumData),
  updateForum: (id, forumData) => api.put(`/forums/${id}`, forumData),
  deleteForum: (id) => api.delete(`/forums/${id}`),
  joinForum: (id) => api.post(`/forums/${id}/join`),
  leaveForum: (id) => api.post(`/forums/${id}/leave`),
  getEventForums: (eventId) => api.get(`/forums/event/${eventId}`),
  getPosts: (forumId, params) => api.get(`/forums/${forumId}/posts`, { params }),
  addPost: (forumId, content, attachments) => 
    api.post(`/forums/${forumId}/posts`, { content, attachments }),
  updatePost: (forumId, postId, content) => 
    api.put(`/forums/${forumId}/posts/${postId}`, { content }),
  deletePost: (forumId, postId) => api.delete(`/forums/${forumId}/posts/${postId}`),
  likePost: (forumId, postId) => api.post(`/forums/${forumId}/posts/${postId}/like`),
  unlikePost: (forumId, postId) => api.delete(`/forums/${forumId}/posts/${postId}/like`),
  replyToPost: (forumId, postId, content) => 
    api.post(`/forums/${forumId}/posts/${postId}/reply`, { content }),
  updateReply: (forumId, postId, replyId, content) => 
    api.put(`/forums/${forumId}/posts/${postId}/replies/${replyId}`, { content }),
  deleteReply: (forumId, postId, replyId) => 
    api.delete(`/forums/${forumId}/posts/${postId}/replies/${replyId}`),
  reportPost: (forumId, postId, reason) => 
    api.post(`/forums/${forumId}/posts/${postId}/report`, { reason }),
  pinPost: (forumId, postId) => api.post(`/forums/${forumId}/posts/${postId}/pin`),
  unpinPost: (forumId, postId) => api.delete(`/forums/${forumId}/posts/${postId}/pin`),
};

// Streaming API
export const streamingAPI = {
  getStreamingEvents: () => api.get('/streaming/events'),
  getStreamingAccess: (eventId) => api.get(`/streaming/access/${eventId}`),
};

export default api;