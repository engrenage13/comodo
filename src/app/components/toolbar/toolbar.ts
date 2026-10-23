import { afterNextRender, Component, computed, ElementRef, inject, linkedSignal, viewChild } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { ProjectMenu } from '../project-menu/project-menu';
import { eCursorMode, Tools } from '../../services/tools';
import { MODEL_TITLE_MAX_LENGTH, ModelService } from '../../services/model-service';

@Component({
  selector: 'app-toolbar',
  imports: [FormField, ProjectMenu],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  private readonly toolsService: Tools = inject(Tools);
  private readonly modelService: ModelService = inject(ModelService);

  private readonly selectionButton = viewChild<ElementRef<HTMLButtonElement>>('selectionButton');

  constructor() {
    afterNextRender(() => {
      this.selectionButton()?.nativeElement.focus();
    });
  }

  cursorMode = this.toolsService.cursorMode;

  private readonly titleModel = linkedSignal(() => ({title: this.modelService.title()}));
  readonly titleForm = form(this.titleModel, (schema) => {
    required(schema.title, {message: "Le modèle doit avoir un titre."});
    maxLength(schema.title, MODEL_TITLE_MAX_LENGTH, {
      message: `Le titre ne peut pas dépasser ${MODEL_TITLE_MAX_LENGTH} caractères.`,
    });
  });
  readonly titleInvalid = computed(() =>
    this.titleForm.title().touched() && this.titleForm.title().invalid()
  );

  saveTitle(event?: Event): void {
    event?.preventDefault();
    const trimmedTitle: string = this.titleModel().title.trim();
    if (trimmedTitle !== this.titleModel().title) {
      this.titleModel.set({title: trimmedTitle});
    }
    this.modelService.updateTitle(this.titleModel().title);
  }

  setCursorMode(cursorMode: eCursorMode): void {
    this.cursorMode.set(cursorMode);
  }
}
