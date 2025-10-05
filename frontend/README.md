# Finansowy Kompas – Frontend

## 🇵🇱 Polski

---

Jednostronicowa aplikacja (SPA) React + TypeScript + Vite dla projektu Finansowy Kompas. UI zbudowany w MUI i Tailwind; pobieranie danych z TanStack Query; routing w React Router; formularze w React Hook Form + Zod; wykresy w Recharts; animacje w Framer Motion.

### Wymagania
- Node.js 18+ (zalecane 20+)
- npm 10+

### Szybki start
- Zainstaluj zależności: `npm install`
- Uruchom serwer deweloperski: `npm run dev` → http://localhost:5173
- Lintowanie kodu: `npm run lint`
- Budowa produkcyjna: `npm run build` (wynik w `build/`)
- Podgląd buildu: `npm run preview`

### Zmienne środowiskowe
Utwórz plik `.env` lub `.env.local` w tym folderze, np.:

```
VITE_API_URL=http://localhost:8080
```

Do przeglądarki trafiają wyłącznie zmienne z prefiksem `VITE_` (patrz dokumentacja Vite).

### Struktura projektu
- `src/` – kod aplikacji (komponenty, strony, hooki, api itd.)
- `public/` – statyczne zasoby serwowane bez zmian
- `index.html` – punkt wejścia
- `vite.config.ts` – konfiguracja Vite
- `vercel.json` – reguły SPA do wdrożenia

### Stos technologiczny
- React 19, TypeScript, Vite 7
- MUI 7, Tailwind CSS 4
- TanStack Query 5
- React Router 7
- React Hook Form + Zod
- Recharts, Framer Motion, Sonner, Lucide Icons

### Wdrożenie
- Vercel: `vercel.json` przekierowuje wszystkie ścieżki do `index.html`. Użyj polecenia budowania `vite build`; katalog wyjściowy: `build`.

—
Ten README to zwięzła instrukcja tylko dla frontendu. Szerszy kontekst znajdziesz w README w katalogu głównym repozytorium.

## 🇺🇸 English

---

A React + TypeScript + Vite single‑page app for the Finansowy Kompas project. UI is built with MUI and Tailwind; data fetching with TanStack Query; routing with React Router; forms with React Hook Form + Zod; charts with Recharts; animations with Framer Motion.

### Requirements
- Node.js 18+ (20+ recommended)
- npm 10+

### Quick start
- Install dependencies: `npm install`
- Start dev server: `npm run dev` → http://localhost:5173
- Lint code: `npm run lint`
- Build for production: `npm run build` (outputs to `build/`)
- Preview production build: `npm run preview`

### Environment variables
Create a `.env` or `.env.local` file in this folder, for example:

```
VITE_API_URL=http://localhost:8080
```

Only variables prefixed with `VITE_` are exposed to the client (see Vite docs).

### Project structure
- `src/` – application source (components, pages, hooks, api, etc.)
- `public/` – static assets served as‑is
- `index.html` – app entry
- `vite.config.ts` – Vite configuration
- `vercel.json` – SPA rewrites for deployment

### Tech stack
- React 19, TypeScript, Vite 7
- MUI 7, Tailwind CSS 4
- TanStack Query 5
- React Router 7
- React Hook Form + Zod
- Recharts, Framer Motion, Sonner, Lucide Icons

### Deployment
- Vercel: `vercel.json` routes all paths to `index.html`. Use build command `vite build` and output directory `build`.

—
This README is a succinct frontend‑only guide. For broader project context, see the repository root README.
