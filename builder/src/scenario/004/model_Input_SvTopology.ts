import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.in_skNodeStatusResponse,
  output: sysCol.model_Input,
  pipeline: [
    //{$match:{$expr:false}}
    
      {$unwind: "$response.value"},
      {$project:{
          model:{
              "@type":"SvTopology",
              "@action":"create",
              "@idSource":"processor",
              "@id":{$concat:["SvTopology","$response.value.connectivityNodeUid"]},
              SvTopology_Energized:"$response.value.value.energized",
              SvTopology_Grounded:"$response.value.value.grounded",
              SvTopology_BaseVoltage:"$response.value.value.nominalVoltage",
              SvTopology_ConnectivityNode: {
                  "@type":"ConnectivityNode",
                  "@idSource":"platform",
                  "@id":"$response.value.connectivityNodeUid"
                  }
              }
        }
      }
  ],
};