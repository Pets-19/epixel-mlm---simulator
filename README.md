# Epixel MLM Tools

A professional MLM (Multi-Level Marketing) management platform built with Next.js, PostgreSQL, and Docker. Features role-based access control with system administrator capabilities.

## Features

- **Role-Based Access Control**: System Admin, Admin, and User roles
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices
- **Docker Support**: Complete containerized deployment
- **PostgreSQL Database**: Robust data storage with proper indexing

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS, Lucide React icons
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 15
- **Authentication**: JWT, bcryptjs
- **Containerization**: Docker & Docker Compose
- **Development**: ESLint, TypeScript

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL (if running locally)

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd epixel-mlm-tools
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Initialize the system admin**
   ```bash
   curl -X POST http://localhost:3000/api/auth/init
   ```

4. **Access the application**
   - Open http://localhost:3000
   - Login with:
     - Email: `admin@epixelmlm.com`
     - Password: `admin123`

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd epixel-mlm-tools
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb epixel_mlm_tools
   
   # Run schema
   psql -d epixel_mlm_tools -f database/schema.sql
   psql -d epixel_mlm_tools -f database/init.sql
   ```

5. **Initialize the system admin**
   ```bash
   curl -X POST http://localhost:3000/api/auth/init
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Open http://localhost:3000
   - Login with default credentials

## Default System Admin

- **Email**: `admin@epixelmlm.com`
- **Password**: `admin123`
- **Role**: System Administrator

**Important**: Change the default password after first login for security.

## Role-Based Access Control

### System Administrator
- Full system access
- Can create and manage all users
- System configuration privileges
- Access to all features

### Administrator
- Can manage users (except system admins)
- Access to most administrative features
- Limited system configuration access

### User
- Basic user access
- View-only access to most features
- Limited administrative capabilities

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/init` - Initialize system admin

## Database Schema

The application uses PostgreSQL with the following main table:

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `name` - User's full name
- `password_hash` - Bcrypt hashed password
- `role` - User role (system_admin, admin, user)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

## Development

### Project Structure
```
epixel-mlm-tools/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth-provider.tsx # Authentication context
│   ├── dashboard.tsx     # Dashboard component
│   └── login-page.tsx    # Login page
├── lib/                  # Utility libraries
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts            # Database connection
│   └── utils.ts         # General utilities
├── database/            # Database scripts
│   ├── schema.sql       # Database schema
│   └── init.sql         # Initialization script
├── docker-compose.yml   # Docker orchestration
├── Dockerfile          # Application container
└── package.json        # Dependencies
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Security Considerations

1. **Change default credentials** immediately after setup
2. **Use strong JWT secrets** in production
3. **Configure proper database passwords**
4. **Enable HTTPS** in production
5. **Regular security updates** for dependencies

## Production Deployment

1. **Update environment variables** with production values
2. **Use strong secrets** for JWT and database
3. **Configure reverse proxy** (nginx) for HTTPS
4. **Set up monitoring** and logging
5. **Regular backups** of PostgreSQL data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team. 