import { Service, signal } from '@angular/core';

@Service()
export class Tools {
  cursorMode = signal<eCursorMode>(eCursorMode.Selection);
}

export enum eCursorMode {
  Selection,
  Table,
}
