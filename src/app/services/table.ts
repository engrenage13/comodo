import {inject, Service} from '@angular/core';
import { IColumn, ICoord, ITable } from '../types/interfaces';
import { EDataType } from '../types/enums';
import {ModelService} from './model-service';

@Service()
export class Table {
  private readonly modelService: ModelService = inject(ModelService);

  tables = this.modelService.tables;

  // Table management
  createTable(coords: ICoord): void {
    this.tables.update(value => {
      const newTable: ITable = {
        columns: [{name: "Column 1", type: EDataType.String, order: 0, maxlength: ""}],
        coords,
        id: value.length + 1,
        title: `Table ${value.length + 1}`
      };
      return [...value, newTable];
    });
    this.modelService.saveModel();
  }

  updateTable(tableId: number, newTable: ITable): void {
    const index: number = this.tables().findIndex(table => table.id === tableId);
    if (index > -1) {
      this.tables()[index] = newTable;
      this.modelService.saveModel();
    }
  }

  deleteTable(tableId: number): void {
    this.tables.update(value => value.filter(table => table.id != tableId));
    this.modelService.saveModel();
  }

  // Column management
  generateEmptyColumn(currentColumnCount: number = 0): IColumn {
    const nextColumnNumber: number = currentColumnCount + 1;
    return {
      name: "Column " + nextColumnNumber,
      type: EDataType.String,
      order: currentColumnCount,
      maxlength: "",
    };
  }
}
