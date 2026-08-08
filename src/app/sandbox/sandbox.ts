import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { F_CANVAS, FFlowModule } from '@foblex/flow';
import { SidePanel } from '../components/side-panel/side-panel';
import { Toolbar } from '../components/toolbar/toolbar';
import { Table as TableService } from '../services/table';
import { Table } from "../components/table/table";
import { Tools } from '../services/tools';
import { iCoord } from '../types/interfaces';
import { IPoint } from '@foblex/2d';

@Component({
  selector: 'app-sandbox',
  imports: [FFlowModule, SidePanel, Toolbar, Table],
  templateUrl: './sandbox.html',
  styleUrl: './sandbox.scss',
})
export class Sandbox {
  private readonly tableService = inject(TableService);
  private readonly toolsService = inject(Tools);

  // Tables
  tables = this.tableService.tables;

  // Cursor
  isSelector = computed(() => this.toolsService.cursorMode() == 0);
  cursorCoords = signal<iCoord>({x: 0, y: 0});

  // Canvas
  canvas = viewChild(F_CANVAS);

  isSidePanelOpen = signal<boolean>(false);

  constructor() {
    document.addEventListener('mousemove', (event) => {
      this.cursorCoords.set({x: event.clientX, y: event.clientY});
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
}
