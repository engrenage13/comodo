import {Service, signal} from '@angular/core';

const DB_NAME = "comodo";
const DB_VERSION = 1;
const STORE_NAME = "recent-files";
const LIST_KEY = "files";
const CURRENT_KEY = "current";
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

interface SaveFilePickerOptions {
  suggestedName?: string;
  excludeAcceptAllOption?: boolean;
  types?: {
    description?: string;
    accept: Record<string, string[]>;
  }[];
}

type ShowSaveFilePicker = (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;

interface StoredHandle {
  name: string;
  handle: FileSystemFileHandle;
}

interface WritableFileHandle extends FileSystemFileHandle {
  requestPermission?: (descriptor: {mode: "readwrite"}) => Promise<PermissionState>;
}

@Service()
export class RecentFiles {
  readonly canRememberFiles: boolean = jsonFilePicker() !== null;
  readonly canPickSaveLocation: boolean = jsonSavePicker() !== null;
  readonly files = signal<RecentFile[]>([]);

  private connection: Promise<IDBDatabase> | null = null;

  async allowWrite(handle: FileSystemFileHandle): Promise<void> {
    const permitted: WritableFileHandle = handle;
    if (!permitted.requestPermission) return;
    const permission: PermissionState = await permitted.requestPermission({mode: "readwrite"});
    if (permission !== "granted") {
      throw new DOMException("L'accès au fichier a été refusé.", "NotAllowedError");
    }
  }

  async clearCurrent(): Promise<void> {
    await this.deleteKey(CURRENT_KEY);
  }

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

  async pickSaveFile(suggestedName: string): Promise<FileSystemFileHandle | null> {
    const picker: ShowSaveFilePicker | null = jsonSavePicker();
    if (!picker) return null;
    return picker({
      suggestedName,
      excludeAcceptAllOption: false,
      types: [{
        description: "Modèle JSON",
        accept: {"application/json": [".json"]},
      }],
    });
  }

  async readCurrent(): Promise<FileSystemFileHandle | null> {
    const value: unknown = await this.readKey(CURRENT_KEY);
    return isStoredHandle(value) ? value.handle : null;
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

  async storeCurrent(handle: FileSystemFileHandle): Promise<void> {
    const record: StoredHandle = {name: handle.name, handle};
    await this.writeKey(CURRENT_KEY, record);
  }

  async writeFile(handle: FileSystemFileHandle, contents: string): Promise<void> {
    const writable: FileSystemWritableFileStream = await handle.createWritable();
    try {
      await writable.write(contents);
      await writable.close();
    } catch (error: unknown) {
      await writable.abort().catch(() => undefined);
      throw error;
    }
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

  private async deleteKey(key: string): Promise<void> {
    const database: IDBDatabase = await this.database();
    const transaction: IDBTransaction = database.transaction(STORE_NAME, "readwrite");
    const done: Promise<void> = transactionToPromise(transaction);
    transaction.objectStore(STORE_NAME).delete(key);
    await done;
  }

  private async readKey(key: string): Promise<unknown> {
    const database: IDBDatabase = await this.database();
    const transaction: IDBTransaction = database.transaction(STORE_NAME, "readonly");
    const done: Promise<void> = transactionToPromise(transaction);
    const request: IDBRequest<unknown> = transaction.objectStore(STORE_NAME).get(key);
    const value: unknown = await requestToPromise(request);
    await done;
    return value;
  }

  private async readRecords(): Promise<RecentFile[]> {
    const value: unknown = await this.readKey(LIST_KEY);
    if (!Array.isArray(value)) return [];
    return value
      .filter(isRecentFile)
      .sort((a, b) => b.openedAt - a.openedAt)
      .slice(0, MAX_RECENT_FILES);
  }

  private async writeKey(key: string, value: unknown): Promise<void> {
    const database: IDBDatabase = await this.database();
    const transaction: IDBTransaction = database.transaction(STORE_NAME, "readwrite");
    const done: Promise<void> = transactionToPromise(transaction);
    transaction.objectStore(STORE_NAME).put(value, key);
    await done;
  }

  private async writeRecords(records: RecentFile[]): Promise<void> {
    await this.writeKey(LIST_KEY, records);
  }
}

function jsonFilePicker(): ShowOpenFilePicker | null {
  const browser = window as Window & {showOpenFilePicker?: unknown};
  if (typeof browser.showOpenFilePicker !== "function") return null;
  return browser.showOpenFilePicker.bind(window) as ShowOpenFilePicker;
}

function jsonSavePicker(): ShowSaveFilePicker | null {
  const browser = window as Window & {showSaveFilePicker?: unknown};
  if (typeof browser.showSaveFilePicker !== "function") return null;
  return browser.showSaveFilePicker.bind(window) as ShowSaveFilePicker;
}

function isFileHandle(value: unknown): value is FileSystemFileHandle {
  if (!value || typeof value !== "object") return false;
  const handle = value as Partial<FileSystemFileHandle>;
  return handle.kind === "file"
    && typeof handle.getFile === "function"
    && typeof handle.isSameEntry === "function";
}

function isStoredHandle(value: unknown): value is StoredHandle {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<StoredHandle>;
  return typeof record.name === "string" && isFileHandle(record.handle);
}

function isRecentFile(value: unknown): value is RecentFile {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<RecentFile>;
  return typeof record.name === "string"
    && typeof record.openedAt === "number"
    && isFileHandle(record.handle);
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
