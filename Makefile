.PHONY: up down restart rebuild logs logs-app logs-poller ps shell

# Start the stack (no rebuild)
up:
	docker compose up -d

# Stop the stack
down:
	docker compose down

# Restart containers without rebuilding
restart:
	docker compose restart

# Rebuild images and recreate containers (use this after code changes)
rebuild:
	docker compose up -d --build --remove-orphans

# Build images without starting
build:
	docker compose build

# View logs from all containers (follow)
logs:
	docker compose logs -f

# View app logs only
logs-app:
	docker compose logs -f kidtube

# View Telegram poller logs only
logs-poller:
	docker compose logs -f telegram-poller

# Show running container status
ps:
	docker compose ps

# Open a shell in the app container
shell:
	docker compose exec kidtube sh
