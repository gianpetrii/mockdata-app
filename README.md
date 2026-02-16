# MockData

Genera datos de prueba sintéticos e inteligentes en segundos, sin exponer información sensible.

## Problemática

Las empresas usan copias de datos reales de producción para testing, exponiendo información sensible (PII, datos financieros) a más personas de las necesarias, violando regulaciones (GDPR, LGPD) y aumentando riesgos de seguridad.

MockData automatiza la generación y anonimización de datos de prueba sintéticos, eliminando la necesidad de usar datos reales.

## Cliente Modelo

- Startups y scale-ups tecnológicas (10-200 empleados)
- Software houses / Consultoras de desarrollo
- Empresas de sectores regulados: Fintech, Healthtech, E-commerce, Seguros
- Equipos que manejan datos sensibles y necesitan cumplir regulaciones

## MVP - Funcionalidades

1. **Conexión a BD** (PostgreSQL, MySQL)
2. **Detección automática de PII** (regex + nombres de columnas)
3. **Visualización de schema** (diagrama ER interactivo)
4. **Chat/LLM interface** para especificar transformaciones
5. **5 estrategias de anonimización**:
   - Synthetic realistic replacement
   - Deterministic hash
   - Randomized preserving format
   - Nullification
   - Keep original
6. **Safe Clone** (nueva BD anonimizada)
7. **Export SQL** opcional
8. **Preservación de constraints** (PKs, FKs, unique, not null, checks)

## Stack Tecnológico

- **Backend**: Node.js + TypeScript + Express + Knex.js
- **Frontend**: Next.js + shadcn/ui + Tailwind + React Flow
- **LLM**: OpenRouter (MVP) → Claude (producción)
- **Databases**: PostgreSQL, MySQL

## Estructura del Proyecto

```
mockdata-app/
├── backend/          # API + lógica de anonimización
├── frontend/         # Next.js app
└── pnpm-workspace.yaml
```

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Desarrollo (ambos servicios)
pnpm dev

# Solo frontend
pnpm dev:frontend

# Solo backend
pnpm dev:backend
```

## Configuración

1. Copiar `backend/.env.example` a `backend/.env`
2. Configurar `OPENROUTER_API_KEY`
3. Configurar conexiones de BD según necesidad

## Roadmap

### Fase 2
- Tokenization determinística
- Relationship-aware synthetic generation
- Distribution-preserving generation
- CLI tool
- Integración cloud storage

### Fase 3
- Differential privacy
- k-anonymity
- Data profiling avanzado
- Audit logs
- SOC2 compliance
