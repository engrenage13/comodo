import {computed, inject, Service} from '@angular/core';
import {FCreateConnectionEvent, FReassignConnectionEvent} from '@foblex/flow';
import {ERelationQuantity} from '../types/enums';
import {ModelService} from './model-service';

@Service()
export class Connection {
  private readonly modelService: ModelService = inject(ModelService);

  connections = this.modelService.connections;
  private readonly nextId = computed<number>(() => {
    const length: number = this.connections().length;
    if (length > 0) {
      return Number(this.connections()[length - 1].id) + 1;
    } else {
      return 1;
    }
  });

  private cannotCreateConnection(source: string, target: string): boolean {
    const targetName: string[] = target.split("@");
    const sourceName: string[] = source.split("@");
    return (sourceName[0] == targetName[0])
      || this.connections().some(link => {
        const linkSourceName: string[] = link.source.split("@");
        const linkTargetName: string[] = link.target.split("@");
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
      this.modelService.saveModel();
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
          id: this.nextId().toString(),
          source,
          target,
          leftQuantity: ERelationQuantity.OneToMany,
          rightQuantity: ERelationQuantity.OneToOne
        }
      ]
    );
    this.modelService.saveModel();
  }

  deleteConnection(connectionId: string): void {
    this.connections.update(value =>
      value.filter(connection => connection.id !== connectionId)
    );
    this.modelService.saveModel();
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
    this.connections.update(links => {
      const connection = links.find(
        (c) => c.source === event.previousSourceId && c.target === event.previousTargetId,
      );
      if (!connection) {
        throw new Error('Connection not found');
      }
      connection.source = event.nextSourceId ?? connection.source;
      connection.target = event.nextTargetId ?? connection.target;

      return [...links];
    });
    this.modelService.saveModel();
  }
}
