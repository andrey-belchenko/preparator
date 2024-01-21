import { Flow } from "./Flow";
import * as fs from "fs";
import { join } from "path";
import { CollectionIndexSet } from "./CollectionIndexSet";
import * as os from "os";
import { ContextSetting } from "./MessageContextSetting";


export class Rules {
  flows: Flow[] = [];
  cascadeDeleteLinks?: String[] = [];
  collectionIndexes?: CollectionIndexSet[] = [];
  contextSettings?: ContextSetting[] = [];
 
}

function objectToString(object: any): string {
  return JSON.stringify(object, null, 8);
}

export function rulesToFile(settings: Rules) {
  saveObjectToFile(settings, "full.json");
  saveObjectToFile(
    { timestamp: new Date().toISOString(), user: os.userInfo().username },
    "info.json"
  );
}

function saveObjectToFile(object: any, fileName: string) {
  let data = objectToString(object);
  let dir = join("./../", "settings", "rules");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  fs.writeFileSync(join(dir, fileName), data, {
    flag: "w",
  });
}
