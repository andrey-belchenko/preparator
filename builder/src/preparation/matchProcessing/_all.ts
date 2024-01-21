import { Flow, OperationType } from "_sys/classes/Flow";
import * as SubstationEquipmentTerminals from "./SubstationEquipmentTerminals";
import * as PowerTransformer from "./PowerTransformer";
import * as trig from "triggers";

export const flows: Flow[] = [
  {
    trigger: trig.trigger_ProcessMatch,
    operation: createFlows(false),
  },
];

// функция с параметром useDefaultFilter чтобы можно было вызывать правило и для всех объектов и только для измененных при обработке "отложенных сообщений"
export function createFlows(useDefaultFilter: boolean): Flow[] {
  return [
    SubstationEquipmentTerminals.createFlow(useDefaultFilter),
    PowerTransformer.createFlow(useDefaultFilter),
  ];
}
