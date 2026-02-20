# cybersafe.cc

API intelligence explorer — make API calls and inspect responses in a clean dark UI.

## Run locally

```bash
python3 app.py
```

Then open [http://localhost:8080](http://localhost:8080)

## Features

- **Explorer** — Make GET/POST/PUT/PATCH/DELETE/HEAD requests
- **Params, Headers, Auth, Body** — Full request configuration
- **Auth** — Bearer token, Basic Auth, API Key
- **Presets** — IP geolocation, DNS, WHOIS, threat intel, SSL, httpbin utils
- **History** — All requests logged in-session
- **Stats** — Request count, success/error rates, avg response time
- **JSON highlighting** — Syntax-coloured response viewer

## Config

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `8080`  | Server port |

```bash
PORT=3000 python3 app.py
```
