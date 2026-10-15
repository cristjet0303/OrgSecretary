import { InjectionToken } from '@angular/core';
import { LocalApi } from './local-api.interface';

export const LOCAL_API = new InjectionToken<LocalApi>('LOCAL_API');
