import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  output,
  signal,
  viewChild
} from '@angular/core';
import {ModelService} from '../services/model-service';
import {RecentFiles} from '../services/recent-files';

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
  private readonly recentFiles = inject(RecentFiles);

  // Output
  quitHomePage = output<void>();

  // Internal work
  private readonly heading = viewChild<ElementRef<HTMLHeadingElement>>('heading');
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly canRememberFiles = this.recentFiles.canRememberFiles;
  readonly hasStoredModel = this.modelService.hasStoredModel;
  readonly storedTitle = this.modelService.title;
  readonly confirmNew = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
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
    this.confirmNew.set(false);
  }

  createNewModel(): void {
    this.modelService.startNewModel();
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
    this.confirmNew.set(false);
    this.error.set(null);
    if (!this.canRememberFiles) {
      this.fileInput()?.nativeElement.click();
      return;
    }

    try {
      const handle: FileSystemFileHandle | null = await this.recentFiles.pickJsonFile();
      if (!handle) return;
      await this.importHandle(handle);
    } catch (error: unknown) {
      this.report(error);
    }
  }

  requestNewModel(): void {
    this.error.set(null);
    if (this.hasStoredModel()) {
      this.confirmNew.set(true);
      return;
    }
    this.createNewModel();
  }

  resume(): void {
    this.confirmNew.set(false);
    this.quitHomePage.emit();
  }

  private async importFile(file: File): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      this.modelService.loadFromText(await file.text());
      this.quitHomePage.emit();
    } catch (error: unknown) {
      this.report(error);
    } finally {
      this.busy.set(false);
    }
  }

  private async importHandle(handle: FileSystemFileHandle): Promise<void> {
    this.busy.set(true);
    try {
      const file: File = await handle.getFile();
      this.modelService.loadFromText(await file.text());
      await this.recentFiles.remember(handle).catch(() => undefined);
      this.quitHomePage.emit();
    } catch (error: unknown) {
      this.report(error);
    } finally {
      this.busy.set(false);
    }
  }

  private report(error: unknown): void {
    if (error instanceof DOMException && error.name === "AbortError") return;
    if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
      this.error.set("L'accès au fichier a été refusé.");
      return;
    }
    if (error instanceof Error && error.message && !(error instanceof DOMException)) {
      this.error.set(error.message);
      return;
    }
    this.error.set("Impossible d'ouvrir ce fichier.");
  }
}
