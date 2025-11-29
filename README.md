# SAIVED Backend

Backend platformy **SAIVED** – systemu do zarządzania projektami i kosztorysami dla architektów wnętrz.  
Aplikacja dostarcza API dla wtyczki przeglądarkowej SAIVED oraz webowy dashboard dla użytkowników.

Technologie:
- Ruby on Rails 7
- PostgreSQL (Docker)
- Redis (Docker) – pod Sidekiq / cache (future use)
- TailwindCSS
- ESBuild
- Makefile workflow (dev, DB, Redis)

---

## 🚀 Development Setup

Projekt korzysta z Docker Compose (Postgres + Redis) oraz standardowego `bin/dev` Railsowego.

### 1. Klonowanie repo

```bash
git clone https://github.com/<twoje_repo>/saived-backend.git
cd saived-backend
```

### 2. Przygotowanie bazy danych

Podniesienie Postgresa + przygotowanie schematu:

```bash
make prepare
```

Po tej komendzie baza jest gotowa.

### 3. Odpalenie backendu

```bash
make dev
```

Domyślnie aplikacja działa pod:

```
http://localhost:3000
```

Zatrzymanie:

```bash
make dev-down
```

---

## 📦 Dostępne komendy

### Postgres

```bash
make db-up
make db-down
make db-logs
make db-wipe
make db-psql
```

### Redis

```bash
make redis-up
make redis-down
make redis-logs
```

### Rails

```bash
make console     # rails c
make routes      # rails routes
```

---

## 🗂 Struktura projektu (MVP)

Na tym etapie projekt zawiera jedynie bazowy szkielet Railsa.  
Stopniowo będziemy dodawać:

- strony publiczne (landing)
- rejestrację i logowanie użytkowników
- dashboard
- API v1 dla wtyczki przeglądarkowej
- modele: User, Project, ProjectItem, SiteConfig
- Sidekiq i background jobs (odświeżanie cen)
- integrację z frontendem (Chrome Extension SAIVED)

---

## 🛠 Wymagania lokalne

- Ruby 3.2+
- Bundler
- Docker + Docker Compose
- Node.js (dla Tailwind/ESBuild – instalowany automatycznie przez Rails)

---

## 📄 Licencja

Projekt prywatny — wszystkie prawa zastrzeżone.

---

README wygenerowane automatycznie przez ChatGPT — jeśli coś w setupie nie działa, daj znać. 😄
