# GalleryGlobe

A modern web application for exploring fine art collections, built with Next.js 14 and TypeScript.

## Features

- Browse and discover artworks from various artists and periods
- View detailed artist profiles with biographical information
- Explore artwork details with high-resolution images 
- Responsive design for optimal viewing on all devices
- Integration with WikiArt API for extensive art database access
- Server-side rendering for improved performance
- Authentication system using NextAuth.js

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, TailwindCSS
- **UI Components:** Shadcn UI, Lucide Icons
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** NextAuth.js
- **API Integration:** WikiArt API
- **Styling:** Tailwind CSS with custom components

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ByalykT02/DP_24-F_byalykt
```

2. Install dependencies:
```bash
cd galleryglobe
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in the following variables:
```
DATABASE_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NO_SSL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
WIKIART_ACCESS_KEY=
WIKIART_SECRET_KEY=
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── app/
│   ├── (protected)/     # Protected routes (collections, profile, etc.)
│   ├── (public)/        # Public routes (explore, categories)
│   ├── api/            # API routes
│   ├── artists/        # Artist-related pages
│   ├── artworks/       # Artwork-related pages
│   └── auth/           # Authentication pages
├── components/
│   ├── auth/           # Authentication components
│   ├── collections/    # Collection-related components
│   ├── common/         # Shared components
│   ├── form/           # Form components
│   ├── home/           # Homepage components
│   ├── preferences/    # User preference components
│   ├── profile/        # Profile management components
│   ├── recommendations/# Recommendation components
│   ├── search/         # Search components
│   └── ui/             # UI components
├── hooks/              # Custom React hooks
├── lib/
│   ├── types/          # TypeScript interfaces
│   └── utils/          # Utility functions
└── server/
    ├── actions/        # Server actions
    └── db/             # Database configuration
```

## Key Features Details

### Collections Management
- Create and manage personal collections
- Toggle collection visibility (public/private)
- Add/remove artworks from collections
- Browse public collections from other users

### User Profile System
- Edit profile information
- Change password securely
- View personal favorites
- Track viewing history
- Manage collections

### Search Functionality
- Real-time artwork and artist search
- Search results categorization
- Quick navigation to results

### Artwork Discovery
- Browse popular artworks
- View detailed artwork information
- Similar artwork recommendations
- High-resolution image viewing

### Artist Exploration
- Browse popular artists with biographical information
- View artist's complete artwork collection
- Timeline of artist's periods and career
- Related artists and influences

## Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- WikiArt API for providing the artwork database
- Next.js team for the amazing framework
- Shadcn for accessible component primitives

## Contact

Project Link: [https://github.com/ByalykT02/DP_24-F_byalykt](https://github.com/ByalykT02/DP_24-F_byalykt)