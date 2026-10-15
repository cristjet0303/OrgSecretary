# Angular 21 & Tailwind CSS v4 Best Practice Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish enterprise-ready, domain-sliced Angular 21 architecture with Tailwind CSS v4, TypeScript path aliases, signals-based state, shared primitives, persistent layout, and lazy-loaded dashboard.

**Architecture:** Feature-Driven / Domain-Sliced architecture (`@core/*`, `@shared/*`, `@layouts/*`, `@features/*`), 100% standalone components, Signals-first reactivity, `provideHttpClient(withFetch())`, and CSS-first Tailwind CSS v4 with automated Prettier class sorting.

**Tech Stack:** Angular 21, Tailwind CSS v4, PostCSS, Vitest, Prettier (`prettier-plugin-tailwindcss`), TypeScript 5.9.

**Spec:** `docs/superpowers/specs/2026-10-15-angular-tailwind-setup-design.md`

## Global Constraints

- Angular version: ^21.2.0 with `@angular/build:application` and Vitest
- Tailwind CSS version: v4 (`tailwindcss`, `@tailwindcss/postcss`, `postcss`)
- All components must be Standalone (`standalone: true` default in Angular 21)
- Reactivity must prioritize Signals (`signal()`, `computed()`, `input()`, `output()`)
- Dependency injection must use `inject(...)` instead of constructor injection
- Path aliases: `@core/*`, `@shared/*`, `@layouts/*`, `@features/*`

## Review Focus

- Tailwind v4 styles fail to compile or load in production build: verified via `ng build`
- PostCSS configuration missing or misnamed for `@angular/build`: verified via PostCSS config detection
- TypeScript path aliases not resolved by Angular CLI builder or Vitest: verified in build and spec runs
- Default 20KB boilerplate in `app.html` causing residual clutter: replaced with clean `<router-outlet />`
- Broken routing or missing `<router-outlet />` in layout: verified in layout and route specs

---

### Task 1: Install Dependencies & Configure PostCSS + Prettier

**Files:**

- Modify: `package.json`
- Create: `postcss.config.json`
- Modify: `.prettierrc`
- Modify: `src/styles.css`

**Interfaces:**

- Consumes: `package.json`
- Produces: installed `node_modules`, `postcss.config.json` with `@tailwindcss/postcss`, `.prettierrc` with `prettier-plugin-tailwindcss`, and `src/styles.css` importing `tailwindcss`.

- [ ] **Step 1: Install npm dependencies and Tailwind v4 packages**

Run:

```bash
npm install
npm install -D tailwindcss @tailwindcss/postcss postcss prettier-plugin-tailwindcss
```

- [ ] **Step 2: Create PostCSS configuration file**

Create `postcss.config.json`:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

- [ ] **Step 3: Update `.prettierrc` with Tailwind plugin and format script**

Update `.prettierrc`:

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

Add `"format": "prettier --write ."` to `package.json` scripts.

- [ ] **Step 4: Update `src/styles.css` with Tailwind v4 entrypoint**

In `src/styles.css`:

```css
@import 'tailwindcss';

@layer base {
  body {
    @apply bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white;
  }
}
```

- [ ] **Step 5: Verify build with Tailwind v4**

Run: `npm run build`
Expected: SUCCESS with zero CSS or build warnings.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json postcss.config.json .prettierrc src/styles.css
git commit -m "chore: setup tailwindcss v4, postcss, and prettier plugin"
```

---

### Task 2: Configure TypeScript Path Aliases

**Files:**

- Modify: `tsconfig.json`

**Interfaces:**

- Consumes: base `tsconfig.json`
- Produces: compiler options path mappings:
  - `@core/*`: `["src/app/core/*"]`
  - `@shared/*`: `["src/app/shared/*"]`
  - `@layouts/*`: `["src/app/layouts/*"]`
  - `@features/*`: `["src/app/features/*"]`

- [ ] **Step 1: Add path mappings to `tsconfig.json`**

In `tsconfig.json` under `compilerOptions`:

```json
"baseUrl": "./",
"paths": {
  "@core/*": ["src/app/core/*"],
  "@shared/*": ["src/app/shared/*"],
  "@layouts/*": ["src/app/layouts/*"],
  "@features/*": ["src/app/features/*"]
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "config: configure typescript path aliases for core, shared, layouts, and features"
```

---

### Task 3: Shared UI Primitive (ButtonComponent)

**Files:**

- Create: `src/app/shared/components/button/button.component.ts`
- Create: `src/app/shared/components/button/button.component.spec.ts`

**Interfaces:**

- Consumes: Angular `input()`, `computed()`
- Produces: `ButtonComponent`
  - `variant = input<'primary' | 'secondary' | 'outline'>('primary')`
  - `size = input<'sm' | 'md' | 'lg'>('md')`
  - `disabled = input<boolean>(false)`
  - `buttonClasses = computed<string>()`

- [ ] **Step 1: Write the failing unit test for `ButtonComponent`**

Create `src/app/shared/components/button/button.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute primary variant classes by default', () => {
    expect(component.buttonClasses()).toContain('bg-indigo-600');
  });

  it('should compute outline variant classes when set', () => {
    fixture.componentRef.setInput('variant', 'outline');
    fixture.detectChanges();
    expect(component.buttonClasses()).toContain('border-slate-300');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/app/shared/components/button/button.component.spec.ts`
Expected: FAIL (file or class not found).

- [ ] **Step 3: Implement `ButtonComponent`**

Create `src/app/shared/components/button/button.component.ts`:

```typescript
import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  template: `
    <button [type]="type()" [disabled]="disabled()" [class]="buttonClasses()">
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);

  buttonClasses = computed(() => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeMap: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    };

    const variantMap: Record<ButtonVariant, string> = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
      secondary: 'bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-700',
      outline:
        'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-indigo-500',
    };

    return `${base} ${sizeMap[this.size()]} ${variantMap[this.variant()]}`;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/app/shared/components/button/button.component.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/components/button
git commit -m "feat(shared): add signals-based ButtonComponent with tailwind styling"
```

---

### Task 4: Core Services & Application Configuration

**Files:**

- Create: `src/app/core/services/theme.service.ts`
- Create: `src/app/core/services/theme.service.spec.ts`
- Modify: `src/app/app.config.ts`

**Interfaces:**

- Consumes: Angular `signal()`, `PLATFORM_ID`, `inject()`
- Produces: `ThemeService` with `isDarkMode = signal<boolean>(false)` and `toggleTheme(): void`; `provideHttpClient(withFetch())` in `appConfig`.

- [ ] **Step 1: Write the failing unit test for `ThemeService`**

Create `src/app/core/services/theme.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle dark mode state', () => {
    const initial = service.isDarkMode();
    service.toggleTheme();
    expect(service.isDarkMode()).toBe(!initial);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/app/core/services/theme.service.spec.ts`
Expected: FAIL (cannot find ThemeService).

- [ ] **Step 3: Implement `ThemeService` and update `app.config.ts`**

Create `src/app/core/services/theme.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  toggleTheme(): void {
    this.isDarkMode.update((dark) => !dark);
  }
}
```

In `src/app/app.config.ts`, add `provideHttpClient(withFetch())`:

```typescript
import { ApplicationConfig, provideBrowserGlobal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideHttpClient(withFetch())],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/app/core/services/theme.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/services src/app/app.config.ts
git commit -m "feat(core): add ThemeService and configure provideHttpClient withFetch"
```

---

### Task 5: Layout Shell (MainLayoutComponent) & App Root Cleanup

**Files:**

- Create: `src/app/layouts/main-layout/main-layout.component.ts`
- Create: `src/app/layouts/main-layout/main-layout.component.html`
- Create: `src/app/layouts/main-layout/main-layout.component.spec.ts`
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`
- Modify: `src/app/app.spec.ts`

**Interfaces:**

- Consumes: `@core/services/theme.service`, `RouterOutlet`, `RouterLink`
- Produces: `MainLayoutComponent` with responsive top navbar, sidebar navigation, and main `<router-outlet />`. Minimal `app.html` containing `<router-outlet />`.

- [ ] **Step 1: Write the failing unit test for `MainLayoutComponent`**

Create `src/app/layouts/main-layout/main-layout.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create layout component', () => {
    expect(component).toBeTruthy();
  });

  it('should render application brand name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('OrgSecretary');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/app/layouts/main-layout/main-layout.component.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `MainLayoutComponent` and clean `app.html` / `app.ts`**

Create `src/app/layouts/main-layout/main-layout.component.html`:

```html
<div class="flex min-h-screen flex-col bg-slate-50">
  <!-- Top Navigation Bar -->
  <header
    class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6"
  >
    <div class="flex items-center space-x-3">
      <div
        class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white shadow-sm"
      >
        O
      </div>
      <span class="text-xl font-bold tracking-tight text-slate-800">OrgSecretary</span>
    </div>

    <div class="flex items-center space-x-4">
      <span
        class="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
      >
        Angular 21 • Tailwind v4
      </span>
    </div>
  </header>

  <div class="flex flex-1">
    <!-- Sidebar -->
    <aside class="hidden w-64 border-r border-slate-200 bg-white p-4 md:block">
      <nav class="space-y-1">
        <a
          routerLink="/dashboard"
          routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
          class="flex items-center rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
        >
          <span class="mr-3">📊</span> Dashboard
        </a>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto p-6 md:p-8">
      <div class="mx-auto max-w-7xl">
        <router-outlet />
      </div>
    </main>
  </div>
</div>
```

Create `src/app/layouts/main-layout/main-layout.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {}
```

Replace `src/app/app.html` with:

```html
<router-outlet />
```

Update `src/app/app.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  title = 'OrgSecretary';
}
```

Update `src/app/app.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'OrgSecretary' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('OrgSecretary');
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/app/layouts/main-layout/main-layout.component.spec.ts src/app/app.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/layouts/main-layout src/app/app.ts src/app/app.html src/app/app.spec.ts
git commit -m "feat(layout): add MainLayoutComponent and clean app root template"
```

---

### Task 6: Dashboard Feature & Routing Configuration

**Files:**

- Create: `src/app/features/dashboard/dashboard.component.ts`
- Create: `src/app/features/dashboard/dashboard.component.html`
- Create: `src/app/features/dashboard/dashboard.component.spec.ts`
- Create: `src/app/features/dashboard/dashboard.routes.ts`
- Modify: `src/app/app.routes.ts`

**Interfaces:**

- Consumes: `@shared/components/button/button.component`, `@layouts/main-layout/main-layout.component`
- Produces: Lazy-loaded Dashboard route registered under `MainLayoutComponent` at `/dashboard`, with default redirect from `/` to `/dashboard`.

- [ ] **Step 1: Write the failing unit test for `DashboardComponent`**

Create `src/app/features/dashboard/dashboard.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should increment signal counter when button clicked', () => {
    expect(component.counter()).toBe(0);
    component.increment();
    expect(component.counter()).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/app/features/dashboard/dashboard.component.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `DashboardComponent` and routing**

Create `src/app/features/dashboard/dashboard.component.html`:

```html
<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight text-slate-900">System Overview</h1>
    <p class="mt-1 text-sm text-slate-500">
      Welcome to OrgSecretary. Your modern Angular 21 & Tailwind CSS v4 workspace is ready.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Architecture</div>
      <div class="mt-2 text-xl font-bold text-slate-800">Domain-Sliced</div>
      <p class="mt-1 text-xs text-slate-500">Core, Shared, Layouts & Features</p>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="text-xs font-semibold tracking-wider text-slate-400 uppercase">
        Styling Engine
      </div>
      <div class="mt-2 text-xl font-bold text-indigo-600">Tailwind CSS v4</div>
      <p class="mt-1 text-xs text-slate-500">Zero-config CSS-first compilation</p>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="text-xs font-semibold tracking-wider text-slate-400 uppercase">
        Reactivity Proof
      </div>
      <div class="mt-2 flex items-center justify-between">
        <span class="text-2xl font-bold text-slate-800">{{ counter() }}</span>
        <app-button variant="primary" size="sm" (click)="increment()">
          Increment Signal
        </app-button>
      </div>
      <p class="mt-2 text-xs text-slate-500">Angular Signals reactive state</p>
    </div>
  </div>
</div>
```

Create `src/app/features/dashboard/dashboard.component.ts`:

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  counter = signal<number>(0);

  increment(): void {
    this.counter.update((c) => c + 1);
  }
}
```

Create `src/app/features/dashboard/dashboard.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
  },
];
```

Update `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/app/features/dashboard/dashboard.component.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/dashboard src/app/app.routes.ts
git commit -m "feat(features): add lazy-loaded dashboard feature with signals counter"
```

---

### Task 7: Full Verification & Formatting

**Files:**

- Repository-wide

**Interfaces:**

- Consumes: All implemented components, styling, configs
- Produces: Complete clean production build, 100% passing tests, formatted code.

- [ ] **Step 1: Run Prettier formatting check**

Run: `npm run format`
Expected: Prettier formats all files according to `.prettierrc` with Tailwind class sorting.

- [ ] **Step 2: Run all unit tests**

Run: `npm test -- --run`
Expected: All test suites PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: Build compiles with 0 errors and output generated in `dist/`.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: format project and verify production build"
```
