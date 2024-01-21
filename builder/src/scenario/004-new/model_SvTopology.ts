import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "./_collections";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_NodesStatus,
  output: sysCol.model_Input,
  pipeline: [
    {
      $project: {
        model: {
          "@type": "SvTopology",
          "@action": "create",
          "@idSource": "processor",
          "@id": { $concat: ["SvTopology", "$_id"] },
          "@lastSource":"sk11",
          SvTopology_Energized: "$value.energized",
          SvTopology_Grounded: "$value.grounded",
          SvTopology_BaseVoltage: "$value.nominalVoltage",
          SvTopology_ConnectivityNode: {
            "@type": "ConnectivityNode",
            "@idSource": "platform",
            "@id": "$_id",
            "@lastSource":"keep",
          },
          IdentifiedObject_ParentObject: {
            "@type": "ConnectivityNode",
            "@idSource": "platform",
            "@id": "$_id",
            "@lastSource":"keep",
          },
        },
      },
    },
  ],
};
