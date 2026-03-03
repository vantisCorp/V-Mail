# Vantis Mail - Makefile for Project Management
# Provides convenient commands for all platforms and common operations

.PHONY: help install dev build test lint format clean deploy

# Default target
help:
	@echo "Vantis Mail - Available Commands:"
	@echo ""
	@echo "Web Application:"
	@echo "  make web-install          - Install web dependencies"
	@echo "  make web-dev              - Start web development server"
	@echo "  make web-build            - Build web application"
	@echo "  make web-preview          - Preview web build"
	@echo "  make web-test             - Run web tests"
	@echo "  make web-lint             - Lint web code"
	@echo "  make web-format           - Format web code"
	@echo ""
	@echo "Backend (Rust):"
	@echo "  make backend-dev          - Start backend development server"
	@echo "  make backend-build        - Build backend"
	@echo "  make backend-test         - Run backend tests"
	@echo "  make backend-lint         - Lint backend code"
	@echo ""
	@echo "Desktop App (Tauri):"
	@echo "  make desktop-install      - Install desktop dependencies"
	@echo "  make desktop-dev          - Start desktop development"
	@echo "  make desktop-build        - Build desktop app"
	@echo "  make desktop-test         - Run desktop tests"
	@echo "  make desktop-lint         - Lint desktop code"
	@echo ""
	@echo "Mobile App (React Native):"
	@echo "  make mobile-install       - Install mobile dependencies"
	@echo "  make mobile-dev           - Start mobile development server"
	@echo "  make mobile-android       - Run on Android"
	@echo "  make mobile-ios           - Run on iOS"
	@echo "  make mobile-test          - Run mobile tests"
	@echo "  make mobile-lint          - Lint mobile code"
	@echo ""
	@echo "General:"
	@echo "  make install              - Install all dependencies"
	@echo "  make dev                  - Start all development servers"
	@echo "  make build                - Build all applications"
	@echo "  make test                 - Run all tests"
	@echo "  make lint                 - Lint all code"
	@echo "  make format               - Format all code"
	@echo "  make clean                - Clean all build artifacts"
	@echo "  make deploy               - Deploy to production"
	@echo ""

# Install all dependencies
install:
	@echo "Installing all dependencies..."
	@make web-install
	@make desktop-install
	@make mobile-install
	@echo "All dependencies installed!"

# Web Application
web-install:
	@echo "Installing web dependencies..."
	npm install

web-dev:
	@echo "Starting web development server..."
	npm run dev

web-build:
	@echo "Building web application..."
	npm run build

web-preview:
	@echo "Previewing web build..."
	npm run preview

web-test:
	@echo "Running web tests..."
	npm run test

web-lint:
	@echo "Linting web code..."
	npm run lint

web-format:
	@echo "Formatting web code..."
	npm run format

# Backend
backend-dev:
	@echo "Starting backend development server..."
	cd backend && cargo run

backend-build:
	@echo "Building backend..."
	cd backend && cargo build --release

backend-test:
	@echo "Running backend tests..."
	cd backend && cargo test

backend-lint:
	@echo "Linting backend code..."
	cd backend && cargo clippy

# Desktop App
desktop-install:
	@echo "Installing desktop dependencies..."
	cd desktop-app && npm install

desktop-dev:
	@echo "Starting desktop development..."
	cd desktop-app && npm run tauri:dev

desktop-build:
	@echo "Building desktop app..."
	cd desktop-app && npm run tauri:build

desktop-test:
	@echo "Running desktop tests..."
	cd desktop-app && npm run test

desktop-lint:
	@echo "Linting desktop code..."
	cd desktop-app && npm run lint

desktop-format:
	@echo "Formatting desktop code..."
	cd desktop-app && npm run format

# Mobile App
mobile-install:
	@echo "Installing mobile dependencies..."
	cd mobile-app && npm install

mobile-dev:
	@echo "Starting mobile development server..."
	cd mobile-app && npm start

mobile-android:
	@echo "Running on Android..."
	cd mobile-app && npm run android

mobile-ios:
	@echo "Running on iOS..."
	cd mobile-app && npm run ios

mobile-test:
	@echo "Running mobile tests..."
	cd mobile-app && npm run test

mobile-lint:
	@echo "Linting mobile code..."
	cd mobile-app && npm run lint

mobile-format:
	@echo "Formatting mobile code..."
	cd mobile-app && npm run format

# General commands
dev:
	@echo "Starting all development servers..."
	@echo "Note: Run each development server in separate terminal"
	@echo "  Web: make web-dev"
	@echo "  Backend: make backend-dev"
	@echo "  Desktop: make desktop-dev"
	@echo "  Mobile: make mobile-dev"

build:
	@echo "Building all applications..."
	@make web-build
	@make backend-build
	@make desktop-build
	@echo "All applications built!"

test:
	@echo "Running all tests..."
	@make web-test
	@make backend-test
	@make mobile-test
	@echo "All tests completed!"

lint:
	@echo "Linting all code..."
	@make web-lint
	@make backend-lint
	@make desktop-lint
	@make mobile-lint
	@echo "All code linted!"

format:
	@echo "Formatting all code..."
	@make web-format
	@make desktop-format
	@make mobile-format
	@echo "All code formatted!"

clean:
	@echo "Cleaning all build artifacts..."
	@rm -rf node_modules
	@rm -rf dist
	@rm -rf backend/target
	@rm -rf desktop-app/node_modules
	@rm -rf desktop-app/dist
	@rm -rf desktop-app/src-tauri/target
	@rm -rf mobile-app/node_modules
	@echo "All build artifacts cleaned!"

deploy:
	@echo "Deploying to production..."
	@echo "This will deploy using the configured CI/CD pipeline"
	@echo "Make sure all tests pass and code is reviewed"
	@echo "Run: git push origin main"