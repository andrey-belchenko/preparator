import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";

// функция с параметром useDefaultFilter чтобы можно было вызывать правило и для всех объектов и только для измененных при обработке "отложенных сообщений"
export function createFlow(useDefaultFilter: boolean): SingleStepFlow {
  return {
    src: __filename,
    comment: "Добавление ключей для терминалов оборудования на подстанции",
    input: col.model_Entities,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    useDefaultFilter: useDefaultFilter,
    pipeline: new Pipeline()
      .match({
        type: {
          $in: [
            "Disconnector",
            "Breaker",
            "GroundDisconnector",
            "NonConformLoad",
            "Fuse",
            "BusbarSection",
          ],
        },
      })
      .matchExpr("$extId.КИСУР")
      .lookup({
        from: sysCol.model_Links,
        localField: "id",
        foreignField: "fromId",
        as: "l",
      })
      .unwind("$l")
      .match({ "l.predicate": "IdentifiedObject_RootContainer" })
      // .matchExpr({
      //   $in: [
      //     "$fromType",
      //     [
      //       "Disconnector",
      //       "Breaker",
      //       "GroundDisconnector",
      //       "NonConformLoad",
      //       "Fuse",
      //       "BusbarSection",
      //     ],
      //   ],
      // })
      .matchExpr({ $not: "$l.deletedAt" })
      // .entityId("fromId")
      // .lookupSelf("e")
      // .unwindEntity()
      // .matchExpr("$e.extId.КИСУР")
      .entityId("l.toId")
      .lookupParent("IdentifiedObject_RootContainer", "rc")
      .unwindEntity()
      .match({ "rc.type": "Substation" })
      .entityId("id")
      .inverseLookupChildrenOfType(
        "Terminal",
        "Terminal_ConductingEquipment",
        "t"
      )
      .unwindEntity()
      .addFields({
        // базовый id такой же как в задается в правилах обработки сообщений
        extId: {
          $concat: [
            "$extId.КИСУР",
            "-T",
            { $toString: "$t.model.ACDCTerminal_sequenceNumber" },
          ],
        },
      })
      .project({
        model: {
          "@type": "Terminal",
          "@action": "update",
          "@lastSource":"keep",
          "@id": {
            platform: "$t.id",
            КИСУР: "$extId",
            processor: "$extId",
          },
        },
      })
      .build(),
  };
}

// export const flow: SingleStepFlow = createFlow(false);

// utils.compileFlow(flow);
