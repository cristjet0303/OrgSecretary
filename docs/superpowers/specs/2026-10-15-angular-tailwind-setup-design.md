# OrgSecretary: Angular 21 & Tailwind CSS v4 Best Practice Architecture Spec

- **Date**: 2026-10-15
- **Status**: Approved
- **Scope**: Project architecture initialization, Tailwind CSS v4 integration, directory restructuring, developer tooling, and baseline layout.

---

## 1. Context & Objectives

The `OrgSecretary` project is an Angular application initialized with Angular 21 (esbuild/Vite-based `@angular/build:application` and Vitest). The objective is to configure the repository to adhere to modern enterprise Angular best practices, install and configure Tailwind CSS v4 with automated Prettier sorting, configure clean TypeScript path aliases, and replace the initial scaffold with a modular layout and feature architecture.

---

## 2. Architecture & Directory Organization

The project adheres to a **Feature-Driven / Domain-Sliced Architecture**.

### 2.1 Directory Layout (`src/app/`)
```text
src/
├── app/
│   ├── core/                        # Global singletons, guards, interceptors, tokens
│   │   ├── guards/                  # Functional route guards (CanActivateFn)
│   │   ├── interceptors/            # Functional HTTP interceptors (HttpInterceptorFn)
│   │   └── services/                # Global services (ThemeService, etc.)
│   ├── shared/                      # Reusable dumb components, pipes, directives
│   │   ├── components/
│   │   │   └── button/              # Reusable button component with Tailwind variants
│   │   ├── directives/
│   │   └── pipes/
│   ├── layouts/                     # Layout shells hosting <router-outlet>
│   │   └── main-layout/             # Persistent shell: Header, Sidebar, Content Area
│   │       ├── main-layout.component.ts
│   │       ├── main-layout.component.html
│   │       └── main-layout.component.spec.ts
│   ├── features/                    # Domain-sliced lazy-loaded feature modules
│   │   └── dashboard/               # Starter dashboard feature
│   │       ├── dashboard.component.ts
│   │       ├── dashboard.component.html
│   │       ├── dashboard.component.spec.ts
│   │       └── dashboard.routes.ts
│   ├── app.config.ts                # Application configuration & providers (Router, HttpClient with fetch)
│   ├── app.routes.ts                # Root route table with lazy-loaded layouts/features
│   ├── app.ts                       # Root application component shell
│   └── app.html                     # Minimal template containing `<router-outlet />`
├── styles.css                       # Global styles and Tailwind CSS v4 entrypoint
└── index.html                       # HTML5 entrypoint with updated title and meta
```

### 2.2 TypeScript Path Aliases (`tsconfig.json`)
Update `tsconfig.json` compiler options:
```json
"paths": {
  "@core/*": ["src/app/core/*"],
  "@shared/*": ["src/app/shared/*"],
  "@layouts/*": ["src/app/layouts/*"],
  "@features/*": ["src/app/features/*"]
}
```

---

## 3. Styling & Developer Tooling

### 3.1 Tailwind CSS v4 Setup
- **Packages**:
  - `tailwindcss` (v4)
  - `@tailwindcss/postcss`
  - `postcss`
- **PostCSS Config** (`postcss.config.json`):
  ```json
  {
    "plugins": {
      "@tailwindcss/postcss": {}
    }
  }
  ```
- **Global Stylesheet** (`src/styles.css`):
  ```css
  @import "tailwindcss";

  @layer base {
    body {
      @apply bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white;
    }
  }
  ```

### 3.2 Prettier Configuration
- **Package**: `prettier-plugin-tailwindcss`
- Update `.prettierrc`:
  ```json
  {
    "tabWidth": 2,
    "useTabs": false,
    "singleQuote": true,
    "semi": true,
    "bracketSpacing": true,
    "arrowParens": "avoid",
    "trailingComma": "all",
    "plugins": ["prettier-plugin-tailwindcss"]
  }
  ```
- Add script to `package.json`: `"format": "prettier --write ."`

---

## 4. Modern Angular 21 Patterns

1. **Reactivity**: Use Angular Signals (`signal()`, `computed()`) across all components and services. Avoid legacy RxJS Subject state patterns where Signals are better suited.
2. **Component Inputs/Outputs**: Use `input()`, `input.required()`, and `output()` API syntax instead of `@Input()` and `@Output()` decorators.
3. **Dependency Injection**: Use `inject(...)` instead of constructor injection.
4. **Standalone Defaults**: All components are standalone by default.
5. **HTTP & Routing**:
   - `provideHttpClient(withFetch())` configured in `app.config.ts`.
   - Lazy load route components using dynamic `import(...)`.

---

## 5. Testing & Verification

1. **Dependency Installation**: Run `npm install` to install all packages and generate `package-lock.json` / `node_modules`.
2. **Build Verification**: Run `npm run build` (`ng build`) to confirm Tailwind v4 compiles, PostCSS executes, and TypeScript path aliases resolve without error.
3. **Unit Tests**: Run `npm test -- --run` (Vitest) to verify that unit tests pass for root, layout, shared button, and dashboard components.
4. **Format Check**: Run `npx prettier --check .` to verify class sorting and formatting.
