import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { SidePanel } from "../side-panel/side-panel";
import { iColumn, iTable } from '../../types/interfaces';
import { Table } from '../../services/table';
import { form, required, FormField, disabled } from '@angular/forms/signals';
import { ColumnForm } from "../column-form/column-form";

@Component({
  selector: 'app-table-settings',
  imports: [SidePanel, FormField, ColumnForm],
  templateUrl: './table-settings.html',
  styleUrl: './table-settings.scss',
})
export class TableSettings {
  private readonly tableService = inject(Table);

  // Inputs
  tableDatas = input.required<iTable>();

  // Outputs
  closePanel = output<void>();

  // Columns
  columns = linkedSignal<{column: iColumn, invalid: boolean, checked?: boolean}[]>(() => 
    this.tableDatas().columns.map(column => {
      return {column, invalid: false};
    })
  );
  hasInvalidColumn = signal<boolean>(false);
  deleteColumnMode = signal<boolean>(false);

  // Form
  tableModel = linkedSignal<iTable>(() => this.tableDatas());
  tableForm = form(this.tableModel, (schema) => {
    required(schema.title, {message: "La table doit avoir un nom."});
    disabled(schema.title, {when: () => this.deleteColumnMode()});
  });
  isInvalid = computed(() => 
    (this.tableForm().touched() && this.tableForm().invalid()) || this.hasInvalidColumn()
  );

  addNewColumn(): void {
    this.columns.update(value => {
      return [...value, {column: this.tableService.generateEmptyColumn(value.length), invalid: false}];
    });
  }

  deleteTable(): void {
    this.tableService.deleteTable(this.tableDatas().id);
    this.closePanel.emit();
  }

  saveTableModifications(): void {
    // Columns
    const columns: iColumn[] = this.columns().map(column => column.column);
    // Table
    const table: iTable = {...this.tableModel(), columns};
    this.tableService.updateTable(this.tableDatas().id, table);
    this.closePanel.emit();
  }

  switchColumnMode(): void {
    this.deleteColumnMode.update(value => !value);
    if (!this.deleteColumnMode()) {
      this.columns().forEach(column => column.checked = false);
    }
  }

  updateColumnData(columnIndex: number, newColumnData: iColumn): void {
    if (columnIndex > -1) {
      this.columns()[columnIndex].column = newColumnData;
    }
  }

  updateColumnSelection(columnIndex: number, columnChecked: boolean): void {
    if (columnIndex > -1) {
      this.columns()[columnIndex].checked = columnChecked;
    }
  }

  updateColumnValidity(columnIndex: number, columnValidity: boolean): void {
    if (columnIndex > -1) {
      this.columns()[columnIndex].invalid = columnValidity;
    }
    const index: number = this.columns().findIndex(column => column.invalid);
    this.hasInvalidColumn.set(index > -1);
  }

  deleteCheckedColumns(): void {
    this.columns.set(this.columns().filter(column => !column.checked));
    this.deleteColumnMode.set(false);
  }
}
