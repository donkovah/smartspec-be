.PHONY: up down logs test dev build clean

# Development
up:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

down:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml down

logs:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml logs -f

# Testing
test:
	yarn test

test-watch:
	yarn test:watch

test-coverage:
	yarn test:cov

# Building
build:
	docker-compose build

# Cleaning
clean:
	docker-compose down -v
	rm -rf node_modules
	rm -rf dist

# Development shortcuts
dev: up logs

# Monitoring
monitoring:
	@echo "Grafana: http://localhost:3001 (admin/admin)"
	@echo "Prometheus: http://localhost:9090"

# Database
db-shell:
	docker-compose exec qdrant curl http://localhost:6333/collections

# Help
help:
	@echo "Available commands:"
	@echo "  make up              - Start all services in development mode"
	@echo "  make down            - Stop all services"
	@echo "  make logs            - View logs from all services"
	@echo "  make test            - Run tests"
	@echo "  make test-watch      - Run tests in watch mode"
	@echo "  make test-coverage   - Run tests with coverage"
	@echo "  make build           - Build all services"
	@echo "  make clean           - Clean up containers, volumes, and build artifacts"
	@echo "  make dev             - Start services and tail logs"
	@echo "  make monitoring      - Show monitoring URLs"
	@echo "  make db-shell        - Query Qdrant collections" 