import { Component, signal } from '@angular/core';
import { FFlowModule } from '@foblex/flow';
import { SidePanel } from '../components/side-panel/side-panel';
import { Toolbar } from '../components/toolbar/toolbar';

@Component({
  selector: 'app-sandbox',
  imports: [FFlowModule, SidePanel, Toolbar],
  templateUrl: './sandbox.html',
  styleUrl: './sandbox.scss',
})
export class Sandbox {
  isSidePanelOpen = signal<boolean>(false);
}
