import {Service, signal} from '@angular/core';
import {IConnection} from '../types/interfaces';
import {FCreateConnectionEvent, FReassignConnectionEvent} from '@foblex/flow';
import {ERelationQuantity} from '../types/enums';

@Service()
export class Connection {
  connections = signal<IConnection[]>([]);
  private nextId: number = 1;

  private cannotCreateConnection(source: string, target: string): boolean {
    const targetName: string[] = target.split("_");
    const sourceName: string[] = source.split("_");
    return (sourceName[0] == targetName[0])
      || this.connections().some(link => {
        const linkSourceName: string[] = link.source.split("_");
        const linkTargetName: string[] = link.target.split("_");
        return (linkSourceName[0] == sourceName[0] && linkTargetName[0] == targetName[0])
          || (linkSourceName[0] == targetName[0] && linkTargetName[0] == sourceName[0]);
      });
  }

  changeQuantities(connectionId: string, left: ERelationQuantity, right: ERelationQuantity): void {
    const index: number = this.connections().findIndex(connection => connection.id === connectionId);
    if (index > -1) {
      this.connections.update(value => {
        value[index].leftQuantity = left;
        value[index].rightQuantity = right;
        return value;
      });
    }
  }

  createConnection(event: FCreateConnectionEvent): void {
    const target: string|undefined = event.targetId;
    const source: string = event.sourceId;
    if (!target || this.cannotCreateConnection(source, target)) {
      return;
    }
    this.connections.update((x) =>
      [...x,
        {
          id: this.nextId.toString(),
          source: event.sourceId,
          target,
          leftQuantity: ERelationQuantity.OneToMany,
          rightQuantity: ERelationQuantity.OneToOne
        }
      ]
    );
    this.nextId++;
  }

  deleteConnection(connectionId: string): void {
    this.connections.update(value =>
      value.filter(connection => connection.id !== connectionId)
    );
  }

  reassignConnection(event: FReassignConnectionEvent): void {
    if (
      (!event.nextTargetId && !event.nextSourceId)
      || this.cannotCreateConnection(
        event.nextSourceId ?? event.previousSourceId,
        event.nextTargetId ?? event.previousTargetId
      )
    ) {
      return;
    }
    this.connections.update((link) => {
      const connection = link.find(
        (c) => c.source === event.previousSourceId && c.target === event.previousTargetId,
      );
      if (!connection) {
        throw new Error('Connection not found');
      }
      connection.source = event.nextSourceId || connection.source;
      connection.target = event.nextTargetId || connection.target;

      return [...link];
    });
  }
}
