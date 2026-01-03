# DayFlow - HR Management System

A modern, full-stack Human Resource Management System built with React and Node.js.

## Features

- **Authentication & Authorization** - Role-based access (Admin/Employee)
- **Employee Management** - Create, update, and manage employee profiles
- **Attendance Tracking** - Check-in/out with real-time status
- **Leave Management** - Apply, approve/reject leave requests with balance tracking
- **Payroll Processing** - Automated salary calculations with detailed payslips
- **Reports & Analytics** - Comprehensive reports with CSV export
- **Announcements** - Company-wide announcements with priority levels
- **Settings** - Configurable company, leave, payroll, and attendance policies

## Tech Stack

### Backend
- Node.js + Express.js
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Axios
- Lucide React Icons

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### Database Setup

1. Create a PostgreSQL database named `dayflow`
2. Update database credentials in `backend/src/config/index.js`

### Backend Setup

```bash
cd backend
npm install
npm run seed    # Creates initial admin user
npm run dev     # Start development server
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev     # Start development server
```

### Default Admin Credentials

After running the seed script, login with:
- **Login ID:** Displayed in terminal after seeding
- **Password:** `Admin@123`

> ⚠️ Change the password immediately after first login!

## Project Structure

```
DayFlow/
├── backend/
│   └── src/
│       ├── config/         # Database & app configuration
│       ├── controllers/    # Route handlers
│       ├── middleware/     # Auth & validation middleware
│       ├── routes/         # API routes
│       ├── services/       # Business logic
│       └── utils/          # Helper functions
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── context/        # React context (Auth)
│       ├── pages/          # Page components
│       └── services/       # API service functions
```

## API Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `POST /api/auth/login` | User login |
| Auth | `POST /api/auth/change-password` | Change password |
| Users | `GET /api/users` | List all users (Admin) |
| Users | `POST /api/users` | Create user (Admin) |
| Attendance | `GET /api/attendance/today` | Get today's status |
| Attendance | `POST /api/attendance/mark` | Mark check-in/out |
| Leaves | `GET /api/leaves` | Get leave requests |
| Leaves | `POST /api/leaves` | Apply for leave |
| Payroll | `GET /api/payroll` | Get payroll records |
| Payroll | `POST /api/payroll/generate` | Generate payroll (Admin) |
| Reports | `GET /api/reports/attendance` | Attendance report |
| Announcements | `GET /api/announcements` | Get active announcements |

## License

MIT
