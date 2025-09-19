const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    console.log('✅ MongoDB Atlas connected successfully');
    console.log('🗄️  Using real database for all operations');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('📝 Please check your MongoDB connection string and network access');
    console.log('🔄 Server will continue running for demonstration purposes');
    console.log('⚠️  API calls will fail until database connection is restored');
  }
};

connectDB();

// Routes - using real database models only
app.use('/api/tests', require('./routes/tests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/results', require('./routes/results'));

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
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 API Base: http://localhost:${PORT}/api`);
  console.log(`💾 Database: Real MongoDB Atlas Connection Only`);
  console.log(`📊 No dummy data - all data from database`);
});