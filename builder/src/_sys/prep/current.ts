import { Pipeline } from "_sys/classes/Pipeline";

namespace Test {
  // abstract class Operation {
  //   funcName: String;
  //   name: String;
  //   constructor(params: { funcName: String; name?: String }) {
  //     Object.assign(this, params);
  //   }
  // }

  // abstract class InputOperation extends Operation {
  //   inputs?: Input[] = [{}];
  // }

  // class ReadCollectionOperation extends InputOperation {
  //   collectionName: String;
  //   constructor(params: { collectionName: String }) {
  //     super({ funcName: "readCollection" });
  //     Object.assign(this, params);
  //   }
  // }

  // class CreateDataSetOperation extends InputOperation {
  //   data: any;
  //   constructor(params: { data: any }) {
  //     super({ funcName: "readCollection" });
  //     Object.assign(this, params);
  //   }
  // }

  // class ScriptOperation extends Operation {
  //   inputs?: Input[];
  //   outputs?: Output[];
  //   operations?: Operation[];
  //   connections?: Connection[];
  // }

  // class ScriptFunc extends Func {
  //   inputs?: Input[];
  //   outputs?: Output[];
  //   operations?: Operation[];
  //   connections?: Connection[];
  // }

  class FunctionInput {}

  class OperationInput {
    bindTo(name?: string) {
      return this;
    }
  }

  class OperationOutput {}

  class Operation {
    container: FunctionRef;
    bindInput(
      inputName: string,
      source: FunctionInput | OperationRefOutput | OperationRef
    ) {
      return this;
    }
  }

  class OperationRefOutput {}
  class OperationRef {
    output(name: string): OperationRefOutput {
      return new OperationRefOutput();
    }
  }

  class PipelineOperation extends Operation {
    pipeline(pipeline: any[] | Pipeline) {}
  }

  class FunctionRef {
    input(name: string): FunctionInput {
      return new FunctionInput();
    }

    step(name: string): OperationRef {
      return new OperationRef();
    }
  }

  class Function {
    input(name: string): FunctionInput {
      return new FunctionInput();
    }

    setName(value: String) {
      return this;
    }
    addInput(name: string, defaultValue: any[] | any) {
      return this;
    }
    addOutput(name: string) {
      return this;
    }
    callFunction(
      stepName: string,
      funcName: string,
      configure: (op: Operation) => void
    ) {
      return this;
    }
    pipeline(stepName: string, configure: (op: PipelineOperation) => void) {
      return this;
    }
    createDataSet(stepName: string, data: any[] | any) {
      return this;
    }

    callFunctionWithParams(stepName: string, funcName: string, params: any) {
      const paramStepName = `${stepName}_params`;
      this.createDataSet(paramStepName, params).callFunction(
        stepName,
        funcName,
        (op) => {
          op.bindInput("", op.container.step(paramStepName));
        }
      );
      return this;
    }
    build() {}
  }

  const getFile = new Function()
    .addInput("fileParams", {
      relativeFilePath: "",
    })
    .createDataSet("connectionParams", {
      root: "data/",
      token: "wer3243245234524352435",
    })
    .pipeline("fullParams", (op) => {
      op.bindInput("", op.container.step("connectionParams"));
      op.pipeline(
        new Pipeline()
          .lookup({
            from: op.container.input("fileParams"),
            as: "fp",
          })
          .project({
            token: "$token",
            filePath: { $concat: ["$root", "$fp.relativeFilePath"] },
          })
      );
    })
    .callFunction("file", "diskFile", (op) => {
      op.bindInput("params", op.container.step("fullParams"));
    })
    .addOutput("")
    .build();

  const getSubstationFile = new Function()
    .createDataSet("params", {
      relativeFilePath: "supa/substation.xlsx",
    })
    .callFunction("getFile", "getFile", (op) => {
      op.bindInput("fileParams", op.container.step("params"));
    })
    .build();

  const getSubstationFile1 = new Function()
    .callFunctionWithParams("", "getFile", {
      relativeFilePath: "supa/substation.xlsx",
    })
    .build();

  // const flow = new Function()
  //   .setName("loadSubstationData")
  //   .declareOutput()
  //   .addOperation((op) => {
  //     op.setFuncName("getFile").bindInput(op.container.input());
  //   })
  //   .build();
}
