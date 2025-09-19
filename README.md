# Test Portal - Online Testing Platform

A full-stack MERN application for creating and taking online tests with real-time features and comprehensive test management.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Test Creation**: Create tests with multiple-choice questions
- **Test Taking**: Interactive test-taking interface with timer
- **Result Management**: View and manage test results
- **Real-time Updates**: Dynamic content loading and updates
- **Responsive Design**: Mobile-friendly Bootstrap UI
- **Database Integration**: MongoDB Atlas for data persistence

## 🛠️ Technology Stack

### Frontend
- **React 18.2.0** - Modern React with hooks and functional components
- **React Router Dom** - Client-side routing and navigation
- **Bootstrap 5.3.0** - Responsive UI framework
- **Axios** - HTTP client for API communication

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database service
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB Atlas account** (for database)
- **Git** (for version control)

## 🚦 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd test-portel
```

### 2. Install Dependencies

Install dependencies for both frontend and backend:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/testportal?retryWrites=true&w=majority&appName=test&tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true
JWT_SECRET=your_jwt_secret_key_here_2024_test_portal
PORT=3001
```

**⚠️ Important**: Replace the MongoDB URI with your actual MongoDB Atlas connection string.

### 4. Database Setup

1. Create a MongoDB Atlas account at [https://cloud.mongodb.com/](https://cloud.mongodb.com/)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string and update the `.env` file
5. Ensure your IP address is whitelisted in MongoDB Atlas Network Access

### 5. Running the Application

#### Option 1: Run Both Frontend and Backend Together

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend server on `http://localhost:3000`

#### Option 2: Run Separately

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

## 📁 Project Structure

```
test-portel/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Test.js
│   │   ├── User.js
│   │   └── Result.js
│   ├── routes/
│   │   ├── tests.js
│   │   ├── users.js
│   │   └── results.js
│   ├── .env
│   ├── .gitignore
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   ├── .gitignore
│   ├── package.json
│   └── package-lock.json
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login

### Tests
- `GET /api/tests` - Get all tests
- `POST /api/tests` - Create a new test
- `GET /api/tests/:id` - Get specific test
- `PUT /api/tests/:id` - Update test
- `DELETE /api/tests/:id` - Delete test

### Results
- `GET /api/results` - Get all results
- `POST /api/results` - Submit test result
- `GET /api/results/:testId` - Get results for specific test

## 🎯 Key Features

### Test Creation
- Add multiple-choice questions with 4 options each
- Automatic total marks calculation
- Question validation ensures at least one correct answer
- Real-time form validation

### Test Taking
- User information collection
- Timer functionality
- Question navigation
- Answer persistence
- Result submission

### Dashboard
- View created tests
- Test statistics
- Real-time data loading
- Empty state handling

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Protected API routes
- Input validation and sanitization
- MongoDB injection protection

## 🚀 Deployment

### Backend Deployment
1. Deploy to services like Heroku, Railway, or Vercel
2. Set environment variables in deployment platform
3. Ensure MongoDB Atlas is accessible from deployment platform

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy build folder to static hosting (Netlify, Vercel, etc.)
3. Update API base URL for production

## 🧪 Testing

To run tests:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- MongoDB SSL connection may require specific TLS configuration
- Environment variables must be properly configured for production

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing issues for solutions

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication
  - Test creation and taking
  - Result management
  - MongoDB integration
  - Real-time features

---

**Made with ❤️ using the MERN Stack**