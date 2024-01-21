import { Flow, MultiStepFlow, OperationType, WhenMatchedOperation } from "_sys/classes/Flow";
import * as col from "collections";
import * as sysCol from "_sys/collections";
import { Pipeline } from "_sys/classes/Pipeline";
import * as utils from "_sys/utils";
import { resFilterSteps, validRegions } from "scenario/common/_utils";

export const flow: MultiStepFlow = {
  src: __filename,
  trigger: col.in_meter,
  operation: [
    {
      input: col.in_meter,
      output: col.flow_meter_buffer,
      operationType: OperationType.replace,
      pipeline: new Pipeline()
        // .addSteps(resFilterSteps())
        .addFields({
          "payload.body.messageId": "$messageId",
        })
        .replaceRoot("$payload.body")
        // .matchExpr({ $in: ["$customAttributes.resCode", validRegions] })
        .addFields({
          mRID: { $toLower: "$mRID" },
          "usagePoint.mRID": { $toLower: "$usagePoint.mRID" },
        })
        .lookup({
          from: col.dm_UsagePoint,
          localField: "usagePoint.mRID",
          foreignField: "id",
          as: "p",
        })
        .unwind({ path: "$p", preserveNullAndEmptyArrays: true })
        .project({
          messageId: "$messageId",
          issue: {
            $cond: ["$p.id", "$$REMOVE", "Не найдена связанная точка"],
          },
          model: {
            "@type": "Meter",
            "@action": "create",
            "@id": "$mRID",
            "@idSource": "platform",
            IdentifiedObject_name: "$meterInfoLink.modelNumber",
            IdentifiedObject_mRID: "$mRID",
            Asset_SerialNumber: "$serialNumber",
            EndDevice_timeZoneOffset: "$timeZoneOffset",
            EndDevice_amrSystem: "$armSystem",
            IdentifiedObject_ParentObject: {
              "@action": "link",
              "@id": "$usagePoint.mRID",
              "@idSource": "platform",
            },
            EndDevice_UsagePoint: {
              "@action": "link",
              "@id": "$usagePoint.mRID",
              "@idSource": "platform",
            },
            Meter_MeteringPointCode: "$usagePoint.mRID",
            // ......................................................
            // Meter_MeterMultipliers: {
            //   "@type": "MeterMultiplier",
            //   "@action": "create",
            //   "@id": { $concat: ["MeterMultiplier", "$mRID"] },
            //   "@idSource": "processor",
            //   MeterMultiplier_value: "$meterMultipliers.value",
            //   IdentifiedObject_name: {
            //      $concat: ["Множитель ПУ: ",
            //                "$meterInfoLink.modelNumber"]
            //   },
            //   IdentifiedObject_ParentObject: {
            //     "@action": "link",
            //     "@id": "$mRID",
            //     "@idSource": "platform",
            //   },
            //   MeterMultiplier_kind: {
            //     "@idSource": "platform",
            //     "@type": "MeterMultiplierKind",
            //     "@id": {
            //       $concat: ["cim:MeterMultiplierKind.", "$meterMultipliers.kind"],
            //     },
            //   },
            // },
            // todo
            // Экземпляр LifecycleDate - не создаётся в платформе.
            // Разобраться, почему. todo
            // Моделеру не переваривает формат даты из сообщения проверить почему.
            // Asset_lifecycles: {
            // "@type": "LifecycleDate",
            // "@action": "create",
            // "@id": { $concat: ["LifecycleDate", "$mRID" ] },
            // "@idSource": "processor",
            // LifecycleDate_manufacturedDate: "$lifeCycleDate.manufacturedDate",
            // LifecycleDate_installationDate: "$lifeCycleDate.installationDate",
            // LifecycleDate_removalDate: "$lifeCycleDate.removalDate",
            // LifecycleDate_retiredDate: "$lifeCycleDate.retiredDate",
            // LifecycleDate_lastDateValid: "$lifeCycleDate.lastDateValid",
            // LifecycleDate_nextDateValid: "$lifeCycleDate.nextDateValid",
            // },
            // Экземпляр Seal - не создаётся в платформе.
            // Разобраться, почему. todo
            AssetContainer_Seals: {
              "@type": "Seal",
              "@action": "create",
              "@id": { $concat: ["Seal", "$mRID"] },
              "@idSource": "processor",
              IdentifiedObject_mRID: { $toLower: "$seals.mRID" },
              Seal_sealNumber: "$seals.sealNumber",
              // Seal_kind: {
              // "@type": "SealKind",
              // "@action": "create",
              // "@id": { $concat: ["SealKind", "$mRID" ] },
              // "@idSource": "processor",
              // },
            },
            EndDevice_EndDeviceInfo: {
              "@type": "MeterInfo",
              "@action": "create",
              "@id": { $concat: ["EndDeviceInfo", "$mRID"] },
              "@idSource": "processor",
              IdentifiedObject_name: {
                $concat: ["Инфо о ПУ: ", "$meterInfoLink.modelNumber"],
              },
              EndDeviceInfo_RightDigitCount: "$register.rightDigitCount",
              EndDeviceInfo_LeftDigitCount: "$register.leftDigitCount",
              IdentifiedObject_mRID: { $toLower: "$meterInfoLink.mRID" },
              EndDeviceInfo_AccuracyClass: "$meterInfoLink.accuracyClass",
              EndDeviceInfo_VerificationInterval: "$meterInfoLink.validPeriod",
              EndDeviceInfo_PhaseCount: "$meterInfoLink.phaseCount",
              EndDeviceInfo_ServiceLife: "$meterInfoLink.serviceLife",
              EndDeviceInfo_RatedCurrent: {
                "@type": "CurrentFlow",
                "@action": "create",
                "@id": { $concat: ["CurrentFlow", "$mRID"] },
                "@idSource": "processor",
                CurrentFlow_value: "$meterInfoLink.ratedCurrent",
              },
              EndDeviceInfo_RatedVoltage: {
                "@type": "Voltage",
                "@action": "create",
                "@id": { $concat: ["Voltage", "$mRID"] },
                "@idSource": "processor",
                Voltage_value: "$meterInfoLink.ratedVoltage",
              },
            },
          },
        })
        .build(),
    },

    {
      input: col.flow_meter_buffer,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      pipeline: new Pipeline().matchExpr({ $not: "$issue" }).build(),
    },
    {
      input: col.flow_meter_buffer,
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
// export const flow1: Flow = {
//   src: __filename,
//   input: col.in_meter,
//   output: sysCol.model_Input,
//   pipeline: new Pipeline()
//     // .addSteps(resFilterSteps())
//     .addFields({
//       "payload.body.messageId": "$messageId",
//     })
//     .replaceRoot("$payload.body")
//     // .matchExpr({ $in: ["$customAttributes.resCode", validRegions] })
//     .addFields({
//       mRID: { $toLower: "$mRID" },
//       "usagePoint.mRID": { $toLower: "$usagePoint.mRID" },
//     })
//     .project({
//       messageId: "$messageId",
//       model: {
//         "@type": "Meter",
//         "@action": "create",
//         "@id": "$mRID",
//         "@idSource": "platform",
//         IdentifiedObject_name: "$meterInfoLink.modelNumber",
//         IdentifiedObject_mRID: "$mRID",
//         Asset_SerialNumber: "$serialNumber",
//         EndDevice_timeZoneOffset: "$timeZoneOffset",
//         EndDevice_amrSystem: "$armSystem",
//         IdentifiedObject_ParentObject: {
//           "@action": "link",
//           "@id": "$usagePoint.mRID",
//           "@idSource": "platform",
//         },
//         EndDevice_UsagePoint: {
//           "@action": "link",
//           "@id": "$usagePoint.mRID",
//           "@idSource": "platform",
//         },
//         Meter_MeteringPointCode: "$usagePoint.mRID",
//         // ......................................................
//         // Meter_MeterMultipliers: {
//         //   "@type": "MeterMultiplier",
//         //   "@action": "create",
//         //   "@id": { $concat: ["MeterMultiplier", "$mRID"] },
//         //   "@idSource": "processor",
//         //   MeterMultiplier_value: "$meterMultipliers.value",
//         //   IdentifiedObject_name: {
//         //      $concat: ["Множитель ПУ: ",
//         //                "$meterInfoLink.modelNumber"]
//         //   },
//         //   IdentifiedObject_ParentObject: {
//         //     "@action": "link",
//         //     "@id": "$mRID",
//         //     "@idSource": "platform",
//         //   },
//         //   MeterMultiplier_kind: {
//         //     "@idSource": "platform",
//         //     "@type": "MeterMultiplierKind",
//         //     "@id": {
//         //       $concat: ["cim:MeterMultiplierKind.", "$meterMultipliers.kind"],
//         //     },
//         //   },
//         // },
//         // todo
//         // Экземпляр LifecycleDate - не создаётся в платформе.
//         // Разобраться, почему. todo
//         // Моделеру не переваривает формат даты из сообщения проверить почему.
//         // Asset_lifecycles: {
//         // "@type": "LifecycleDate",
//         // "@action": "create",
//         // "@id": { $concat: ["LifecycleDate", "$mRID" ] },
//         // "@idSource": "processor",
//         // LifecycleDate_manufacturedDate: "$lifeCycleDate.manufacturedDate",
//         // LifecycleDate_installationDate: "$lifeCycleDate.installationDate",
//         // LifecycleDate_removalDate: "$lifeCycleDate.removalDate",
//         // LifecycleDate_retiredDate: "$lifeCycleDate.retiredDate",
//         // LifecycleDate_lastDateValid: "$lifeCycleDate.lastDateValid",
//         // LifecycleDate_nextDateValid: "$lifeCycleDate.nextDateValid",
//         // },
//         // Экземпляр Seal - не создаётся в платформе.
//         // Разобраться, почему. todo
//         AssetContainer_Seals: {
//           "@type": "Seal",
//           "@action": "create",
//           "@id": { $concat: ["Seal", "$mRID"] },
//           "@idSource": "processor",
//           IdentifiedObject_mRID: { $toLower: "$seals.mRID" },
//           Seal_sealNumber: "$seals.sealNumber",
//           // Seal_kind: {
//           // "@type": "SealKind",
//           // "@action": "create",
//           // "@id": { $concat: ["SealKind", "$mRID" ] },
//           // "@idSource": "processor",
//           // },
//         },
//         EndDevice_EndDeviceInfo: {
//           "@type": "MeterInfo",
//           "@action": "create",
//           "@id": { $concat: ["EndDeviceInfo", "$mRID"] },
//           "@idSource": "processor",
//           IdentifiedObject_name: {
//             $concat: ["Инфо о ПУ: ", "$meterInfoLink.modelNumber"],
//           },
//           EndDeviceInfo_RightDigitCount: "$register.rightDigitCount",
//           EndDeviceInfo_LeftDigitCount: "$register.leftDigitCount",
//           IdentifiedObject_mRID: { $toLower: "$meterInfoLink.mRID" },
//           EndDeviceInfo_AccuracyClass: "$meterInfoLink.accuracyClass",
//           EndDeviceInfo_VerificationInterval: "$meterInfoLink.validPeriod",
//           EndDeviceInfo_PhaseCount: "$meterInfoLink.phaseCount",
//           EndDeviceInfo_ServiceLife: "$meterInfoLink.serviceLife",
//           EndDeviceInfo_RatedCurrent: {
//             "@type": "CurrentFlow",
//             "@action": "create",
//             "@id": { $concat: ["CurrentFlow", "$mRID"] },
//             "@idSource": "processor",
//             CurrentFlow_value: "$meterInfoLink.ratedCurrent",
//           },
//           EndDeviceInfo_RatedVoltage: {
//             "@type": "Voltage",
//             "@action": "create",
//             "@id": { $concat: ["Voltage", "$mRID"] },
//             "@idSource": "processor",
//             Voltage_value: "$meterInfoLink.ratedVoltage",
//           },
//         },
//       },
//     })
//     .build(),
// };

// utils.compileFlow(flow);
