import { Flow, SingleStepFlow } from "_sys/classes/Flow";
import * as model_Equipment_RootContainer from "scenario/common/model_Equipment_RootContainer";
import * as utils from "_sys/utils";

export const flow: Flow = utils.createFullRefreshFlow(
  model_Equipment_RootContainer.prepFlow,
  false
);

// utils.compileFlow(flow);
