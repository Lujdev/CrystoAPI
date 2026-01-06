<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<p align="center">Un framework progresivo de <a href="http://nodejs.org" target="_blank">Node.js</a> para construir aplicaciones del lado del servidor eficientes y escalables.</p>

<p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
</p>

# CrystoAPI NestJS

**CrystoAPI** es una API RESTful desarrollada con NestJS que proporciona cotizaciones actualizadas de criptomonedas y monedas fiat en el mercado venezolano. Recopila datos de diversas fuentes (BCV, Binance P2P, Italcambios) mediante scrapers automatizados y los unifica en una interfaz sencilla.

## 🚀 Características

-   **Multi-fuente**: Obtención de tasas de BCV, Binance y Italcambios.
-   **Actualización Automática**: Tareas programadas (Cron Jobs) para sincronizar tasas cada 30 minutos.
-   **Histórico**: Almacenamiento de historial de tasas para cálculo de variaciones (24h).
-   **Performance**: Uso de base de datos SQLite ligera y eficiente.
-   **Documentación**: Swagger UI integrado.
-   **Salud del Sistema**: Endpoints de Health Check.

## 🛠️ Instalación y Configuración

1.  **Clonar el repositorio**
    ```bash
    git clone <url-del-repositorio>
    cd crystoapi-nestjs
    ```

2.  **Instalar dependencias**
    ```bash
    pnpm install
    ```

3.  **Configurar variables de entorno**
    Copia el archivo de ejemplo y ajústalo según tus necesidades:
    ```bash
    cp .env.example .env
    ```

4.  **Base de Datos**
    El proyecto utiliza SQLite. Las migraciones se encargan de crear la estructura:
    ```bash
    pnpm run migration:run
    ```

## ▶️ Ejecución

```bash
# Desarrollo (con recarga automática)
pnpm run dev

# Desarrollo (modo debug)
pnpm run dev:debug

# Producción
pnpm run build
pnpm run start:prod
```

## 📡 Documentación de la API

La API cuenta con documentación interactiva Swagger disponible en `/docs` cuando la aplicación está corriendo (ej. `http://localhost:3000/docs`).

### Endpoints Principales

#### 1. Obtener Tasas Actuales

Obtiene el listado de todas las tasas disponibles o filtra por parámetros.

-   **Método**: `GET`
-   **Ruta**: `/api/v1/rates`
-   **Parámetros (Query Params)**:
    -   `exchange_code` (Opcional): Código del exchange (ej. `BCV`, `BINANCE_P2P`, `ITALCAMBIOS`).
    -   `currency_pair` (Opcional): Par de monedas (ej. `USD/VES`, `USDT/VES`).

**Ejemplo de Respuesta:**
```json
[
  {
    "id": 1,
    "exchange_code": "BCV",
    "currency_pair": "USD/VES",
    "buy_price": 36.5,
    "sell_price": 36.5,
    "spread": 0,
    "variation_24h": 0.15,
    "volume_24h": null,
    "source": "api",
    "last_updated": "2024-01-01T12:00:00.000Z"
  }
]
```

#### 2. Tasas por Fuente (Atajos)

Endpoints directos para fuentes específicas.

-   **BCV**: `GET /api/v1/rates/bcv`
-   **Binance**: `GET /api/v1/rates/binance`
-   **Italcambios**: `GET /api/v1/rates/italcambios`

Todas retornan el mismo formato de objeto `Rate`.

#### 3. Health Check

Verifica el estado de la API y la conexión a la base de datos.

-   **Método**: `GET`
-   **Ruta**: `/health`

**Ejemplo de Respuesta:**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

## 🧪 Tests

```bash
# Tests unitarios
pnpm run test

# Tests E2E
pnpm run test:e2e

# Cobertura de tests
pnpm run test:cov
```

## 🏗️ Stack Tecnológico

-   [NestJS](https://nestjs.com/) - Framework de Node.js
-   [TypeORM](https://typeorm.io/) - ORM para TypeScript
-   [SQLite](https://www.sqlite.org/) - Motor de base de datos
-   [Puppeteer/Cheerio/Axios] - Scraping (según implementación de cada módulo)
-   [Biome](https://biomejs.dev/) - Linter y Formatter

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).