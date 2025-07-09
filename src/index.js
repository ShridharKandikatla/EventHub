// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const forumRoutes = require('./routes/forums');
const streamingRoutes = require('./routes/streaming');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event_platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/streaming', streamingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  avatar: { type: String },
  role: { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' },
  preferences: {
    categories: [String],
    locations: [String],
    priceRange: { min: Number, max: Number },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },
  loyaltyPoints: { type: Number, default: 0 },
  bookingHistory: [{
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    purchaseDate: { type: Date, default: Date.now },
    amount: Number,
    status: { type: String, enum: ['active', 'used', 'cancelled', 'refunded'] }
  }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  accessibility: {
    wheelchairAccess: { type: Boolean, default: false },
    hearingAssistance: { type: Boolean, default: false },
    visualAssistance: { type: Boolean, default: false }
  },
  language: { type: String, default: 'en' },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: String,
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  venue: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    country: { type: String, required: true },
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    capacity: { type: Number, required: true },
    amenities: [String],
    accessibility: {
      wheelchairAccessible: { type: Boolean, default: false },
      parkingAvailable: { type: Boolean, default: false },
      publicTransport: { type: Boolean, default: false }
    }
  },
  dateTime: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' }
  },
  pricing: {
    currency: { type: String, default: 'USD' },
    tiers: [{
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      sold: { type: Number, default: 0 },
      benefits: [String],
      seatMap: {
        section: String,
        rows: [String],
        seats: [String]
      }
    }],
    groupDiscounts: [{
      minQuantity: Number,
      discountPercentage: Number
    }],
    earlyBirdDiscount: {
      percentage: Number,
      validUntil: Date
    }
  },
  media: {
    images: [String],
    videos: [String],
    virtualTour: String,
    arPreview: String
  },
  tags: [String],
  ageRestriction: {
    minimum: Number,
    maximum: Number
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'cancelled', 'postponed', 'completed'], 
    default: 'draft' 
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  features: {
    hasSeating: { type: Boolean, default: false },
    allowsResale: { type: Boolean, default: false },
    hasWaitlist: { type: Boolean, default: false },
    supportsStreaming: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false }
  },
  analytics: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 }
  },
  socialMedia: {
    hashtags: [String],
    shareIncentives: {
      enabled: { type: Boolean, default: false },
      promoCode: String,
      discountPercentage: Number
    }
  },
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ticketType: String,
    checkInTime: Date,
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    }
  }],
  waitlist: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ticketType: String,
    joinedAt: { type: Date, default: Date.now },
    notified: { type: Boolean, default: false }
  }],
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    createdAt: { type: Date, default: Date.now },
    helpful: { type: Number, default: 0 }
  }],
  multiLanguage: {
    translations: [{
      language: String,
      title: String,
      description: String
    }]
  }
}, { timestamps: true });

eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ 'venue.city': 1, category: 1, 'dateTime.start': 1 });
eventSchema.index({ 'venue.coordinates': '2dsphere' });

module.exports = mongoose.model('Event', eventSchema);

// models/Ticket.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticketType: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  transactionId: String,
  qrCode: { type: String, required: true, unique: true },
  seatNumbers: [String],
  status: {
    type: String,
    enum: ['active', 'used', 'cancelled', 'transferred'],
    default: 'active'
  },
  transferHistory: [{
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transferDate: { type: Date, default: Date.now },
    reason: String
  }],
  checkInDetails: {
    checkedIn: { type: Boolean, default: false },
    checkInTime: Date,
    checkInLocation: String,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  downloadInfo: {
    downloaded: { type: Boolean, default: false },
    downloadCount: { type: Number, default: 0 },
    lastDownloaded: Date
  },
  specialRequests: {
    accessibility: [String],
    dietary: [String],
    other: String
  },
  promoCode: String,
  discountApplied: {
    type: String,
    amount: Number,
    percentage: Number
  },
  resaleInfo: {
    availableForResale: { type: Boolean, default: false },
    resalePrice: Number,
    resaleConditions: String
  }
}, { timestamps: true });

ticketSchema.index({ qrCode: 1 });
ticketSchema.index({ event: 1, user: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);

// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  paymentMethod: {
    type: { type: String, required: true }, // stripe, paypal, crypto, upi, wallet, bnpl
    details: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  transactionId: { type: String, required: true },
  gatewayResponse: mongoose.Schema.Types.Mixed,
  installments: [{
    amount: Number,
    dueDate: Date,
    status: { type: String, enum: ['pending', 'paid', 'overdue'] },
    paidDate: Date
  }],
  refundInfo: {
    refunded: { type: Boolean, default: false },
    refundAmount: Number,
    refundDate: Date,
    refundReason: String,
    refundTransactionId: String
  },
  fees: {
    platformFee: Number,
    paymentGatewayFee: Number,
    totalFees: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['booking_confirmation', 'event_reminder', 'event_update', 'payment_success', 'payment_failed', 'waitlist_available', 'event_cancelled', 'refund_processed'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  channels: {
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true }
  },
  status: {
    email: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    sms: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    push: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    inApp: { type: String, enum: ['pending', 'read', 'archived'], default: 'pending' }
  },
  scheduledFor: Date,
  sentAt: {
    email: Date,
    sms: Date,
    push: Date
  },
  readAt: Date,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

// models/Forum.js
const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  title: { type: String, required: true },
  description: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['general', 'meetup', 'carpooling', 'accommodation', 'reviews'], default: 'general' },
  posts: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [String],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [{
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    createdAt: { type: Date, default: Date.now },
    isModerated: { type: Boolean, default: false }
  }],
  tags: [String],
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Forum', forumSchema);

// models/Analytics.js
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  metrics: {
    views: {
      total: { type: Number, default: 0 },
      unique: { type: Number, default: 0 },
      byDate: [{
        date: Date,
        views: Number,
        uniqueViews: Number
      }]
    },
    bookings: {
      total: { type: Number, default: 0 },
      byTicketType: [{
        ticketType: String,
        count: Number,
        revenue: Number
      }],
      byDate: [{
        date: Date,
        bookings: Number,
        revenue: Number
      }]
    },
    revenue: {
      total: { type: Number, default: 0 },
      net: { type: Number, default: 0 },
      fees: { type: Number, default: 0 },
      refunds: { type: Number, default: 0 }
    },
    demographics: {
      ageGroups: [{
        range: String,
        count: Number
      }],
      locations: [{
        city: String,
        count: Number
      }],
      gender: [{
        type: String,
        count: Number
      }]
    },
    engagement: {
      shares: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      forumPosts: { type: Number, default: 0 },
      averageRating: Number,
      reviewCount: { type: Number, default: 0 }
    }
  },
  conversionFunnel: {
    views: Number,
    detailViews: Number,
    cartAdds: Number,
    checkoutStarts: Number,
    completedPurchases: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);

// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const organizer = (req, res, next) => {
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Organizer role required.' });
  }
  next();
};

const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

module.exports = { auth, organizer, admin };

// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      verificationToken
    });

    await user.save();

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verify Your Account',
      text: `Please verify your account by clicking: ${process.env.FRONTEND_URL}/verify/${verificationToken}`
    });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email
router.post('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    id: req.user._id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    isVerified: req.user.isVerified,
    preferences: req.user.preferences,
    loyaltyPoints: req.user.loyaltyPoints
  });
});

module.exports = router;

// routes/events.js
const express = require('express');
const Event = require('../models/Event');
const Analytics = require('../models/Analytics');
const { auth, organizer } = require('../middleware/auth');
const { generateRecommendations } = require('../utils/recommendations');

const router = express.Router();

// Get all events with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      city,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      search,
      sortBy = 'dateTime.start'
    } = req.query;

    const query = { status: 'published' };

    // Apply filters
    if (category) query.category = category;
    if (city) query['venue.city'] = new RegExp(city, 'i');
    if (startDate || endDate) {
      query['dateTime.start'] = {};
      if (startDate) query['dateTime.start'].$gte = new Date(startDate);
      if (endDate) query['dateTime.start'].$lte = new Date(endDate);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName email')
      .populate('reviews.user', 'firstName lastName')
      .populate('attendees.user', 'firstName lastName');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Increment view count
    event.analytics.views += 1;
    await event.save();

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event
router.post('/', auth, organizer, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id
    };

    const event = new Event(eventData);
    await event.save();

    // Create analytics record
    const analytics = new Analytics({
      event: event._id,
      organizer: req.user._id
    });
    await analytics.save();

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event
router.put('/:id', auth, organizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('organizer', 'firstName lastName');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', auth, organizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recommendations for user
router.get('/recommendations/:userId', auth, async (req, res) => {
  try {
    const recommendations = await generateRecommendations(req.params.userId);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add to wishlist
router.post('/:id/wishlist', auth, async (req, res) => {
  try {
    const user = req.user;
    const eventId = req.params.id;

    if (!user.wishlist.includes(eventId)) {
      user.wishlist.push(eventId);
      await user.save();
    }

    res.json({ message: 'Added to wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Join waitlist
router.post('/:id/waitlist', auth, async (req, res) => {
  try {
    const { ticketType } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existingWaitlist = event.waitlist.find(
      item => item.user.toString() === req.user._id.toString() && item.ticketType === ticketType
    );

    if (existingWaitlist) {// Continuing routes/events.js
        return res.status(400).json({ message: 'Already on waitlist' });
      }
  
      event.waitlist.push({
        user: req.user._id,
        ticketType
      });
  
      await event.save();
      res.json({ message: 'Added to waitlist successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Add review
  router.post('/:id/review', auth, async (req, res) => {
    try {
      const { rating, comment } = req.body;
      const event = await Event.findById(req.params.id);
  
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      // Check if user has already reviewed
      const existingReview = event.reviews.find(
        review => review.user.toString() === req.user._id.toString()
      );
  
      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this event' });
      }
  
      event.reviews.push({
        user: req.user._id,
        rating,
        comment
      });
  
      await event.save();
      res.json({ message: 'Review added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/tickets.js
  const express = require('express');
  const QRCode = require('qrcode');
  const Ticket = require('../models/Ticket');
  const Event = require('../models/Event');
  const Payment = require('../models/Payment');
  const User = require('../models/User');
  const { auth } = require('../middleware/auth');
  const { processPayment } = require('../utils/payment');
  const { sendTicketEmail } = require('../utils/email');
  
  const router = express.Router();
  
  // Create ticket booking
  router.post('/book', auth, async (req, res) => {
    try {
      const {
        eventId,
        ticketType,
        quantity,
        seatNumbers,
        paymentMethod,
        promoCode,
        specialRequests
      } = req.body;
  
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      // Find ticket tier
      const tier = event.pricing.tiers.find(t => t.name === ticketType);
      if (!tier) {
        return res.status(400).json({ message: 'Invalid ticket type' });
      }
  
      // Check availability
      if (tier.sold + quantity > tier.quantity) {
        return res.status(400).json({ message: 'Not enough tickets available' });
      }
  
      let totalAmount = tier.price * quantity;
  
      // Apply discount if promo code is valid
      if (promoCode) {
        // Implement promo code logic
        const discount = await validatePromoCode(promoCode, eventId);
        if (discount) {
          totalAmount = totalAmount * (1 - discount.percentage / 100);
        }
      }
  
      // Generate QR code
      const qrCodeData = `${eventId}-${req.user._id}-${Date.now()}`;
      const qrCode = await QRCode.toDataURL(qrCodeData);
  
      // Create ticket
      const ticket = new Ticket({
        event: eventId,
        user: req.user._id,
        ticketType,
        quantity,
        totalAmount,
        seatNumbers,
        qrCode: qrCodeData,
        promoCode,
        specialRequests
      });
  
      await ticket.save();
  
      // Process payment
      const payment = await processPayment({
        amount: totalAmount,
        currency: event.pricing.currency,
        paymentMethod,
        ticketId: ticket._id,
        userId: req.user._id
      });
  
      if (payment.status === 'completed') {
        ticket.paymentStatus = 'completed';
        tier.sold += quantity;
        
        // Update user loyalty points
        req.user.loyaltyPoints += Math.floor(totalAmount / 10);
        
        await Promise.all([ticket.save(), event.save(), req.user.save()]);
  
        // Send ticket email
        await sendTicketEmail(req.user.email, ticket, event);
  
        res.status(201).json({
          ticket,
          payment,
          qrCode
        });
      } else {
        res.status(400).json({ message: 'Payment failed' });
      }
    } catch (error) {
      console.error('Booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get user tickets
  router.get('/my-tickets', auth, async (req, res) => {
    try {
      const tickets = await Ticket.find({ user: req.user._id })
        .populate('event', 'title dateTime venue status')
        .sort({ createdAt: -1 });
  
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get ticket by ID
  router.get('/:id', auth, async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id)
        .populate('event')
        .populate('user', 'firstName lastName email');
  
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      // Check if user owns the ticket or is event organizer
      const event = await Event.findById(ticket.event._id);
      if (ticket.user._id.toString() !== req.user._id.toString() && 
          event.organizer.toString() !== req.user._id.toString() &&
          req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Cancel ticket
  router.put('/:id/cancel', auth, async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      if (ticket.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      if (ticket.status === 'cancelled') {
        return res.status(400).json({ message: 'Ticket already cancelled' });
      }
  
      ticket.status = 'cancelled';
      await ticket.save();
  
      // Process refund
      const payment = await Payment.findOne({ ticket: ticket._id });
      if (payment) {
        // Implement refund logic
        await processRefund(payment);
      }
  
      res.json({ message: 'Ticket cancelled successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Transfer ticket
  router.post('/:id/transfer', auth, async (req, res) => {
    try {
      const { toUserEmail, reason } = req.body;
      const ticket = await Ticket.findById(req.params.id);
  
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      if (ticket.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      const toUser = await User.findOne({ email: toUserEmail });
      if (!toUser) {
        return res.status(404).json({ message: 'Recipient user not found' });
      }
  
      ticket.transferHistory.push({
        fromUser: req.user._id,
        toUser: toUser._id,
        reason
      });
  
      ticket.user = toUser._id;
      await ticket.save();
  
      res.json({ message: 'Ticket transferred successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Check-in ticket
  router.post('/:id/checkin', auth, async (req, res) => {
    try {
      const { location } = req.body;
      const ticket = await Ticket.findById(req.params.id);
  
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      if (ticket.checkInDetails.checkedIn) {
        return res.status(400).json({ message: 'Ticket already checked in' });
      }
  
      ticket.checkInDetails = {
        checkedIn: true,
        checkInTime: new Date(),
        checkInLocation: location,
        verifiedBy: req.user._id
      };
  
      ticket.status = 'used';
      await ticket.save();
  
      res.json({ message: 'Check-in successful' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Download ticket
  router.get('/:id/download', auth, async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id)
        .populate('event')
        .populate('user', 'firstName lastName email');
  
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      if (ticket.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      // Update download info
      ticket.downloadInfo.downloaded = true;
      ticket.downloadInfo.downloadCount += 1;
      ticket.downloadInfo.lastDownloaded = new Date();
      await ticket.save();
  
      // Generate PDF ticket (implement PDF generation)
      const pdfBuffer = await generateTicketPDF(ticket);
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket._id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/payments.js
  const express = require('express');
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const Payment = require('../models/Payment');
  const Ticket = require('../models/Ticket');
  const { auth } = require('../middleware/auth');
  
  const router = express.Router();
  
  // Create payment intent
  router.post('/create-intent', auth, async (req, res) => {
    try {
      const { amount, currency = 'usd', paymentMethod } = req.body;
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        payment_method_types: ['card'],
        metadata: {
          userId: req.user._id.toString()
        }
      });
  
      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Confirm payment
  router.post('/confirm', auth, async (req, res) => {
    try {
      const { paymentIntentId, ticketId } = req.body;
  
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
      if (paymentIntent.status === 'succeeded') {
        const payment = new Payment({
          user: req.user._id,
          ticket: ticketId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          paymentMethod: {
            type: 'stripe',
            details: paymentIntent.payment_method
          },
          status: 'completed',
          transactionId: paymentIntent.id,
          gatewayResponse: paymentIntent
        });
  
        await payment.save();
  
        // Update ticket status
        await Ticket.findByIdAndUpdate(ticketId, {
          paymentStatus: 'completed',
          paymentMethod: 'stripe',
          transactionId: paymentIntent.id
        });
  
        res.json({ message: 'Payment confirmed', payment });
      } else {
        res.status(400).json({ message: 'Payment not completed' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Process refund
  router.post('/refund', auth, async (req, res) => {
    try {
      const { paymentId, reason } = req.body;
  
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
  
      // Check if user owns the payment
      if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      if (payment.paymentMethod.type === 'stripe') {
        const refund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          amount: payment.amount * 100
        });
  
        payment.refundInfo = {
          refunded: true,
          refundAmount: payment.amount,
          refundDate: new Date(),
          refundReason: reason,
          refundTransactionId: refund.id
        };
  
        payment.status = 'refunded';
      }
  
      await payment.save();
      res.json({ message: 'Refund processed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get payment history
  router.get('/history', auth, async (req, res) => {
    try {
      const payments = await Payment.find({ user: req.user._id })
        .populate('ticket')
        .sort({ createdAt: -1 });
  
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/users.js
  const express = require('express');
  const User = require('../models/User');
  const Event = require('../models/Event');
  const Ticket = require('../models/Ticket');
  const { auth } = require('../middleware/auth');
  const { uploadAvatar } = require('../utils/upload');
  
  const router = express.Router();
  
  // Get user profile
  router.get('/profile', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .populate('wishlist', 'title dateTime venue')
        .populate('bookingHistory.eventId', 'title dateTime venue');
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Update user profile
  router.put('/profile', auth, async (req, res) => {
    try {
      const updates = req.body;
      delete updates.password; // Don't allow password updates through this route
  
      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      );
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Upload avatar
  router.post('/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
  
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: req.file.location },
        { new: true }
      );
  
      res.json({ avatar: user.avatar });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get user dashboard
  router.get('/dashboard', auth, async (req, res) => {
    try {
      const userId = req.user._id;
  
      const [upcomingEvents, pastEvents, totalSpent, loyaltyPoints] = await Promise.all([
        Ticket.find({ user: userId, status: 'active' })
          .populate('event', 'title dateTime venue')
          .sort({ 'event.dateTime.start': 1 }),
        Ticket.find({ user: userId, status: 'used' })
          .populate('event', 'title dateTime venue')
          .sort({ 'event.dateTime.start': -1 }),
        Ticket.aggregate([
          { $match: { user: userId, paymentStatus: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        User.findById(userId).select('loyaltyPoints')
      ]);
  
      res.json({
        upcomingEvents,
        pastEvents,
        totalSpent: totalSpent[0]?.total || 0,
        loyaltyPoints: loyaltyPoints.loyaltyPoints
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Update preferences
  router.put('/preferences', auth, async (req, res) => {
    try {
      const { preferences } = req.body;
  
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { preferences },
        { new: true }
      );
  
      res.json({ message: 'Preferences updated', preferences: user.preferences });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get wishlist
  router.get('/wishlist', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .populate('wishlist', 'title description dateTime venue pricing status');
  
      res.json(user.wishlist);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Remove from wishlist
  router.delete('/wishlist/:eventId', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      user.wishlist = user.wishlist.filter(
        eventId => eventId.toString() !== req.params.eventId
      );
      await user.save();
  
      res.json({ message: 'Removed from wishlist' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/notifications.js
  const express = require('express');
  const Notification = require('../models/Notification');
  const { auth } = require('../middleware/auth');
  const { sendNotification } = require('../utils/notifications');
  
  const router = express.Router();
  
  // Get user notifications
  router.get('/', auth, async (req, res) => {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
  
      const query = { user: req.user._id };
      if (unreadOnly === 'true') {
        query['status.inApp'] = 'pending';
      }
  
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
  
      const unreadCount = await Notification.countDocuments({
        user: req.user._id,
        'status.inApp': 'pending'
      });
  
      res.json({ notifications, unreadCount });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Mark notification as read
  router.put('/:id/read', auth, async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { 
          'status.inApp': 'read',
          readAt: new Date()
        },
        { new: true }
      );
  
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
  
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Mark all notifications as read
  router.put('/read-all', auth, async (req, res) => {
    try {
      await Notification.updateMany(
        { user: req.user._id, 'status.inApp': 'pending' },
        { 
          'status.inApp': 'read',
          readAt: new Date()
        }
      );
  
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Delete notification
  router.delete('/:id', auth, async (req, res) => {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });
  
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
  
      res.json({ message: 'Notification deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Send notification (admin only)
  router.post('/send', auth, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      const { userId, type, title, message, channels, data } = req.body;
  
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        channels,
        data
      });
  
      await notification.save();
      await sendNotification(notification);
  
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/analytics.js
  const express = require('express');
  const Analytics = require('../models/Analytics');
  const Event = require('../models/Event');
  const Ticket = require('../models/Ticket');
  const { auth, organizer } = require('../middleware/auth');
  
  const router = express.Router();
  
  // Get event analytics
  router.get('/event/:eventId', auth, organizer, async (req, res) => {
    try {
      const eventId = req.params.eventId;
      
      // Verify user owns the event
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      let analytics = await Analytics.findOne({ event: eventId });
      
      if (!analytics) {
        analytics = new Analytics({
          event: eventId,
          organizer: req.user._id
        });
        await analytics.save();
      }
  
      // Get real-time data
      const tickets = await Ticket.find({ event: eventId, paymentStatus: 'completed' });
      const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.totalAmount, 0);
      const totalBookings = tickets.length;
  
      // Update analytics
      analytics.metrics.bookings.total = totalBookings;
      analytics.metrics.revenue.total = totalRevenue;
      
      await analytics.save();
  
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get organizer dashboard analytics
  router.get('/dashboard', auth, organizer, async (req, res) => {
    try {
      const organizerId = req.user._id;
  
      const [totalEvents, totalRevenue, totalTicketsSold, upcomingEvents] = await Promise.all([
        Event.countDocuments({ organizer: organizerId }),
        Analytics.aggregate([
          { $match: { organizer: organizerId } },
          { $group: { _id: null, total: { $sum: '$metrics.revenue.total' } } }
        ]),
        Ticket.aggregate([
          { $lookup: { from: 'events', localField: 'event', foreignField: '_id', as: 'eventData' } },
          { $match: { 'eventData.organizer': organizerId, paymentStatus: 'completed' } },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]),
        Event.countDocuments({
          organizer: organizerId,
          'dateTime.start': { $gte: new Date() },
          status: 'published'
        })
      ]);
  
      res.json({
        totalEvents,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalTicketsSold: totalTicketsSold[0]?.total || 0,
        upcomingEvents
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/forums.js
  const express = require('express');
  const Forum = require('../models/Forum');
  const Event = require('../models/Event');
  const { auth } = require('../middleware/auth');
  
  const router = express.Router();
  
  // Get event forums
  router.get('/event/:eventId', async (req, res) => {
    try {
      const forums = await Forum.find({ event: req.params.eventId })
        .populate('creator', 'firstName lastName')
        .populate('posts.author', 'firstName lastName')
        .sort({ isPinned: -1, lastActivity: -1 });
  
      res.json(forums);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Create forum
  router.post('/', auth, async (req, res) => {
    try {
      const { eventId, title, description, category } = req.body;
  
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      const forum = new Forum({
        event: eventId,
        title,
        description,
        creator: req.user._id,
        category
      });
  
      await forum.save();
      res.status(201).json(forum);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Add post to forum
  router.post('/:forumId/posts', auth, async (req, res) => {
    try {
      const { content, attachments } = req.body;
  
      const forum = await Forum.findById(req.params.forumId);
      if (!forum) {
        return res.status(404).json({ message: 'Forum not found' });
      }
  
      forum.posts.push({
        author: req.user._id,
        content,
        attachments
      });
  
      forum.lastActivity = new Date();
      await forum.save();
  
      res.json({ message: 'Post added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Like post
  router.post('/:forumId/posts/:postId/like', auth, async (req, res) => {
    try {
      const forum = await Forum.findById(req.params.forumId);
      if (!forum) {
        return res.status(404).json({ message: 'Forum not found' });
      }
  
      const post = forum.posts.id(req.params.postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      const likeIndex = post.likes.indexOf(req.user._id);
      if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1);
      } else {
        post.likes.push(req.user._id);
      }
  
      await forum.save();
      res.json({ message: 'Like toggled successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Reply to post
  router.post('/:forumId/posts/:postId/reply', auth, async (req, res) => {
    try {
      const { content } = req.body;
  
      const forum = await Forum.findById(req.params.forumId);
      if (!forum) {
        return res.status(404).json({ message: 'Forum not found' });
      }
  
      const post = forum.posts.id(req.params.postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      post.replies.push({
        author: req.user._id,
        content
      });
  
      forum.lastActivity = new Date();
      await forum.save();
  
      res.json({ message: 'Reply added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/streaming.js
  const express = require('express');
  const Event = require('../models/Event');
  const Ticket = require('../models/Ticket');
  const { auth } = require('../middleware/auth');
  
  const router = express.Router();
  
  // Get streaming events
  router.get('/events', async (req, res) => {
    try {
      const streamingEvents = await Event.find({
        'features.supportsStreaming': true,
        status: 'published',
        'dateTime.start': { $gte: new Date() }
      }).populate('organizer', 'firstName lastName');
  
      res.json(streamingEvents);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get streaming access for ticket holder
  router.get('/access/:eventId', auth, async (req, res) => {
    try {
      const eventId = req.params.eventId;
  
      // Check if user has valid ticket
      const ticket = await Ticket.findOne({
        user: req.user._id,
        event: eventId,
        paymentStatus: 'completed',
        status: { $in: ['active', 'used'] }
      });
  
      if (!ticket) {
        return res.status(403).json({ message: 'No valid ticket found for streaming access' });
      }
  
      const event = await Event.findById(eventId);
      if (!event || !event.features.supportsStreaming) {// Continuing routes/events.js
        return res.status(400).json({ message: 'Already on waitlist' });
      }
  
      event.waitlist.push({
        user: req.user._id,
        ticketType
      });
  
      await event.save();
      res.json({ message: 'Added to waitlist successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Add review
  router.post('/:id/review', auth, async (req, res) => {
    try {
      const { rating, comment } = req.body;
      const event = await Event.findById(req.params.id);
  
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      // Check if user has already reviewed
      const existingReview = event.reviews.find(
        review => review.user.toString() === req.user._id.toString()
      );
  
      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this event' });
      }
  
      event.reviews.push({
        user: req.user._id,
        rating,
        comment
      });
  
      await event.save();
      res.json({ message: 'Review added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/tickets.js
  const express = require('express');
  const QRCode = require('qrcode');
  const Ticket = require('../models/Ticket');
  const Event = require('../models/Event');
  const Payment = require('../models/Payment');
  const User = require('../models/User');
  const { auth } = require('../middleware/auth');
  const { processPayment } = require('../utils/payment');
  const { sendTicketEmail } = require('../utils/email');
  
  const router = express.Router();
  
  // Create ticket booking
  router.post('/book', auth, async (req, res) => {
    try {
      const {
        eventId,
        ticketType,
        quantity,
        seatNumbers,
        paymentMethod,
        promoCode,
        specialRequests
      } = req.body;
  
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      // Find ticket tier
      const tier = event.pricing.tiers.find(t => t.name === ticketType);
      if (!tier) {
        return res.status(400).json({ message: 'Invalid ticket type' });
      }
  
      // Check availability
      if (tier.sold + quantity > tier.quantity) {
        return res.status(400).json({ message: 'Not enough tickets available' });
      }
  
      let totalAmount = tier.price * quantity;
  
      // Apply discount if promo code is valid
      if (promoCode) {
        // Implement promo code logic
        const discount = await validatePromoCode(promoCode, eventId);
        if (discount) {
          totalAmount = totalAmount * (1 - discount.percentage / 100);
        }
      }
  
      // Generate QR code
      const qrCodeData = `${eventId}-${req.user._id}-${Date.now()}`;
      const qrCode = await QRCode.toDataURL(qrCodeData);
  
      // Create ticket
      const ticket = new Ticket({
        event: eventId,
        user: req.user._id,
        ticketType,
        quantity,
        totalAmount,
        seatNumbers,
        qrCode: qrCodeData,
        promoCode,
        specialRequests
      });
  
      await ticket.save();
  
      // Process payment
      const payment = await processPayment({
        amount: totalAmount,
        currency: event.pricing.currency,
        paymentMethod,
        ticketId: ticket._id,
        userId: req.user._id
      });
  
      if (payment.status === 'completed') {
        ticket.paymentStatus = 'completed';
        tier.sold += quantity;
        
        // Update user loyalty points
        req.user.loyaltyPoints += Math.floor(totalAmount / 10);
        
        await Promise.all([ticket.save(), event.save(), req.user.save()]);
  
        // Send ticket email
        await sendTicketEmail(req.user.email, ticket, event);
  
        res.status(201).json({
          ticket,
          payment,
          qrCode
        });
      } else {
        res.status(400).json({ message: 'Payment failed' });
      }
    } catch (error) {
      console.error('Booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get user tickets
  router.get('/my-tickets', auth, async (req, res) => {
    try {
      const tickets = await Ticket.find({ user: req.user._id })
        .populate('event', 'title dateTime venue status')
        .sort({ createdAt: -1 });
  
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get ticket by ID
  router.get('/:id', auth, async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id)
        .populate('event')
        .populate('user', 'firstName lastName email');
  
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      // Check if user owns the ticket or is event organizer
      const event = await Event.findById(ticket.event._id);
      if (ticket.user._id.toString() !== req.user._id.toString() && 
          event.organizer.toString() !== req.user._id.toString() &&
          req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Cancel ticket
  router.put('/:id/cancel', auth, async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      if (ticket.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      if (ticket.status === 'cancelled') {
        return res.status(400).json({ message: 'Ticket already cancelled' });
      }
  
      ticket.status = 'cancelled';
      await ticket.save();
  
      // Process refund
      const payment = await Payment.findOne({ ticket: ticket._id });
      if (payment) {
        // Implement refund logic
        await processRefund(payment);
      }
  
      res.json({ message: 'Ticket cancelled successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Transfer ticket
  router.post('/:id/transfer', auth, async (req, res) => {
    try {
      const { toUserEmail, reason } = req.body;
      const ticket = await Ticket.findById(req.params.id);
  
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      if (ticket.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      const toUser = await User.findOne({ email: toUserEmail });
      if (!toUser) {
        return res.status(404).json({ message: 'Recipient user not found' });
      }
  
      ticket.transferHistory.push({
        fromUser: req.user._id,
        toUser: toUser._id,
        reason
      });
  
      ticket.user = toUser._id;
      await ticket.save();
  
      res.json({ message: 'Ticket transferred successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Check-in ticket
  router.post('/:id/checkin', auth, async (req, res) => {
    try {
      const { location } = req.body;
      const ticket = await Ticket.findById(req.params.id);
  
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      if (ticket.checkInDetails.checkedIn) {
        return res.status(400).json({ message: 'Ticket already checked in' });
      }
  
      ticket.checkInDetails = {
        checkedIn: true,
        checkInTime: new Date(),
        checkInLocation: location,
        verifiedBy: req.user._id
      };
  
      ticket.status = 'used';
      await ticket.save();
  
      res.json({ message: 'Check-in successful' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Download ticket
  router.get('/:id/download', auth, async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id)
        .populate('event')
        .populate('user', 'firstName lastName email');
  
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      if (ticket.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      // Update download info
      ticket.downloadInfo.downloaded = true;
      ticket.downloadInfo.downloadCount += 1;
      ticket.downloadInfo.lastDownloaded = new Date();
      await ticket.save();
  
      // Generate PDF ticket (implement PDF generation)
      const pdfBuffer = await generateTicketPDF(ticket);
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket._id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/payments.js
  const express = require('express');
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const Payment = require('../models/Payment');
  const Ticket = require('../models/Ticket');
  const { auth } = require('../middleware/auth');
  
  const router = express.Router();
  
  // Create payment intent
  router.post('/create-intent', auth, async (req, res) => {
    try {
      const { amount, currency = 'usd', paymentMethod } = req.body;
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        payment_method_types: ['card'],
        metadata: {
          userId: req.user._id.toString()
        }
      });
  
      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Confirm payment
  router.post('/confirm', auth, async (req, res) => {
    try {
      const { paymentIntentId, ticketId } = req.body;
  
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
      if (paymentIntent.status === 'succeeded') {
        const payment = new Payment({
          user: req.user._id,
          ticket: ticketId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          paymentMethod: {
            type: 'stripe',
            details: paymentIntent.payment_method
          },
          status: 'completed',
          transactionId: paymentIntent.id,
          gatewayResponse: paymentIntent
        });
  
        await payment.save();
  
        // Update ticket status
        await Ticket.findByIdAndUpdate(ticketId, {
          paymentStatus: 'completed',
          paymentMethod: 'stripe',
          transactionId: paymentIntent.id
        });
  
        res.json({ message: 'Payment confirmed', payment });
      } else {
        res.status(400).json({ message: 'Payment not completed' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Process refund
  router.post('/refund', auth, async (req, res) => {
    try {
      const { paymentId, reason } = req.body;
  
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
  
      // Check if user owns the payment
      if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      if (payment.paymentMethod.type === 'stripe') {
        const refund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          amount: payment.amount * 100
        });
  
        payment.refundInfo = {
          refunded: true,
          refundAmount: payment.amount,
          refundDate: new Date(),
          refundReason: reason,
          refundTransactionId: refund.id
        };
  
        payment.status = 'refunded';
      }
  
      await payment.save();
      res.json({ message: 'Refund processed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get payment history
  router.get('/history', auth, async (req, res) => {
    try {
      const payments = await Payment.find({ user: req.user._id })
        .populate('ticket')
        .sort({ createdAt: -1 });
  
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/users.js
  const express = require('express');
  const User = require('../models/User');
  const Event = require('../models/Event');
  const Ticket = require('../models/Ticket');
  const { auth } = require('../middleware/auth');
  const { uploadAvatar } = require('../utils/upload');
  
  const router = express.Router();
  
  // Get user profile
  router.get('/profile', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .populate('wishlist', 'title dateTime venue')
        .populate('bookingHistory.eventId', 'title dateTime venue');
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Update user profile
  router.put('/profile', auth, async (req, res) => {
    try {
      const updates = req.body;
      delete updates.password; // Don't allow password updates through this route
  
      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      );
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Upload avatar
  router.post('/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
  
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: req.file.location },
        { new: true }
      );
  
      res.json({ avatar: user.avatar });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get user dashboard
  router.get('/dashboard', auth, async (req, res) => {
    try {
      const userId = req.user._id;
  
      const [upcomingEvents, pastEvents, totalSpent, loyaltyPoints] = await Promise.all([
        Ticket.find({ user: userId, status: 'active' })
          .populate('event', 'title dateTime venue')
          .sort({ 'event.dateTime.start': 1 }),
        Ticket.find({ user: userId, status: 'used' })
          .populate('event', 'title dateTime venue')
          .sort({ 'event.dateTime.start': -1 }),
        Ticket.aggregate([
          { $match: { user: userId, paymentStatus: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        User.findById(userId).select('loyaltyPoints')
      ]);
  
      res.json({
        upcomingEvents,
        pastEvents,
        totalSpent: totalSpent[0]?.total || 0,
        loyaltyPoints: loyaltyPoints.loyaltyPoints
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Update preferences
  router.put('/preferences', auth, async (req, res) => {
    try {
      const { preferences } = req.body;
  
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { preferences },
        { new: true }
      );
  
      res.json({ message: 'Preferences updated', preferences: user.preferences });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get wishlist
  router.get('/wishlist', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .populate('wishlist', 'title description dateTime venue pricing status');
  
      res.json(user.wishlist);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Remove from wishlist
  router.delete('/wishlist/:eventId', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      user.wishlist = user.wishlist.filter(
        eventId => eventId.toString() !== req.params.eventId
      );
      await user.save();
  
      res.json({ message: 'Removed from wishlist' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/notifications.js
  const express = require('express');
  const Notification = require('../models/Notification');
  const { auth } = require('../middleware/auth');
  const { sendNotification } = require('../utils/notifications');
  
  const router = express.Router();
  
  // Get user notifications
  router.get('/', auth, async (req, res) => {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
  
      const query = { user: req.user._id };
      if (unreadOnly === 'true') {
        query['status.inApp'] = 'pending';
      }
  
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
  
      const unreadCount = await Notification.countDocuments({
        user: req.user._id,
        'status.inApp': 'pending'
      });
  
      res.json({ notifications, unreadCount });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Mark notification as read
  router.put('/:id/read', auth, async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { 
          'status.inApp': 'read',
          readAt: new Date()
        },
        { new: true }
      );
  
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
  
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Mark all notifications as read
  router.put('/read-all', auth, async (req, res) => {
    try {
      await Notification.updateMany(
        { user: req.user._id, 'status.inApp': 'pending' },
        { 
          'status.inApp': 'read',
          readAt: new Date()
        }
      );
  
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Delete notification
  router.delete('/:id', auth, async (req, res) => {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });
  
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
  
      res.json({ message: 'Notification deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Send notification (admin only)
  router.post('/send', auth, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      const { userId, type, title, message, channels, data } = req.body;
  
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        channels,
        data
      });
  
      await notification.save();
      await sendNotification(notification);
  
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/analytics.js
  const express = require('express');
  const Analytics = require('../models/Analytics');
  const Event = require('../models/Event');
  const Ticket = require('../models/Ticket');
  const { auth, organizer } = require('../middleware/auth');
  
  const router = express.Router();
  
  // Get event analytics
  router.get('/event/:eventId', auth, organizer, async (req, res) => {
    try {
      const eventId = req.params.eventId;
      
      // Verify user owns the event
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      let analytics = await Analytics.findOne({ event: eventId });
      
      if (!analytics) {
        analytics = new Analytics({
          event: eventId,
          organizer: req.user._id
        });
        await analytics.save();
      }
  
      // Get real-time data
      const tickets = await Ticket.find({ event: eventId, paymentStatus: 'completed' });
      const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.totalAmount, 0);
      const totalBookings = tickets.length;
  
      // Update analytics
      analytics.metrics.bookings.total = totalBookings;
      analytics.metrics.revenue.total = totalRevenue;
      
      await analytics.save();
  
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get organizer dashboard analytics
  router.get('/dashboard', auth, organizer, async (req, res) => {
    try {
      const organizerId = req.user._id;
  
      const [totalEvents, totalRevenue, totalTicketsSold, upcomingEvents] = await Promise.all([
        Event.countDocuments({ organizer: organizerId }),
        Analytics.aggregate([
          { $match: { organizer: organizerId } },
          { $group: { _id: null, total: { $sum: '$metrics.revenue.total' } } }
        ]),
        Ticket.aggregate([
          { $lookup: { from: 'events', localField: 'event', foreignField: '_id', as: 'eventData' } },
          { $match: { 'eventData.organizer': organizerId, paymentStatus: 'completed' } },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]),
        Event.countDocuments({
          organizer: organizerId,
          'dateTime.start': { $gte: new Date() },
          status: 'published'
        })
      ]);
  
      res.json({
        totalEvents,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalTicketsSold: totalTicketsSold[0]?.total || 0,
        upcomingEvents
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/forums.js
  const express = require('express');
  const Forum = require('../models/Forum');
  const Event = require('../models/Event');
  const { auth } = require('../middleware/auth');
  
  const router = express.Router();
  
  // Get event forums
  router.get('/event/:eventId', async (req, res) => {
    try {
      const forums = await Forum.find({ event: req.params.eventId })
        .populate('creator', 'firstName lastName')
        .populate('posts.author', 'firstName lastName')
        .sort({ isPinned: -1, lastActivity: -1 });
  
      res.json(forums);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Create forum
  router.post('/', auth, async (req, res) => {
    try {
      const { eventId, title, description, category } = req.body;
  
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      const forum = new Forum({
        event: eventId,
        title,
        description,
        creator: req.user._id,
        category
      });
  
      await forum.save();
      res.status(201).json(forum);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Add post to forum
  router.post('/:forumId/posts', auth, async (req, res) => {
    try {
      const { content, attachments } = req.body;
  
      const forum = await Forum.findById(req.params.forumId);
      if (!forum) {
        return res.status(404).json({ message: 'Forum not found' });
      }
  
      forum.posts.push({
        author: req.user._id,
        content,
        attachments
      });
  
      forum.lastActivity = new Date();
      await forum.save();
  
      res.json({ message: 'Post added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Like post
  router.post('/:forumId/posts/:postId/like', auth, async (req, res) => {
    try {
      const forum = await Forum.findById(req.params.forumId);
      if (!forum) {
        return res.status(404).json({ message: 'Forum not found' });
      }
  
      const post = forum.posts.id(req.params.postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      const likeIndex = post.likes.indexOf(req.user._id);
      if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1);
      } else {
        post.likes.push(req.user._id);
      }
  
      await forum.save();
      res.json({ message: 'Like toggled successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Reply to post
  router.post('/:forumId/posts/:postId/reply', auth, async (req, res) => {
    try {
      const { content } = req.body;
  
      const forum = await Forum.findById(req.params.forumId);
      if (!forum) {
        return res.status(404).json({ message: 'Forum not found' });
      }
  
      const post = forum.posts.id(req.params.postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      post.replies.push({
        author: req.user._id,
        content
      });
  
      forum.lastActivity = new Date();
      await forum.save();
  
      res.json({ message: 'Reply added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;
  
  // routes/streaming.js
  const express = require('express');
  const Event = require('../models/Event');
  const Ticket = require('../models/Ticket');
  const { auth } = require('../middleware/auth');
  
  const router = express.Router();
  
  // Get streaming events
  router.get('/events', async (req, res) => {
    try {
      const streamingEvents = await Event.find({
        'features.supportsStreaming': true,
        status: 'published',
        'dateTime.start': { $gte: new Date() }
      }).populate('organizer', 'firstName lastName');
  
      res.json(streamingEvents);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get streaming access for ticket holder
  router.get('/access/:eventId', auth, async (req, res) => {
    try {
      const eventId = req.params.eventId;
  
      // Check if user has valid ticket
      const ticket = await Ticket.findOne({
        user: req.user._id,
        event: eventId,
        paymentStatus: 'completed',
        status: { $in: ['active', 'used'] }
      });
  
      if (!ticket) {
        return res.status(403).json({ message: 'No valid ticket found for streaming access' });
      }
  
      const event = await Event.findById(eventId);
      if (!event || !event.features.supportsStreaming) {