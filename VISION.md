# MockData - Visión del Producto

## 1. Problemática

**Problema:** Los equipos de desarrollo y QA pierden tiempo significativo creando datos de prueba que:
- Respeten constraints y relaciones de BD complejas
- Sean volumétricamente representativos
- Mantengan consistencia e integridad referencial
- Cubran casos de prueba específicos
- **⚠️ CRÍTICO: Muchas empresas usan copias de datos reales de producción para testing, exponiendo información sensible (PII, datos financieros, etc.) a más personas de las necesarias, violando regulaciones (GDPR, LGPD) y aumentando riesgos de seguridad**

**Solución:** MockData automatiza la generación inteligente de datos de prueba **sintéticos** mediante lenguaje natural, eliminando la necesidad de usar datos reales y reduciendo la exposición de información sensible.

### Beneficios de Seguridad
- ✅ Zero datos reales en ambientes de desarrollo/testing
- ✅ Cumplimiento de regulaciones de privacidad (GDPR, LGPD, HIPAA)
- ✅ Menor superficie de ataque (datos sintéticos sin valor)
- ✅ Developers/QA trabajan sin acceso a información sensible

---

## 2. Cliente Modelo (Organización)

**Perfil:**
- **Startups y scale-ups tecnológicas** (10-200 empleados)
- **Software houses / Consultoras de desarrollo**
- **Empresas de sectores regulados**: Fintech, Healthtech, E-commerce, Seguros
- **Equipos de producto con ciclos de desarrollo ágiles**

**Características:**
- Manejan datos sensibles (PII, financieros, médicos)
- Necesitan cumplir regulaciones (GDPR, LGPD, HIPAA)
- Tienen ambientes múltiples (dev, staging, QA)
- Presupuesto limitado para herramientas enterprise

**Pain Points Organizacionales:**
- Riesgo legal por exposición de datos reales en testing
- Costos de infraestructura para copiar/anonimizar datos de producción
- Onboarding lento (devs esperan acceso a datos de prueba)
- Auditorías de seguridad señalan datos sensibles en ambientes no productivos

---

## 3. Usuario Modelo (Persona)

### Primario:
- **Backend/Fullstack Developers** - Necesitan datos para desarrollo local
- **QA/Test Engineers** - Crean casos de prueba con datos específicos

### Secundario:
- **Tech Leads** - Configuran ambientes de equipo
- **DevOps** - Integran en pipelines CI/CD

---

## 4. MVP - Funcionalidades Core

### Alcance Inicial:
1. **Conexión a BD PostgreSQL** (una sola BD para empezar)
2. **Análisis automático de esquema** (tablas, columnas, PKs, FKs, tipos)
3. **Chat interface** para solicitar datos en lenguaje natural
4. **Generación básica** respetando constraints y relaciones
5. **Inyección directa** a la BD conectada
6. **Export a SQL** como alternativa

### Límites del MVP:
- Solo PostgreSQL
- Datos en inglés (nombres, textos genéricos)
- Sin persistencia de configuraciones
- Volumetría limitada (hasta 10k registros por request)

---

## 5. Roadmap - Funcionalidades Futuras

### Fase 2:
- Soporte MySQL, SQLite
- Export a CSV, JSON
- Datos localizados (español, otros idiomas)
- Templates guardables y reutilizables

### Fase 3:
- MongoDB y BDs NoSQL
- Datos específicos por región (DNI, CUIT, etc.)
- API REST para integración CI/CD
- Generación incremental (agregar datos sin borrar)

### Fase 4:
- Múltiples BDs simultáneas
- Datos con patrones temporales (series de tiempo)
- Anonimización de datos reales
- Colaboración en equipo

---

## Value Proposition

**"Genera datos de prueba sintéticos e inteligentes en segundos, sin exponer información sensible"**

### Diferenciadores Clave:
1. **Seguridad primero**: Elimina riesgos de exposición de datos reales
2. **Lenguaje natural**: No requiere scripting complejo
3. **Integridad automática**: Respeta todas las relaciones y constraints
4. **Flexible**: Inyección directa o archivos exportables
