/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

/** Lightweight shims — full Firebase types ship with the package when install is healthy */
declare module 'firebase/app' {
  export interface FirebaseApp {
    name: string;
    options: Record<string, string>;
  }

  export interface FirebaseOptions {
    apiKey?: string;
    authDomain?: string;
    databaseURL?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  }

  export function initializeApp(options: FirebaseOptions, name?: string): FirebaseApp;
}

declare module 'firebase/database' {
  import type { FirebaseApp } from 'firebase/app';

  export interface Database {
    app: FirebaseApp;
  }

  export interface DatabaseReference {
    key: string | null;
  }

  export interface DataSnapshot {
    exists(): boolean;
    val(): unknown;
    key: string | null;
  }

  export type Unsubscribe = () => void;

  export function getDatabase(app?: FirebaseApp): Database;
  export function ref(db: Database, path?: string): DatabaseReference;
  export function onValue(
    query: DatabaseReference,
    callback: (snapshot: DataSnapshot) => void,
    cancelCallback?: (error: Error) => void,
  ): Unsubscribe;
  export function set(ref: DatabaseReference, value: unknown): Promise<void>;
  export function update(
    ref: DatabaseReference,
    values: Record<string, unknown>,
  ): Promise<void>;
}
