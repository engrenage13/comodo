import {Component, inject, signal} from '@angular/core';
import {Home} from './home/home';
import {Sandbox} from './sandbox/sandbox';
import {Theme} from './services/theme';

@Component({
  selector: 'app-root',
  imports: [Home, Sandbox],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly themeService: Theme = inject(Theme);

  // Internal work
  showHomePage = signal<boolean>(true);
}
