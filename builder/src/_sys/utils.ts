import * as fs from "fs";
import * as path from "path";
import * as open from "open";
import * as flowTags from "_sys/flowTags";
import * as col from "_sys/collections";
import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
  isMultiStep,
} from "./classes/Flow";
import { Pipeline } from "./classes/Pipeline";

export function addFlowsTags(flows: Flow[], tags: string[]) {
  for (let flow of flows) {
    if (!flow.tags) {
      flow.tags = [];
    }
    for (let tag of tags) {
      if (!(flow.tags.indexOf(tag) >= 0)) {
        flow.tags.push(tag);
      }
    }
  }
}

export function addOnlineProcessingTag(flows: Flow[]) {
  for (let flow of flows) {
    if (!flow.tags || flow.tags.indexOf(flowTags.fullProcessing) < 0) {
      addFlowsTags([flow], [flowTags.onlineProcessing]);
    }
  }
}

// export function removeFlowsTags(flows: Flow[], tags: string[]) {
//   for (let flow of flows) {
//     if (flow.tags) {
//       for (let tag of tags) {
//         let i = flow.tags.indexOf(tag);
//         if (i >= 0) {
//           flow.tags = flow.tags.splice(i, 1);
//         }
//       }
//     }
//   }
// }

export function createFullRefreshRule(
  trigger: string,
  addClearOperation: boolean,
  operations: SingleStepFlow[]
): MultiStepFlow {
  let newOperations: Flow[] = [];
  if (addClearOperation) {
    newOperations.push({
      input: col.sys_Dummy,
      output: operations[0].output,
      operationType: OperationType.replace,
      pipeline: new Pipeline().matchExpr(false).build(),
    });
  }

  for (let flow of operations) {
    newOperations.push(createFullRefreshFlow(flow, !addClearOperation));
  }
  let rule: MultiStepFlow = {
    tags: [flowTags.fullProcessing],
    trigger: trigger,
    operation: newOperations,
  };
  return rule;
}

// export function createFullRefreshFlows(
//   flows: SingleStepFlow[],
//   isReplace: boolean
// ): SingleStepFlow[] {
//   let newFlows: SingleStepFlow[] = [];
//   for (let flow of flows) {
//     newFlows.push(createFullRefreshFlow(flow, isReplace));
//   }
//   return newFlows;
// }

export function createFullRefreshFlow(
  flow: Flow,
  isReplace: boolean,
  trigger?: string
): Flow {
  if (isMultiStep(flow)) {
    return createFullRefreshMultiStepFlow(
      flow as MultiStepFlow,
      isReplace,
      trigger
    );
  } else {
    return createFullRefreshSingleStepFlow(
      flow as SingleStepFlow,
      isReplace,
      trigger
    );
  }
}

function createFullRefreshMultiStepFlow(
  flow: MultiStepFlow,
  isReplace: boolean,
  trigger?: string
): MultiStepFlow {
  let newFlow: MultiStepFlow = {
    ...flow,
  };
  newFlow.operation = [];
  if (trigger) {
    newFlow.trigger = trigger;
  } else {
    delete newFlow.trigger;
  }

  newFlow.tags = [flowTags.fullProcessing];
  if (flow.tags) {
    for (let tag of flow.tags) {
      if (tag != flowTags.onlineProcessing) {
        newFlow.tags.push(tag);
      }
    }
  }

  let outputs: any = {};
  for (let op of flow.operation) {
    let isReplaceOp = false;
    if (isReplace) {
      if (!isMultiStep(op)) {
        let opS = op as SingleStepFlow;
        if (!outputs[opS.output]) {
          isReplaceOp = true;
          outputs[opS.output] = true;
        }
      }
    }
    let newOp = createFullRefreshFlow(op, isReplaceOp);
    newFlow.operation.push(newOp);
  }
  return newFlow;
}

function createFullRefreshSingleStepFlow(
  flow: SingleStepFlow,
  isReplace: boolean,
  trigger?: string
): SingleStepFlow {
  let operationType = flow.operationType;

  if (isReplace) {
    if (operationType == OperationType.syncWithDelete) {
      operationType = OperationType.replaceWithDelete;
    } else {
      operationType = OperationType.replace;
    }
  }

  let newProps = {
    useDefaultFilter: false,
    operationType: operationType,
  };
  let newFlow: SingleStepFlow = {
    ...flow,
    ...newProps,
  };

  if (trigger) {
    newFlow.trigger = trigger;
  } else {
    delete newFlow.trigger;
  }

  newFlow.tags = [flowTags.fullProcessing];
  if (flow.tags) {
    for (let tag of flow.tags) {
      if (tag != flowTags.onlineProcessing) {
        newFlow.tags.push(tag);
      }
    }
  }
  return newFlow;
}

export function comment(text: string) {
  return {
    $match: { $expr: true, $comment: text },
  };
}

export function compileObject(object: any) {
  let text = stringify(object);
  writeAndOpen(text);
}

export function compileFlows(flows: Flow[]) {
  writeAndOpen(getFlowsText(flows, true));
}

export function compileFlow(flow: Flow) {
  writeAndOpen(getRootFlowText(flow));
}

function getRootFlowText(flow: Flow): string {
  let text = "";
  if (flow["pipeline"]) {
    text = getSingleStepFlowText(flow as SingleStepFlow, false);
  } else {
    text = getFlowsText((flow as MultiStepFlow).operation, true);
  }
  return text;
}

function getFlowText(flow: Flow, doOut: boolean): string {
  let text = "";
  if (flow["pipeline"]) {
    text = getSingleStepFlowText(flow as SingleStepFlow, doOut);
  } else {
    text = getFlowsText((flow as MultiStepFlow).operation, doOut);
  }
  return text;
}

function getSingleStepFlowText(flow: SingleStepFlow, doOut: boolean): string {
  if (doOut) {
    flow.pipeline?.push({ $out: flow.output });
  }
  let text = stringify(flow.pipeline);
  text = `db.getCollection("${flow.input}").aggregate(\n${text}\n)`;
  return text;
}

function getFlowsText(flows: Flow[], doOut: boolean): string {
  let text = "";
  for (let f of flows) {
    text += getFlowText(f, doOut) + "\n";
  }
  return text;
}

function stringify(object: any): string {
  return JSON.stringify(object, null, 8);
}

function writeAndOpen(text: string) {
  let dir = "./../temp";
  let fileName = path.join(dir, "result.js");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fileName, text, {
    flag: "w",
  });
  console.log(fileName);
  open(fileName);
}
