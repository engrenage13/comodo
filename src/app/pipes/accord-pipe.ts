import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'accord',
})
/**
 * Accorde le mot au pluriel ou singulier selon une valeur donnée.
 */
export class AccordPipe implements PipeTransform {

  /**
   * Accorde le mot au pluriel ou singulier selon une valeur donnée.
   * @param mot Le mot à accorder.
   * @param counter Le nombre caractérisé par le mot à accorder.
   * @param pluralForm Le pluriel du mot à accorder s'il est différent du singulier. Par défaut vaut [mot au singulier]+s.
   */
  transform(mot: string, counter: number, pluralForm: string = mot+'s'): string {
    return counter > 1 ? pluralForm : mot;
  }

}
