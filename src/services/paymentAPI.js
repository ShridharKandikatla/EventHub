const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Payment API service
export const paymentAPI = {
  // Create payment intent
  createPaymentIntent: async (paymentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId, paymentMethodId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error;
    }
  },

  // Get payment status
  getPaymentStatus: async (paymentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get payment status error:', error);
      throw error;
    }
  },

  // Get payment history
  getPaymentHistory: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.eventId) queryParams.append('eventId', filters.eventId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      
      const response = await fetch(`${API_BASE_URL}/payments/history?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get payment history');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error;
    }
  },

  // Process refund
  processRefund: async (paymentId, refundData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(refundData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process refund');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Process refund error:', error);
      throw error;
    }
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get payment details');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get payment details error:', error);
      throw error;
    }
  },

  // Cancel payment
  cancelPayment: async (paymentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel payment');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Cancel payment error:', error);
      throw error;
    }
  },

  // Retry failed payment
  retryPayment: async (paymentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to retry payment');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Retry payment error:', error);
      throw error;
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/methods`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get payment methods');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get payment methods error:', error);
      throw error;
    }
  },

  // Save payment method
  savePaymentMethod: async (paymentMethodData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(paymentMethodData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save payment method');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Save payment method error:', error);
      throw error;
    }
  },

  // Delete payment method
  deletePaymentMethod: async (paymentMethodId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete payment method error:', error);
      throw error;
    }
  },
};