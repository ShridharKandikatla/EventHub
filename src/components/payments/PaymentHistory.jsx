import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, RefreshCw, CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { paymentAPI } from '../../services/paymentAPI';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    loadPaymentHistory();
  }, [currentPage, statusFilter, sortBy]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: sortBy
      };

      const response = await paymentAPI.getPaymentHistory(filters);
      setPayments(response.data.payments || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment || !refundReason.trim()) return;

    try {
      await paymentAPI.processRefund(selectedPayment.id, {
        reason: refundReason,
        amount: selectedPayment.amount // Full refund
      });

      setShowRefundModal(false);
      setSelectedPayment(null);
      setRefundReason('');
      loadPaymentHistory();
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
          <p className="text-gray-600">View and manage your payment transactions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by event name or payment method..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Sort */}
            <div className="md:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'You haven\'t made any payments yet'}
              </p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900 mr-3">
                        {payment.event?.title || 'Event Payment'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1 capitalize">{payment.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>${(payment.amount / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        <span>
                          {payment.paymentMethod?.brand?.toUpperCase()} ••••{payment.paymentMethod?.last4}
                        </span>
                      </div>
                    </div>

                    {payment.description && (
                      <p className="text-sm text-gray-600 mt-2">{payment.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 mt-4 md:mt-0">
                    {/* Download Receipt */}
                    <button
                      onClick={() => window.open(`/api/payments/${payment.id}/receipt`, '_blank')}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Receipt
                    </button>

                    {/* Refund Button */}
                    {payment.status === 'completed' && (
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRefundModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Request Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Request Refund</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for requesting a refund for this payment.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Refund Reason</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please explain why you're requesting a refund..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows="4"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRefund}
                disabled={!refundReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request Refund
              </button>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedPayment(null);
                  setRefundReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;