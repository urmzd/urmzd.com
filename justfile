default: check

# Install dependencies
install:
    npm ci

# Build the site
build:
    npm run build

# Run linter
lint:
    npm run lint

# Typecheck
typecheck:
    npm run typecheck

# Quality gate: lint + typecheck + build
check: lint typecheck build

# Full CI gate
ci: lint typecheck build
