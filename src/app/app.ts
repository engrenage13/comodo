import {Component, signal} from '@angular/core';
import {Home} from './home/home';
import {Sandbox} from './sandbox/sandbox';

@Component({
  selector: 'app-root',
  imports: [Home, Sandbox],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // Internal work
  showHomePage = signal<boolean>(true);
}
