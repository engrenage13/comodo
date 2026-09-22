import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {F_CANVAS, FCreateConnectionEvent, FFlowModule, FReassignConnectionEvent} from '@foblex/flow';
import { Toolbar } from '../components/toolbar/toolbar';
import { Table as TableService } from '../services/table';
import { Table } from "../components/table/table";
import { Tools } from '../services/tools';
import { iCoord, iTable } from '../types/interfaces';
import { IPoint } from '@foblex/2d';
import { TableSettings } from "../components/table-settings/table-settings";

@Component({
  selector: 'app-sandbox',
  imports: [FFlowModule, Toolbar, Table, TableSettings],
  templateUrl: './sandbox.html',
  styleUrl: './sandbox.scss',
})
export class Sandbox {
  private readonly tableService = inject(TableService);
  private readonly toolsService = inject(Tools);

  // Connections
  connections = signal<{ source: string; target: string }[]>([]);

  // Tables
  tables = this.tableService.tables;
  editedTable = signal<iTable|undefined>(undefined);

  // Cursor
  isSelector = computed(() => this.toolsService.cursorMode() == 0);
  cursorCoords = signal<iCoord>({x: 0, y: 0});

  // Canvas
  readonly canvas = viewChild(F_CANVAS);

  constructor() {
    document.addEventListener('mousemove', (event) => {
      this.cursorCoords.set({x: event.clientX, y: event.clientY});
    });
  }

  createConnection(event: FCreateConnectionEvent): void {
    const target: string|undefined = event.targetId;
    const source: string = event.sourceId;
    if (!target || this.cannotCreateConnection(source, target)) {
      return;
    }
    this.connections.update((x) =>
      [...x, { source: event.sourceId, target }]
    );
  }

  protected reassignConnection(event: FReassignConnectionEvent): void {
    if (
      (!event.nextTargetId && !event.nextSourceId)
      || this.cannotCreateConnection(
        event.nextSourceId ?? event.previousSourceId,
        event.nextTargetId ?? event.previousTargetId
      )
    ) {
      return;
    }
    this.connections.update((link) => {
      const connection = link.find(
        (c) => c.source === event.previousSourceId && c.target === event.previousTargetId,
      );
      if (!connection) {
        throw new Error('Connection not found');
      }
      connection.source = event.nextSourceId || connection.source;
      connection.target = event.nextTargetId || connection.target;

      return [...link];
    });
  }

  createTable(): void {
    if (!this.isSelector()) {
      const canvasCoords: IPoint = this.canvas()!.getPosition();
      this.tableService.createTable({
        x: this.cursorCoords().x - canvasCoords.x,
        y: this.cursorCoords().y - canvasCoords.y
      });
    }
  }

  private cannotCreateConnection(source: string, target: string): boolean {
    const targetName: string[] = target.split("_");
    const sourceName: string[] = source.split("_");
    return (sourceName[0] == targetName[0])
      || this.connections().some(link => {
        const linkSourceName: string[] = link.source.split("_");
        const linkTargetName: string[] = link.target.split("_");
        return (linkSourceName[0] == sourceName[0] && linkTargetName[0] == targetName[0])
          || (linkSourceName[0] == targetName[0] && linkTargetName[0] == sourceName[0]);
      });
  }
}
