# Klovy Chat Backend

A robust, scalable backend API for the Klovy Chat messenger application built with Node.js and modern web technologies.

## 🚀 Features

- **Real-time WebSocket communication** - Instant message delivery
- **JWT Authentication** - Secure user authentication and authorization
- **Database integration** - Persistent data storage with optimized queries
- **Email notifications** - Automated email services for user engagement
- **Bot protection** - Cloudflare Turnstile server-side verification
- **CORS configuration** - Configurable cross-origin resource sharing
- **Whitelist system** - Optional IP/domain whitelisting for enhanced security
- **RESTful API** - Clean, well-structured API endpoints
- **Middleware support** - Extensible request processing pipeline
- **MVC Architecture** - Organized codebase with separation of concerns

## 🛠 Tech Stack

- **JavaScript** (100%) - Server-side development with Node.js
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional event-based communication
- **JWT** - JSON Web Token for authentication
- **Database ORM/ODM** - Database abstraction layer
- **Email Service** - SMTP integration for notifications

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/Klovy/klovy-chat-backend.git
cd klovy-chat-backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.production .env
# Edit .env with your configuration
```

4. Set up the database:

```bash
npm run db:migrate
npm run db:seed
```

5. Start the server:

```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
JWT_KEY=your_jwt_secret_key_here
ORIGIN=https://your-frontend-domain.com
DATABASE_URL=your_database_connection_string
WHITELIST_ENABLED=false
TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret_key
EMAIL_PASSWORD=your_email_service_password
```

### Configuration Details

- **PORT** - Server port (default: 3000)
- **JWT_KEY** - Secret key for JWT token signing and verification
- **ORIGIN** - Frontend domain for CORS configuration
- **DATABASE_URL** - Database connection string (MongoDB, PostgreSQL, etc.)
- **WHITELIST_ENABLED** - Enable/disable IP whitelisting (true/false)
- **TURNSTILE_SECRET_KEY** - Cloudflare Turnstile secret for bot protection
- **EMAIL_PASSWORD** - Password for email service authentication

## 📁 Project Structure

```
klovy-chat-backend/
├── controllers/      # Request handlers and business logic
├── middlewares/      # Custom middleware functions
├── model/           # Database models and schemas
├── routes/          # API route definitions
├── utils/           # Utility functions and helpers
├── index.js         # Main server entry point
├── package.json     # Project dependencies and scripts
├── server.js        # Server configuration
└── README.md       # Project documentation
```

## 🚦 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run test suite
- `npm run lint` - Run code linting
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

## 🔐 Security Features

- **JWT Authentication** - Stateless token-based authentication
- **CORS Protection** - Configurable cross-origin request handling
- **Rate Limiting** - API request rate limiting
- **Input Validation** - Request data validation and sanitization
- **Bot Protection** - Cloudflare Turnstile integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Development Guidelines

- Follow Node.js best practices
- Use consistent code formatting (Prettier/ESLint)
- Write meaningful commit messages
- Add tests for new features
- Update API documentation
- Handle errors gracefully

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📝 License

This project is licensed under the [LICENSE](LICENSE.txt) file in the repository.

## 🔗 Related Projects

- Frontend: [klovy-chat-frontend](https://github.com/Klovy-Chat/klovy-chat-frontend)

## 📞 Support

- Create an issue for bug reports or feature requests
- Check existing issues before creating new ones
- Join our community discussions

## 🎯 Roadmap

- [ ] Voice message support
- [ ] File upload API
- [ ] Push notifications
- [ ] Message encryption
- [ ] Group chat management
- [ ] Admin dashboard API
- [ ] Analytics and monitoring
- [ ] Message search functionality

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t klovy-chat-backend .

# Run container
docker run -p 3000:3000 --env-file .env klovy-chat-backend
```

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor
pm2 status
```

---

**Made with ❤️ by the Klovy Team**

_Star ⭐ this repository if you find it helpful!_
