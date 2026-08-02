import { Component } from '@angular/core';
import { Sandbox } from "./sandbox/sandbox";

@Component({
  selector: 'app-root',
  imports: [Sandbox],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
