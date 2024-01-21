import { Flow, MultiStepFlow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as sysCol from "_sys/collections";
import * as difOutput from "_sys/flows/diffOutput";
import * as utils from "_sys/utils";
import * as flowTags from "_sys/flowTags";
import * as trig from "_sys/triggers";

export function flows(): Flow[] {
  var flows = difOutput.rules(col.out_Platform, true, false, [], []);
  utils.addOnlineProcessingTag(flows);

  var fullRefreshFlow = utils.createFullRefreshRule(
    trig.trigger_DiffToPlatform,
    true,
    flows
  );

  let allFlows: Flow[] = flows;
  allFlows.push(fullRefreshFlow);
  return allFlows;
}
