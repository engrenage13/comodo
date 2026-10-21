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
import {Project} from '../services/project';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  host: {
    '(keydown.escape)': 'cancelNew()',
  },
})
export class Home {
  private readonly modelService = inject(ModelService);
  private readonly project = inject(Project);

  // Output
  quitHomePage = output<void>();

  // Internal work
  private readonly heading = viewChild<ElementRef<HTMLHeadingElement>>('heading');
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly canRememberFiles = this.project.canRememberFiles;
  readonly hasStoredModel = this.modelService.hasStoredModel;
  readonly storedTitle = this.modelService.title;
  readonly confirmNew = this.project.confirmNew;
  readonly busy = this.project.busy;
  readonly error = this.project.error;
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
    this.project.cancelNew();
  }

  createNewModel(): void {
    this.project.startNew();
    this.quitHomePage.emit();
  }

  onFileSelected(event: Event): void {
    const input: EventTarget | null = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file: File | null = input.files?.item(0) ?? null;
    input.value = "";
    if (!file) return;
    void this.importFile(file);
  }

  async openFromComputer(): Promise<void> {
    if (!this.canRememberFiles) {
      this.fileInput()?.nativeElement.click();
      return;
    }

    try {
      const opened: boolean = await this.project.openFromPicker();
      if (opened) this.quitHomePage.emit();
    } catch {
      return;
    }
  }

  requestNewModel(): void {
    if (this.project.requestNew()) this.quitHomePage.emit();
  }

  resume(): void {
    this.project.cancelNew();
    this.quitHomePage.emit();
  }

  private async importFile(file: File): Promise<void> {
    try {
      await this.project.openText(await file.text());
      this.quitHomePage.emit();
    } catch {
      return;
    }
  }
}
