import { Component, inject, input, linkedSignal, output } from '@angular/core';
import { SidePanel } from "../side-panel/side-panel";
import { iTable } from '../../types/interfaces';
import { Table } from '../../services/table';
import { form, required, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-table-settings',
  imports: [SidePanel, FormField],
  templateUrl: './table-settings.html',
  styleUrl: './table-settings.scss',
})
export class TableSettings {
  private readonly tableService = inject(Table);

  // Inputs
  tableDatas = input.required<iTable>();

  // Outputs
  closePanel = output<void>();

  // Form
  tableModel = linkedSignal<iTable>(() => this.tableDatas());
  tableForm = form(this.tableModel, (schema) => {
    required(schema.title);
  });

  deleteTable(): void {
    this.tableService.deleteTable(this.tableDatas().id);
    this.closePanel.emit();
  }

  saveTableModifications(): void {
    this.tableService.updateTable(this.tableDatas().id, this.tableModel());
    this.closePanel.emit();
  }
}
