import {Component, computed, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'div[connection-toolbar]',
  imports: [
    FormField,
    NgTemplateOutlet
  ],
  templateUrl: './connection-toolbar.html',
  styleUrl: './connection-toolbar.scss',
})
export class ConnectionToolbar {
  quantityModel = signal<IQuantityModel>({
    left: ERelationQuantity.ZeroToOne,
    right: ERelationQuantity.OneToMany,
  });

  quantityForm = form(this.quantityModel);

  // Displayed values
  leftQuantity = computed<string>(() =>
    this.convertRelationQuantityToString(this.quantityModel().left)
  );
  rightQuantity = computed<string>(() =>
    this.convertRelationQuantityToString(this.quantityModel().right)
  );

  private convertRelationQuantityToString(quantity: ERelationQuantity): string {
    switch(quantity) {
      case ERelationQuantity.ZeroToOne:
        return "0..1";
      case ERelationQuantity.OneToOne:
        return "1..1";
      case ERelationQuantity.ZeroToMany:
        return "0..n";
      default:
        return "1..n";
    }
  }

  protected readonly ERelationQuantity = ERelationQuantity;
}

export interface IQuantityModel {
  left: ERelationQuantity;
  right: ERelationQuantity;
}

export enum ERelationQuantity {
  ZeroToOne = "zeroToOne",
  OneToOne = "oneToOne",
  ZeroToMany = "zeroToMany",
  OneToMany = "oneToMany",
}
