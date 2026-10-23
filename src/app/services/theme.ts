import {effect, Service, signal} from '@angular/core';

@Service()
export class Theme {
  allColorVariations: IColorVariation[] = [
    {name: "legacy", title: "Legacy"},
    {name: "glace", title: "Glacier"},
    {name: "emerald", title: "Feuille"},
    {name: "peach", title: "Pêche"},
    {name: "pink", title: "Améthyste"},
  ];

  selectedTheme = signal<TTheme>('auto');
  selectedColor = signal<string>(this.allColorVariations[0].name);

  constructor() {
    // Theme
    const initMode = localStorage.getItem('theme');
    if (initMode) {
      this.selectedTheme.set(initMode as TTheme ?? 'light');
    } else {
      this.selectedTheme.set("auto");
    }
    // Color variation
    const storedValue = localStorage.getItem('themeColor');
    this.selectedColor.set(storedValue ?? this.allColorVariations[0].name);

    effect(() => {
      this.changeTheme(this.selectedTheme());
    });
    effect(() => {
      this.changeColor(this.selectedColor());
    });

    const darkModePreference = globalThis.matchMedia("(prefers-color-scheme: dark)");
    darkModePreference.addEventListener('change', dark => {
      if (this.selectedTheme() == 'auto') {
        const darkMode: boolean = dark.matches;
        document.body.classList.remove(darkMode ? 'light' : 'dark');
        document.body.classList.add(darkMode ? 'dark' : 'light');
      }
    });
  }

  changeColor(colorName: string): void {
    localStorage.setItem('themeColor', colorName);
    this.allColorVariations.forEach(variation => {
      document.body.classList.remove(variation.name);
    });
    document.body.classList.add(colorName);
  }

  changeTheme(newTheme: TTheme): void {
    let cssTheme: string;
    if (newTheme == 'auto') {
      localStorage.removeItem('theme');
      const deviceMode = globalThis.matchMedia("(prefers-color-scheme: dark)");
      cssTheme = deviceMode.matches ? 'dark' : 'light';
    } else {
      localStorage.setItem('theme', newTheme);
      cssTheme = newTheme;
    }

    document.body.classList.remove(cssTheme == 'dark' ? 'light' : 'dark');
    document.body.classList.add(cssTheme);
  }
}

export type TTheme = 'auto' | 'light' | 'dark';
export interface IColorVariation {
  name: string;
  title: string;
}
