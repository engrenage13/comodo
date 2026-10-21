import {computed, inject, Service, signal} from '@angular/core';
import {ModelService} from './model-service';
import {RecentFiles} from './recent-files';

@Service()
export class Project {
  private readonly modelService: ModelService = inject(ModelService);
  private readonly recentFiles: RecentFiles = inject(RecentFiles);
  private locationGeneration = 0;

  readonly canRememberFiles: boolean = this.recentFiles.canRememberFiles;
  readonly title = this.modelService.title;
  readonly location = signal<FileSystemFileHandle | null>(null);
  readonly hasLocation = computed(() => this.location() !== null);
  readonly locationName = computed(() => this.location()?.name ?? "");
  readonly confirmNew = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal<string | null>(null);

  constructor() {
    void this.restoreLocation();
  }

  cancelNew(): void {
    this.confirmNew.set(false);
  }

  async openFromPicker(): Promise<boolean> {
    this.error.set(null);
    this.status.set(null);
    this.confirmNew.set(false);
    let handle: FileSystemFileHandle | null;
    try {
      handle = await this.recentFiles.pickJsonFile();
    } catch (error: unknown) {
      this.report(error, "Impossible d'ouvrir ce fichier.");
      return false;
    }
    if (!handle) return false;
    await this.openHandle(handle);
    return true;
  }

  async openText(text: string): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    this.status.set(null);
    this.confirmNew.set(false);
    try {
      this.modelService.loadFromText(text);
      await this.clearLocation();
    } catch (error: unknown) {
      this.report(error, "Impossible d'ouvrir ce fichier.");
      throw error;
    } finally {
      this.busy.set(false);
    }
  }

  requestNew(): boolean {
    this.error.set(null);
    this.status.set(null);
    if (this.modelService.hasStoredModel()) {
      this.confirmNew.set(true);
      return false;
    }
    this.startNew();
    return true;
  }

  async save(): Promise<void> {
    const handle: FileSystemFileHandle | null = this.location();
    if (!handle) return;
    this.busy.set(true);
    this.error.set(null);
    this.status.set(null);
    try {
      await this.recentFiles.allowWrite(handle);
      await this.recentFiles.writeFile(handle, this.modelService.jsonText());
      this.status.set("Enregistré.");
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "NotFoundError") {
        await this.clearLocation();
        this.error.set("Ce fichier est introuvable. Utilisez Enregistrer sous.");
        return;
      }
      this.report(error, "Impossible d'enregistrer le fichier.");
    } finally {
      this.busy.set(false);
    }
  }

  async saveAs(): Promise<void> {
    this.error.set(null);
    this.status.set(null);
    this.confirmNew.set(false);
    if (!this.recentFiles.canPickSaveLocation) {
      this.modelService.downloadJsonModel();
      this.status.set("Fichier téléchargé.");
      return;
    }

    let handle: FileSystemFileHandle;
    try {
      const picked: FileSystemFileHandle | null = await this.recentFiles.pickSaveFile(this.modelService.suggestedFileName());
      if (!picked) return;
      handle = picked;
    } catch (error: unknown) {
      this.report(error, "Impossible d'enregistrer le fichier.");
      return;
    }

    this.busy.set(true);
    try {
      await this.recentFiles.writeFile(handle, this.modelService.jsonText());
      this.rememberLocation(handle);
      this.status.set("Enregistré.");
    } catch (error: unknown) {
      this.report(error, "Impossible d'enregistrer le fichier.");
    } finally {
      this.busy.set(false);
    }
  }

  startNew(): void {
    this.confirmNew.set(false);
    this.error.set(null);
    this.status.set(null);
    this.modelService.startNewModel();
    void this.clearLocation();
  }

  private async clearLocation(): Promise<void> {
    this.locationGeneration += 1;
    this.location.set(null);
    await this.recentFiles.clearCurrent().catch(() => undefined);
  }

  private async openHandle(handle: FileSystemFileHandle): Promise<void> {
    this.busy.set(true);
    try {
      const file: File = await handle.getFile();
      this.modelService.loadFromText(await file.text());
      this.rememberLocation(handle);
    } catch (error: unknown) {
      this.report(error, "Impossible d'ouvrir ce fichier.");
      throw error;
    } finally {
      this.busy.set(false);
    }
  }

  private rememberLocation(handle: FileSystemFileHandle): void {
    this.locationGeneration += 1;
    this.location.set(handle);
    void this.recentFiles.storeCurrent(handle).catch(() => undefined);
    void this.recentFiles.remember(handle).catch(() => undefined);
  }

  private report(error: unknown, fallback: string): void {
    if (error instanceof DOMException && error.name === "AbortError") return;
    this.status.set(null);
    if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
      this.error.set("L'accès au fichier a été refusé.");
      return;
    }
    if (error instanceof Error && error.message && !(error instanceof DOMException)) {
      this.error.set(error.message);
      return;
    }
    this.error.set(fallback);
  }

  private async restoreLocation(): Promise<void> {
    const generation: number = this.locationGeneration;
    try {
      const handle: FileSystemFileHandle | null = await this.recentFiles.readCurrent();
      if (generation !== this.locationGeneration) return;
      this.location.set(handle);
    } catch {
      if (generation === this.locationGeneration) this.location.set(null);
    }
  }
}
