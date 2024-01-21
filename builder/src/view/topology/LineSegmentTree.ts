import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as thisCol from "./_collections";
import * as prepCol from "other/topology/_collections";
import * as utils from "_sys/utils";

export const flow: MultiStepFlow = {
  trigger: prepCol.LineSegmentTree,
  src: __filename,
  operation: [
    {
      comment: "Представление по сегментам из СК-11 в виде дерева",
      input: prepCol.LineSegmentTree,
      output: thisCol.LineSegmentTree,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        {
          $project: {
            наименованиеЛинии: "$line.name",
            наименованиеСегмента: "$lineEquipment.name",
            наименованиеКонечногоЭлемента: "$endElement.name",
            типКонечногоЭлемента: "$endElement.type",
            кодКонечногоЭлемента: "$endElement.code",
            идЛинии: "$line.id",
            идСегмента: "$lineEquipment.id",
            идКонечногоЭлемента: "$endElement.id",
            id: "$lineEquipment.id",
            parentId: "$parent.lineEquipment.id",
          },
        },
      ],
    },
  ],
};

// utils.compileFlow(flow)
