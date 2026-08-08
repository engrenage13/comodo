import { Component, computed, inject, input, output } from '@angular/core';
import { SidePanel } from "../side-panel/side-panel";
import { iTable } from '../../types/interfaces';
import { Table } from '../../services/table';

@Component({
  selector: 'app-table-settings',
  imports: [SidePanel],
  templateUrl: './table-settings.html',
  styleUrl: './table-settings.scss',
})
export class TableSettings {
  private readonly tableService = inject(Table);

  // Inputs
  tableDatas = input.required<iTable>();

  // Outputs
  closePanel = output<void>();

  deleteTable(): void {
    this.tableService.deleteTable(this.tableDatas().id);
    this.closePanel.emit();
  }
}
