import {
  Flow,
  MultiStepFlow,
  OperationType,
  WhenMatchedOperation,
} from "_sys/classes/Flow";
import * as col from "collections";
import * as sysCol from "_sys/collections";
import { Pipeline } from "_sys/classes/Pipeline";
import * as utils from "_sys/utils";
// import * as s002Funcs from "scenario/002/_common";
import { resFilterSteps, validRegions } from "scenario/common/_utils";

export const flow: MultiStepFlow = {
  src: __filename,
  trigger: col.in_usagePoint,
  operation: [
    {
      input: col.in_usagePoint,
      output: col.flow_usagePoint_buffer_in,
      operationType: OperationType.replace,
      comment: "Общая предварительная обработка",
      pipeline: new Pipeline()
        .addFields({
          "payload.body.messageId": "$messageId",
        })
        .replaceRoot("$payload.body")
        .addFields({
          _codeArray: {
            $split: ["$customAttributes.techObjCode", "-"],
          },
        })
        .addFields({
          objType: "$customAttributes.techObjType",
          objCode: { $ifNull: ["$customAttributes.techObjCode", "-"] },
          rootCode: {
            $concat: [
              { $arrayElemAt: ["$_codeArray", 0] },
              "-",
              { $arrayElemAt: ["$_codeArray", 1] },
            ],
          },
          objCodePrefix: { $substr: ["$customAttributes.techObjCode", 0, 2] },
        })
        .unset("_codeArray")
        .addFields({
          bindType: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $eq: ["$objType", "Bay"] },
                      { $eq: ["$objCodePrefix", "PS"] },
                    ],
                  },
                  then: "Bay-PS",
                },
                {
                  case: {
                    $and: [
                      { $in: ["$objType", ["Bay", "Substation"]] },
                      { $eq: ["$objCodePrefix", "TP"] },
                    ],
                  },
                  then: "TP",
                },
                {
                  case: {
                    $eq: ["$objType", "NonConformLoad"],
                  },
                  then: "NonConformLoad",
                },
              ],
              default: "skip",
            },
          },
        })
        .entityExtId("objCode", "КИСУР")
        .lookupSelf("techObj")
        .unwindEntity(true)
        .addFields({
          techObjId: { $ifNull: ["$techObj.id", "-"] },
        })
        .unset(["_id", "techObj"])
        .build(),
    },
    {
      input: col.flow_usagePoint_buffer_in,
      output: col.flow_usagePoint_buffer,
      comment: "Логика привязки по ссылке на Bay в PS",
      operationType: OperationType.replace,
      pipeline: new Pipeline()
        .match({ bindType: "Bay-PS" })
        .entityId("techObjId")
        .inverseLookupChildrenOfType(
          "Breaker",
          "IdentifiedObject_ParentObject",
          "b"
        )
        .entityId("techObjId")
        .inverseLookupChildrenOfType(
          "Disconnector",
          "IdentifiedObject_ParentObject",
          "d"
        )
        .addFields({
          parentId: { $ifNull: [{ $first: "$b.id" }, { $first: "$d.id" }] },
        })
        .unset(["b", "d"])
        .build(),
    },
    {
      input: col.flow_usagePoint_buffer_in,
      output: col.flow_usagePoint_buffer,
      comment: "Логика привязки по ссылке на Bay в TP и Substation TP",
      operationType: OperationType.insert,
      pipeline: new Pipeline()
        .match({ bindType: "TP" })
        .entityExtId("rootCode", "КИСУР")
        .lookupSelf()
        .unwindEntity()
        .inverseLookupChildrenOfType(
          "PowerTransformer",
          "IdentifiedObject_ParentObject",
          "tr"
        )
        .addFields({
          tr: { $first: "$tr" },
        })
        .entityId("tr.id")
        .inverseLookupChildrenOfType(
          "PowerTransformerEnd",
          "IdentifiedObject_ParentObject",
          "end"
        )
        .addFields({
          end: {
            $first: {
              $filter: {
                input: "$end",
                as: "it",
                cond: {
                  $eq: ["$$it.model.IdentifiedObject_name", "НН"],
                },
              },
            },
          },
        })
        .addFields({
          parentId: "$end.id",
        })
        .unset(["end", "tr"])
        .build(),
    },
    {
      input: col.flow_usagePoint_buffer_in,
      output: col.flow_usagePoint_buffer,
      comment: "Логика привязки по ссылке на NonConformLoad",
      operationType: OperationType.insert,
      pipeline: new Pipeline()
        .match({ bindType: "NonConformLoad" })
        .addFields({
          parentId:  "$rootCode", //"$techObjId",
        })
        .build(),
    },
    {
      input: col.flow_usagePoint_buffer_in,
      output: col.flow_usagePoint_buffer,
      comment: "Прочее пропускаем",
      operationType: OperationType.insert,
      pipeline: new Pipeline()
        .match({ bindType: "skip" })
        .build(),
    },
    {
      input: col.flow_usagePoint_buffer,
      output: col.flow_usagePoint_buffer_out,
      comment: "Общая обработка",
      operationType: OperationType.replace,
      pipeline: new Pipeline()
        .addFields({
          serviceLocation_custom_name: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$customAttributes.customer.kind", "Физическое лицо"],
                  },
                  then: "Физ.учет",
                },
                {
                  case: {
                    $eq: [
                      "$customAttributes.customer.kind",
                      "Юридическое лицо",
                    ],
                  },
                  then: "Ком.учет",
                },
              ],
              default: "Неопр.учет",
            },
          },
          mRID: { $toLower: "$mRID" },
          serviceLocation_mRID: { $toLower: "$serviceLocation.mRID" },
        })
        .entityId("parentId")
        .lookupSelf("e")
        .unwindEntity(true)
        .inverseLookupChildrenOfType(
          "Terminal",
          "IdentifiedObject_ParentObject",
          "t"
        )
        .addFields({
          t: {
            $ifNull: [
              {
                $first: {
                  $filter: {
                    input: "$t",
                    as: "it",
                    cond: {
                      $eq: ["$$it.model.ACDCTerminal_sequenceNumber", 1],
                    },
                  },
                },
              },
              { $first: "$t" },
            ],
          },
        })

        .unwind({ path: "$t", preserveNullAndEmptyArrays: true })
        .lookupParent("IdentifiedObject_RootContainer", "rc")
        .unwindEntity(true)
        .project({
          messageId: "$messageId",
          issue: {
            $switch: {
              branches: [
                {
                  case: { $not: "$rc.id" },
                  then: "Не найдено связанное оборудование",
                },
                {
                  case: { $not: "$t.id" },
                  then: "Не найден связанный терминал",
                },
              ],
              default: "$$REMOVE",
            },
          },
          model: [
            {
              "@type": "UsagePoint",
              "@action": "create",
              "@id": "$mRID",
              "@idSource": "platform",
              IdentifiedObject_name: "$name",
              IdentifiedObject_mRID: "$mRID",
              IdentifiedObject_ParentObject: {
                "@action": "link",
                "@id": "$parentId",
                "@idSource": "platform",
              },
              UsagePoint_Terminal: {
                "@action": "link",
                "@id": "$t.id",
                "@idSource": "platform",
              },
              UsagePoint_ServiceLocation: {
                "@type": "ServiceLocation",
                "@idSource": "processor",
                "@action": "create",
                "@id": { $concat: ["ServiceLocation", "$rc.id"] },
                ServiceLocation_UsagePoints: {
                  "@idSource": "platform",
                  "@action": "link",
                  "@id": "$mRID",
                },
              },
              // UsagePoint_Customer: {
              //   "@idSource": "processor",
              //   "@action": "create",
              //   "@id": { $concat: ["Customer", "$rc.id"] },
              //   "@type": "Customer",
              // },
              UsagePoint_sDPointRole: {
                "@idSource": "processor",
                "@id": { $concat: ["SDPointRole", "$rc.id"] },
                "@type": "SDPointRole",
                "@action": "create",
                SDPointRole_sDAccountLink: {
                  "@idSource": "processor",
                  "@id": { $concat: ["SDAccountLink", "$rc.id"] },
                  "@type": "SDAccountLink",
                  "@action": "create",
                  SDAccountLink_calcDirection:
                    "$SDPointRole.sDAccountLinks.isCalculated",
                  SDAccountLink_isCalculated: {
                    $in: [
                      "$SDPointRole.sDAccountLinks.calcDirection",
                      ["да", "true"],
                    ],
                  },
                },
              },
            },
            {
              "@idSource": "processor",
              "@id": { $concat: ["Folder", "Obj", "$rc.id"] },
              "@type": "Folder",
              "@action": "create",
              IdentifiedObject_name: "Объекты электроснабжения",
              IdentifiedObject_ParentObject: {
                "@action": "link",
                "@id": "$rc.id",
                "@idSource": "platform",
              },
              IdentifiedObject_childObjects: {
                "@idSource": "processor",
                "@id": { $concat: ["ServiceLocation", "$rc.id"] },
                "@type": "ServiceLocation",
                "@action": "create",
                IdentifiedObject_name: "$serviceLocation_custom_name",
                IdentifiedObject_description:
                  "$sDPointRole.serviceLocation.name",
                Location_PositionPoints: {
                  "@idSource": "processor",
                  "@id": { $concat: ["PositionPoint", "$rc.id"] },
                  "@type": "PositionPoint",
                  "@action": "create",
                  PositionPoint_groupNumber:
                    "$sDPointRole.serviceLocation.positionPoints.groupNumber",
                  PositionPoint_sequenceNumber:
                    "$sDPointRole.serviceLocation.positionPoints.sequenceNumber",
                  PositionPoint_xPosition:
                    "$sDPointRole.serviceLocation.positionPoints.xPosition",
                  PositionPoint_yPosition:
                    "$sDPointRole.serviceLocation.positionPoints.yPosition",
                },
              },
            },
            // ......................................................
            {
              "@idSource": "processor",
              "@id": { $concat: ["Folder", "Customer", "$rc.id"] },
              "@type": "Folder",
              "@action": "create",
              IdentifiedObject_name: "Абонент",
              IdentifiedObject_ParentObject: {
                "@action": "link",
                "@id": "$rc.id",
                "@idSource": "platform",
              },
              IdentifiedObject_childObjects: {
                "@idSource": "processor",
                "@action": "create",
                "@id": { $concat: ["Customer", "$rc.id"] },
                "@type": "Customer",
                IdentifiedObject_name: "$customerName",
              },
            },
            // ......................................................
          ],
        })
        .build(),
    },
    {
      input: col.flow_usagePoint_buffer_out,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      pipeline: new Pipeline().matchExpr({ $not: "$issue" }).build(),
    },
    {
      input: col.flow_usagePoint_buffer_out,
      output: sysCol.sys_IncomingMessages,
      operationType: OperationType.sync,
      whenMatched: WhenMatchedOperation.merge,
      pipeline: new Pipeline()
        .matchExpr("$issue")
        .lookup({
          from: sysCol.sys_IncomingMessages,
          localField: "messageId",
          foreignField: "messageId",
          as: "m",
        })
        .unwind("$m")
        .project({
          _id: "$m._id",
          issue: "$issue",
        })
        .build(),
    },
  ],
};

// utils.compileFlow(flow.operation[1]);
