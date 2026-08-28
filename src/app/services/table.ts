import { Service, signal } from '@angular/core';
import { eDataType, iColumn, iCoord, iTable } from '../types/interfaces';

@Service()
export class Table {
  tables = signal<iTable[]>([
    {
      id: 1, 
      title: "Table 1", 
      columns: [
        this.generateEmptyColumn(),
      ], 
      coords: {x: 32, y: 64}
    },
    {
      id: 2, 
      title: "Table 2", 
      columns: [
        this.generateEmptyColumn(),
      ], 
      coords: {x: 200, y: 64}
    }
  ]);

  // Table management
  createTable(coords: iCoord): void {
    this.tables.update(value => {
      const newTable: iTable = {
        columns: [{name: "Column 1", type: eDataType.String, order: 0, maxlength: ""}],
        coords,
        id: value.length + 1,
        title: `Table ${value.length + 1}`
      };
      return [...value, newTable];
    });
  }

  updateTable(tableId: number, newTable: iTable): void {
    const index: number = this.tables().findIndex(table => table.id === tableId);
    if (index > -1) {
      this.tables()[index] = newTable;
    }
  }

  deleteTable(tableId: number): void {
    this.tables.update(value => value.filter(table => table.id != tableId));
  }

  // Column management
  generateEmptyColumn(currentColumnCount: number = 0): iColumn {
    const nextColumnNumber: number = currentColumnCount + 1;
    return {
      name: "Column " + nextColumnNumber, 
      type: eDataType.String, 
      order: currentColumnCount, 
      maxlength: "",
    };
  }
}
