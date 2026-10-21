import {Component, ElementRef, inject, signal, viewChild, viewChildren} from '@angular/core';
import {Project} from '../../services/project';

@Component({
  selector: 'app-project-menu',
  templateUrl: './project-menu.html',
  styleUrl: './project-menu.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class ProjectMenu {
  readonly project: Project = inject(Project);

  private readonly projectRoot = viewChild<ElementRef<HTMLElement>>('projectRoot');
  private readonly projectButton = viewChild<ElementRef<HTMLButtonElement>>('projectButton');
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly menuItems = viewChildren<ElementRef<HTMLButtonElement>>('menuItem');
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  readonly menuOpen = signal(false);

  cancelConfirm(): void {
    this.project.cancelNew();
    setTimeout(() => this.focusFirstItem());
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.project.cancelNew();
  }

  confirmCreate(): void {
    this.project.startNew();
    this.menuOpen.set(false);
  }

  onDocumentClick(event: Event): void {
    if (!this.menuOpen()) return;
    const root: HTMLElement | undefined = this.projectRoot()?.nativeElement;
    if (root && event.target instanceof Node && root.contains(event.target)) return;
    this.closeMenu();
  }

  onEscape(): void {
    if (!this.menuOpen()) return;
    if (this.project.confirmNew()) {
      this.project.cancelNew();
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

  async openProject(): Promise<void> {
    if (!this.project.canRememberFiles) {
      this.fileInput()?.nativeElement.click();
      this.closeMenu();
      return;
    }
    this.menuOpen.set(false);
    try {
      await this.project.openFromPicker();
    } catch {
      return;
    }
  }

  requestNew(): void {
    if (this.project.requestNew()) {
      this.menuOpen.set(false);
      return;
    }
    setTimeout(() => this.confirmButton()?.nativeElement.focus());
  }

  async save(): Promise<void> {
    this.menuOpen.set(false);
    await this.project.save();
  }

  async saveAs(): Promise<void> {
    this.menuOpen.set(false);
    await this.project.saveAs();
  }

  toggleMenu(): void {
    const open: boolean = !this.menuOpen();
    this.menuOpen.set(open);
    if (!open) {
      this.project.cancelNew();
      return;
    }
    setTimeout(() => this.focusFirstItem());
  }

  private async importFile(file: File): Promise<void> {
    try {
      await this.project.openText(await file.text());
    } catch {
      return;
    }
  }

  private focusFirstItem(): void {
    if (!this.menuOpen() || this.project.confirmNew()) return;
    this.menuItems()[0]?.nativeElement.focus();
  }
}
