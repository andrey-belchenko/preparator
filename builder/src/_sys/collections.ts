import { CollectionIndexSet } from "./classes/CollectionIndexSet";

export const self = "$$$self"; // заменяется в lookup на имя коллекции на которой выполняется агрегация
export const model_Input = "sys_model_Input";
export const model_Import = "sys_model_Import";
export const model_Entities = "model_Entities";
export const model_Fields = "model_Fields";
export const model_Links = "model_Links";
export const sys_Warning = "sys_Warning";
export const sys_Dummy = "sys_Dummy";
export const sys_MessageLog = "sys_MessageLog";



export const sys_IncomingMessages = "sys_IncomingMessages";
// export const sys_MessageIssues = "sys_MessageIssues";
export const sys_model_BlockedDto = "sys_model_BlockedDto";
export const sys_model_BlockedDtoEntities = "sys_model_BlockedDtoEntities";
export const sys_model_BlockedEntities = "sys_model_BlockedEntities";
export const sys_model_BlockedMessages = "sys_model_BlockedMessages";
export const sys_model_ForbiddenEntities = "sys_model_ForbiddenEntities";
export const sys_model_ExtraIdMatching = "sys_model_ExtraIdMatching";


export const sys_applyKeysOperation = "sys_applyKeysOperation";
export const sys_model_UnblockedDto = "sys_model_UnblockedDto";
export const sys_model_UnblockedDtoEntities = "sys_model_UnblockedDtoEntities";
export const sys_model_UnblockedEntities = "sys_model_UnblockedEntities";
export const sys_MessageInput = "sys_MessageInput";


export const indexes: CollectionIndexSet[] = [
    {
      collection: sys_model_ExtraIdMatching,
      indexes: [["applyOperationId"]],
    },
    {
      collection: sys_model_BlockedDto,
      indexes: [["applyOperationId"]],
    }
  ];