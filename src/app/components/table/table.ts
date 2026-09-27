import { Component, input, output } from '@angular/core';
import { ITable } from '../../types/interfaces';
import { FFlowModule } from '@foblex/flow';

@Component({
  selector: 'app-table',
  imports: [FFlowModule],
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class Table {
  // Inputs
  content = input.required<ITable>();
  id = input.required<number>();
  disableOptions = input<boolean>(false);

  // Outputs
  edit = output<void>();
}
