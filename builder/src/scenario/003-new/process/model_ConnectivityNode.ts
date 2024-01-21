import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import * as col from "collections";
import { compileFlow } from "_sys/utils";
import { lineEquipmentParentModelSteps } from "../input/_utils";
export const flows: Flow[] = [
  {
    src: __filename,
    input: thisCol.flow_ConnectivityNode_forUpsert,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [
      ...lineEquipmentParentModelSteps(
        "_id",
        "processor",
        "lineId",
        "platform"
      ),
      {
        $project: {
          model: {
            "@type": "ConnectivityNode",
            "@action": "create",
            "@id": "$_id",
            "@idSource": "processor",
            ConnectivityNode_ConnectivityNodeContainer: {
              "@type": "Line",
              "@id": "$lineId",
            },
            IdentifiedObject_ParentObject: "$parentModel",
            // IdentifiedObject_ParentObject: {
            //   "@type": "Line",
            //   "@id": "$lineId",
            // },
          },
        },
      },
    ],
  },
  {
    src: __filename,
    input: thisCol.flow_ConnectivityNode_forDelete,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [
      {
        $project: {
          model: {
            "@type": "ConnectivityNode",
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
