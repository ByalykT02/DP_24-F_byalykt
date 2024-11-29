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

## Planned Features & Improvements

### Authentication & User Experience
- [x] Complete authentication system implementation
- [x] User browsing history
- [ ] Personal collections and favorites
- [ ] User preferences and settings
- [ ] Artwork comments and ratings

### Search & Discovery
- [ ] Advanced search functionality with filters
- [ ] Similar artists and artworks recommendations
- [ ] Art style and period categorization
- [ ] Intelligent search engine with auto-suggestions

### Content & Recommendations
- [ ] Personalized artwork recommendations
- [ ] Curated collections and exhibitions
- [ ] Art movement exploration guides
- [ ] Related artworks suggestions

### Technical Improvements
- [ ] Code refactoring and optimization
- [ ] Performance improvements
- [ ] Better error handling
- [ ] Enhanced caching strategy
- [ ] Comprehensive testing implementation

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
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   ├── artists/        # Artist-related pages
│   ├── artworks/       # Artwork-related pages
│   └── about/          # Static pages
├── components/         
│   ├── common/         # Shared components (Header, Footer)
│   ├── home/           # Homepage-specific components
│   └── ui/             # Reusable UI components
├── lib/                
│   ├── types/          # TypeScript interfaces
│   └── utils.ts        # Utility functions
└── server/             
    ├── actions/        # Server actions for data fetching
    └── db/             # Database configuration and queries
```

## Key Features Details

### Artist Exploration
- Browse popular artists with biographical information
- View artist's complete artwork collection
- Timeline of artist's periods and career
- Related artists and influences

### Artwork Discovery
- Artwork viewing with zoom capability
- Detailed artwork information including style, period, and technique
- Similar artwork recommendations
- Responsive image loading with fallbacks

### User Interface
- Modern, responsive design
- Intuitive navigation
- Quick loading states and smooth transitions

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