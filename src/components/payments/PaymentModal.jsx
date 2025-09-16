import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";
import { paymentAPI } from "../../services/paymentAPI";
import { ticketsAPI } from "../../services/api";

const PaymentModal = ({ isOpen, onClose, event, ticketType, quantity = 1 }) => {
  const [step, setStep] = useState("payment"); // payment, processing, success, error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [saveCard, setSaveCard] = useState(false);

  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    email: "",
    billingAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
    },
  });

  const ticketPrice =
    event.pricing.tiers.find((t) => t.name === ticketType)?.price * quantity ||
    (0).toFixed(2);
  const processingFee =
    Math.round((ticketPrice * quantity * 0.029 + 0.3) * 100) / 100;
  const totalAmount = ticketPrice * quantity + processingFee;

  useEffect(() => {
    if (isOpen) {
      loadSavedPaymentMethods();
    }
  }, [isOpen]);

  const loadSavedPaymentMethods = async () => {
    try {
      const response = await paymentAPI.getPaymentMethods();
      setSavedMethods(response.data || []);
    } catch (error) {
      console.error("Failed to load payment methods:", error);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field, value) => {
    if (field === "cardNumber") {
      value = formatCardNumber(value);
    } else if (field === "expiryDate") {
      value = formatExpiryDate(value);
    } else if (field === "cvv") {
      value = value.replace(/\D/g, "").substring(0, 4);
    }

    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const validateForm = () => {
    if (selectedMethod) return true;

    const { cardNumber, expiryDate, cvv, cardholderName, email } = formData;

    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 13) {
      setError("Please enter a valid card number");
      return false;
    }

    if (!expiryDate || expiryDate.length !== 5) {
      setError("Please enter a valid expiry date");
      return false;
    }

    if (!cvv || cvv.length < 3) {
      setError("Please enter a valid CVV");
      return false;
    }

    if (!cardholderName.trim()) {
      setError("Please enter the cardholder name");
      return false;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setStep("processing");

    try {
      // Step 1: Create payment intent
      const paymentIntentData = {
        eventId: event.id,
        ticketTypeId: ticketType.id,
        quantity: quantity,
        amount: totalAmount * 100, // Convert to cents
        currency: "usd",
        paymentMethodId: selectedMethod?.id || null,
        savePaymentMethod: saveCard,
        billingDetails: {
          name: formData.cardholderName,
          email: formData.email,
          address: formData.billingAddress,
        },
      };

      const intentResponse = await paymentAPI.createPaymentIntent(
        paymentIntentData
      );
      setPaymentIntent(intentResponse.data);

      // Step 2: If using new card, create payment method
      let paymentMethodId = selectedMethod?.id;

      if (!selectedMethod) {
        const paymentMethodData = {
          type: "card",
          card: {
            number: formData.cardNumber.replace(/\s/g, ""),
            exp_month: parseInt(formData.expiryDate.split("/")[0]),
            exp_year: parseInt("20" + formData.expiryDate.split("/")[1]),
            cvc: formData.cvv,
          },
          billing_details: {
            name: formData.cardholderName,
            email: formData.email,
            address: formData.billingAddress,
          },
        };

        const methodResponse = await paymentAPI.savePaymentMethod(
          paymentMethodData
        );
        paymentMethodId = methodResponse.data.id;
      }

      // Step 3: Confirm payment
      const confirmResponse = await paymentAPI.confirmPayment(
        intentResponse.data.id,
        paymentMethodId
      );

      if (confirmResponse.data.status === "succeeded") {
        // Step 4: Book the ticket
        const bookingData = {
          eventId: event.id,
          ticketTypeId: ticketType.id,
          quantity: quantity,
          paymentIntentId: intentResponse.data.id,
          totalAmount: totalAmount,
        };

        await ticketsAPI.bookTicket(bookingData);

        setStep("success");

        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
          window.location.reload(); // Refresh to show new ticket
        }, 3000);
      } else {
        throw new Error("Payment confirmation failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message || "Payment failed. Please try again.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep("payment");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "payment" && (
          <div className="p-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    {ticketType?.name} × {quantity}
                  </span>
                  <span>${(ticketPrice * quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Processing Fee</span>
                  <span>${processingFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Saved Payment Methods */}
            {savedMethods.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Saved Payment Methods</h3>
                <div className="space-y-2">
                  {savedMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-3 cursor-pointer ${
                        selectedMethod?.id === method.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          •••• •••• •••• {method.last4}
                        </span>
                        <span className="ml-auto text-xs text-gray-500">
                          {method.brand.toUpperCase()} {method.exp_month}/
                          {method.exp_year}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                >
                  Use a different card
                </button>
              </div>
            )}

            {/* Payment Form */}
            {!selectedMethod && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) =>
                        handleInputChange("cardNumber", e.target.value)
                      }
                      placeholder="1234 5678 9012 3456"
                      className="w-full p-3 border border-gray-300 rounded-lg pl-10"
                      maxLength="19"
                    />
                    <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={formData.expiryDate}
                      onChange={(e) =>
                        handleInputChange("expiryDate", e.target.value)
                      }
                      placeholder="MM/YY"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      maxLength="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange("cvv", e.target.value)}
                      placeholder="123"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      maxLength="4"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={formData.cardholderName}
                    onChange={(e) =>
                      handleInputChange("cardholderName", e.target.value)
                    }
                    placeholder="John Doe"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="john@example.com"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Billing Address */}
                <div className="space-y-3">
                  <h4 className="font-medium">Billing Address</h4>
                  <input
                    type="text"
                    value={formData.billingAddress.street}
                    onChange={(e) =>
                      handleInputChange("billingAddress.street", e.target.value)
                    }
                    placeholder="Street Address"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.billingAddress.city}
                      onChange={(e) =>
                        handleInputChange("billingAddress.city", e.target.value)
                      }
                      placeholder="City"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={formData.billingAddress.state}
                      onChange={(e) =>
                        handleInputChange(
                          "billingAddress.state",
                          e.target.value
                        )
                      }
                      placeholder="State"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.billingAddress.zipCode}
                    onChange={(e) =>
                      handleInputChange(
                        "billingAddress.zipCode",
                        e.target.value
                      )
                    }
                    placeholder="ZIP Code"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Save Card Option */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="saveCard"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="saveCard" className="text-sm text-gray-600">
                    Save this card for future purchases
                  </label>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Lock className="w-4 h-4 mr-2" />
                <span>Your payment information is encrypted and secure</span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </div>
              ) : (
                `Pay $${totalAmount.toFixed(2)}`
              )}
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="p-6 text-center">
            <div className="mb-4">
              <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
            <p className="text-gray-600">
              Please wait while we process your payment...
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="p-6 text-center">
            <div className="mb-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your ticket has been booked successfully. You will receive a
              confirmation email shortly.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                Redirecting to your tickets...
              </p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="p-6 text-center">
            <div className="mb-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">Payment Failed</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
