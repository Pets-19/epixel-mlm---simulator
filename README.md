# MLM Tools - Version 4.2

A comprehensive Multi-Level Marketing (MLM) management platform built with Next.js, Go, and PostgreSQL.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd mlm-tools

# Install dependencies
npm install

# Start the application
docker compose up -d

# Access the application
open http://localhost:3000
```

## 📚 Documentation

### Complete Documentation Suite
- **[Comprehensive Technical Guide](./COMPREHENSIVE_TECHNICAL_GUIDE.md)** - Complete technical and implementation reference
- **[Project Requirements](./PROJECT_REQUIREMENTS.md)** - User stories and requirements specification
- **[Version 4.2 Checkpoint](./VERSION_4.2_CHECKPOINT.md)** - Complete version 4.2 details and changes



## ✨ Features

### 🔐 Authentication & User Management
- JWT-based authentication system
- Role-based access control (admin, user, business_user)
- Comprehensive user management
- Secure password handling

### 📊 Business Plan Management
- Multi-step Business Plan Wizard
- Product configuration with pricing and sales ratios
- Business plan assignment to users
- Status tracking and management

### 🌳 Genealogy Simulation
- Multiple genealogy types (Matrix, Unilevel, Binary)
- Configurable simulation parameters
- Visual tree representation
- Simulation data persistence

### 🗄️ Database & Infrastructure
- PostgreSQL with strong schema design
- Version-controlled migrations
- Docker containerization
- RESTful API with validation

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Go 1.21, PostgreSQL
- **Infrastructure**: Docker, Docker Compose
- **Authentication**: JWT tokens
- **Database**: PostgreSQL with migrations

## 📋 Version 4.2 Highlights

### New Features
- **Product Sales Ratio**: New field for product purchase rate (0-100%)
- **Enhanced Field Naming**: "Business Plan Name" for improved clarity
- **Comprehensive Documentation**: Complete technical and project documentation suite

### Improvements
- Enhanced validation for all form inputs
- Improved error handling and user feedback
- Better database schema with constraints
- Comprehensive development guidelines

### Technical Updates
- Updated TypeScript interfaces
- Enhanced API validation
- Improved database migrations
- Complete documentation coverage

## 🔧 Development

### Prerequisites
- Node.js 18+ (LTS)
- Go 1.21+
- Docker & Docker Compose
- PostgreSQL 15+

### Development URLs
- **Application**: http://localhost:3000
- **API Base**: http://localhost:3000/api
- **Go Simulator**: http://localhost:8080
- **Database**: localhost:5432

### Common Commands
```bash
# Start development environment
docker compose up -d

# View logs
docker compose logs -f app

# Apply database migrations
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -f /docker-entrypoint-initdb.d/migration.sql

# Rebuild containers
docker compose build --no-cache

# Stop all services
docker compose down

# Quick project restart with fresh database
./scripts/restart_project.sh

# Create database backup
docker compose exec postgres pg_dump -U postgres -d epixel_mlm_tools --clean --if-exists --create --verbose > database/backup_$(date +%Y%m%d_%H%M%S).sql
```

## 📊 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Go Simulator    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)      │◄──►│   (Database)    │
│   Port: 3000    │    │   Port: 8080     │    │   Port: 5432    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🗄️ Database Schema

### Core Tables
- `users` - User management and authentication
- `genealogy_types` - Available simulation types
- `genealogy_simulations` - Simulation data and results
- `business_plan_simulations` - Business plan management
- `business_products` - Product configuration within plans

### Key Features
- Strong schema design with constraints
- Version-controlled migrations
- Proper indexing for performance
- Data integrity enforcement

## 💾 Database Backup & Restart

### Quick Restart
```bash
# Restart project with fresh database and sample data
./scripts/restart_project.sh
```

### Backup Files
- **`database/complete_migration.sql`** - Complete database setup with sample data
- **`database/backup_*.sql`** - Timestamped database backups
- **`scripts/restart_project.sh`** - Automated restart script

### Sample Data
- System Admin: `admin@epixel.com` / `password123`
- Business User: `business@epixel.com` / `password123`
- Sample business plans and products included

For detailed backup and restart instructions, see [Database Backup & Restart Guide](./DATABASE_BACKUP_RESTART_GUIDE.md).

## 🔒 Security

### Authentication
- JWT token-based authentication
- Secure password hashing with bcrypt
- Role-based access control
- Session management

### Data Protection
- Input validation (client and server-side)
- SQL injection prevention
- Database constraints
- Secure error handling

## 🧪 Testing

### Test Coverage
- Unit tests for components and functions
- Integration tests for API endpoints
- End-to-end tests for user flows
- Database migration testing

### Testing Guidelines
- Comprehensive test coverage
- Test-driven development approach
- Mock external dependencies
- Performance testing

## 🚀 Deployment

### Development
```bash
docker compose up -d
```

### Production
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Environment Variables
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/epixel_mlm_tools
JWT_SECRET=your-secret-key
SIMULATOR_URL=http://localhost:8080
```

## 📈 Performance

### Application Performance
- **Startup Time**: ~50-70ms (Next.js ready)
- **API Response Time**: <2 seconds (95th percentile)
- **Database Queries**: Optimized with proper indexes
- **Memory Usage**: Efficient with proper cleanup

### Optimization
- Database query optimization
- Proper indexing strategy
- Component memoization
- Code splitting and lazy loading

## 🔄 Version History

### Version 4.2 (Current)
- Enhanced Business Plan Wizard
- Product Sales Ratio feature
- Comprehensive documentation suite
- Improved validation and error handling

### Previous Versions
- Version 4.1: Business Plan Wizard implementation
- Version 4.0: Core system architecture
- Version 3.x: Genealogy simulation features
- Version 2.x: User management system
- Version 1.x: Initial authentication system

## 🤝 Contributing

### Development Process
1. Review [Development Guide](./DEVELOPMENT_GUIDE.md)
2. Check [Project Requirements](./PROJECT_REQUIREMENTS.md)
3. Follow coding standards and guidelines
4. Write comprehensive tests
5. Update documentation

### Code Standards
- TypeScript strict mode
- ESLint and Prettier formatting
- React functional components
- Go idioms and conventions
- Database best practices

## 📞 Support

### Documentation
- [Technical Documentation](./TECHNICAL_DOCUMENTATION.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Development Guide](./DEVELOPMENT_GUIDE.md)
- [Troubleshooting Guide](./DEVELOPMENT_GUIDE.md#troubleshooting)

### Common Issues
- Database connection problems
- Migration issues
- Build and deployment problems
- Performance optimization

## 📄 License

This project is proprietary software. All rights reserved.

## 🎯 Roadmap

### Planned Features
- Advanced analytics dashboard
- Mobile application
- Public API for integrations
- Real-time features with WebSockets

### Technical Improvements
- Microservices architecture
- Cloud deployment
- Performance optimization
- Comprehensive monitoring

---

**Version 4.2** - Production Ready with Enhanced Features and Comprehensive Documentation

*For detailed information about this version, see [Version 4.2 Checkpoint](./VERSION_4.2_CHECKPOINT.md)* 