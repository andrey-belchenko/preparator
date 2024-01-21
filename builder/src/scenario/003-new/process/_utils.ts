import { Pipeline } from "_sys/classes/Pipeline";

export function fakeCode(protoId: string, type: number): any {
  return { $concat: ["$" + protoId, "Fake" + type] };
}

// .addFields({
//   startTowerId: { $ifNull: ["$ls.model.LineSpan_StartTower", "-"] },
//   endTowerId: { $ifNull: ["$ls.model.LineSpan_EndTower", "-"] },
// })

// {
//   $lookup: {
//     from: col.flow_LineSpan_list,
//     localField: "startTowerId",
//     foreignField: "model.LineSpan_EndTower",
//     as: "prev",
//   },
// },
export const fakeSegment2Pipeline = new Pipeline()
  .comment("На входе д. быть структура с полями lineSpanId,switchId")
  .entityId("lineSpanId", "LineSpan")
  .lookupSelf("ls")
  .unwindEntity()
  .lookupParentOfType("Tower", "LineSpan_StartTower")
  .unwindEntity()
  .inverseLookupChildrenOfType("LineSpan", "LineSpan_StartTower", "als")
  .matchExpr({ $gt: [{ $size: "$als" }, 1] })
  .entityId("lineSpanId", "LineSpan")
  .lookupParent("LineSpan_EndTower", "ntw")
  .unwindEntity()
  .entityId("switchId")
  .lookupSelf("sw")
  .unwindEntity()
  .project({
    model: {
      "@type": "LineSpan",
      "@action": "create",
      "@id": fakeCode("ls.extId.КИСУР", 2),
      "@idSource": "КИСУР",
      IdentifiedObject_name: "Фиктивный пролет",
      LineSpan_fakeType: { $literal: 2 },
      LineSpan_aWireTypeName: "$ls.model.LineSpan_aWireTypeName",
      LineSpan_bWireTypeName: "$ls.model.LineSpan_bWireTypeName",
      LineSpan_cWireTypeName: "$ls.model.LineSpan_cWireTypeName",
      LineSpan_length: { $literal: 5 },
      LineSpan_AccountPartLine: {
        "@idSource": "platform",
        "@type": "AccountPartLine",
        "@id": "$ls.model.LineSpan_AccountPartLine",
      },
      IdentifiedObject_ParentObject:{
        "@idSource": "platform",
        "@type": "AccountPartLine",
        "@id": "$ls.model.LineSpan_AccountPartLine",
      },
      LineSpan_StartTower: {
        "@idSource": "platform",
        "@type": "Tower",
        "@id": "$ls.model.LineSpan_StartTower",
      },
      LineSpan_EndTower: {
        "@idSource": "КИСУР",
        "@type": "Tower",
        "@id": fakeCode("ntw.extId.КИСУР", 2),
        "@action": "create",
        IdentifiedObject_name: "Фиктивная опора",
        Tower_AccountPartLine: {
          "@idSource": "platform",
          "@type": "AccountPartLine",
          "@id": "$ls.model.LineSpan_AccountPartLine",
        },
        IdentifiedObject_ParentObject:{
          "@idSource": "platform",
          "@type": "AccountPartLine",
          "@id": "$ls.model.LineSpan_AccountPartLine",
        },
        Tower_StartTower: {
          "@idSource": "platform",
          "@type": "LineSpan",
          "@id": "$ls.id",
        },
       
      },
    },
  });

// export const fakeSegment2Pipeline1 = new Pipeline()
//   .comment("На входе д. быть структура с полями lineSpanId,switchId")
//   .entityId("towerId")
//   .lookupSelf("tw")
//   .unwindEntity()
//   .inverseLookupChildrenOfType("LineSpan", "LineSpan_StartTower", "ls")
//   .matchExpr({ $gt: [{ $size: "$ls" }, 1] })
//   .entityId("switchId")
//   .lookupSelf("sw")
//   .unwindEntity()
//   .lookupParent("Switch_LineSpan", "ls")
//   .unwindEntity()
//   .lookupParent("LineSpan_AccountPartLine", "apl")
//   .unwindEntity()
//   .entityId("ls.id")
//   .lookupParent("LineSpan_EndTower", "ntw")
//   .unwindEntity()
//   .project({
//     model: {
//       "@type": "LineSpan",
//       "@action": "create",
//       "@id": fakeCode("ls.extId.КИСУР", 2),
//       "@idSource": "КИСУР",
//       IdentifiedObject_name: "Фиктивный пролет",
//       LineSpan_fakeType: { $literal: 2 },
//       LineSpan_aWireTypeName: "$ls.model.LineSpan_aWireTypeName",
//       LineSpan_bWireTypeName: "$ls.model.LineSpan_bWireTypeName",
//       LineSpan_cWireTypeName: "$ls.model.LineSpan_cWireTypeName",
//       LineSpan_AccountPartLine: {
//         "@idSource": "platform",
//         "@type": "AccountPartLine",
//         "@id": "$apl.id",
//       },
//       LineSpan_StartTower: {
//         "@idSource": "platform",
//         "@type": "Tower",
//         "@id": "$towerId",
//       },
//       LineSpan_EndTower: {
//         "@idSource": "КИСУР",
//         "@type": "Tower",
//         "@id": fakeCode("ntw.extId.КИСУР", 2),
//         "@action": "create",
//         IdentifiedObject_name: "Фиктивная опора",
//         Tower_AccountPartLine: {
//           "@idSource": "platform",
//           "@type": "AccountPartLine",
//           "@id": "$apl.id",
//         },
//         Tower_StartTower: {
//           "@idSource": "platform",
//           "@type": "LineSpan",
//           "@id": "$ls.id",
//         },
//         Tower_Switches: {
//           "@idSource": "platform",
//           "@id": "$sw.id",
//         },
//       },
//     },
//   });
