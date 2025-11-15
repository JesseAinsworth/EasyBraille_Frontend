# EasyBraille Frontend

A modern React-based web application for braille education and translation, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Braille Translation**: Convert text to braille and vice versa
- **Interactive Braille Keyboard**: Learn braille through hands-on interaction
- **User Authentication**: Secure login and registration system
- **Translation History**: Save and manage your translations
- **Admin Dashboard**: User management and statistics
- **Responsive Design**: Optimized for all device sizes
- **Accessibility First**: Built with screen reader compatibility

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives
- **Authentication**: NextAuth.js with JWT tokens
- **Database**: MongoDB with Mongoose ODM
- **Charts**: Chart.js and Recharts for analytics
- **Icons**: Lucide React
- **Date Handling**: date-fns library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or Atlas)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JesseAinsworth/EasyBraille_Frontend.git
cd EasyBraille_Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NEXTAUTH_SECRET=your_nextauth_secret
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
├── lib/                   # Utility functions and configurations
├── services/              # API service functions
└── types/                 # TypeScript type definitions
```

## API Routes

The application includes several API endpoints:
- `/api/auth/*` - Authentication endpoints
- `/api/translations/*` - Translation management
- `/api/admin/*` - Administrative functions
- `/api/braille-image` - Braille image generation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
