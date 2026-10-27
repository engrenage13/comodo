import {Component, ElementRef, inject, signal, viewChild, viewChildren} from '@angular/core';
import {ModelService} from '../../services/model-service';
import {ConfirmPopup} from '../confirm-popup/confirm-popup';
import {FileImportPopup} from '../file-import-popup/file-import-popup';

@Component({
  selector: 'app-project-menu',
  templateUrl: './project-menu.html',
  styleUrl: './project-menu.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
  imports: [
    ConfirmPopup,
    FileImportPopup
  ]
})
export class ProjectMenu {
  private readonly modelService: ModelService = inject(ModelService);

  private readonly projectRoot = viewChild<ElementRef<HTMLElement>>('projectRoot');
  private readonly projectButton = viewChild<ElementRef<HTMLButtonElement>>('projectButton');
  private readonly menuItems = viewChildren<ElementRef<HTMLButtonElement>>('menuItem');

  readonly menuOpen = signal(false);

  // File management
  busy = this.modelService.busy;
  confirmNew = this.modelService.confirmNew;
  title = this.modelService.title;
  isFilePopupOpened = signal<boolean>(false);

  closeFilePopup(fileLoaded: boolean): void {
    this.isFilePopupOpened.set(false);
    if (fileLoaded) {
      this.menuOpen.set(false);
    } else {
      setTimeout(() => this.focusFirstItem());
    }
  }

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

  private focusFirstItem(): void {
    if (!this.menuOpen() || this.confirmNew()) return;
    this.menuItems()[0]?.nativeElement.focus();
  }
}
