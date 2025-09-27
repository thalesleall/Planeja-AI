# Planeja-AI Backend

Backend server for the Planeja-AI application built with Node.js, Express, and TypeScript.

## ✨ Features

- **Express.js** with TypeScript
- **Security**: Helmet, CORS, Rate Limiting
- **Performance**: Compression, Request size limits
- **Monitoring**: Health checks, Structured logging
- **Development**: Hot reload with Nodemon
- **Error Handling**: Comprehensive error handling with detailed logging
- **Environment Configuration**: Dotenv support with example file

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd planeja-ai/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. Start development server:
```bash
npm run dev
```

The server will start at `http://localhost:3001`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Custom middleware
│   └── routes/          # Route handlers
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── nodemon.json        # Nodemon configuration
├── package.json        # Dependencies and scripts
├── server.ts           # Main server file
└── tsconfig.json       # TypeScript configuration
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run start:dev` - Start with ts-node (alternative dev mode)

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `SESSION_SECRET` | Session secret key | Required in production |

## 📡 API Endpoints

### Core Endpoints

- `GET /` - Server information
- `GET /health` - Health check with system info
- `GET /ping` - Simple ping/pong endpoint

### API v1

- `GET /api/v1` - API information
- `GET /api/v1/users` - Users endpoint (placeholder)
- `GET /api/v1/plans` - Plans endpoint (placeholder)
- `GET /api/v1/tasks` - Tasks endpoint (placeholder)

## 🛡️ Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Request size limits and JSON parsing protection
- **Error Handling**: Secure error responses (no stack traces in production)

## 📊 Monitoring

### Health Check

Access `/health` for detailed system information:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 1234.567,
  "environment": "development",
  "version": "1.0.0",
  "memory": {
    "used": 25.67,
    "total": 50.12
  },
  "responseTime": "2ms"
}
```

### Logging

Comprehensive request logging includes:
- Timestamp
- HTTP method and URL
- Client IP address
- User agent
- Response time

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Setup

Make sure to:
1. Set `NODE_ENV=production`
2. Configure proper `SESSION_SECRET`
3. Set correct `FRONTEND_URL`
4. Adjust rate limiting for production load

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.
