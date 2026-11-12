# 🎾 CourtMaster Pro — Gestión de Reservas de Canchas

Sistema fullstack para gestión de reservas de canchas deportivas.

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Spring Boot 3.3 + Java 25 |
| Base de datos | PostgreSQL 16 (Docker) |
| Seguridad | JWT + Spring Security |
| Migraciones | Flyway |

## 🚀 Cómo correr el proyecto

### 1. Base de datos
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
.\mvnw spring-boot:run
```

### 3. Frontend
```bash
cd frontend
npm run dev
```

## 🔐 Credenciales por defecto
- **Email:** admin@courtmaster.com
- **Contraseña:** admin123

## 🗺️ URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5433

