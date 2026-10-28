import {Component, computed, inject, signal, viewChild} from '@angular/core';
import {ModelService} from '../../services/model-service';
import {ConfirmPopup} from '../confirm-popup/confirm-popup';
import {FileImportPopup} from '../file-import-popup/file-import-popup';
import {Menu, MenuContent, MenuItem, MenuTrigger} from '@angular/aria/menu';
import {CdkConnectedOverlay} from '@angular/cdk/overlay';

@Component({
  selector: 'app-project-menu',
  templateUrl: './project-menu.html',
  styleUrl: './project-menu.scss',
  imports: [
    ConfirmPopup,
    FileImportPopup,
    MenuTrigger,
    CdkConnectedOverlay,
    Menu,
    MenuContent,
    MenuItem
  ]
})
export class ProjectMenu {
  private readonly modelService: ModelService = inject(ModelService);

  // Internal work
  baseMenu = viewChild<Menu<string>>('baseMenu');
  expanded = computed<boolean>(() => this.baseMenu()?.visible() ?? false);

  // Options
  options: IMenuItem[][] = [
    [
      {code: "new_project", label: "Nouveau projet", icon: "note_add"},
      {code: "open_project", label: "Ouvrir", icon: "folder_open"},
    ],
    [
      {code: "download", label: "Télécharger", icon: "download"},
    ],
  ];

  // File management
  busy = this.modelService.busy;
  confirmNew = this.modelService.confirmNew;
  title = this.modelService.title;
  isFilePopupOpened = signal<boolean>(false);

  closeFilePopup(fileLoaded: boolean): void {
    this.isFilePopupOpened.set(false);
    if (fileLoaded) {
      this.baseMenu()?.close();
    }
  }

  confirmNewModel(confirmation: boolean): void {
    confirmation ? this.modelService.startNew() : this.modelService.cancelNew();
    if (confirmation) {
      this.baseMenu()?.close();
    }
  }

  requestNew(): void {
    if (this.modelService.requestNew()) {
      this.baseMenu()?.close();
    }
  }

  saveAs(): void {
    this.baseMenu()?.close();
    this.modelService.downloadJsonModel();
  }

  startAction(actionCode: string): void {
    switch (actionCode) {
      case "open_project": {
        this.isFilePopupOpened.set(true);
        break;
      }
      case "download": {
        this.saveAs();
        break;
      }
      default: {
        this.requestNew();
      }
    }
  }
}

export interface IMenuItem {
  code: string;
  label: string;
  icon: string;
}
