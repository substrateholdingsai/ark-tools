# ARK Tools

**ARK TOOLS** — Suite de herramientas modernas para contadores. Worker unificado en Cloudflare.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/substrateholdingsai/ark-tools)

## Descripción

ARK Tools es una suite de cálculo financiero y fiscal diseñada específicamente para contadores y profesionales financieros en México. Proporciona calculadoras precisas y actualizadas para los principales impuestos y obligaciones fiscales mexicanas.

## Herramientas Incluidas

| Herramienta | Descripción |
|-------------|-------------|
| **ISN** | Calculadora de Impuesto Sobre Nóminas por estado con tasas actualizadas |
| **Leasing** | Calculadora de arrendamiento financiero con tabla de proyección mensual |
| **Mapa de Activos** | Visualización interactiva de activos y pasivos |
| **Nómina** | Calculadora completa con desglose IMSS/ISR y deducciones |
| **SBC** | Calculadora de Salario Base de Cotización con rangos UMA |
| **SPEI** | Generador de enlaces de cobro SPEI con integración Clip |
| **XML → Excel** | Conversor de facturas CFDI XML a Excel |
| **Validador XML** | Auditoría de cumplimiento CFDI con score de validación |

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Build**: Vite 5
- **Styling**: Tailwind CSS + PostCSS
- **Testing**: Vitest + Coverage V8
- **Deploy**: Cloudflare Workers (Wrangler)
- **Linting**: ESLint + Prettier + Husky

## Requisitos

- Node.js >= 20.0.0
- pnpm >= 9.0.0

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/substrateholdingsai/ark-tools.git
cd ark-tools

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .dev.vars.example .dev.vars
# Editar .dev.vars con tus credenciales
```

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia servidor de desarrollo con Wrangler
pnpm build            # Build de producción
pnpm build:watch      # Build en modo watch

# Despliegue
pnpm deploy           # Deploy a producción
pnpm deploy:staging   # Deploy a staging
pnpm deploy:production # Deploy a producción (explícito)

# Calidad de código
pnpm typecheck        # Verificación de tipos TypeScript
pnpm lint             # Linting con ESLint
pnpm lint:fix         # Auto-fix linting
pnpm format           # Formateo con Prettier
pnpm format:check     # Verificar formato

# Testing
pnpm test             # Ejecutar tests
pnpm test:watch       # Tests en modo watch
pnpm test:ui          # UI de tests
pnpm test:coverage    # Coverage report

# Utilidades
pnpm cf-typegen       # Generar tipos de Cloudflare
pnpm clean            # Limpiar artifacts de build
```

## Estructura del Proyecto

```
ark-tools/
├── src/
│   ├── components/          # Componentes UI compartidos
│   │   └── ui/              # Componentes de diseño (GlassButton, LCDDisplay, etc.)
│   ├── data/                # Datos estáticos (estados, actos, conductas)
│   ├── lib/                 # Utilidades compartidas (cn.ts)
│   ├── styles/              # Estilos globales (ark-system.css)
│   ├── tools/               # Herramientas principales
│   │   ├── isn/             # Calculadora ISN
│   │   ├── leasing/         # Calculadora Leasing
│   │   ├── mapa-activos/    # Mapa de Activos
│   │   ├── nomina/          # Calculadora Nómina
│   │   ├── sbc/             # Calculadora SBC
│   │   ├── spei/            # Generador SPEI
│   │   ├── xml-excel/       # Conversor XML→Excel
│   │   └── xml-validador/   # Validador XML
│   ├── App.tsx              # App principal
│   ├── index.tsx            # Entry point
│   └── index.ts             # Exports
├── docs/                    # Documentación
│   ├── design-system.md     # Sistema de diseño
│   └── map.md               # Mapa de arquitectura
├── wrangler.toml            # Config Cloudflare Workers
├── vite.config.ts           # Config Vite
├── tailwind.config.js       # Config Tailwind
├── tsconfig.json            # Config TypeScript
└── vitest.config.ts         # Config Vitest
```

## Variables de Entorno

Copiar `.dev.vars.example` a `.dev.vars` y configurar:

```bash
# Clip API (para SPEI)
CLIP_API_KEY=your_clip_api_key
CLIP_API_SECRET=your_clip_api_secret

# Cloudflare (configurado en wrangler.toml)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

## Despliegue en Cloudflare Workers

### Configuración Inicial

```bash
# Login en Cloudflare
wrangler login

# Verificar configuración
wrangler whoami
```

### Deploy

```bash
# Staging
pnpm deploy:staging

# Producción
pnpm deploy:production
```

El `wrangler.toml` está configurado con:
- `main` → producción
- `staging` environment → staging

## Testing

```bash
# Ejecutar todos los tests
pnpm test

# Con coverage
pnpm test:coverage

# UI interactiva
pnpm test:ui
```

Los tests están organizados junto a cada herramienta en `src/tools/*/lib/*.test.ts`.

## Contribución

1. Fork el repositorio
2. Crear feature branch: `git checkout -b feature/nueva-herramienta`
3. Commit cambios: `git commit -m "feat: agregar nueva herramienta"`
4. Push: `git push origin feature/nueva-herramienta`
5. Abrir Pull Request

### Convenciones de Commit

- `feat:` — Nueva funcionalidad
- `fix:` — Corrección de bug
- `docs:` — Documentación
- `style:` — Formato (prettier, etc.)
- `refactor:` — Refactorización
- `test:` — Tests
- `chore:` — Mantenimiento

## Licencia

UNLICENSED — Propiedad de Substrate Holdings LLC

## Enlaces

- **Producción**: https://tools.arksystems.site
- **Repositorio**: https://github.com/substrateholdingsai/ark-tools
- **Issues**: https://github.com/substrateholdingsai/ark-tools/issues