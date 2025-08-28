# Window Cleaning Management System

## Overview

A comprehensive business management system for window cleaning companies built with Node.js/Express backend and React frontend. The system provides door canvassing capabilities, job scheduling, customer management, and user administration with role-based access control for admins, canvassers, and cleaners.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Single-page application using React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management with optimistic updates
- **UI Framework**: Shadcn/ui components with Radix UI primitives and Tailwind CSS for styling
- **Form Management**: React Hook Form with Zod validation for type-safe form handling
- **Authentication**: JWT token-based authentication stored in localStorage

### Backend Architecture
- **Framework**: Express.js with TypeScript for type safety
- **Database ORM**: Drizzle ORM for PostgreSQL with type-safe database operations
- **File Uploads**: Multer middleware for handling job photos and attachments
- **Authentication**: JWT-based authentication with role-based middleware
- **API Design**: RESTful API endpoints with standardized error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless for scalability
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **File Storage**: Local file system storage for job photos and uploads
- **Session Management**: Database-backed sessions for production environments

### Authentication and Authorization
- **Authentication Method**: JWT tokens with bcrypt password hashing
- **Role-Based Access**: Three user roles (admin, canvasser, cleaner) with different permissions
- **Middleware Protection**: Route-level authentication and role-based authorization
- **Token Management**: Automatic token refresh and secure storage

### External Dependencies
- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives for accessible component foundation
- **Validation**: Zod for runtime type validation and schema enforcement
- **Styling**: Tailwind CSS with CSS variables for theming
- **Development**: Vite for fast development and building
- **File Processing**: Sharp for image processing (implied by multer usage)