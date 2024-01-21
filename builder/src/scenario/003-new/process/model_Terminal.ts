import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import * as col from "collections";
import { compileFlow } from "_sys/utils";
export const flows: Flow[] = [
  {
    src: __filename,
    input: thisCol.flow_Terminal_forUpsert,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [
      {
        $project: {
          model: {
            "@type": "Terminal",
            "@id": "$_id",
            "@idSource": "processor",
            "@action": "create",
            Terminal_ConnectivityNode: {
              $cond: [
                "$nodeProcessorId",
                {
                  "@id": "$nodeProcessorId",
                  "@idSource": "processor",
                },
                {
                  $cond: [
                    { $and: [{ $not: "$isBorderOfArea" }, "$oldNodeProcessorId"] },
                    {
                      "@action": "deleteLink",
                      "@id": "$oldNodeProcessorId",
                      "@idSource": "processor",
                    },
                    "$$REMOVE",
                  ],
                },
              ],
            },
            ACDCTerminal_sequenceNumber: "$sequenceNumber",
            Terminal_index: "$number",
            IdentifiedObject_ParentObject: {
              "@id": "$equipmentProcessorId",
              "@idSource": "processor",
            },
            Terminal_ConductingEquipment: {
              "@id": "$equipmentProcessorId",
              "@idSource": "processor",
            },
          },
        },
      },
    ],
  },
  {
    src: __filename,
    input: thisCol.flow_Terminal_forDelete,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [
      {
        $project: {
          model: {
            "@type": "Terminal",
            "@id": "$_id",
            "@idSource": "processor",
            "@action": "delete",
          },
        },
      },
    ],
  },
];

// compileFlow(flows[0] as SingleStepFlow)
