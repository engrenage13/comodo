import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  output,
  viewChild
} from '@angular/core';
import {ModelService} from '../services/model-service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  host: {
    '(keydown.escape)': 'cancelNew()',
  },
})
export class Home {
  private readonly modelService: ModelService = inject(ModelService);

  // Output
  quitHomePage = output<void>();

  // Internal work
  private readonly heading = viewChild<ElementRef<HTMLHeadingElement>>('heading');
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly hasStoredModel = this.modelService.hasStoredModel;
  readonly storedTitle = this.modelService.title;
  readonly confirmNew = this.modelService.confirmNew;
  readonly busy = this.modelService.busy;
  readonly error = this.modelService.error;
  readonly storedDetails = computed(() => {
    const count: number = this.modelService.tables().length;
    const tables: string = count === 1 ? "1 table" : `${count} tables`;
    return `Enregistré dans ce navigateur · ${tables}`;
  });

  constructor() {
    afterNextRender(() => {
      this.heading()?.nativeElement.focus();
    });
    afterRenderEffect(() => {
      if (this.confirmNew()) this.confirmButton()?.nativeElement.focus();
    });
  }

  cancelNew(): void {
    this.modelService.cancelNew();
  }

  close(): void {
    this.error.set(null);
    this.quitHomePage.emit();
  }

  createNewModel(): void {
    this.modelService.startNew();
    this.close();
  }

  onFileSelected(event: Event): void {
    const input: EventTarget | null = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file: File | null = input.files?.item(0) ?? null;
    input.value = "";
    if (!file) return;
    void this.importFile(file);
  }

  openFromComputer(): void {
    this.fileInput()?.nativeElement.click();
  }

  requestNewModel(): void {
    if (this.modelService.requestNew()) this.close();
  }

  resume(): void {
    this.modelService.cancelNew();
    this.close();
  }

  private async importFile(file: File): Promise<void> {
    try {
      this.modelService.openFile(await file.text());
    } catch {
      return;
    } finally {
      if (!this.error()) {
        this.close();
      }
    }
  }
}
