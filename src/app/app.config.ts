import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { LOCAL_API } from './core/local-api/local-api.token';
import { ElectronLocalApi } from './core/local-api/electron-local-api.service';
import { WebLocalApi } from './core/local-api/web-local-api.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    {
      provide: LOCAL_API,
      useFactory: () => {
        if (typeof window !== 'undefined' && window.localApi) {
          return new ElectronLocalApi();
        }
        return new WebLocalApi();
      },
    },
  ],
};
