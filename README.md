# lexarium

This template should help get you started developing with Vue 3 in Vite.

## Environment variables
This project uses Vite's mode-based `.env` files. Variables must be prefixed with `VITE_` to be exposed to client code.

Provided files:
- `.env` — shared defaults for all modes
- `.env.development` — overrides used by `npm run dev`
- `.env.production` — overrides used by `npm run build`

Local (untracked) overrides you can create:
- `.env.local`
- `.env.development.local`
- `.env.production.local`

Example variables you can use in code:
```ts
console.log(import.meta.env.VITE_APP_NAME)
console.log(import.meta.env.VITE_API_BASE_URL)
```

> Note: Sensitive values should go in the `*.local` files which are gitignored.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
