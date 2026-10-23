import {Component, computed, inject, signal, viewChild} from '@angular/core';
import {
  EFCanvasLayer,
  F_CANVAS,
  FCreateConnectionEvent,
  FFlowModule,
  FReassignConnectionEvent, provideFFlow, withA11y, withConnectionFlow, withFCanvas, withReflowOnResize
} from '@foblex/flow';
import { Toolbar } from '../components/toolbar/toolbar';
import { Table as TableService } from '../services/table';
import { Table } from "../components/table/table";
import { Tools } from '../services/tools';
import { ICoord, ITable } from '../types/interfaces';
import { IPoint } from '@foblex/2d';
import { TableSettings } from "../components/table-settings/table-settings";
import {ConnectionToolbar} from '../components/connection-toolbar/connection-toolbar';
import {Connection} from '../services/connection';

@Component({
  selector: 'app-sandbox',
  imports: [FFlowModule, Toolbar, Table, TableSettings, ConnectionToolbar],
  templateUrl: './sandbox.html',
  styleUrl: './sandbox.scss',
  providers: [provideFFlow(
    withConnectionFlow('click'),
    withFCanvas({
      layers: [EFCanvasLayer.GROUPS, EFCanvasLayer.NODES, EFCanvasLayer.CONNECTIONS],
    }),
    withA11y({
      moveStep: 20,
    }),
    withReflowOnResize()
  )],
})
export class Sandbox {
  private readonly tableService: TableService = inject(TableService);
  private readonly toolsService: Tools = inject(Tools);
  private readonly connectionService: Connection = inject(Connection);

  // Connections
  connections = this.connectionService.connections;

  // Tables
  tables = this.tableService.tables;
  editedTable = signal<ITable|undefined>(undefined);

  // Cursor
  isSelector = computed(() => this.toolsService.cursorMode() == 0);
  cursorCoords = signal<ICoord>({x: 0, y: 0});

  // Canvas
  readonly canvas = viewChild(F_CANVAS);

  constructor() {
    document.addEventListener('mousemove', (event) => {
      this.cursorCoords.set({x: event.clientX, y: event.clientY});
    });
  }

  createConnection(event: FCreateConnectionEvent): void {
    this.connectionService.createConnection(event);
  }

  protected reassignConnection(event: FReassignConnectionEvent): void {
    this.connectionService.reassignConnection(event);
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

  onLoaded(): void {
    this.canvas()?.resetScale();
  }
}
