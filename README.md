# Porter Shift Management System

A modern web application for tracking porter shifts, department staffing, and managing temporary assignments in healthcare facilities.

## Tech Stack

- **Frontend**: Vue 3 + Vite + TypeScript + Modern CSS (Grid, Subgrid, Layers, Container Queries)
- **Backend**: Express + TypeScript + Node.js
- **Database**: MySQL 8.0
- **Containerization**: Docker + Docker Compose
- **Development**: OrbStack (local Docker environment)

## Features

### Core Functionality
- **Shift Management**: Track 24-hour day/night shifts with complex rotation patterns (4 on/4 off with offsets)
- **Department Staffing**: Monitor minimum staffing requirements and operational hours
- **Porter Tracking**: Manage regular assignments, contracted hours, and availability
- **Low Staffing Alerts**: Automatic detection of understaffed departments
- **Temporary Assignments**: Quick assignment of floor staff to departments
- **Relief Porter Management**: Handle guaranteed-hour relief staff assignments

### User Interface
- **Home Dashboard**: Current day view with shift tables and department status
- **Configure Screen**: Tabbed interface for managing departments, porters, and shifts
- **Week Navigation**: View up to 6 weeks in advance
- **Mobile Responsive**: Optimized for tablets and mobile devices

## Project Structure

```
rotatr/
├── frontend/          # Vue 3 + Vite application
├── backend/           # Express + TypeScript API
├── database/          # MySQL schema and migrations
├── docker/            # Docker configuration files
├── docs/              # Documentation and diagrams
└── docker-compose.yml # Multi-container orchestration
```

## Getting Started

### Prerequisites
- OrbStack or Docker Desktop
- Node.js 18+ (for local development)

### Quick Start
```bash
# Clone and setup
git clone <repository-url>
cd rotatr

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# MySQL: localhost:3306
```

## Development

### Local Development
```bash
# Frontend development
cd frontend
npm install
npm run dev

# Backend development
cd backend
npm install
npm run dev

# Database
docker-compose up mysql -d
```

## Key Business Logic

### Shift Calculations
- **Ground Zero**: Reference date for aligning shift cycles with real-world operations
- **Shift Offsets**: Allow porters to be "out of phase" (e.g., 2-day offset for staggered coverage)
- **Cycle Patterns**: Support various patterns (4 on/4 off, custom cycles)

### Staffing Logic
- **Regular Assignments**: Porters assigned to specific departments
- **Floor Staff**: Shift-based porters available for temporary department assignment
- **Relief Porters**: Guaranteed-hour staff for covering long-term absences
- **Low Staffing Detection**: Real-time comparison of requirements vs availability

### Time Handling
- **24-Hour Operations**: Night shifts (20:00-08:00) are considered part of the start date
- **Cross-Midnight**: Proper handling of shifts that span midnight
- **Absence Management**: Annual leave, sickness, and appointment tracking

## API Endpoints

### Core Resources
- `GET/POST /api/departments` - Department management
- `GET/POST /api/porters` - Porter management  
- `GET/POST /api/shifts` - Shift pattern management
- `GET/POST /api/assignments` - Temporary assignments
- `GET /api/staffing/:date` - Daily staffing overview

### Specialized Endpoints
- `GET /api/staffing/alerts/:date` - Low staffing alerts
- `POST /api/assignments/temporary` - Quick floor staff assignment
- `GET /api/schedule/:porter/:date` - Porter availability calculation
- `POST /api/export/schedule` - Data export functionality

## Database Schema

Key tables:
- `departments` & `department_schedules` - Department operational data
- `porters` & `porter_contracted_hours` - Porter information and availability
- `shifts` - Shift patterns and cycles
- `absences` - Annual leave, sickness, appointments
- `temporary_assignments` - Floor staff to department assignments
- `relief_assignments` - Long-term relief porter assignments

## Contributing

1. Follow TypeScript strict mode
2. Use modern CSS features (Grid, Subgrid, Container Queries)
3. Maintain clean HTML structure with minimal nesting
4. Write comprehensive tests for shift calculation logic
5. Ensure mobile responsiveness

## License

[License information]
