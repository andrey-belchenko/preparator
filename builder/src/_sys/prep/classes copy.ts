namespace Prep1 {
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
    func: Func | string;
    paramValues?: ParamVal[];
  }

  class Func {
    name: String;
    params?: Param[];
    inputs?: Input[];
    outputs?: Output[];
    operations?: Operation[];
    connections?: Connection[];
  }

  const getFile: Func = {
    name: "getFile",
    params: [
      {
        name: "filePath",
      },
      {
        name: "apiToken",
      },
    ],
    outputs: [{}],
  };

  const normalizeData: Func = {
    name: "normalizeData",
    inputs: [{}],
    outputs: [{}],
  };

  const substationInputCollection: Collection = { name: "substationInput" };
  const switchInputCollection: Collection = { name: "switchInput" };
  const substationDataCollection: Collection = {
    name: "substationDataCollection",
  };
  const switchDataCollection: Collection = { name: "switchDataCollection" };

  const loadSubstationData: Func = {
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
        func: "normalizeData",
      },
      {
        func: "replace",
        paramValues: [
          {
            param: "collection",
            value: "",
          },
        ],
      },
    ],
    connections: [
      {
        from: "getFile.output",
        to: "normalizeData.input",
      },
      {
        from: "getFile.output",
        to: "normalizeData.input",
      },
    ],
  };
}
