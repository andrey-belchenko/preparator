export class SingleStepFlow {
  enabled?: boolean;
  trigger?: string;
  input: string;
  output: string;
  pipeline?: Object[];
  operationType?: OperationType;
  mergeKey?: string | string [];
  idSource?: string;
  src?: string;
  stop?: boolean;
  useDefaultFilter?: boolean;
  filterType?: FilterType;
  comment?: string;
  whenMatched?: WhenMatchedOperation;
  tags?: string[];
}

export class MultiStepFlow {
  enabled?: boolean;
  trigger?: string;
  idSource?: string;
  operation: Flow[];
  src?: string;
  stop?: boolean;
  comment?: string;
  isParallel?: boolean;
  tags?: string[];
}

export enum OperationType {
  insert = "insert",
  sync = "sync",
  replace = "replace",
  view = "view",
  syncWithDelete = "syncWithDelete", // физически удаляются записи для которых проставлен deletedAt
  replaceWithDelete = "replaceWithDelete",
}

export enum WhenMatchedOperation {
  merge = "merge",
  replace = "replace",
}

export enum FilterType {
  changedAt = "changedAt",
  batchId = "batchId",
}

export type Flow = SingleStepFlow | MultiStepFlow;

export function isMultiStep(flow: Flow) {
  if (flow["pipeline"]) {
    return false;
  } else {
    return true;
  }
}
