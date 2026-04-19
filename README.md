# MockData App

## Descripción del proyecto

Frontend **Next.js** para **generar datos de prueba** y, según la implementación, ofuscar o transformar datos sensibles, usando Firebase y modelos de lenguaje vía **OpenRouter**.

## Problema que resuelve

Los equipos de desarrollo y QA suelen copiar producción o inventar datos a mano, con riesgo de filtrar PII o violar normas: esta herramienta apunta a obtener datos útiles y seguros para entornos no productivos sin exponer información real.

## Stack

- Next.js, React, TypeScript
- Firebase

## Requisitos

- Node.js LTS
- Cuenta OpenRouter si usás la API

## Instalación

```bash
npm install
npm run dev
```

Scripts: `build`, `start`, `lint`.

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá `OPENROUTER_API_KEY` y las variables `NEXT_PUBLIC_FIREBASE_*`.
