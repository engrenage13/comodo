import {Component, output, signal} from '@angular/core';
import {Popup} from '../primitives/popup/popup';

@Component({
  selector: 'app-confirm-popup',
  imports: [
    Popup
  ],
  templateUrl: './confirm-popup.html',
  styleUrl: './confirm-popup.scss',
})
export class ConfirmPopup {
  // Output
  confirm = output<boolean>();

  // Internal work
  closed = signal<boolean>(false);

  close(confirm: boolean): void {
    this.closed.set(true);
    this.confirm.emit(confirm);
  }
}
