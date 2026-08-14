import { afterRenderEffect, Component, input, model, output } from '@angular/core';
import { iColumn } from '../../types/interfaces';
import { form, required, FormField, disabled } from '@angular/forms/signals';

@Component({
  selector: 'app-column-form',
  imports: [FormField],
  templateUrl: './column-form.html',
  styleUrl: './column-form.scss',
})
export class ColumnForm {
  // Input
  checkBoxMode = input<boolean>(false);

  // Models
  columnDatas = model.required<iColumn>();
  checked = model<boolean>(false);

  // Output
  isInvalid = output<boolean>();

  // Form
  columnForm = form(this.columnDatas, (schema) => {
    required(schema.name, {message: "La colonne doit avoir un nom."});
    disabled(schema.name, {when: () => this.checkBoxMode()});
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.columnForm().touched()) {
        this.isInvalid.emit(this.columnForm().invalid());
      }
    });
  }

  check(): void {
    if (this.checkBoxMode()) {
      this.checked.update(value => !value);
    }
  }
}
