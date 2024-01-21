import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import * as col from "collections";
import { compileFlow } from "_sys/utils";
import { lineEquipmentParentModelSteps } from "../input/_utils";
export const flows: Flow[] = [
  {
    src: __filename,
    input: thisCol.flow_ACLineSegment_forUpsert,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [
      {
        $lookup: {
          from: thisCol.flow_ACLineSegment_name,
          localField: "_id",
          foreignField: "_id",
          as: "name",
        },
      },
      { $unwind: "$name" },
      {
        $lookup: {
          from: thisCol.flow_ACLineSegment_data,
          localField: "_id",
          foreignField: "_id",
          as: "data",
        },
      },
      {
        $unwind: {
          path: "$data",
          preserveNullAndEmptyArrays: true,
        },
      },
      ...lineEquipmentParentModelSteps(
        "_id",
        "processor",
        "lineId",
        "platform"
      ),
      {
        $project: {
          model: {
            "@type": "ACLineSegment",
            "@action": "create",
            "@id": "$_id",
            "@idSource": "processor",
            IdentifiedObject_name: "$name.name",
            Conductor_length: "$data.length",
            Equipment_EquipmentContainer: {
              "@type": "Line",
              "@id": "$lineId",
            },
            // IdentifiedObject_ParentObject: {
            //   "@type": "Line",
            //   "@id": "$lineId",
            // },
            IdentifiedObject_ParentObject: "$parentModel",
            ACLineSegment_StartTower: {
              $cond: [
                "$firstTowerId",
                {
                  "@type": "Tower",
                  "@id": "$firstTowerId",
                },
                "$$REMOVE",
              ],
            },
            ACLineSegment_EndTower: {
              $cond: [
                "$lastTowerId",
                {
                  "@type": "Tower",
                  "@id": "$lastTowerId",
                },
                "$$REMOVE",
              ],
            },
            ACLineSegment_FirstLineSpan: {
              "@type": "LineSpan",
              "@id": "$firstLsId",
            },
            ACLineSegment_LastLineSpan: {
              "@type": "LineSpan",
              "@id": "$lastLsId",
            },
            ACLineSegment_isTap: "$isTap",
            ConductingEquipment_BaseVoltage: {
              $cond: [
                "$baseVoltage",
                {
                  "@type": "BaseVoltage",
                  "@id": "$baseVoltage",
                },
                "$$REMOVE",
              ],
            },
            // TODO: хардкод, переделать
            IdentifiedObject_OrganisationRoles: {
              "@idSource": "platform",
              "@id": "c6ea45dd-2164-45f9-94ff-4c00d23b5fbb",
              "@action": "link",
            },
            PowerSystemResource_PSRType: {
              "@idSource": "platform",
              "@id": "10000cf2-0000-0000-c000-0000006d746c",
              "@action": "link",
            },
            ConductingEquipment_ControlArea: {
              "@idSource": "platform",
              "@id": "9c296047-f9d5-4d34-8b26-84522e2f4884",
              "@action": "create",
              "@type":"ControlArea"
            }
          },
        },
      },
    ],
  },
  {
    src: __filename,
    input: thisCol.flow_ACLineSegment_forDelete,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [
      {
        $project: {
          model: {
            "@type": "ACLineSegment",
            "@action": "delete",
            "@id": "$_id",
            "@idSource": "processor",
          },
        },
      },
    ],
  },
];

// compileFlow(flows[0] as SingleStepFlow)
