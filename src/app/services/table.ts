import { Service, signal } from '@angular/core';
import { iCoord, iTable } from '../types/interfaces';

@Service()
export class Table {
  tables = signal<iTable[]>([
    {title: "Table 1", rows: [], coords: {x: 32, y: 64}},
    {title: "Table 2", rows: [], coords: {x: 200, y: 64}}
  ]);

  createTable(coords: iCoord): void {
    this.tables.update(value => {
      const newTable: iTable = {
        rows: [],
        coords,
        title: `Table ${value.length + 1}`
      };
      return [...value, newTable];
    });
  }
}
