import * as exampleContextSettings from "./exampleContextSettings";
import * as exampleRule from "./exampleRule";
import { Flow } from "_sys/classes/Flow";
import { ContextSetting } from "_sys/classes/MessageContextSetting";
export const contextSettings: ContextSetting[] = [
  ...exampleContextSettings.contextSettings,
];

export const flows: Flow[] = [...exampleRule.flows];
