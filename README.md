# Personakter

## APIer som används

Dessa APIer används i projektet, applikationsanvändaren i WSO2 måste prenumerera på dessa. Systemet utgår ifrån /backend/api-config.ts där dessa står specificerade.

| API               | Version |
| ----------------- | ------: |
| SimulatorServer   |     2.0 |
| Employee          |     2.0 |
| Citizen           |     3.0 |
| Documents         |     3.0 |
| FoundationObjects |     1.0 |
| Party             |     2.2 |

## Utveckling

### Krav

- Node >= 22 LTS
- Yarn

### Steg för steg

1. Klona ner repot till en mapp "<web-app-projektnamn>" och skapa nytt git repo

```
npx tiged --mode=git git@github.com:Sundsvallskommun/web-app-starter.git <web-app-projektnamn>
cd <web-app-projektnamn>
git init
```

2. Installera dependencies för både `backend` och `frontend`

```
cd frontend
yarn install

cd backend
yarn install
```

3. Skapa .env-fil för `frontend`

```
cd frontend
cp .env-example .env
```

Redigera `.env` för behov, för utveckling bör exempelvärdet fungera.

4. Skapa .env-fil för `backend`

```
cd backend
cp .env.example.local .env.development.local
cp .env.example.local .env.test.local
```

redigera `.env.development.local` för behov. URLer, nycklar och cert behöver fyllas i korrekt.

- `CLIENT_KEY` och `CLIENT_SECRET` måste fyllas i för att APIerna ska fungera, du måste ha en applikation från WSO2-portalen som abonnerar på de microtjänster du anropar
- `SAML_ENTRY_SSO` behöver pekas till en SAML IDP
- `SAML_IDP_PUBLIC_CERT` ska stämma överens med IDPens cert
- `SAML_PRIVATE_KEY` och `SAML_PUBLIC_KEY` behöver bara fyllas i korrekt om man kör mot en riktig IDP

5. Synca datamodeller för api:er

Se till att README och /backend/src/config/api-config.ts matchar och justera utefter de api:er som önskas användas.

- För backend, i /backend kör `yarn generate:contracts` för att få ned de senaste datamodellerna för samtliga api:er
  -- Justera om så behövs utifrån de uppdaterade modellerna
- För frontend, se till att backend är igång (`yarn dev`), i /frontend kör `yarn generate:contracts` för att synca backend med frontend
  -- Justera om så behövs utifrån de uppdaterade modellerna

### OIDC (valfritt, parallellt med SAML)

Inloggning via OIDC (authorization code + PKCE) aktiveras med `OIDC_ENABLED=true` i backend och `NEXT_PUBLIC_OIDC_ENABLED=true` i frontend. Båda är avstängda som standard och då används SAML som tidigare.

- `OIDC_ISSUER_URL`: utfärdarens bas-URL, t.ex. `http://172.16.124.2/idp2/api/oidc` för fake-idp
- `OIDC_CLIENT_ID` och `OIDC_CLIENT_SECRET`: klienten som registrerats hos OIDC-providern
- `OIDC_CALLBACK_URL`: måste registreras exakt som redirect URI hos providern, t.ex. `http://localhost:3001/api/oidc/login/callback`
- `OIDC_SCOPES`: valfritt, standard är `openid profile email`. OneGate kräver `roles` för att grupperna ska komma med
- `OIDC_USERNAME_CLAIM`: valfritt, claimet som innehåller AD-kontonamnet. Standard är `preferred_username`, kan även skickas i `sub`
- Claims hämtas både ur ID-token och från userinfo. ID-token går först, och om userinfo inte svarar används bara ID-token
- Registrera även frontendens `<frontend-url>/login?loggedout` som post logout redirect URI
- Utfärdare över http tillåts bara när `APP_ENV` inte är `production`

Hur backend anropar API:erna vid OIDC-inloggning styrs av `WSO2_USER_TOKEN_EXCHANGE_ENABLED`:

- `false` (default): maskintoken i `Authorization` och användarens access token som `X-JWT-Assertion`.
- `true`: vid inloggningen växlas IDP-token mot en användarbunden API-token hos `${API_BASE_URL}/token` med `CLIENT_KEY`/`CLIENT_SECRET`. Anropen görs med `Authorization: Bearer <WSO2-token>` och WSO2 skapar själv `X-JWT-Assertion`. Token förnyas automatiskt, och MobilityGuard-token förnyas med refresh token vid behov. Går det inte svarar backend 401 och användaren loggas in på nytt. WSO2-appen måste ha den valda grant typen påslagen
- `WSO2_TOKEN_EXCHANGE_GRANT`: `token_exchange` (standard, RFC 8693, som WSO2 använder via OneGate Test KeyManager) eller `jwt_bearer` (RFC 7523)
- `WSO2_TOKEN_EXCHANGE_ASSERTION`: `access_token` (standard) eller `id_token`, beroende på vilken MobilityGuard-token WSO2 kräver

SAML-inloggade användare anropar alltid med maskintoken.

För att köra lokalt mot OneGate test och WSO2-labbet utan att ändra `.env.development.local`: kopiera `backend/.env.oidc.example.local` till `backend/.env.oidc.local` och `frontend/.env.oidc-example` till `frontend/.env.oidc.local`, fyll i värdena och starta med `yarn dev:oidc` i båda katalogerna. Värdena i `.env.oidc.local` går före de vanliga env-filerna, så filen behöver bara innehålla det som skiljer.

### Språkstöd

För språkstöd används [next-i18next](https://github.com/i18next/next-i18next).

Placera dina språkfiler i `frontend/public/locales/<locale>/<namespace>.json`.

För att det ska fungera med **Next.js** och **SSR** måste du skicka med språkdatat till ServerSideProps.
Det gör du genom att lägga till följande till dina page-komponenter (behövs ej i subkomponenter).

```
export const getServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, [<namespaces>])),
  },
});
```

För att lägga till ett ytterligare spåk, skapa en mapp med språkets namn, och lägg sedan till språket i `next-i18next.config.js`.

**Exempel för tyska:**
Skapa `frontend/public/locales/de/common.json`.
Ändra next-i18next.config.js:

```
module.exports = {
  i18n: {
    defaultLocale: 'sv',
    locales: ['sv', 'de'],
  },
 ...
};
```

Som hjälp i VSCode rekommenderas [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally).

## Session-hantering (Memory / File / Redis)

Backend använder `express-session` för sessionshantering. Session store väljs via miljövariabeln `SESSION_STORE`.

### Tillgängliga session stores

| Värde    | Beskrivning                          | Rekommenderad miljö   |
| -------- | ------------------------------------ | --------------------- |
| `memory` | In-memory store (default)            | Lokal utveckling      |
| `file`   | Filbaserad store (`./data/sessions`) | Lokal test / legacy   |
| `redis`  | Redis-baserad store                  | OpenShift / multi-pod |

### Redis (för OpenShift / container-miljö)

När applikationen körs i OpenShift används Redis för sessions, vilket möjliggör:

- flera backend-poddar
- stabila inloggningar
- korrekt skalning

I detta läge sätts följande miljövariabler via Deployment / Helm / ArgoCD:

```
SESSION_STORE=redis
REDIS_HOST=<redis-hostname>
REDIS_PORT=6379
REDIS_PASSWORD=<secret>
```

Redis initieras endast när `SESSION_STORE=redis`. Saknas `REDIS_HOST` när Redis är vald kraschar applikationen direkt vid start med:

```
Failed to start app: Error: SESSION_STORE=redis but REDIS_HOST is not set
```

Lokal utveckling kräver ingen Redis — samma kodbas används i alla miljöer.
