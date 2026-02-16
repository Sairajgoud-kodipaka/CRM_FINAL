# Jewellery CRM

Complete CRM solution for Indian jewellery businesses.

Manage customers, sales pipeline, inventory, and e-commerce integration.

## Local Development with Docker

Use Docker for a consistent dev environment (no need to match Python/Node versions on your machine).

### Setup (first time)

1. **Install prerequisites**
   - Docker Desktop (with Docker Compose v2 enabled).

2. **Copy env templates**
   - Backend:
     - Windows (PowerShell):  
       `copy backend\dev.environment.example backend\.env`
   - Frontend:
     - Windows (PowerShell):  
       `copy jewellery-crm\dev.environment.example jewellery-crm\.env.dev`

3. **(Optional) Keep production env separate**
   - If you have a production `.env` in `backend/`, rename it (e.g. `.env.prod`) so it is not used for Docker dev.

### Running the stack

From the project root (`K:\CRM_FINAL`):

- **Start all services (build if needed)**

  ```bash
  docker compose -f docker-compose.dev.yml up --build
  ```

- **Stop all services**

  ```bash
  docker compose -f docker-compose.dev.yml down
  ```

### What runs in Docker

- `backend-dev` – Django (Python 3.12) at `http://localhost:8001` (container port 8000)
- `backend-cron` – Appointment reminder job (runs every 15 min; no manual run needed)
- `db-dev` – Postgres 15 on host port `5434`
- `redis-dev` – Redis 7 on host port `6380`

Source directories (`backend/`, `jewellery-crm/`) are bind mounted into the containers, so saving code locally triggers hot reload in both backend and frontend.

### Backend workflow inside Docker

- **Run migrations**

  ```bash
  docker compose -f docker-compose.dev.yml exec backend-dev python manage.py migrate
  ```

- **Create superuser**

  ```bash
  docker compose -f docker-compose.dev.yml exec backend-dev python manage.py createsuperuser
  ```

- **Run tests**

  ```bash
  docker compose -f docker-compose.dev.yml exec backend-dev python manage.py test
  ```

- **Open Django shell**

  ```bash
  docker compose -f docker-compose.dev.yml exec backend-dev python manage.py shell
  ```

### Frontend workflow inside Docker

- **Frontend URL**
  - Open `http://localhost:3001` in your browser.

- **If you need to install new npm packages**
  - Install locally in `jewellery-crm/`:

    ```bash
    cd jewellery-crm
    npm install <package-name>
    ```

  - The `Dockerfile.dev` uses `npm ci`, so after editing `package.json`/`package-lock.json`, rebuild:

    ```bash
    cd ..
    docker compose -f docker-compose.dev.yml up --build
    ```

### Common Docker commands (cheat sheet)

- **View logs of all services (running stack)**

  ```bash
  docker compose -f docker-compose.dev.yml logs -f
  ```

- **View logs for a single service**

  ```bash
  docker compose -f docker-compose.dev.yml logs -f backend-dev
  docker compose -f docker-compose.dev.yml logs -f frontend-dev
  ```

- **Restart a single service**

  ```bash
  docker compose -f docker-compose.dev.yml restart backend-dev
  ```

- **Open a shell inside a container**

  ```bash
  docker compose -f docker-compose.dev.yml exec backend-dev bash
  docker compose -f docker-compose.dev.yml exec frontend-dev sh
  ```

