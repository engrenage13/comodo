import {Component, debounced, effect, input, linkedSignal, output} from '@angular/core';

@Component({
  selector: 'app-popup',
  imports: [],
  templateUrl: './popup.html',
  styleUrl: './popup.scss',
})
export class Popup {
  // Inputs
  windowTitle = input<string>('Window');
  /**
   * Permit to close popup with an external event
   */
  closeDemand = input<boolean>(false);
  minWidth = input<string>("");

  // Output
  windowClosed = output();

  // Internal work
  isShown = linkedSignal<boolean>(() => !this.closeDemand());
  isShownDebounced = debounced(this.isShown, 500);

  constructor() {
    effect((): void => {
      if (!this.isShownDebounced.value()) {
        this.windowClosed.emit();
      }
    });
  }
}
