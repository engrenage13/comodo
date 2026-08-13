import { afterRenderEffect, Component, model, output } from '@angular/core';
import { iColumn } from '../../types/interfaces';
import { form, required, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-column-form',
  imports: [FormField],
  templateUrl: './column-form.html',
  styleUrl: './column-form.scss',
})
export class ColumnForm {
  // Model
  columnDatas = model.required<iColumn>();

  // Output
  isInvalid = output<boolean>();

  // Form
  columnForm = form(this.columnDatas, (schema) => {
    required(schema.name, {message: "La colonne doit avoir un nom."});
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.columnForm().touched()) {
        this.isInvalid.emit(this.columnForm().invalid());
      }
    });
  }
}
