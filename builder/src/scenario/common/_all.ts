import * as col from "collections";
import { Flow } from "_sys/classes/Flow";
import * as model_Equipment_RootContainer from "./model_Equipment_RootContainer";
import * as skSentObjects from "./skSentObjects";
import * as notifications from "./notifications";

export const flows: Flow[] = [
  model_Equipment_RootContainer.onlineFlow,
  skSentObjects.flow,
  ...notifications.flows,
];
