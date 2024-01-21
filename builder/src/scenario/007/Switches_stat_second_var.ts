import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.flow_Switches_stat_updated,
  output: sysCol.model_Input,
  idSource: "platform",
  pipeline: [
    {
      $project: {
        model: {
          "@type": "Discrete",
          "@id": { $concat: ["Discrete", "$value.switchUid", "Положение КА"] },
          "@idSource": "processor",
          "@action": "create",
          "@lastSource":"sk11",
          Measurement_PowerSystemResource: {
            "@id": "$value.switchUid",
            "@idSource": "platform",
            "@lastSource":"keep",
          },
          Measurement_measurementType: "Положение КА",
          Discrete_DiscreteValues: {
            "@type": "DiscreteValue",
            "@id": { $concat: ["DiscreteValue", "$value.switchUid", "Положение КА"] },
            "@idSource": "processor",
            "@action": "create",
            "@lastSource":"sk11",
            DiscreteValue_value: "$value.value",
            MeasurementValue_measurementValueQuality: {
              "@type": "MeasurementValueQuality",
              "@id": { $concat: ["MeasurementValueQuality", "$value.switchUid", "Положение КА"] },
              "@idSource": "processor",
              "@action": "create",
              "@lastSource":"sk11",
              Quality61850_validity: {
                "@type": "Validity",
                "@id": { $concat: ["Validity", "$value.validity"] },
                "@idSource": "processor",
                "@action": "create",
                "@lastSource":"sk11",
                label: { $toUpper: "$value.validity" }
              }
            }
          },
        },
      },
    },
  ],
};
