import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as prepCol from "other/topology/_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";

export const flow: SingleStepFlow = {
  comment: "Формирование витрины по статусам КА полученным из СК-11",
  src: __filename,
  input: col.dm_DiscreteValue,
  output: thisCol.skSwitchesStat,
  operationType: OperationType.sync,
  mergeKey: "id",
  pipeline: new Pipeline()

    .entityId("id")
    .lookupParent("MeasurementValue_measurementValueQuality", "measurementValueQuality")
    .unwindEntity(true)

    .lookupParent("Quality61850_validity", "Validity")
    .unwindEntity(true)

    .addFields({ substr_uid: { $substr: ["$extId.processor", 13, 36] } })

    .lookup({
      localField: "substr_uid",
      from: "model_Entities",
      foreignField: "id",
      as: "Entities"
    })
    .unwind({
      path: "$Entities",
      preserveNullAndEmptyArrays: true
    })

    .entityId("substr_uid")
    .lookupParent("IdentifiedObject_RootContainer", "rc")
    .unwindEntity(true)
    .lookupParent(["Line_Region", "Substation_Region"], "r")
    .unwindEntity(true)


    .project({
      changedAt: "$changedAt",
      id: "$substr_uid",
      РЭС: "$r.model.IdentifiedObject_name",
      Название: "$model.IdentifiedObject_name",
      // ЗначениеИзмеренияСостояния: "$model.DiscreteValue_value",
      ЗначениеИзмеренияСостояния:
      {
        $switch: {
          branches: [
            { case: { $eq: ["$model.DiscreteValue_value", 0] }, then:"Промежуточное состояние"  },
            { case: { $eq: ["$model.DiscreteValue_value", 1] }, then:"Отключено"  },
            { case: { $eq: ["$model.DiscreteValue_value", 2] }, then:"Включено"  },
            { case: { $eq: ["$model.DiscreteValue_value", 3] }, then:"Ошибочное состояние" },            
          ], default: "$model.DiscreteValue_value"
        }
      },
      // ОбобщённыйКодКачестваТелеизмерения: "$Validity.model.Validity_label",
      ОбобщённыйКодКачестваТелеизмерения:
      {
        $switch: {
          branches: [
            { case: { $eq: ["$Validity.model.Validity_label", "GOOD"] }, then:"Достоверное"  },
            { case: { $eq: ["$Validity.model.Validity_label", "INVALID"] }, then:"Недостоверное"  },
            { case: { $eq: ["$Validity.model.Validity_label", "QUESTIONABLE"] }, then:"Сомнительное"  },
            { case: { $eq: ["$Validity.model.Validity_label", "INSPECT"] }, then:"Проверка" },            
          ], default: "$Validity.model.Validity_label"
        }
      },
      МеткаВремени: "$model.MeasurementValue_timeStamp",
      НаименованиеТехническогоОбъекта: "$Entities.model.IdentifiedObject_name",
      КодТехническогоОбъекта: "$Entities.model.PowerSystemResource_ccsCode",
    })
    .build(),
};

// utils.compileFlow(flow)
