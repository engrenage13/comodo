import {Component, inject, output, signal} from '@angular/core';
import {Popup} from '../primitives/popup/popup';
import {ModelService} from '../../services/model-service';

@Component({
  selector: 'app-file-import-popup',
  imports: [
    Popup
  ],
  templateUrl: './file-import-popup.html',
  styleUrl: './file-import-popup.scss',
})
export class FileImportPopup {
  private readonly modelService: ModelService = inject(ModelService);
  private dragDepth: number = 0;

  // Output
  confirm = output<boolean>();

  // Internal work
  error = this.modelService.error;
  closed = signal<boolean>(false);
  readonly dragOver = signal<boolean>(false);

  close(confirm: boolean): void {
    this.closed.set(true);
    this.confirm.emit(confirm);
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.dragDepth++;
    this.dragOver.set(true);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDragLeave(): void {
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) {
      this.dragOver.set(false);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragDepth = 0;
    this.dragOver.set(false);

    const file: File | null = event.dataTransfer?.files.item(0) ?? null;
    if (!file || !this.isJsonFile(file)) {
      this.error.set("Déposez un fichier JSON.");
      return;
    }
    void this.importFile(file);
  }

  private isJsonFile(file: File): boolean {
    const type: string = file.type.toLowerCase();
    return type === "application/json"
      || type === "text/json"
      || file.name.toLowerCase().endsWith(".json");
  }

  private async importFile(file: File): Promise<void> {
    let content: string;
    try {
      content = await file.text();
    } catch {
      this.error.set("Impossible de lire ce fichier.");
      return;
    }
    this.modelService.openFile(content);
    if (!this.error()) {
      this.close(true);
    }
  }

  onFileSelected(event: Event): void {
    const input: EventTarget | null = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file: File | null = input.files?.item(0) ?? null;
    input.value = "";
    if (!file) return;
    void this.importFile(file);
  }
}
