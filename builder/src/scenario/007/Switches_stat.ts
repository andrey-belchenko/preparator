import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.flow_Switches_stat_updated,
  output: sysCol.model_Input,
  pipeline: [
    // Получаем название КА для отображения в поле Discrete.IdentifiedObject.name
    {
      $lookup: {
        localField: "value.switchUid",
        from: "model_Entities",
        foreignField: "id",
        as: "model_Entities"
      }
    },
    {
      $unwind: {
        path: "$model_Entities",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        model: {
          "@id": "$value.switchUid",
          "@idSource": "platform",
          "@lastSource":"keep",
          // "@action": "actionlink", 
          PowerSystemResource_Measurements: [{
            "@type": "Discrete",
            "@id": { $concat: ["Discrete", "$value.switchUid", "Положение КА"] },
            "@idSource": "processor",
            "@action": "create",
            "@lastSource":"sk11",
            IdentifiedObject_ParentObject: {
              "@id": "$value.switchUid",
              "@lastSource":"keep",
            },
            IdentifiedObject_name: { $concat: ["Сост. комм. устр ", "$model_Entities.model.IdentifiedObject_name"] }, // TO DO добавил для презентации заказчику
            Measurement_measurementType: "Положение КА",
            Discrete_DiscreteValues: {
              "@type": "DiscreteValue",
              "@id": { $concat: ["DiscreteValue", "$value.switchUid", "Положение КА"] },
              "@idSource": "processor",
              "@action": "create",
              "@lastSource":"sk11",
              IdentifiedObject_ParentObject: {
                "@id": "$value.switchUid",
                "@lastSource":"keep",
              },
              IdentifiedObject_name: { $concat: ["Состояние устройства ", "$model_Entities.model.IdentifiedObject_name"] }, // TO DO добавил для презентации заказчику
              DiscreteValue_value: "$value.value.value",
              MeasurementValue_timeStamp: { $dateFromString: { dateString: "$value.value.timeStamp" } },
              MeasurementValue_measurementValueQuality: {
                "@type": "MeasurementValueQuality",
                "@id": { $concat: ["MeasurementValueQuality", "$value.switchUid", "Положение КА"] },
                "@idSource": "processor",
                "@action": "create",
                "@lastSource":"sk11",
                IdentifiedObject_ParentObject: {
                  "@id": "$value.switchUid",
                  "@lastSource":"keep",
                },
                // TO DO нужно выяснить куда правильно записывать значение validity. Сейчас в платформе ошибка
                // validity: { $toUpper: "$value.value.validity" },
                Quality61850_validity: {
                  "@type": "Validity",
                  "@id": { $concat: ["Validity", "$value.value.validity"] },
                  "@idSource": "processor",
                  "@action": "create",
                  "@lastSource":"sk11",
                  IdentifiedObject_ParentObject: {
                    "@id": "$value.switchUid",
                    "@lastSource":"keep",
                  },
                  Validity_label: { $toUpper: "$value.value.validity" } // Характеристика достоверности значения.validity="invalid"/"good"/"questionable"/"inspect" 
                }
              }
            },
          }],
        },
      },
    },
  ],
};