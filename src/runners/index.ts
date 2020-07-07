
export interface IContext {
  open?: boolean,

  operations: Operation[]

  [key: string]: any
}

export type Operation =
  'create'
  | 'modify'
  | 'delete'
