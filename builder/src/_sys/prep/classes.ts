class Param {
  name: string;
}

class DataType {}

class Port {
  name?: string;
}

class Input extends Port {}

class Output extends Port {}

class Collection {
  name: string;
}

class CollectionRef {
  name?: string;
  collection: Collection | string;
}

type Expr = string;

class ParamVal {
  param: Param | string;
  value: Expr;
}

class OperationRef {
  operation: Operation | string;
}

class PortRef {
  operation: OperationRef | string;
  port: Port | string;
}

class Connection {
  from: PortRef | CollectionRef | string;
  to: PortRef | CollectionRef | string;
}

class Dependency {
  from: Port | Collection | string;
  to: Port | Collection | string;
}

class Operation {
  name?: string;
  func: ScriptFunc | string;
  paramValues?: ParamVal[];
}

class Func {
  name: String;
  constructor(params: { name: String }) {
    Object.assign(this, params);
  }
}

class ReadCollectionFunc extends Func {
  name = "readCollection";
  collectionName: String;
  outputs: [{}];
}

class CreateDataSetFunc extends Func {
  name = "createDataSetFunc";
  collectionName: String;
  outputs: [{}];
}

class ScriptFunc extends Func {
  name: String;
  inputs?: Input[];
  outputs?: Output[];
  operations?: Operation[];
  connections?: Connection[];
}

const createDataSet: ScriptFunc = {
  name: "createDataSet",
  outputs: [{}],
};

const getFile: ScriptFunc = {
  name: "getFile",
  outputs: [{}],
};

const normalizeData: ScriptFunc = {
  name: "normalizeData",
  inputs: [{}],
  outputs: [{}],
};

const substationInputCollection: Collection = { name: "substationInput" };
const switchInputCollection: Collection = { name: "switchInput" };
const substationDataCollection: Collection = {
  name: "substationData",
};
const switchDataCollection: Collection = { name: "switchData" };

const loadSubstationData: ScriptFunc = {
  name: "loadSubstationData",
  operations: [
    {
      func: "getFile",
      paramValues: [
        {
          param: "filePath",
          value: "data/substation.xlsx",
        },
        {
          param: "token",
          value: "wer3243245234524352435",
        },
      ],
    },
    {
      name: "replaceSubstationInput",
      func: "replace",
      paramValues: [
        {
          param: "collection",
          value: "substationData",
        },
      ],
    },
    {
      func: "normalizeData",
    },
    {
      name: "replaceSubstationData",
      func: "replace",
      paramValues: [
        {
          param: "collection",
          value: "substationInput",
        },
      ],
    },
    {
      name: "replaceSubstationData",
      func: "replace",
      paramValues: [
        {
          param: "collection",
          value: "substationData",
        },
      ],
    },
  ],
  connections: [
    {
      from: "getFile.output",
      to: "replaceSubstationInput.input",
    },
    {
      from: "replaceSubstationInput.output",
      to: "normalizeData.input",
    },
    {
      from: "normalizeData.output",
      to: "replaceSubstationData.input",
    },
  ],
};
