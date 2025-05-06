<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Smartspec Backend

A powerful backend service for managing initiatives, tasks, and analytics with AI-powered task generation and monitoring capabilities.

## Features

- **Initiative Management**
  - Create and manage initiatives with detailed tracking
  - AI-powered task generation and suggestions
  - Revision history and change tracking
  - Status management and workflow automation

- **Analytics & Monitoring**
  - Real-time metrics collection with Prometheus
  - Comprehensive dashboards with Grafana
  - Custom metrics for:
    - HTTP request rates and durations
    - Database connection status
    - Initiative process metrics
    - Task generation performance
    - Revision tracking

- **Database & Storage**
  - PostgreSQL for persistent storage
  - TypeORM for database management
  - Automated migrations
  - Vector storage for similarity search

- **AI Integration**
  - OpenAI integration for task generation
  - Vector similarity search
  - Smart task suggestions
  - Historical context analysis

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Docker and Docker Compose (for containerized deployment)
- OpenAI API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=smartspec

# Connection Pool Configuration
DB_POOL_MAX=20
DB_POOL_MIN=4
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=2000

# OpenAI Configuration
OPENAI_API_KEY=your-api-key-here

# Environment
NODE_ENV=development
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smartspec_be
```

2. Install dependencies:
```bash
yarn install
```

3. Set up the database:
```bash
# Create the database
createdb smartspec

# Run migrations
yarn migration:run
```

4. Start the application:
```bash
# Development
yarn start:dev

# Production
yarn build
yarn start:prod
```

## Docker Deployment

1. Build and start the services:
```bash
docker-compose up -d
```

2. Access the services:
- Application: http://localhost:3000
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

## Available Scripts

- `yarn start:dev` - Start the application in development mode
- `yarn build` - Build the application
- `yarn start:prod` - Start the application in production mode
- `yarn migration:generate` - Generate a new migration
- `yarn migration:run` - Run pending migrations
- `yarn migration:revert` - Revert the last migration
- `yarn test` - Run tests
- `yarn test:e2e` - Run end-to-end tests
- `yarn lint` - Run linting
- `yarn format` - Format code

## API Documentation

The API documentation is available at `/api` when running the application. It includes:

- Initiative management endpoints
- Analytics endpoints
- Task generation endpoints
- Metrics endpoints

## Monitoring

### Prometheus Metrics

The application exposes metrics at `/metrics` with the following categories:

- HTTP request metrics
- Database connection metrics
- Initiative process metrics
- Task generation metrics
- Custom business metrics

### Grafana Dashboards

Two dashboards are available:

1. **Basic Dashboard**
   - Essential metrics overview
   - System health monitoring
   - Basic performance indicators

2. **Detailed Dashboard**
   - Comprehensive metrics
   - Trend analysis
   - Performance breakdowns
   - Custom visualizations

## Development

### Project Structure

```
src/
├── modules/
│   ├── initiatives/      # Initiative management
│   ├── metrics/         # Monitoring and metrics
│   ├── vector/          # Vector storage and search
│   ├── jira/            # JIRA integration
│   └── qdrant/          # Qdrant vector database
├── migrations/          # Database migrations
├── scripts/            # Utility scripts
└── config/             # Configuration files
```

### Adding New Features

1. Create a new module in `src/modules/`
2. Add necessary entities and DTOs
3. Implement services and controllers
4. Add tests
5. Update documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license information here]

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

This project is licensed under the MIT License.

