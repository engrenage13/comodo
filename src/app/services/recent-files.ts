import {Service, signal} from '@angular/core';

const DB_NAME = "comodo";
const DB_VERSION = 1;
const STORE_NAME = "recent-files";
const LIST_KEY = "files";
const MAX_RECENT_FILES = 5;

export interface RecentFile {
  name: string;
  openedAt: number;
  handle: FileSystemFileHandle;
}

interface JsonFilePickerOptions {
  multiple?: false;
  excludeAcceptAllOption?: boolean;
  types?: {
    description?: string;
    accept: Record<string, string[]>;
  }[];
}

type ShowOpenFilePicker = (options?: JsonFilePickerOptions) => Promise<FileSystemFileHandle[]>;

@Service()
export class RecentFiles {
  readonly canRememberFiles: boolean = jsonFilePicker() !== null;
  readonly files = signal<RecentFile[]>([]);

  private connection: Promise<IDBDatabase> | null = null;

  async pickJsonFile(): Promise<FileSystemFileHandle | null> {
    const picker: ShowOpenFilePicker | null = jsonFilePicker();
    if (!picker) return null;
    const handles: FileSystemFileHandle[] = await picker({
      multiple: false,
      excludeAcceptAllOption: false,
      types: [{
        description: "Modèle JSON",
        accept: {"application/json": [".json"]},
      }],
    });
    return handles[0] ?? null;
  }

  async remember(handle: FileSystemFileHandle): Promise<void> {
    const kept: RecentFile[] = [];
    for (const record of await this.readRecords()) {
      let same = false;
      try {
        same = await record.handle.isSameEntry(handle);
      } catch {
        same = false;
      }
      if (!same) kept.push(record);
    }

    const next: RecentFile[] = [
      {name: handle.name, openedAt: Date.now(), handle},
      ...kept,
    ].slice(0, MAX_RECENT_FILES);
    await this.writeRecords(next);
    this.files.set(next);
  }

  private database(): Promise<IDBDatabase> {
    if (!this.connection) {
      this.connection = this.openDatabase().catch((error: unknown) => {
        this.connection = null;
        throw error;
      });
    }
    return this.connection;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request: IDBOpenDBRequest = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database: IDBDatabase = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    });
  }

  private async readRecords(): Promise<RecentFile[]> {
    const database: IDBDatabase = await this.database();
    const transaction: IDBTransaction = database.transaction(STORE_NAME, "readonly");
    const done: Promise<void> = transactionToPromise(transaction);
    const request: IDBRequest<unknown> = transaction.objectStore(STORE_NAME).get(LIST_KEY);
    const value: unknown = await requestToPromise(request);
    await done;
    if (!Array.isArray(value)) return [];
    return value
      .filter(isRecentFile)
      .sort((a, b) => b.openedAt - a.openedAt)
      .slice(0, MAX_RECENT_FILES);
  }

  private async writeRecords(records: RecentFile[]): Promise<void> {
    const database: IDBDatabase = await this.database();
    const transaction: IDBTransaction = database.transaction(STORE_NAME, "readwrite");
    const done: Promise<void> = transactionToPromise(transaction);
    transaction.objectStore(STORE_NAME).put(records, LIST_KEY);
    await done;
  }
}

function jsonFilePicker(): ShowOpenFilePicker | null {
  const browser = window as Window & {showOpenFilePicker?: unknown};
  if (typeof browser.showOpenFilePicker !== "function") return null;
  return browser.showOpenFilePicker.bind(window) as ShowOpenFilePicker;
}

function isRecentFile(value: unknown): value is RecentFile {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<RecentFile>;
  const handle: Partial<FileSystemFileHandle> | undefined = record.handle;
  return typeof record.name === "string"
    && typeof record.openedAt === "number"
    && !!handle
    && handle.kind === "file"
    && typeof handle.getFile === "function"
    && typeof handle.isSameEntry === "function";
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}
