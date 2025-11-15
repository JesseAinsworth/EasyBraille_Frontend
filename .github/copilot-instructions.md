# EasyBraille Frontend - GitHub Copilot Instructions

This workspace contains the EasyBraille Frontend application - a Next.js React application for braille education and translation.

## Project Overview

EasyBraille is an educational platform that helps users learn braille through interactive translation tools, keyboard practice, and educational resources. The frontend provides an accessible, user-friendly interface for braille learning.

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom components
- **UI Library**: Radix UI primitives
- **Authentication**: NextAuth.js with custom JWT tokens
- **Database**: MongoDB with Mongoose ODM
- **State Management**: React hooks and context
- **Charts**: Chart.js and Recharts
- **Icons**: Lucide React

## Code Standards & Patterns

### React/Next.js
- Use functional components with hooks
- Prefer Server Components where possible
- Use proper error boundaries and loading states
- Follow Next.js App Router conventions
- Implement proper TypeScript typing

### Authentication
- Use both NextAuth.js and custom JWT tokens
- Import `authOptions` from `@/lib/auth.server.ts`
- Custom auth functions are in `@/lib/auth.ts`
- Protect routes with middleware and session checks

### Styling
- Use Tailwind CSS utility classes
- Follow responsive design principles
- Maintain consistent spacing and typography
- Use Radix UI for complex components
- Ensure accessibility compliance (WCAG guidelines)

### Database
- MongoDB operations through Mongoose
- Use proper error handling for DB operations
- Implement data validation schemas
- Handle ObjectId conversions properly

### API Routes
- Follow RESTful conventions
- Implement proper error handling
- Use TypeScript for request/response types
- Add authentication middleware where needed

## Accessibility Requirements

- Maintain semantic HTML structure
- Provide proper ARIA labels and roles
- Ensure keyboard navigation support
- Use sufficient color contrast ratios
- Implement screen reader compatibility
- Test with assistive technologies

## File Organization

- Components in `/src/components/` with proper TypeScript interfaces
- API routes in `/src/app/api/` following Next.js conventions
- Utility functions in `/src/lib/`
- Service functions in `/src/services/`
- Type definitions in `/src/types/`

## Development Notes

- Environment variables must be properly configured
- Handle MongoDB connection states gracefully
- Implement proper loading and error states
- Use proper TypeScript generics for API responses
- Follow the existing code patterns and naming conventions