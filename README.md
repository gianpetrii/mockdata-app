# MockData

**Genera datos de prueba sintéticos e inteligentes en segundos, sin exponer información sensible.**

MockData es una herramienta para equipos de desarrollo y QA que automatiza la generación de datos de prueba y la ofuscación de datos reales, eliminando riesgos de seguridad y cumpliendo con regulaciones de privacidad (GDPR, LGPD, HIPAA).

---

## 🎯 Problema que Resuelve

**⚠️ CRÍTICO:** Muchas empresas usan copias de datos reales de producción para testing, exponiendo:
- Información personal (PII)
- Datos financieros
- Registros médicos
- Violando regulaciones (GDPR, LGPD, HIPAA)
- Aumentando riesgos de seguridad

**✅ SOLUCIÓN:** MockData proporciona dos approaches:
1. **Generación sintética** - Crea datos de prueba desde cero
2. **Ofuscación de datos reales** - Transforma datos existentes en seguros

---

## 🚀 Features

### ✅ Discovery
- Conexión a PostgreSQL
- Introspección automática de esquema
- Detección de 50+ tipos de PII
- Diagrama ER interactivo
- Clasificación de datos sensibles

### ✅ Data Generation
- Generación con lenguaje natural
- 6 tipos de constraints complejos
- Relaciones FK automáticas
- Casos de QA específicos
- Preview y ejecución

### ✅ Data Anonymization
- Análisis de PII en datos reales
- 9 estrategias de ofuscación
- Preview antes de ejecutar
- Transacciones seguras
- Download SQL para auditoría

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS
- **Backend:** Node.js, Knex.js
- **Database:** PostgreSQL
- **LLM:** OpenRouter (GPT-4o-mini)
- **Data Generation:** Faker.js
- **Visualization:** ReactFlow
- **Auth:** Firebase

---

## 📦 Installation

```bash
# Clone repo
git clone <repo-url>
cd mockdata-app

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Environment Variables

```bash
# OpenRouter API (for LLM)
OPENROUTER_API_KEY=your_key_here

# Firebase (for auth)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 📖 Usage

### 1. Connect to Database

```
1. Navigate to /app
2. Enter PostgreSQL credentials
3. Click "Connect & Analyze"
```

### 2. Explore Schema

```
- View ER Diagram
- See table details
- Check PII classification
```

### 3. Generate Mock Data

```
1. Go to "Generate Data" tab
2. Write prompt or use examples:
   "Generate 100 users where 80% are active"
3. Review plan
4. Preview SQL or Execute
```

### 4. Anonymize Existing Data

```
1. Go to "Anonymize Data" tab
2. Click "Analyze & Detect PII"
3. Review detected PII
4. Customize strategies
5. Preview SQL
6. Execute (with confirmation)
```

---

## 🎯 Use Cases

### For Developers
- Local development with realistic data
- No access to production PII
- Fast onboarding

### For QA Engineers
- Specific test scenarios
- Edge cases and distributions
- Reproducible test data

### For DevOps
- Safe staging environments
- Compliance with regulations
- Automated data pipelines

### For Security Teams
- Eliminate PII exposure
- Audit trails
- Compliance reporting

---

## 📚 Documentation

- **[VISION.md](./VISION.md)** - Product vision and roadmap
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture
- **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - 20+ prompt examples
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
- **[lib/generators/README.md](./lib/generators/README.md)** - Generation system docs
- **[lib/anonymization/README.md](./lib/anonymization/README.md)** - Anonymization system docs

---

## 🔒 Security & Compliance

### Data Protection
- ✅ Zero real data in dev/test environments
- ✅ Transaction-based operations (ROLLBACK on error)
- ✅ Preview before execution
- ✅ Audit trail (SQL logs)

### Compliance
- ✅ **GDPR** - Right to erasure, data minimization, pseudonymization
- ✅ **HIPAA** - De-identification, Safe Harbor method
- ✅ **LGPD** - Anonymization and pseudonymization

---

## 🎨 Screenshots

### ER Diagram with PII Classification
![ER Diagram](docs/screenshots/er-diagram.png)

### Data Generation with Examples
![Generation](docs/screenshots/generation.png)

### Data Anonymization
![Anonymization](docs/screenshots/anonymization.png)

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🗺️ Roadmap

### Current (MVP)
- ✅ PostgreSQL support
- ✅ Data generation with constraints
- ✅ Data anonymization
- ✅ 50+ PII types detected

### Next
- [ ] MySQL and SQLite support
- [ ] CSV/JSON export
- [ ] Saved templates
- [ ] Localized data (ES, PT-BR)

### Future
- [ ] MongoDB and NoSQL
- [ ] API for CI/CD integration
- [ ] Team collaboration
- [ ] Time-series data generation

---

## 💡 Examples

### Generate Data
```
Generate 100 users where:
- 80% have status 'active'
- Ages between 25-45
- Created in last 6 months
```

### Anonymize Data
```
1. Analyze existing data
2. Detect PII automatically
3. Choose strategies:
   - Emails → mask
   - Names → fake
   - SSN → tokenize
   - Salaries → noise
4. Execute with transaction safety
```

---

## 🐛 Known Issues

None currently. Report issues on GitHub.

---

## 📞 Support

- **Documentation:** See docs folder
- **Issues:** GitHub Issues
- **Email:** support@mockdata.app

---

Built with ❤️ for developers who care about data privacy.
