COMPOSE_BASE   = COMPOSE_PROJECT_NAME=saived docker compose
DB_COMPOSE     = $(COMPOSE_BASE) -f docker-compose.db.yml
REDIS_COMPOSE  = $(COMPOSE_BASE) -f docker-compose.redis.yml

PGHOST ?= 127.0.0.1
PGPORT ?= 5433
PGUSER ?= postgres
PGPASSWORD ?= postgres
REDIS_URL ?= redis://127.0.0.1:6380/0
RAILS_ENV ?= development

.PHONY: help db-up db-down db-restart db-logs db-psql db-wipe db-status \
        dev dev-db dev-down prepare console routes redis-up redis-down redis-logs

help:
	@echo "Targets:"
	@echo "  make dev         - start PG+Redis+Rails (Ctrl+C = sprząta)"
	@echo "  make prepare     - rails db:prepare (po odpaleniu DB)"
	@echo "  make db-up/down  - Postgres (compose)"
	@echo "  make redis-up/down - Redis (compose)"
	@echo "  make console/routes - rails c / routes"

db-up:
	$(DB_COMPOSE) up -d

db-down:
	$(DB_COMPOSE) stop

db-restart:
	$(DB_COMPOSE) restart

db-logs:
	$(DB_COMPOSE) logs -f db

db-psql:
	psql "postgres://$(PGUSER):$(PGPASSWORD)@$(PGHOST):$(PGPORT)/postgres"

db-wipe:
	$(DB_COMPOSE) down -v

db-status:
	@echo "== Docker ps ==" && $(DB_COMPOSE) ps || true
	@echo "\n== pg_isready ==" && pg_isready -h $(PGHOST) -p $(PGPORT) || true

dev-db:
	$(DB_COMPOSE) up -d
	@echo "Waiting for Postgres on $(PGHOST):$(PGPORT)..."
	@until pg_isready -h $(PGHOST) -p $(PGPORT) >/dev/null 2>&1; do sleep 1; done
	@echo "Postgres is ready."

prepare: dev-db
	PGHOST=$(PGHOST) PGPORT=$(PGPORT) PGUSER=$(PGUSER) PGPASSWORD=$(PGPASSWORD) bin/rails db:prepare

dev:
	RAILS_ENV=$(RAILS_ENV) ./bin/dev

dev-down:
	- $(REDIS_COMPOSE) stop || true
	- $(DB_COMPOSE) stop || true

redis-up:
	$(REDIS_COMPOSE) up -d

redis-down:
	$(REDIS_COMPOSE) stop

redis-logs:
	$(REDIS_COMPOSE) logs -f

console:
	PGHOST=$(PGHOST) PGPORT=$(PGPORT) PGUSER=$(PGUSER) PGPASSWORD=$(PGPASSWORD) bin/rails c

routes:
	PGHOST=$(PGHOST) PGPORT=$(PGPORT) PGUSER=$(PGUSER) PGPASSWORD=$(PGPASSWORD) bin/rails routes