//TODO Эксперименты, удалить

import { type } from "os";
import { Pipeline } from "./Pipeline";

class Reference {
  foo?: any;
}

class Unspecified extends Reference {}

class Entity extends Reference {}

class IdentifiedObject extends Entity {
  id: string;
  name: string;
}

class Link<EntityType> {}

class Folder extends IdentifiedObject {
  kind: String;
}

class Substation extends IdentifiedObject {
  code: String;
  folder: Link<Folder>;
}

class Equipment extends IdentifiedObject {
  substation: Link<Substation>;
}

type LinkOperationResult<EntityType> = {
  [key: string]: Link<EntityType>;
};

class PipelineContext<
  CurrentContextType extends Reference,
  NewContextType extends Reference,
  TVariables
> {
  castById<EntityType extends Entity>(
    field: string
  ): PipelineContext<EntityType, Unspecified, {}> {
    return new PipelineContext<EntityType, Unspecified, {}>();
  }

  link<LinkedContextType extends Entity, TVariable>(
    selector: (item: CurrentContextType) => Link<LinkedContextType>,
    variable?: TVariable
  ): PipelineContext<
    CurrentContextType,
    LinkedContextType,
    TVariables & TVariable
  > {
    return new PipelineContext<
      CurrentContextType,
      LinkedContextType,
      TVariables & TVariable
    >();
  }

  link1<
    LinkedContextType extends Entity,
    TVariable extends LinkOperationResult<LinkedContextType>
  >(
    selector: (item: CurrentContextType) => TVariable
  ): PipelineContext<
    CurrentContextType,
    LinkedContextType,
    TVariables & TVariable
  > {
    return new PipelineContext<
      CurrentContextType,
      LinkedContextType,
      TVariables & TVariable
    >();
  }

  unwind(): PipelineContext<NewContextType, Unspecified, TVariables> {
    return new PipelineContext<NewContextType, Unspecified, TVariables>();
  }

  vars(): TVariables {
    return {} as TVariables;
  }

  // project(options: any): PipelineContext<Unspecified, Unspecified> {
  //   return new PipelineContext<Unspecified, Unspecified>();
  // }
}

let p = new PipelineContext();

let x = p.castById<Equipment>("id");
let c = x.link((e) => e.substation);
let n = c.unwind();

let s: Substation;
let vars = new PipelineContext()
  .castById<Equipment>("id")
  .link1((a) => ({ item: a.substation }))
  .link1((a) => ({ item1: a.substation }))
  // .link((a) => a.substation,{a:""})
  // .link((a) => a.substation,{b:""})
  // .project({aaa:s.name})
  .unwind()
  .vars();

////////////////

class Person {
  name: Equipment;
}

type PersonName = typeof Person.prototype.name;

type EquipmentFieldName = keyof Equipment;

class Builder<ContextType> {
  item: ContextType;
  link(field: keyof ContextType): Builder<ContextType> {
    return new Builder<ContextType>();
  }

  // link1(field: keyof ContextType):field {
  //   return new Builder<ContextType[typeof field]>();
  // }
  //
}

let b = new Builder<Equipment>().link("substation");

// let b1 = new Builder<Equipment>().link1("substation");
// pp.link((e) => e.substation).unwind();

function test<T1, T2>(par1: T1, par2: T2): T1 & T2 {
  return {
    ...par1,
    ...par2,
  };
}

class A {
  a: number;
}

class B {
  b: number;
}

type AB = A & B;

var ab: AB;

var x1 = test({ a: "yyy" }, { b: "zzz" });



const numbers: number[] = [1, 2, 3, 4, 5, 6];
const evens = numbers.filter(_ => _ % 2 === 0);
