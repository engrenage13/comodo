import { Component, input } from '@angular/core';
import { iTable } from '../../types/interfaces';
import { FFlowModule } from '@foblex/flow';

@Component({
  selector: 'app-table',
  imports: [FFlowModule],
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class Table {
  content = input.required<iTable>();
  id = input.required<number>();
  disableDragging = input<boolean>(false);
}
