.PHONY: up down build restart logs backoffice clean

## Start the container, rebuild if needed, and register the portless alias
up:
	portless proxy start || true
	docker compose up -d --build
	portless alias devstrechplus 7300
	@echo ""
	@echo "DevStretch Plus is running"
	@echo "  https://devstrechplus.localhost"
	@echo "  http://localhost:7300"

## Stop the container
down:
	docker compose down

## Rebuild the image without starting
build:
	docker compose build

## Restart the container (no rebuild)
restart:
	docker compose restart

## Tail container logs
logs:
	docker compose logs -f

## Open the backoffice TUI inside the running container
backoffice:
	docker exec -it -w /usr/share/nginx/html devstretch-plus node /app/backoffice/cli.js

## Stop container and remove image and volumes
clean:
	docker compose down --rmi all --volumes
