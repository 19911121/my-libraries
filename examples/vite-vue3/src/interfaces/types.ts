// import { State } from '@/store';
import { Request } from 'express';
import { Router } from 'vue-router';
// import { Store } from 'vuex';

export type PropRequiredTrue = true;
export interface ServerContext {
  [key: string]: any;
  req: Request & {
    cookies: string
  },
}

export interface VueContext {
  // store: Store<State>;
  router: Router;
}

export interface CustomEmit<T> {
  (event: T): void;
  (event: T, ...args: any): void;
  (event: any): void;
  (event: any, ...args: any): void;
}