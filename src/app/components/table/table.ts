import {Component, inject, input, output} from '@angular/core';
import { ITable } from '../../types/interfaces';
import { FFlowModule } from '@foblex/flow';
import {IPoint} from '@foblex/2d';
import {Table as TableService} from '../../services/table';

@Component({
  selector: 'app-table',
  imports: [FFlowModule],
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class Table {
  private readonly tableService: TableService = inject(TableService);

  // Inputs
  content = input.required<ITable>();
  id = input.required<number>();
  disableOptions = input<boolean>(false);

  // Outputs
  edit = output<void>();

  updateCoords(coords: IPoint): void {
    this.tableService.updateTableCoords(this.content().id, coords);
  }
}
