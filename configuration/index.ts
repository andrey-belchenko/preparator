module attempt2 {
  type DataSet = {};

  export function input_ya_disk_excel(pars: DataSet) {
    return { def: {} };
  }

  export function clear_rs_data(def: DataSet) {
    return { def: {} };
  }

  export function load_rs(pars: DataSet) {
    let input = input_ya_disk_excel(pars)
    let clear = clear_rs_data(input)
    return clear;
  }

  const funcs:any = {}
  
  export function steps(pars: DataSet) {
    let input = funcs["input_ya_disk_excel"].call(pars)
    let clear = funcs["clear_rs_data"].call(input)
    return clear;
  }
  //   export function input_ya_disk_excel({
  //     input1,
  //     input2,
  //   }: {
  //     input1: DataSet;
  //     input2: DataSet;
  //   }): { output1: DataSet } {
  //     return { output1: {} };
  //   }
}

let a = attempt2.input_ya_disk_excel({ input1: {}, input2: {} });
