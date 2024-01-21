import { Rules } from "_sys/classes/Rules";
import * as col from "collections";

import * as s002 from "scenario/002/_all";
import * as s003 from "scenario/003-new/_all";
// import * as s003 from "scenario/003/_all";
import * as s004 from "scenario/004/_all";
import * as s004new from "scenario/004-new/_all";
import * as s005 from "scenario/005/_all";
import * as s007 from "scenario/007/_all";
import * as s008 from "scenario/008/_all";
import * as sk11 from "sk11";
import * as prep from "preparation/_all";
import * as other from "other/_all";
import * as view from "view/_all";
import * as psrFiles from "scenario/psrFiles/_all";
// import * as experiments from "experiments/_all";
import * as sCommon from "scenario/common/_all";
import * as utils from "_sys/utils";
import * as sysFlowTags from "_sys/flowTags";
import * as sysCol from "_sys/collections";
export function main(): Rules {
  return centerRules;
}

var centerOnlineFlows = [
  ...s002.flows,
  ...s003.flows,
  ...psrFiles.flows,
   ...s004.flows,
   ...s004new.flows,
   ...s005.flows,
   ...s007.flows,
   ...s008.flows,
  ...sCommon.flows,
  ...sk11.flows,
];

utils.addOnlineProcessingTag(centerOnlineFlows);

var centerRules: Rules = {
  flows: [
    ...centerOnlineFlows,
    ...prep.flows,
    ...other.flows,
    ...view.flows,
    // ...experiments.flows,
  ],
  cascadeDeleteLinks: [
    "AccountPartLine.AccountPartLine_LineSpans",
    "AccountPartLine.AccountPartLine_Towers",
    "Substation.EquipmentContainer_PlaceEquipmentContainer",
    // "Substation.Substation_Region",
    // "Breaker.ConductingEquipment_BaseVoltage",
    "Breaker.Equipment_PlaceEquipment",
    "Breaker.ConductingEquipment_Terminals",
    "Bay.EquipmentContainer_PlaceEquipmentContainer",
    // "Fuse.ConductingEquipment_BaseVoltage",
    "Fuse.Equipment_PlaceEquipment",
    "Fuse.ConductingEquipment_Terminals",
    // "Disconnector.ConductingEquipment_BaseVoltage",
    "Disconnector.Equipment_PlaceEquipment",
    "Disconnector.ConductingEquipment_Terminals",
    "BusbarSection.Equipment_PlaceEquipment",
    // "BusbarSection.ConductingEquipment_BaseVoltage",
    "BusbarSection.ConductingEquipment_Terminals",
    "SurgeArrester.Equipment_PlaceEquipment",
    // "VoltageLevel.VoltageLevel_BaseVoltage",
    "VoltageLevel.EquipmentContainer_PlaceEquipmentContainer",
    "PowerTransformer.PowerTransformer_PowerTransformerEnd",
    "PowerTransformer.Equipment_PlaceEquipment",
    // "PowerTransformerEnd.TransformerEnd_BaseVoltage",
    // "PowerTransformerEnd.PowerTransformerEnd_ratedS",
    "PowerTransformerEnd.TransformerEnd_Terminal",
    "ACLineSegment.ConductingEquipment_Terminals",
  ],
  collectionIndexes: [
    {
      collection: col.flow_LineSpan_buffer,
      indexes: [["model.LineSpan_EndTower"], ["model.LineSpan_StartTower"]],
    },
    {
      collection: col.flow_ConnectivityNode_external_buffer,
      indexes: [["terminalId"]],
    },
    {
      collection: sysCol.sys_IncomingMessages,
      indexes: [["payload.body.code"]],
    },
    ...s003.indexes,
    ...prep.indexes,
    ...view.indexes
  ],
  contextSettings: [
    // ...experiments.contextSettings
  ]
};

var siberiaRules: Rules = {
  flows: [],
  cascadeDeleteLinks: [],
  collectionIndexes: [],
};
