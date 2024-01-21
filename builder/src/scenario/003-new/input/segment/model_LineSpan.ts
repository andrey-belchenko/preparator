import { Flow, MultiStepFlow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import { Pipeline } from "_sys/classes/Pipeline";
export const flow: MultiStepFlow = {
  src: __filename,
  operation: [
    {
      isParallel: true,
      operation: [
        {
          src: __filename,
          input: thisCol.flow_Сегмент,
          output: thisCol.flow_Сегмент_Фазы,
          operationType: OperationType.replace,
          pipeline: [
            {
              $project: {
                item: "$payload.Тело.ЭлементСтруктурыСети.НазваниеКомпонента",
              },
            },
            { $unwind: "$item" },
            {
              $group: {
                _id: "$item.КодТехническогоОбъекта",
                item: { $first: "$item" },
              },
            },
          ],
        },
        {
          src: __filename,
          input: thisCol.flow_Сегмент,
          output: thisCol.flow_Сегмент_Пролеты,
          operationType: OperationType.replace,
          pipeline: [
            {
              $project: {
                сегмент:
                  "$payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
                пролет: "$payload.Тело.ЭлементСтруктурыСети.Пролеты",
              },
            },
            { $unwind: "$пролет" },
            { $addFields: { _id: "$пролет.КодТехническогоОбъекта" } },
          ],
        },
      ],
    },
    {
      isParallel: true,
      operation: [
        {
          src: __filename,
          input: thisCol.flow_Сегмент_Пролеты,
          output: sysCol.model_Input,
          operationType: OperationType.insert,
          idSource: "КИСУР",
          pipeline: [
            {
              $lookup: {
                from: thisCol.flow_Сегмент_Фазы,
                localField: "пролет.КодТехническогоОбъекта",
                foreignField: "_id",
                as: "фазы",
              },
            },
            {
              $unwind: {
                path: "$фазы",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                model: {
                  LineSpan_AccountPartLine: {
                    "@type": "AccountPartLine",
                    "@id": "$сегмент",
                  },
                  IdentifiedObject_ParentObject: {
                    "@type": "AccountPartLine",
                    "@id": "$сегмент",
                  },
                  "@type": "LineSpan",
                  "@action": "create",
                  "@id": "$пролет.КодТехническогоОбъекта",
                  IdentifiedObject_name: "$пролет.НаименованиеТехнОбъекта",
                  LineSpan_aWireTypeName: "$фазы.item.ФазаA",
                  LineSpan_bWireTypeName: "$фазы.item.ФазаB",
                  LineSpan_cWireTypeName: "$фазы.item.ФазаC",
                  LineSpan_length:"$пролет.ДлиннаПролета"
                },
              },
            },
          ],
        },
        {
          src: __filename,
          input: thisCol.flow_Сегмент,
          output: sysCol.model_Input,
          operationType: OperationType.insert,
          pipeline: new Pipeline()
            .entityExtId(
              "payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
              "КИСУР",
              "AccountPartLine"
            )
            .lookupSelf("apl")
            .unwindEntity()
            .inverseLookupChildrenOfType(
              "LineSpan",
              "LineSpan_AccountPartLine",
              "ls"
            )
            .unwindEntity()
            .lookup({
              from: thisCol.flow_Сегмент_Пролеты,
              localField: "ls.extId.КИСУР",
              foreignField: "_id",
              as: "nls",
            })
            .matchExpr({ $eq: [{ $size: "$nls" }, 0] })
            .project({
              model: {
                "@type": "LineSpan",
                "@action": "delete",
                "@idSource": "platform",
                "@id": "$ls.id",
              },
            })
            .build(),
        },
      ],
    },
  ],
};
