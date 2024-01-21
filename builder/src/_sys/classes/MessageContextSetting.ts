export class ContextSetting {
  messageType: string;
  idSource: string;
  contextQueries: ContextQuery[];
}

export class ContextQuery {
  rootIds: string[];
 
  queryId: string;
}
