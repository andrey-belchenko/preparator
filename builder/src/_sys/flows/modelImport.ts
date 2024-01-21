import { OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections"
export const flow = {
    src: __filename,
    input: sysCol.model_Import,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [],
  }