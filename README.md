# Credit Scribe Hub Server

Backend server for the Credit Scribe Hub application, providing authentication, credit management, and API endpoints for the Gmail extension.

## Features

- 🔐 User authentication with JWT tokens
- 💳 Credit management system
- 🔑 Access token generation for extensions
- 📊 Credit history tracking
- 🛡️ Security middleware and validation
- 🌐 CORS enabled for cross-origin requests

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/credit-scribe-hub
JWT_SECRET=your-super-secret-jwt-key
```

3. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "credits": 100
  },
  "token": "jwt_token"
}
```

#### POST `/api/auth/login`
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "credits": 100
  },
  "token": "jwt_token"
}
```

### User Management

#### GET `/api/user/profile`
Get user profile (requires JWT token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "credits": 100,
    "isActive": true,
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST `/api/user/add-credits`
Add credits to user account (requires JWT token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "amount": 50
}
```

**Response:**
```json
{
  "message": "Credits added successfully",
  "credits": 150
}
```

### Access Token Management

#### POST `/api/user/generate-token`
Generate access token for extension (requires JWT token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Token generated successfully",
  "token": "ext_abc123..."
}
```

#### GET `/api/user/tokens`
Get all active access tokens (requires JWT token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "tokens": [
    {
      "_id": "token_id",
      "token": "ext_abc123...",
      "expiresAt": "2024-02-01T00:00:00.000Z",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### DELETE `/api/user/tokens/:tokenId`
Revoke an access token (requires JWT token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Token revoked successfully"
}
```

### Credit Management (Extension API)

#### GET `/api/credits/balance`
Get current credit balance (requires access token).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "balance": 100,
  "message": "Credit balance retrieved successfully"
}
```

#### POST `/api/credits/use`
Use credits for a feature (requires access token).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "amount": 1,
  "feature": "email_analyze",
  "description": "AI email response generation"
}
```

**Response:**
```json
{
  "message": "Credits used successfully",
  "remainingCredits": 99,
  "usedCredits": 1
}
```

#### GET `/api/credits/history`
Get credit transaction history (requires JWT token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "history": [
    {
      "amount": 1,
      "type": "used",
      "feature": "email_analyze",
      "description": "AI email response generation",
      "date": "2024-01-01T00:00:00.000Z"
    },
    {
      "amount": 50,
      "type": "added",
      "description": "Credits added manually",
      "date": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Health Check

#### GET `/api/health`
Check server status.

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Database Schema

### User Schema
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  name: String (required),
  credits: Number (default: 100),
  isActive: Boolean (default: true),
  lastLogin: Date (default: now),
  accessTokens: [{
    token: String,
    expiresAt: Date,
    isActive: Boolean (default: true),
    createdAt: Date (default: now)
  }],
  creditHistory: [{
    amount: Number (required),
    type: String (enum: ['added', 'used', 'refunded']),
    feature: String,
    description: String,
    date: Date (default: now)
  }],
  timestamps: true
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Access token system for extensions
- Input validation
- CORS protection
- Rate limiting (when implemented)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Running in Development Mode
```bash
npm run dev
```

### Environment Variables
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens

### Testing
```bash
npm test
```

## License

MIT License
