import { Flow, MultiStepFlow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import { Pipeline } from "_sys/classes/Pipeline";

export const flow: MultiStepFlow = {
  src: __filename,
  operation: [
    {
      src: __filename,
      input: thisCol.flow_Сегмент,
      output: thisCol.flow_Сегмент_Опоры,
      operationType: OperationType.replace,
      pipeline: [
        { $unwind: "$payload.Тело.ЭлементСтруктурыСети.Опоры" },
        {
          $addFields: {
            "payload.Тело.ЭлементСтруктурыСети.Опоры.КодСегмента":
              "$payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
          },
        },
        {
          $replaceRoot: {
            newRoot: "$payload.Тело.ЭлементСтруктурыСети.Опоры",
          },
        },
        { $addFields: { _id: "$КодТехническогоОбъекта" } },
      ],
    },
    {
      isParallel: true,
      operation: [
        {
          src: __filename,
          input: thisCol.flow_Сегмент_Опоры,
          output: sysCol.model_Input,
          operationType: OperationType.insert,
          idSource: "КИСУР",
          pipeline: [
            {
              $project: {
                model: {
                  "@type": "Tower",
                  "@id": "$КодТехническогоОбъекта",
                  "@action": "create",
                  IdentifiedObject_name: "$НаименованиеТехнОбъекта",
                  Tower_AccountPartLine: {
                    "@type": "AccountPartLine",
                    "@id": "$КодСегмента",
                  },
                  IdentifiedObject_ParentObject: {
                    "@type": "AccountPartLine",
                    "@id": "$КодСегмента",
                  },
                  Structure_PlaceStructure: {
                    "@type": "TechPlace",
                    "@action": "create",
                    "@id": {
                      $concat: ["TechPlace", "$КодТехническогоОбъекта"],
                    },
                    TechPlace_CodeTP: "$КодТехническогоОбъекта",
                  },
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
              "Tower",
              "Tower_AccountPartLine",
              "t"
            )
            .unwindEntity()
            .lookup({
              from: thisCol.flow_Сегмент_Опоры,
              localField: "t.extId.КИСУР",
              foreignField: "_id",
              as: "nt",
            })
            .matchExpr({ $eq: [{ $size: "$nt" }, 0] })
            .project({
              model: {
                "@type": "Tower",
                "@action": "delete",
                "@idSource": "platform",
                "@id": "$t.id",
              },
            })
            .build(),
        },
      ],
    },
  ],
};

// export const flow: Flow = {
//   src: __filename,
//   input: thisCol.flow_Сегмент,
//   output: sysCol.model_Input,
//   operationType: OperationType.insert,
//   idSource: "КИСУР",
//   pipeline: [
//     { $unwind: "$payload.Тело.ЭлементСтруктурыСети.Опоры" },
//     {
//       $addFields: {
//         "payload.Тело.ЭлементСтруктурыСети.Опоры.КодСегмента":
//           "$payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
//       },
//     },
//     {
//       $replaceRoot: { newRoot: "$payload.Тело.ЭлементСтруктурыСети.Опоры" },
//     },
//     {
//       $project: {
//         model: {
//           "@type": "Tower",
//           "@id": "$КодТехническогоОбъекта",
//           "@action": "create",
//           IdentifiedObject_name: "$НаименованиеТехнОбъекта",
//           Tower_AccountPartLine: {
//             "@type": "AccountPartLine",
//             "@id": "$КодСегмента",
//           },
//           Structure_PlaceStructure: {
//             "@type": "TechPlace",
//             "@action": "create",
//             "@id": { $concat: ["TechPlace", "$КодТехническогоОбъекта"] },
//             TechPlace_CodeTP: "$КодТехническогоОбъекта",
//           },
//         },
//       },
//     },
//   ],
// };
