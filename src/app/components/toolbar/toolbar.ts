import { Component, inject } from '@angular/core';
import { eCursorMode, Tools } from '../../services/tools';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  private readonly toolsService = inject(Tools);

  cursorMode = this.toolsService.cursorMode;

  setCursorMode(cursorMode: eCursorMode): void {
    this.cursorMode.set(cursorMode);
  }
}
