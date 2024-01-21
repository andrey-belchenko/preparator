import { main } from "main";
import { rulesToFile } from "_sys/classes/Rules";
import * as modelImport from "_sys/flows/modelImport";
import * as col from "_sys/collections";
import * as platformOutput from "_sys/flows/platformOutput";
// import * as extraMatchingProcess from "_sys/flows/extraMatchingProcess";
// import * as extraMatchingApply from "_sys/flows/extraMatchingApply";
import * as applyKeysOperation from "_sys/flows/applyKeysOperation";
import * as utils from "_sys/utils";
import * as flowTags from "_sys/flowTags";
import { SingleStepFlow } from "_sys/classes/Flow";
let rules = main();
rules.flows.push(modelImport.flow);
for (let flow of platformOutput.flows()) {
  rules.flows.push(flow);
}
// rules.flows.push(extraMatchingProcess.flow);
rules.flows.push(applyKeysOperation.flow);

for (let index of col.indexes){
   rules.collectionIndexes?.push(index)
}

utils.addFlowsTags(rules.flows, [flowTags.all]);

for (let flow of rules.flows) {
  let isFromModel = false;
  let source = flow.trigger;
  if (!source) {
    source = (flow as SingleStepFlow).input;
  }

  if (source) {
    if (source.startsWith("dm_") || source.startsWith("model_")) {
      isFromModel = true;
    }
  }

  if (isFromModel) {
    utils.addFlowsTags([flow], [flowTags.triggeredByModel]);
  }
}

rulesToFile(rules);
