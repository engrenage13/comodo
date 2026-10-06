import {Service, signal} from '@angular/core';
import {IConnection, IModel, ITable} from '../types/interfaces';

@Service()
export class ModelService {
  private readonly STORAGE_KEY: string = "cmdModel";

  connections = signal<IConnection[]>([]);
  tables = signal<ITable[]>([]);

  constructor() {
    const storedModel: string|null = localStorage.getItem(this.STORAGE_KEY);
    if (storedModel) {
      const model: IModel = JSON.parse(storedModel);

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
    link.download = "Mon MCD";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private generateModel(): IModel {
    return {
      tables: this.tables(),
      connections: this.connections(),
    }
  }

  saveModel(): void {
    const model: IModel = this.generateModel();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(model));
  }
}
