import { Component, inject } from '@angular/core';
import { eCursorMode, Tools } from '../../services/tools';
import {ModelService} from '../../services/model-service';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  private readonly toolsService: Tools = inject(Tools);
  private readonly modelService: ModelService = inject(ModelService);

  cursorMode = this.toolsService.cursorMode;

  downloadFile(): void {
    this.modelService.downloadJsonModel();
  }

  setCursorMode(cursorMode: eCursorMode): void {
    this.cursorMode.set(cursorMode);
  }
}
