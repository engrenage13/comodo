import {Component, ElementRef, inject, signal, viewChild, viewChildren} from '@angular/core';
import {ModelService} from '../../services/model-service';
import {ConfirmPopup} from '../confirm-popup/confirm-popup';

@Component({
  selector: 'app-project-menu',
  templateUrl: './project-menu.html',
  styleUrl: './project-menu.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
  imports: [
    ConfirmPopup
  ]
})
export class ProjectMenu {
  private readonly modelService: ModelService = inject(ModelService);

  private readonly projectRoot = viewChild<ElementRef<HTMLElement>>('projectRoot');
  private readonly projectButton = viewChild<ElementRef<HTMLButtonElement>>('projectButton');
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly menuItems = viewChildren<ElementRef<HTMLButtonElement>>('menuItem');

  readonly menuOpen = signal(false);

  // File management
  busy = this.modelService.busy;
  confirmNew = this.modelService.confirmNew;
  error = this.modelService.error;
  title = this.modelService.title;

  closeMenu(): void {
    this.menuOpen.set(false);
    this.modelService.cancelNew();
  }

  confirmNewModel(confirmation: boolean): void {
    confirmation ? this.modelService.startNew() : this.modelService.cancelNew();
    if (confirmation) {
      this.menuOpen.set(false);
    } else {
      setTimeout(() => this.focusFirstItem());
    }
  }

  onDocumentClick(event: Event): void {
    if (!this.menuOpen()) return;
    const root: HTMLElement | undefined = this.projectRoot()?.nativeElement;
    if (root && event.target instanceof Node && root.contains(event.target)) return;
    this.closeMenu();
  }

  onEscape(): void {
    if (!this.menuOpen()) return;
    if (this.confirmNew()) {
      this.modelService.cancelNew();
      setTimeout(() => this.focusFirstItem());
      return;
    }
    this.menuOpen.set(false);
    this.projectButton()?.nativeElement.focus();
  }

  onFileSelected(event: Event): void {
    const input: EventTarget | null = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file: File | null = input.files?.item(0) ?? null;
    input.value = "";
    if (!file) return;
    void this.importFile(file);
  }

  onMenuKeydown(event: KeyboardEvent): void {
    const items: HTMLButtonElement[] = this.menuItems().map(item => item.nativeElement);
    if (items.length === 0) return;
    const index: number = items.indexOf(<HTMLButtonElement>document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items.at(-1)?.focus();
    }
  }

  openProject(): void {
    this.fileInput()?.nativeElement.click();
    this.menuOpen.set(false);
  }

  requestNew(): void {
    if (this.modelService.requestNew()) {
      this.menuOpen.set(false);
    }
  }

  saveAs(): void {
    this.menuOpen.set(false);
    this.modelService.downloadJsonModel();
  }

  toggleMenu(): void {
    const open: boolean = !this.menuOpen();
    this.menuOpen.set(open);
    if (!open) {
      this.modelService.cancelNew();
      return;
    }
    setTimeout(() => this.focusFirstItem());
  }

  private async importFile(file: File): Promise<void> {
    try {
      this.modelService.openFile(await file.text());
    } catch {
      return;
    }
  }

  private focusFirstItem(): void {
    if (!this.menuOpen() || this.confirmNew()) return;
    this.menuItems()[0]?.nativeElement.focus();
  }
}
