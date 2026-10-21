import {Service, signal} from '@angular/core';
import {EDataType, ERelationQuantity} from '../types/enums';
import {IColumn, IConnection, ICoord, IModel, ITable} from '../types/interfaces';

export const MODEL_TITLE_MAX_LENGTH = 80;
const DEFAULT_TITLE: string = "Mon MCD";
const STORAGE_KEY: string = "cmdModel";
const DATA_TYPES = new Set<string>(Object.values(EDataType));
const QUANTITIES = new Set<string>(Object.values(ERelationQuantity));

@Service()
export class ModelService {
  private readonly titleState = signal(DEFAULT_TITLE);
  readonly title = this.titleState.asReadonly();
  readonly hasStoredModel = signal(false);
  connections = signal<IConnection[]>([]);
  tables = signal<ITable[]>([]);

  // File management
  busy = signal<boolean>(false);
  confirmNew = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {
    const storedModel: string|null = localStorage.getItem(STORAGE_KEY);
    if (!storedModel) return;

    try {
      const parsed: unknown = JSON.parse(storedModel);
      if (isRecord(parsed)) this.restoreStored(parsed);
    } catch {
      return;
    }
  }

  cancelNew(): void {
    this.confirmNew.set(false);
  }

  downloadJsonModel(): void {
    const blob: Blob = new Blob([this.jsonText()], { type: "application/json" });
    const url: string = window.URL.createObjectURL(blob);
    const link: HTMLAnchorElement = document.createElement("a");
    link.href = url;
    link.download = this.suggestedFileName();
    link.click();
    window.URL.revokeObjectURL(url);
  }

  jsonText(): string {
    return JSON.stringify(this.generateModel(), null, 2);
  }

  requestNew(): boolean {
    this.error.set(null);
    if (this.hasStoredModel()) {
      this.confirmNew.set(true);
      return false;
    }
    this.startNew();
    return true;
  }

  startNew(): void {
    this.confirmNew.set(false);
    this.error.set(null);
    this.startNewModel();
  }

  suggestedFileName(): string {
    const sanitized: string = this.title()
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/[\u0000-\u001f]/g, "")
      .trim();
    return `${sanitized || DEFAULT_TITLE}.json`;
  }

  loadFromText(text: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Ce fichier n'est pas un JSON valide.");
    }
    if (!isComodoModel(parsed)) {
      throw new Error("Ce fichier ne contient pas un modèle Comodo.");
    }

    const title: string = parsed.title.trim().slice(0, MODEL_TITLE_MAX_LENGTH) || DEFAULT_TITLE;
    const connections: IConnection[] = [...parsed.connections];
    connections.sort((a, b) => Number(a.id) - Number(b.id));
    this.titleState.set(title);
    this.tables.set(parsed.tables);
    this.connections.set(connections);
    this.saveModel();
  }

  openFile(fileContent: string): void {
    this.busy.set(true);
    try {
      this.loadFromText(fileContent);
      this.error.set(null);
    } catch (error: unknown) {
      this.error.set((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }

  startNewModel(): void {
    this.titleState.set(DEFAULT_TITLE);
    this.tables.set([]);
    this.connections.set([]);
    this.saveModel();
  }

  updateTitle(title: string): void {
    const nextTitle: string = title.trim();
    if (!nextTitle || nextTitle.length > MODEL_TITLE_MAX_LENGTH || nextTitle === this.title()) {
      return;
    }
    this.titleState.set(nextTitle);
    this.saveModel();
  }

  saveModel(): void {
    const model: IModel = this.generateModel();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
    this.hasStoredModel.set(true);
  }

  private generateModel(): IModel {
    return {
      title: this.title(),
      tables: this.tables(),
      connections: this.connections(),
    }
  }

  private restoreStored(model: Record<string, unknown>): void {
    const title: unknown = model["title"];
    const tables: unknown = model["tables"];
    const connections: unknown = model["connections"];
    if (typeof title !== "string" && !Array.isArray(tables) && !Array.isArray(connections)) return;

    if (typeof title === "string" && title.trim()) {
      this.titleState.set(title.trim());
    }
    if (Array.isArray(tables)) {
      this.tables.set(tables as ITable[]);
    }
    if (Array.isArray(connections)) {
      const sorted: IConnection[] = [...connections] as IConnection[];
      sorted.sort((a, b) => Number(a.id) - Number(b.id));
      this.connections.set(sorted);
    }
    this.hasStoredModel.set(true);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === "boolean";
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isCoord(value: unknown): value is ICoord {
  if (!isRecord(value)) return false;
  const coord = value as Partial<ICoord>;
  return typeof coord.x === "number" && Number.isFinite(coord.x)
    && typeof coord.y === "number" && Number.isFinite(coord.y);
}

function isColumn(value: unknown): value is IColumn {
  if (!isRecord(value)) return false;
  const column = value as Partial<IColumn>;
  return typeof column.name === "string"
    && typeof column.type === "string"
    && DATA_TYPES.has(column.type)
    && typeof column.maxlength === "string"
    && typeof column.order === "number"
    && optionalString(column.commentary)
    && optionalBoolean(column.isPrimaryKey)
    && optionalBoolean(column.isUnique)
    && optionalBoolean(column.isNotNull);
}

function isTable(value: unknown): value is ITable {
  if (!isRecord(value)) return false;
  const table = value as Partial<ITable>;
  return typeof table.id === "number"
    && Number.isInteger(table.id)
    && typeof table.title === "string"
    && Array.isArray(table.columns)
    && table.columns.every(isColumn)
    && isCoord(table.coords);
}

function isConnection(value: unknown): value is IConnection {
  if (!isRecord(value)) return false;
  const connection = value as Partial<IConnection>;
  return typeof connection.id === "string"
    && typeof connection.source === "string"
    && typeof connection.target === "string"
    && typeof connection.leftQuantity === "string"
    && QUANTITIES.has(connection.leftQuantity)
    && typeof connection.rightQuantity === "string"
    && QUANTITIES.has(connection.rightQuantity);
}

function isComodoModel(value: unknown): value is IModel {
  if (!isRecord(value)) return false;
  const model = value as Partial<IModel>;
  return typeof model.title === "string"
    && Array.isArray(model.tables)
    && model.tables.every(isTable)
    && Array.isArray(model.connections)
    && model.connections.every(isConnection);
}
