const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv')

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Middleware
app.use(cors());

app.use(cors({
  origin: 'https://mailmestro.amritkumar.in',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Explicitly respond to preflight
app.options('*', cors({
  origin: 'https://mailmestro.amritkumar.in',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors()); // handle preflight
app.use(cors({ origin: '*' }));
app.options('*', cors({ origin: '*' }));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/credit-scribe-hub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  credits: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now },
  accessTokens: [{
    token: String,
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  creditHistory: [{
    amount: { type: Number, required: true },
    type: { type: String, enum: ['added', 'used', 'refunded'], required: true },
    feature: String,
    description: String,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to verify access token (for extension)
const authenticateAccessToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = await User.findOne({
      'accessTokens.token': token,
      'accessTokens.isActive': true,
      'accessTokens.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Access token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      credits: 100,
      isActive: true,
      lastLogin: new Date()
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        credits: user.credits
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        credits: user.credits
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add credits
app.post('/api/user/add-credits', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.credits += parseInt(amount);
    user.creditHistory.push({ 
      amount: parseInt(amount), 
      type: 'added',
      description: 'Credits added manually'
    });
    await user.save();

    res.json({
      message: 'Credits added successfully',
      credits: user.credits
    });
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate access token
app.post('/api/user/generate-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate random token
    const token = 'ext_' + require('crypto').randomBytes(24).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    // Add to access tokens
    user.accessTokens.push({
      token,
      expiresAt,
      isActive: true
    });

    await user.save();

    res.json({
      message: 'Token generated successfully',
      token
    });
  } catch (error) {
    console.error('Generate token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user tokens
app.get('/api/user/tokens', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      tokens: user.accessTokens.filter(token => token.isActive)
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW: Get credit balance (for extension)
app.get('/api/credits/balance', authenticateAccessToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      balance: user.credits,
      message: 'Credit balance retrieved successfully'
    });
  } catch (error) {
    console.error('Get credit balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW: Use credits (for extension)
app.post('/api/credits/use', authenticateAccessToken, async (req, res) => {
  try {
    const { amount, feature, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.credits < amount) {
      return res.status(400).json({ 
        error: 'Insufficient credits',
        currentCredits: user.credits,
        requiredCredits: amount
      });
    }

    user.credits -= parseInt(amount);
    user.creditHistory.push({ 
      amount: parseInt(amount), 
      type: 'used',
      feature: feature || 'unknown',
      description: description || 'Credits used'
    });
    await user.save();

    res.json({
      message: 'Credits used successfully',
      remainingCredits: user.credits,
      usedCredits: amount
    });
  } catch (error) {
    console.error('Use credits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW: Get credit history
app.get('/api/credits/history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      history: user.creditHistory.sort((a, b) => b.date - a.date)
    });
  } catch (error) {
    console.error('Get credit history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW: Revoke access token
app.delete('/api/user/tokens/:tokenId', authenticateToken, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = user.accessTokens.id(tokenId);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    token.isActive = false;
    await user.save();

    res.json({
      message: 'Token revoked successfully'
    });
  } catch (error) {
    console.error('Revoke token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});
