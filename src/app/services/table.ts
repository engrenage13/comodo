import { Service, signal } from '@angular/core';
import { iCoord, iTable } from '../types/interfaces';

@Service()
export class Table {
  tables = signal<iTable[]>([
    {id: 1, title: "Table 1", rows: [], coords: {x: 32, y: 64}},
    {id: 2, title: "Table 2", rows: [], coords: {x: 200, y: 64}}
  ]);

  createTable(coords: iCoord): void {
    this.tables.update(value => {
      const newTable: iTable = {
        rows: [],
        coords,
        id: value.length + 1,
        title: `Table ${value.length + 1}`
      };
      return [...value, newTable];
    });
  }

  deleteTable(tableId: number): void {
    const index: number = this.tables().findIndex(table => table.id == tableId);
    console.log(index);
    this.tables.update(value => value.splice(index, 1));
  }
}
