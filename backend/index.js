const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// Increase the limit for JSON payloads to handle base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const connectDB = async (retryCount = 0) => {
  const maxRetries = 3;
  const connectionStrings = [
    process.env.MONGODB_URI,
    process.env.MONGODB_URI_FALLBACK,
    process.env.MONGODB_URI?.replace('&appName=test', '') // Remove appName parameter
  ];

  for (let i = 0; i < connectionStrings.length; i++) {
    const uri = connectionStrings[i];
    if (!uri) continue;

    try {
      // Clear any existing connections
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

  console.log(`Attempting to connect with method ${i + 1}...`);
      
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      });
      
  console.log('MongoDB Atlas connected successfully');
  console.log('Using real database for all operations');
      return; // Success! Exit the function
      
    } catch (error) {
  console.error(`Connection attempt ${i + 1} failed:`, error.message);
    }
  }

  // If all connection attempts failed
  console.error('All MongoDB connection attempts failed');
  console.log('Please check your MongoDB connection string and network access');
  console.log('Server will continue running for demonstration purposes');
  console.log('API calls will fail until database connection is restored');
  
  // Retry after delay if we haven't exceeded max retries
  if (retryCount < maxRetries) {
  console.log(`Retrying connection in 10 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
    setTimeout(() => connectDB(retryCount + 1), 10000);
  }
};

connectDB();

// MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB Atlas');
});

// Handle app termination gracefully
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

// Routes - using real database models only
app.use('/api/tests', require('./routes/tests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/results', require('./routes/results'));
app.use('/api/debug', require('./routes/debug')); // Debug routes for diagnosing scoring issues

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK', 
    database: dbStatus,
    message: `Server running with real database (${dbStatus})`,
    port: PORT
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Test Portal API - Real Database Mode',
    database: mongoose.connection.readyState === 1 ? 'Connected to MongoDB Atlas' : 'Database connection issue',
    endpoints: [
      'GET /api/tests - Get all tests from database',
      'GET /api/tests/:id - Get test by ID from database',
      'POST /api/tests - Create new test in database',
      'PUT /api/tests/:id - Update test in database',
      'DELETE /api/tests/:id - Delete test from database',
      'GET /api/health - Health check'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
  console.log(`Database: Real MongoDB Atlas Connection Only`);
  console.log(`No dummy data - all data from database`);
});