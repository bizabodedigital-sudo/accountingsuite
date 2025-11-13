# Bizabode Accounting Suite

A modern invoicing & bookkeeping SaaS for Jamaican SMEs, built with Next.js, Node.js/Express, MongoDB, and enhanced with hang protection.

## 🚀 Quick Start

### Local Development

```bash
# Install and build all components with hang protection
npm run install:bmad

# Start development environment
npm run dev

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions using Coolify.

**Quick Production Setup:**
1. Configure environment variables (see `.env.production.example`)
2. Deploy using `docker-compose.prod.yml`
3. Seed database: `node scripts/seed-database.js`
4. Access your production instance

## 🛡️ Enhanced Features

### Hang Protection System
- **Moderation Agent**: Prevents cursor hangs with timeout protection
- **Resource Monitoring**: Monitors memory usage and concurrent operations
- **Fallback Strategies**: Automatic fallback for failed components
- **Heartbeat Monitoring**: Real-time execution status updates

### Agent-Based Architecture
- **Infrastructure Agent**: Docker, MongoDB, Redis setup
- **Backend Agent**: Express server, JWT auth, API routes
- **Frontend Agent**: Next.js app, TailwindCSS, ShadCN/UI
- **Coordination Agent**: Orchestrates all agents with timeout protection

## 📋 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15, TailwindCSS, ShadCN/UI | Modern React UI |
| Backend | Node.js, Express, Mongoose | REST API |
| Database | MongoDB 7.x | Document storage |
| Cache/Queue | Redis, BullMQ | Background jobs |
| Storage | DigitalOcean Spaces | File uploads |
| Auth | JWT, bcrypt | Authentication |
| Deploy | Docker, Coolify | Containerization |

## 🏗️ Project Structure

```
bizabode-accounting-suite/
├── agents/                    # Specialized agents
│   ├── moderation-agent.js    # Hang protection
│   ├── infrastructure-agent.js
│   ├── backend-agent.js
│   ├── frontend-agent.js
│   └── enhanced-coordination-agent.js
├── backend/                   # Express API
│   ├── src/
│   │   ├── config/           # Database, logger
│   │   ├── models/           # Mongoose schemas
│   │   ├── controllers/      # Business logic
│   │   ├── routes/           # API endpoints
│   │   └── middleware/       # Auth, error handling
│   └── Dockerfile
├── frontend/                  # Next.js app
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   └── Dockerfile
├── shared/                   # Shared utilities
├── docs/                     # Documentation
├── docker-compose.yml        # Development environment
└── package.json             # Root scripts
```

## 🔧 Available Scripts

```bash
# Core commands
npm run install:bmad         # Build and install all components
npm run dev                   # Start development environment
npm run build                 # Build all components
npm run start                 # Start production environment

# Development
npm run backend:dev           # Start backend only
npm run frontend:dev          # Start frontend only
npm run logs                  # View container logs

# Maintenance
npm run stop                  # Stop all containers
npm run clean                 # Clean up containers and volumes
npm run test                  # Run all tests
npm run lint                  # Lint all code
```

## 🛡️ Hang Protection Features

### Timeout Protection
- Global execution timeout (10 minutes)
- Per-agent timeout limits
- Automatic timeout handling

### Resource Monitoring
- Memory usage tracking
- Concurrent operation limits
- Automatic cleanup triggers

### Fallback Strategies
- Mock database for connection failures
- Mock API for service failures
- Minimal UI for frontend failures

### Heartbeat Monitoring
- Real-time execution status
- Memory usage alerts
- Progress tracking

## 🚀 Development Workflow

1. **Setup**: `npm run install:bmad`
2. **Development**: `npm run dev`
3. **Testing**: `npm run test`
4. **Deployment**: `npm run build && npm run start`

## 📊 Monitoring

The system includes comprehensive monitoring:

- **Execution Time**: Tracks total execution time
- **Memory Usage**: Monitors heap usage
- **Active Operations**: Counts concurrent operations
- **Heartbeat**: Real-time status updates
- **Fallback Mode**: Automatic fallback activation

## 🔒 Security Features

- JWT authentication with role-based access
- Tenant isolation for multi-tenancy
- Password hashing with bcrypt
- Rate limiting and CORS protection
- Input validation and sanitization

## 📈 Performance

- Optimized Docker containers
- Redis caching for sessions
- MongoDB indexing for queries
- Background job processing
- Resource monitoring and cleanup

## 🐛 Troubleshooting

### Common Issues

1. **Hang Protection**: If execution hangs, check timeout settings
2. **Memory Issues**: Monitor memory usage and cleanup
3. **Database**: Verify MongoDB connection
4. **Docker**: Ensure Docker is running

### Recovery Options

1. **Retry**: `npm run clean && npm run install:bmad`
2. **Fallback**: System automatically uses fallback components
3. **Manual**: Check logs and fix specific issues

## 📚 Documentation

- [Development Workflow](docs/Bizabode_Accounting_Suite_Dev_Workflow.md)
- [Architecture Overview](docs/Bizabode_Accounting_Suite_Architecture_Mongo.md)
- [Product Management](docs/Bizabode_Accounting_Suite_PM_Blueprint.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run test`
5. Submit a pull request

## 📄 License

ISC License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

**Built with ❤️ for Jamaican SMEs by the Bizabode Team**













