import {Component, computed, inject, output, signal} from '@angular/core';
import {ModelService} from '../services/model-service';
import {AccordPipe} from '../pipes/accord-pipe';
import {ConfirmPopup} from '../components/confirm-popup/confirm-popup';
import {FileImportPopup} from '../components/file-import-popup/file-import-popup';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  imports: [
    AccordPipe,
    ConfirmPopup,
    FileImportPopup
  ]
})
export class Home {
  private readonly modelService: ModelService = inject(ModelService);

  // Output
  quitHomePage = output<void>();

  // Internal work
  readonly hasStoredModel = this.modelService.hasStoredModel;
  readonly storedTitle = this.modelService.title;
  readonly confirmNew = this.modelService.confirmNew;
  readonly busy = this.modelService.busy;
  readonly error = this.modelService.error;
  tablesCount = computed<number>(() => this.modelService.tables().length);
  isFilePopupOpened = signal<boolean>(false);

  close(): void {
    this.error.set(null);
    this.quitHomePage.emit();
  }

  confirmNewModel(confirmation: boolean): void {
    confirmation ? this.modelService.startNew() : this.modelService.cancelNew();
    if (confirmation) {
      this.close();
    }
  }

  closeFilePopup(fileLoaded: boolean): void {
    this.isFilePopupOpened.set(false);
    if (fileLoaded) {
      this.close();
    }
  }

  requestNewModel(): void {
    if (this.modelService.requestNew()) this.close();
  }

  resume(): void {
    this.modelService.cancelNew();
    this.close();
  }
}
