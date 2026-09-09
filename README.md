# github-mcp-pro

Servidor MCP para interactuar con la API de GitHub, con soporte para ramas, issues, pull requests y más.

---

## Requisitos previos

### Node.js (v18 o superior)

No uses `apt`. Instala Node.js mediante **nvm** (recomendado):

```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Recargar el shell
source ~/.bashrc   # o ~/.zshrc si usas zsh

# Instalar Node.js LTS
nvm install --lts
nvm use --lts
```

Verifica la instalación:

```bash
node --version   # debe ser v18+
npm --version
```

---

## Instalación

```bash
git clone <url-del-repositorio>
cd github-mcp-pro
npm install
```

Esto instalará todas las dependencias del proyecto:

| Paquete | Versión | Uso |
|---|---|---|
| `@modelcontextprotocol/sdk` | ^0.5.0 | SDK base del servidor MCP |
| `@octokit/rest` | ^20.0.0 | Cliente oficial de la API de GitHub |
| `dotenv` | ^16.0.0 | Carga variables de entorno desde `.env` |
| `groq-sdk` | ^1.1.2 | Cliente para la API de Groq (IA) |
| `@google/generative-ai` | ^0.24.1 | Cliente para la API de Google Gemini |

---

## Configuración

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
GITHUB_TOKEN=tu_github_personal_access_token
GROQ_API_KEY=tu_groq_api_key
```

- **GITHUB_TOKEN**: genera uno en [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens). Necesita permisos de `repo`.
- **GROQ_API_KEY**: obtén una en [console.groq.com](https://console.groq.com).

> ⚠️ Nunca subas el archivo `.env` al repositorio. Asegúrate de que está en `.gitignore`.

---

## Uso

```bash
npm start
```

Esto levanta el servidor MCP en modo stdio, listo para conectarse con un cliente MCP (como Claude Desktop).

---
## Ejecutar

```bash
node chat.js
```

Esto levanta el servidor MCP en modo stdio, listo para conectarse con un cliente MCP (como Claude Desktop).

---

## Estructura del proyecto

```
src/
├── server.js        # Entrada principal del servidor MCP
├── tools/           # Definición y handlers de cada herramienta
└── utils/           # Utilidades compartidas (respuestas, etc.)
```

---

## 👨‍💻 Autor

**Tomas Esteban Gonzalez Quintero** — *Desarrollador Full Stack*

- 🌐 [Portafolio Web](https://portafolio-tegq-web.netlify.app/)
- 🐙 [GitHub: @TEstebanGQ](https://github.com/TEstebanGQ)
- 💼 [LinkedIn](https://www.linkedin.com/in/tomas-esteban-gonzalez-quintero/)
- 📧 [Email](mailto:tomasestebangonzalezquintero@gmail.com)

---

<div align="center">
  <br/>
  <a href="https://github.com/TEstebanGQ">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/TEstebanGQ/TEstebanGQ/main/assets/logo_white.png">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/TEstebanGQ/TEstebanGQ/main/assets/logo_clean.png">
      <img src="https://raw.githubusercontent.com/TEstebanGQ/TEstebanGQ/main/assets/logo_white.png" width="100" alt="TEGQ Brand Logo" />
    </picture>
  </a>
  <br/>
  <sub><b>© Tomas Esteban González Quintero — TEGQ</b></sub>
</div>
