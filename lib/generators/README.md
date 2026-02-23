# Data Generation System

Sistema inteligente de generación de datos de prueba con soporte para constraints complejos y casos de QA específicos.

## Arquitectura

```
User Prompt → LLM Parser → Generation Plan → Validator → Data Generator → SQL/Execute
```

## Componentes

### 1. **PlanParser** (`plan-parser.ts`)
Convierte lenguaje natural a plan estructurado usando LLM.

**Input:**
```
"Genera 100 usuarios donde 80% tengan status 'active'"
```

**Output:**
```json
{
  "description": "Generate 100 users with status distribution",
  "strategy": "insert",
  "tables": [{
    "name": "users",
    "count": 100,
    "constraints": [{
      "column": "status",
      "rule": "percentage",
      "value": { "active": 0.8, "inactive": 0.2 }
    }]
  }]
}
```

### 2. **ConstraintValidator** (`constraint-validator.ts`)
Valida el plan contra el esquema de BD.

**Validaciones:**
- Tablas existen en el esquema
- Columnas existen en las tablas
- Constraints son válidos para el tipo de dato
- Relaciones FK son correctas
- Orden de generación respeta dependencias

### 3. **DataGenerator** (`data-generator.ts`)
Genera los datos según el plan validado.

**Features:**
- Respeta constraints de BD (NOT NULL, UNIQUE, FK)
- Genera datos realistas con Faker.js
- Maneja relaciones entre tablas
- Produce SQL optimizado

### 4. **FakerProvider** (`faker-provider.ts`)
Genera valores realistas basados en tipo de columna y PII detectado.

**Estrategias:**
- Detecta PII automáticamente (email, phone, name, etc.)
- Usa patrones de nombre de columna (price, quantity, status)
- Fallback a tipo de dato SQL

## Tipos de Constraints

### `percentage`
Distribución porcentual de valores categóricos.

```json
{
  "column": "status",
  "rule": "percentage",
  "value": { "active": 0.7, "pending": 0.2, "cancelled": 0.1 }
}
```

### `range`
Rango numérico o de fechas.

```json
{
  "column": "age",
  "rule": "range",
  "value": { "min": 18, "max": 65 }
}
```

### `pattern`
Patrón de string (ej: dominio de email).

```json
{
  "column": "email",
  "rule": "pattern",
  "value": "@company.com"
}
```

### `enum`
Lista de valores permitidos.

```json
{
  "column": "status",
  "rule": "enum",
  "value": ["draft", "published", "archived"]
}
```

### `null_percentage`
Porcentaje de valores NULL (para columnas nullable).

```json
{
  "column": "middle_name",
  "rule": "null_percentage",
  "value": 0.3
}
```

### `unique`
Garantiza valores únicos.

```json
{
  "column": "username",
  "rule": "unique",
  "value": true
}
```

## Estrategias de Relaciones

### `existing`
Usa solo valores FK existentes (falla si no hay datos).

### `random_existing`
Distribuye aleatoriamente entre valores FK existentes.

```json
{
  "foreignTable": "users",
  "foreignColumn": "id",
  "localColumn": "user_id",
  "strategy": "random_existing",
  "distribution": { "min": 1, "max": 5 }
}
```

### `generate`
Genera nuevos registros en tabla padre si es necesario.

## Casos de Uso QA

### Test de Flujo Completo
```
Generate data for testing checkout:
- 10 new users with empty cart
- 5 users with abandoned cart (pending > 24h)
- 3 VIP users with 10+ completed orders
```

### Test de Límites
```
Generate edge case products:
- 10 products with price = $0.01 (minimum)
- 10 products with price > $10,000 (expensive)
- 5 products with stock = 0 (out of stock)
```

### Test de Distribución
```
Generate realistic order distribution:
- 1000 orders over last 6 months
- Peak during holidays (Dec, July)
- 80% completed, 15% pending, 5% cancelled
```

## API Endpoints

### `POST /api/generate/plan`
Genera plan estructurado desde prompt.

**Request:**
```json
{
  "prompt": "Generate 100 users...",
  "schema": { ... }
}
```

**Response:**
```json
{
  "plan": { ... },
  "validationErrors": [],
  "valid": true
}
```

### `POST /api/generate/preview`
Genera preview del SQL (primeras 5 filas).

**Request:**
```json
{
  "plan": { ... },
  "schema": { ... }
}
```

**Response:**
```json
{
  "result": {
    "sql": "INSERT INTO ...",
    "rowsGenerated": 5
  }
}
```

### `POST /api/generate/execute`
Ejecuta generación completa (opcional: en BD).

**Request:**
```json
{
  "plan": { ... },
  "schema": { ... },
  "executeInDb": true
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "sql": "...",
    "rowsGenerated": 100,
    "tables": [{ "name": "users", "rows": 100 }]
  },
  "executed": true,
  "message": "Successfully inserted 100 rows"
}
```

## Flujo de Usuario

1. **Escribir prompt** con requerimientos de datos
2. **Generar plan** - LLM interpreta y crea plan estructurado
3. **Revisar plan** - Ver constraints, relaciones, validaciones
4. **Preview SQL** (opcional) - Ver primeras filas generadas
5. **Ejecutar** - Inyectar en BD o descargar SQL

## Seguridad

- Todas las ejecuciones usan transacciones (ROLLBACK en error)
- Validación de plan antes de generar
- Preview antes de ejecutar en BD
- Límite de 10,000 filas por request (configurable)
