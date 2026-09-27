import {Component, computed, effect, inject, input, linkedSignal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {NgTemplateOutlet} from '@angular/common';
import {ERelationQuantity} from '../../types/enums';
import {IConnection} from '../../types/interfaces';
import {Connection} from '../../services/connection';

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
  private readonly connectionService: Connection = inject(Connection);

  // Input
  connectionData = input.required<IConnection>();

  quantityModel = linkedSignal<IQuantityModel>(() => {
    return {
      left: this.connectionData().leftQuantity,
      right: this.connectionData().rightQuantity,
    };
  });

  quantityForm = form(this.quantityModel);

  // Displayed values
  leftQuantity = computed<string>(() =>
    this.convertRelationQuantityToString(this.quantityModel().left)
  );
  rightQuantity = computed<string>(() =>
    this.convertRelationQuantityToString(this.quantityModel().right)
  );

  constructor() {
    effect((): void => {
      this.connectionService.changeQuantities(
        this.connectionData().id,
        this.quantityModel().left,
        this.quantityModel().right
      );
    });
  }

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

  remove(event: MouseEvent): void {
    this.connectionService.deleteConnection(this.connectionData().id);
    event.preventDefault();
    event.stopPropagation();
  }

  protected readonly ERelationQuantity = ERelationQuantity;
}

export interface IQuantityModel {
  left: ERelationQuantity;
  right: ERelationQuantity;
}
