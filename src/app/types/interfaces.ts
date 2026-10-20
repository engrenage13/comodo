import {EDataType, ERelationQuantity} from './enums';

export interface IColumn {
  name: string;
  type: EDataType;
  maxlength: string;
  commentary?: string;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isNotNull?: boolean;
  order: number;
}

export interface IConnection {
  id: string;
  source: string;
  target: string;
  leftQuantity: ERelationQuantity;
  rightQuantity: ERelationQuantity;
}

export interface ICoord {
  x: number;
  y: number;
}

export interface IModel {
  title: string;
  tables: ITable[];
  connections: IConnection[];
}

export interface ITable {
  id: number;
  title: string;
  columns: IColumn[];
  coords: ICoord;
}
