# IntelliAudit Frontend

A modern web application for conducting ASHRAE Level 2 energy audits. This frontend application provides an intuitive interface for energy auditors to collect, analyze, and report building energy data.

## Features

- **Portfolio Manager Integration**: Seamlessly import building data from EPA's Portfolio Manager
- **Field Data Collection**: Capture and analyze field notes and equipment photos
- **Equipment Management**: Comprehensive equipment inventory and analysis tools
- **Report Generation**: Generate ASHRAE Level 2 compliant energy audit reports
- **Real-time Analysis**: AI-powered analysis of photos and field notes
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **API Client**: Axios
- **Form Handling**: React Hook Form
- **UI Components**: Custom components with Tailwind

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Access to the IntelliAudit backend API

## Installation

1. Clone the repository
```bash
git clone [repository-url]
cd frontend
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Configure environment variables
Edit `.env` with your configuration:
```env
VITE_API_URL=your_backend_api_url
VITE_PORTFOLIO_MANAGER_API_KEY=your_pm_api_key
```

## Development

Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
# or
yarn build
```

The build output will be in the `dist` directory.

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # Reusable UI components
├── contexts/      # React contexts for state management
├── hooks/         # Custom React hooks
├── pages/         # Application pages/routes
├── services/      # Business logic and services
├── stores/        # State management
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

[Your License Here]

## Support

For support, please contact [support contact information]
