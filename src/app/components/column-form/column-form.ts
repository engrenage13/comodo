import { afterRenderEffect, Component, input, model, output } from '@angular/core';
import { IColumn } from '../../types/interfaces';
import { form, required, FormField, disabled } from '@angular/forms/signals';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { EDataType } from '../../types/enums';

@Component({
  selector: 'app-column-form',
  imports: [FormField, CdkDrag, CdkDragHandle],
  templateUrl: './column-form.html',
  styleUrl: './column-form.scss',
})
export class ColumnForm {
  // Input
  checkBoxMode = input<boolean>(false);

  // Models
  columnDatas = model.required<IColumn>();
  checked = model<boolean>(false);

  // Output
  isInvalid = output<boolean>();

  // Form
  columnForm = form(this.columnDatas, (schema) => {
    required(schema.name, {message: "La colonne doit avoir un nom."});
    disabled(
      schema.maxlength,
      {when: ({valueOf}) => valueOf(schema.type) != EDataType.String}
    );
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

  declareAsPrimaryKey(): void {
    this.columnDatas().isPrimaryKey = !this.columnDatas().isPrimaryKey;
    if (this.columnDatas().isPrimaryKey) {
      this.columnDatas().isUnique = true;
      this.columnDatas().isNotNull = true;
    }
  }
}
