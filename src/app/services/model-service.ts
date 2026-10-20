import {Service, signal} from '@angular/core';
import {IConnection, IModel, ITable} from '../types/interfaces';

export const MODEL_TITLE_MAX_LENGTH = 80;
const DEFAULT_TITLE = "Mon MCD";

@Service()
export class ModelService {
  private readonly STORAGE_KEY: string = "cmdModel";

  private readonly titleState = signal(DEFAULT_TITLE);
  readonly title = this.titleState.asReadonly();
  connections = signal<IConnection[]>([]);
  tables = signal<ITable[]>([]);

  constructor() {
    const storedModel: string|null = localStorage.getItem(this.STORAGE_KEY);
    if (storedModel) {
      const model: IModel = JSON.parse(storedModel);

      if (typeof model.title === "string" && model.title.trim()) {
        this.titleState.set(model.title.trim());
      }

      if (model.tables) {
        this.tables.set(model.tables);
      }

      const connections: IConnection[] = model.connections;
      if (connections) {
        connections.sort((a, b) => Number(a.id) - Number(b.id));
        this.connections.set(connections);
      }
    }
  }

  downloadJsonModel(): void {
    const model: IModel = this.generateModel();

    const blob: Blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
    const url: string = window.URL.createObjectURL(blob);
    const link: HTMLAnchorElement = document.createElement("a");
    link.href = url;
    link.download = this.downloadFileName();
    link.click();
    window.URL.revokeObjectURL(url);
  }

  updateTitle(title: string): void {
    const nextTitle: string = title.trim();
    if (!nextTitle || nextTitle.length > MODEL_TITLE_MAX_LENGTH || nextTitle === this.title()) {
      return;
    }
    this.titleState.set(nextTitle);
    this.saveModel();
  }

  private downloadFileName(): string {
    const sanitized: string = this.title()
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/[\u0000-\u001f]/g, "")
      .trim();
    return `${sanitized || DEFAULT_TITLE}.json`;
  }

  private generateModel(): IModel {
    return {
      title: this.title(),
      tables: this.tables(),
      connections: this.connections(),
    }
  }

  saveModel(): void {
    const model: IModel = this.generateModel();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(model));
  }
}
