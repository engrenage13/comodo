import { Component, effect, input, linkedSignal, output } from '@angular/core';
import { delay, of } from 'rxjs';

@Component({
  selector: 'app-side-panel',
  imports: [],
  templateUrl: './side-panel.html',
  styleUrl: './side-panel.scss',
})
export class SidePanel {
  // Inputs
  /**
   * Titre de la fenêtre.
   */
  title = input<string>("Titre");
  /**
   * Taille de la fenêtre.
   * @default m
   */
  size = input<TSidePanelSize>('m');
  /**
   * Côté de l'écran sur lequel est attachée la fenêtre.
   * @default left
   */
  alignment = input<TSidePanelAlignment>('left');
  /**
   * Permet de fermer la fenêtre depuis un évènement externe à elle.
   */
  closeDemand = input<boolean>(false);

  // Outputs
  /**
   * Informe que la fenêtre est en train de se fermer.
   */
  closePanel = output();

  // Internal work
  isShown = linkedSignal<boolean>(() => !this.closeDemand());

  constructor() {
    effect((): void => {
      if (!this.isShown()) {
        of(1).pipe(delay(300)).subscribe(() => this.closePanel.emit());
      }
    });
  }

  /**
   * Ferme le panneau
   */
  close = (): void => {
    this.isShown.set(false);
  }
}

export type TSidePanelSize = 'xxl'|'xl'|'l'|'m'|'s'|'xs'|'xxs';
export type TSidePanelAlignment = 'left'|'right';
