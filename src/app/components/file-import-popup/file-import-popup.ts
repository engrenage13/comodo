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

  // Output
  confirm = output<boolean>();

  // Internal work
  error = this.modelService.error;
  closed = signal<boolean>(false);

  close(confirm: boolean): void {
    this.closed.set(true);
    this.confirm.emit(confirm);
  }

  drop(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const dataTransfer = event as unknown as DataTransfer;
    const files = dataTransfer.files;
    if (files && files.length > 0) {
      void this.importFile(files[0]);
    }
  }

  private async importFile(file: File): Promise<void> {
    try {
      this.modelService.openFile(await file.text());
    } catch {
      return;
    } finally {
      if (!this.error()) {
        this.close(true);
      }
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
