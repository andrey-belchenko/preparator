// TODO драфт разделить по файлам
import * as sysCol from "_sys/collections";
export interface SimpleLookupOptions {
  from: CollectionName;
  localField: FieldName;
  foreignField: FieldName;
  as: FieldName;
}

export interface AdvancedLookupOptions {
  from: CollectionName;
  let?: Fields;
  pipeline: StepDefinition[];
  as: FieldName;
}

export interface GraphLookupOptions {
  from: CollectionName;
  startWith: Expression;
  connectFromField: FieldName;
  connectToField: FieldName;
  as: FieldName;
  maxDepth?: number;
  depthField?: FieldName;
  restrictSearchWithMatch?: Expression;
}

export type LookupOptions = SimpleLookupOptions | AdvancedLookupOptions;
// from: <joined collection>,
//        let: { <var_1>: <expression>, …, <var_n>: <expression> },
//        pipeline: [ <pipeline to run on joined collection> ],
//        as: <output array field>

export interface ExprExpr {
  $expr: Expression;
}

export interface ExprIfNull {
  $ifNull: Expression[];
}

export interface ExprToString {
  $toString: Expression;
}

export interface ExprConcat {
  $concat: Expression[];
}

export interface ExprSubstr {
  $substr: Expression[];
}
export interface ExprToLower {
  $toLower: Expression;
}

export interface ExprConcatArrays {
  $concatArrays: Expression[];
}

export interface ExprArrayToObject {
  $arrayToObject: [Expression[]];
}

export interface ExprSetIntersection {
  $setIntersection: Expression[];
}

export interface ExprEq {
  $eq: Expression[];
}

export interface ExprGt {
  $gt: Expression[];
}

export interface ExprLt {
  $lt: Expression[];
}

export interface ExprGte {
  $gte: Expression[];
}

export interface ExprLte {
  $lte: Expression[];
}

export interface ExprNe {
  $ne: Expression[];
}

export interface ExprAnd {
  $and: Expression[];
}

export interface ExprOr {
  $or: Expression[];
}

export interface ExprIn {
  $in: Expression[];
}

export interface ExprNot {
  $not: Expression;
}

export interface ExprSize {
  $size: Expression;
}

export interface ExprFirst {
  $first: Expression;
}

export interface ExprLiteral {
  $literal: Expression;
}

export interface ExprFilter {
  $filter: {
    input: Expression;
    cond: Expression;
    as?: string;
    limit?: number;
  };
}

export interface ExprMap {
  $map: {
    input: Expression;
    as: string;
    in: Expression;
  };
}

export interface ExprCond {
  $cond: (Expression | Fields)[];
}

export interface ExprSwitch {
  $switch: {
    branches: [
      {
        case: Expression;
        then: Expression;
      }
    ];
    default: Expression;
  };
}

export interface AggExprFirst {
  $first: Expression;
}

export interface AggExprLast {
  $last: Expression;
}

export interface AggExprMax {
  $max: Expression;
}

export interface AggExprMin {
  $min: Expression;
}

export interface AggExprSum {
  $sum: Expression;
}

export interface AggExprPush {
  $push: Expression;
}

export type Literal = string | number | boolean | null;
export type CollectionName = string;
export type FieldName = string; // это путь к полю без $
export type FieldPath = string; // это путь к полю c $
export type SingleExpression =
  | ExprExpr
  | ExprEq
  | ExprNe
  | ExprAnd
  | ExprOr
  | ExprIn
  | ExprNot
  | ExprFilter
  | ExprMap
  | ExprCond
  | ExprSwitch
  | ExprConcat
  | ExprToLower
  | ExprConcatArrays
  | ExprArrayToObject
  | ExprSetIntersection
  | ExprIfNull
  | ExprToString
  | ExprSize
  | ExprFirst
  | ExprGt
  | ExprGte
  | ExprLt
  | ExprLte
  | Literal
  | FieldPath
  | ExprLiteral
  | ExprSubstr;
export type Expression =
  | SingleExpression
  | SingleExpression[]
  | Fields
  | Fields[]
  | any[]; // TODO костыль, типизировать нормально
export type AggExpression =
  | AggExprFirst
  | AggExprLast
  | AggExprMax
  | AggExprMin
  | AggExprSum
  | AggExprPush;
export type UnwindOptions = FieldPath | FullUnwindOptions;
export type StepDefinition = object;
// export type PipelineContext = FieldPath;
// export type Fields = object;
export type Predicate = string;
export type MatchOptions = Fields | Expression;
export type GroupKey = Fields | Expression;

export interface FullUnwindOptions {
  path: FieldPath;
  includeArrayIndex?: FieldName;
  preserveNullAndEmptyArrays?: boolean;
}

export interface PipelineStep {
  // contextField?: FieldPath;
  definition: StepDefinition;
}

export interface Fields {
  [x: string | number | symbol]: Expression | Fields | Fields[];
}

export interface GroupOptions {
  _id: GroupKey;
  [x: string | number | symbol]: AggExpression | GroupKey;
}

export interface SortOptions {
  [x: string | number | symbol]: number;
}

// interface PipelineContextDelegate {
//   (path: FieldPath): PipelineContextItem;
// }

interface ProjectOptionsDelegate {
  (...items: PipelineContextItem[]): Fields;
}

type ProjectOptions = ProjectOptionsDelegate | Fields;

// export class PipelineContext {
//   item(path: FieldPath) {
//     return new PipelineContextItem(path);
//   }
// }

export class PipelineContextItem {
  private path = "";
  constructor(path: FieldName) {
    this.path = path;
  }
  name(): FieldPath {
    return this.field("IdentifiedObject_name");
  }
  field(name: string): FieldPath {
    return "$" + this.path + ".model." + name;
  }
}

export class Pipeline {
  private steps: PipelineStep[] = [];
  private addStep(definition: StepDefinition) {
    let step: PipelineStep = {
      definition: definition,
    };
    this.steps.push(step);
  }

  addSteps(steps: StepDefinition[]) {
    steps.forEach((step) => {
      this.addStep(step);
    });
    return this;
  }

  addStepsFromPipeline(pipeline: Pipeline) {
    this.addSteps(pipeline.toSteps());

    for (let field of pipeline.usedSysFields) {
      this.useSysField(field);
    }
    if (!pipeline.processorFieldsUnused) {
      this.processorFieldsUnused = pipeline.processorFieldsUnused;
    }
    return this;
  }

  private processorFieldsUnused = false;

  private toSteps(): StepDefinition[] {
    return this.steps.map((step) => step.definition);
  }

  build(): StepDefinition[] {
    if (this.usedSysFields.length > 0) {
      this.unset(this.usedSysFields);
    }
    if (!this.processorFieldsUnused) {
      this.unset(this.processorFields);
    }

    return this.toSteps();
  }

  group(options: GroupOptions) {
    this.addStep({ $group: options });

    this.clearUsedSysFields();
    return this;
  }

  sort(options: SortOptions) {
    this.addStep({ $sort: options });
    return this;
  }

  lookup(options: LookupOptions): Pipeline {
    this.addStep({ $lookup: options });
    return this;
  }

  graphLookup(options: GraphLookupOptions): Pipeline {
    this.addStep({ $graphLookup: options });
    return this;
  }

  unwind(options: UnwindOptions): Pipeline {
    this.addStep({ $unwind: options });
    return this;
  }
  addFields(options: ProjectOptions): Pipeline {
    let fields = this.getFieldsFromOptions(options);
    this.addStep({ $addFields: fields });
    return this;
  }

  //Манипуляции чтобы упростить синтаксис при вызове, но наверное это уже перебор
  //https://www.edureka.co/community/86200/how-to-get-function-parameter-names-values-dynamically
  private getParamNames(func) {
    var fnStr = func.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, "");
    var result = fnStr
      .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
      .match(/([^\s,]+)/g);
    if (result === null) result = [];
    return result;
  }

  private getFieldsFromOptions(options: ProjectOptions): Fields {
    if (typeof options === "function") {
      let parNames = this.getParamNames(options);
      let items: PipelineContextItem[] = [];
      for (let name of parNames) {
        items.push(new PipelineContextItem(name));
      }
      return (options as ProjectOptionsDelegate)(...items);
    } else {
      return options as Fields;
    }
  }

  project(options: ProjectOptions): Pipeline {
    let fields = this.getFieldsFromOptions(options);
    if (!fields["_id"]) {
      fields["_id"] = false;
    }
    this.addStep({ $project: fields });
    this.clearUsedSysFields();
    return this;
  }

  match(options: MatchOptions): Pipeline {
    this.addStep({ $match: options });
    return this;
  }

  matchExpr(expression: Expression): Pipeline {
    this.addStep({ $match: { $expr: expression } });
    return this;
  }

  unset(options: FieldName | FieldName[]): Pipeline {
    this.addStep({ $unset: options });
    return this;
  }

  replaceRoot(newRoot: Expression): Pipeline {
    this.addStep({ $replaceRoot: { newRoot: newRoot } });
    return this;
  }

  //Модель

  private currentEntityIdPath: FieldName = "id";
  private currentEntityPath: FieldName | null = null;
  private currentEntityType: string | null = null;
  private lookedUpEntityAlias: FieldName | null = null;
  private wasLookupFromDm: boolean = false;

  // private setContext(context: PipelineContext) {
  //   this.currentEntityIdPath = context;
  // }

  private sysFields = {
    // entityId: "@entityId",
    entity: "@@entity",
    buffer: "@@buffer",
  };

  private usedSysFields: string[] = [];

  private clearUsedSysFields() {
    this.usedSysFields = [];
    this.processorFieldsUnused = true;
  }
  private useSysField(fieldName: string): string {
    if (!this.usedSysFields.includes(fieldName)) {
      this.usedSysFields.push(fieldName);
    }
    return fieldName;
  }

  processorFields = ["batchId", "operationId", "executionId"];

  // private isObject(value: any) {
  //   return typeof value === "object";
  // }

  private idSource: string | null = null;
 

  entityId(path: FieldName, type: string | null = null): Pipeline {
    this.currentEntityIdPath = path;
    this.currentEntityPath = null;
    this.idSource = null;
    this.currentEntityType = type;
    return this;
  }

  entityExtId(
    path: FieldName,
    idSource: string,
    type: string | null = null
  ): Pipeline {
    this.currentEntityIdPath = path;
    this.idSource = idSource;
    this.currentEntityPath = null;
    this.currentEntityType = type;
    return this;
  }

  entity(type: string | null = null, path?: FieldName) {
    this.currentEntityType = type;
    if (this.currentEntityType) {
      this.wasLookupFromDm = true;
    }
    let as = path;
    if (!path) {
      as = this.useSysField(this.sysFields.entity);
      let opt: ProjectOptions = {};
      path = "$$ROOT";
      opt[as] = path;
      this.addFields(opt);
      as = this.useSysField(this.sysFields.entity);
    }
    this.lookedUpEntityAlias = as!;
    this.currentEntityPath = this.lookedUpEntityAlias;
    this.currentEntityIdPath = this.lookedUpEntityAlias + ".id";
    this.idSource = null;
    return this;
  }

  lookupSelf(as?: FieldName): Pipeline {
    return this.lookupSelfOperation(as);
  }

  lookupSelfWithDeleted(as?: FieldName): Pipeline {
    return this.lookupSelfOperation(as, true);
  }

  private lookupSelfOperation(as?: FieldName, withDeleted?: Boolean): Pipeline {
    if (!as) {
      as = this.useSysField(this.sysFields.entity);
    }

    let foreignField = "id";
    if (withDeleted === true) {
      foreignField = "initialId";
    }
    if (this.idSource) {
      foreignField = `extId.${this.idSource}`;
    }
    if (this.currentEntityType) {
      this.lookup({
        from: "dm_" + this.currentEntityType,
        localField: this.currentEntityIdPath,
        foreignField: foreignField,
        as: as,
      });
      this.wasLookupFromDm = true;
    } else {
      this.lookup({
        from: "model_Entities",
        localField: this.currentEntityIdPath,
        foreignField: foreignField,
        as: as,
      });
      this.wasLookupFromDm = false;
    }

    this.lookedUpEntityAlias = as;
    // this.selfLookedUpAs = as;
    return this;
  }
  // entity(path: FieldPath): Pipeline {
  //   this.currentEntityIdPath = path + ".id";
  //   return this;
  // }

  // lookupAndUnwindChildren(predicate: Predicate, as?: FieldPath): Pipeline {
  //   return this.lookupAndUnwindLinked(predicate, as, true);
  // }

  lookupChildren(predicate: Predicate, as?: FieldPath): Pipeline {
    return this.lookupLinked(predicate, as, true);
  }

  // unwindFullEntity(preserveNullAndEmptyArrays: boolean = false): Pipeline {
  //   if (!this.wasLookupFromDm) {
  //     throw new Error("Invalid operation");
  //   }
  //   // предполагается что тут будет реализация позволяющая получить данные из dm c полями связей
  //   // сейчас можно использовать только совместно с inverseLookupChildrenOfType(...) или entityId(.., type) + lookupSelf
  //   // это случаи когда известен тип объекта и выполнен lookup из dm
  //   return this.unwindEntity(preserveNullAndEmptyArrays);
  // }

  inverseLookupChildrenOfType(
    types: string[] | string,
    predicate: Predicate,
    as?: FieldPath
  ): Pipeline {
    if (!Array.isArray(types)) {
      types = [types];
    }
    if (types.length == 1) {
      // частный случай при котором можно обратиться сразу в DataMart для оптимизации
      if (!as) {
        as = this.useSysField(this.sysFields.entity);
      }
      this.lookup({
        from: "dm_" + types[0],
        localField: this.currentEntityIdPath,
        foreignField: "model." + predicate,
        as: as,
      });
      this.lookedUpEntityAlias = as;
      this.wasLookupFromDm = true;
      return this;
    }
    return this.lookupLinked(predicate, as, true, types, true);
  }

  // lookupAndUnwindParent(predicate: Predicate, as?: FieldPath): Pipeline {
  //   return this.lookupAndUnwindLinked(predicate, as, false);
  // }

  lookupParentOfType(
    type: string,
    predicate: Predicate,
    as?: FieldName
  ): Pipeline {
    // частный случай при котором можно обратиться сразу в DataMart для оптимизации
    if (!this.wasLookupFromDm) {
      throw new Error("Invalid operation");
    }
    if (!as) {
      as = this.useSysField(this.sysFields.entity);
    }
    this.lookup({
      from: "dm_" + type,
      localField: this.currentEntityPath + ".model." + predicate,
      foreignField: "id",
      as: as,
    });
    this.lookedUpEntityAlias = as;
    this.wasLookupFromDm = true;
    return this;
  }

  lookupParent(predicate: Predicate | Predicate[], as?: FieldName): Pipeline {
    return this.lookupLinked(predicate, as, false);
  }

  lookupParentWithDeleted(
    predicate: Predicate | Predicate[],
    as?: FieldName
  ): Pipeline {
    return this.lookupLinked(predicate, as, false, null, false, true);
  }

  unwindEntity(preserveNullAndEmptyArrays: boolean = false): Pipeline {
    let unwindOptions: UnwindOptions = `$${this.lookedUpEntityAlias}`;
    if (preserveNullAndEmptyArrays) {
      unwindOptions = { path: unwindOptions, preserveNullAndEmptyArrays: true };
    }
    this.unwind(unwindOptions);

    this.currentEntityPath = this.lookedUpEntityAlias;
    this.currentEntityIdPath = this.lookedUpEntityAlias + ".id";
    this.idSource = null;
    return this;
  }

  // private selfLookedUpAs: string | null = null;

  // private lookupSelfIfNeed() {
  //   if (this.selfLookedUpAs) {
  //     return this;
  //   } else {
  //     this.lookupSelf(this.sysFields.entity).unwindEntity();
  //   }
  // }

  entityAggregate(as: FieldName, pipeline: Pipeline): Pipeline {
    let lookupOptions: AdvancedLookupOptions = {
      from: "model_Entities",
      let: { entityId: `$${this.currentEntityIdPath}` },
      pipeline: new Pipeline()
        .matchExpr({ $eq: [`$id`, "$$entityId"] })
        .addStepsFromPipeline(pipeline)
        .build(),
      as: as,
    };
    this.lookup(lookupOptions);
    return this;
  }

  private loadSelfByExternalIdIfNeed() {
    if (this.idSource) {
      this.lookupSelf(this.useSysField(this.sysFields.entity)).unwindEntity();
    }
  }

  private loadSelfIfNeed() {
    if (!this.currentEntityPath) {
      this.lookupSelf(this.useSysField(this.sysFields.entity)).unwindEntity();
    }
  }

  private lookupLinked(
    predicate: Predicate | Predicate[],
    as?: FieldName,
    isChildren: boolean = false,
    types: string[] | string | null = null,
    isInversePredicate: boolean = false,
    withDeleted: boolean = false
  ): Pipeline {
    this.loadSelfByExternalIdIfNeed();

    if (!as) {
      as = this.useSysField(this.sysFields.entity);
    }

    if (types) {
      if (!Array.isArray(types)) {
        types = [types];
      }
    }

    let isInverse = isChildren !== isInversePredicate;
    let predicateFieldName = "predicate";
    if (isInverse) {
      predicateFieldName = "inversePredicate";
    }

    let predicateExpr: Expression = predicate;

    if (Array.isArray(predicate)) {
      predicateExpr = { $in: predicate };
    }

    let predicateMatch: MatchOptions = {};
    predicateMatch[predicateFieldName] = predicateExpr;

    let fields: any = {
      fromToId: "fromId",
      toFromId: "toId",
      fromToType: "fromType",
    };

    if (!isChildren) {
      fields = {
        fromToId: "toId",
        toFromId: "fromId",
        fromToType: "toType",
      };
    }
    fields["predicateMatch"] = predicateMatch;

    let typeMatch = new Pipeline();

    if (types) {
      let matchOptions: MatchOptions = {};
      matchOptions[fields.fromToType] = { $in: types };
      typeMatch.match(matchOptions);
    }

    let entityIdField = "id";

    if (withDeleted) {
      entityIdField = "initialId";
    }

    let entityLookupOptions: SimpleLookupOptions = {
      from: "model_Entities",
      localField: fields.fromToId,
      foreignField: entityIdField,
      as: "entity",
    };

    let matchSteps = new Pipeline();

    let deletedFilter: any = { $not: "$deletedAt" };

    if (withDeleted) {
      deletedFilter = true;
    }

    let commonSteps = new Pipeline()
      .matchExpr(deletedFilter)
      .addSteps(typeMatch.build())
      .lookup(entityLookupOptions)
      .unwind("$entity")
      .replaceRoot("$entity");
    // .unset(this.processorFields);
    let linksLookupOptions: AdvancedLookupOptions;
    if (isInverse) {
      linksLookupOptions = {
        from: "model_Links",
        let: { entityId: `$${this.currentEntityIdPath}` },
        pipeline: new Pipeline()
          .match({ $expr: { $eq: [`$${fields.toFromId}`, "$$entityId"] } })
          .match(fields.predicateMatch)
          .addStepsFromPipeline(commonSteps)
          .build(),
        as: as,
      };
    } else {
      // новый вариант чтобы делать поиск по одному индексированному полю которое содержит id объекта и предикат, сейчас такое поле есть только для прямой ссылки
      let predicates: Predicate[];
      if (Array.isArray(predicate)) {
        predicates = predicate;
      } else {
        predicates = [predicate];
      }
      let linkIdValues: any[] = [];
      for (let p of predicates) {
        let e: Expression = {
          $concat: [`$${this.currentEntityIdPath}`, "-", p],
        };
        linkIdValues.push(e);
      }
      matchSteps.matchExpr({ $in: ["$linkId", linkIdValues] });

      linksLookupOptions = {
        from: sysCol.sys_Dummy,
        let: { localId: linkIdValues },
        pipeline: new Pipeline()
          // экспериментальным путем нашел такой способ чтобы применялся индекс на model_Links.linkId
          .addFields({
            localId: "$$localId",
          })
          .lookup({
            from: sysCol.model_Links,
            localField: "localId",
            foreignField: "linkId",
            as: "it",
          })
          .unwind("$it")
          .replaceRoot("$it")
          .addStepsFromPipeline(commonSteps)
          .build(),
        as: as,
      };
    }

    this.lookup(linksLookupOptions);
    this.lookedUpEntityAlias = as;
    this.wasLookupFromDm = false;
    return this;
  }

  lookupAncestorOrSelfOfType(
    types: string[] | string,
    as?: FieldName
  ): Pipeline {
    if (!Array.isArray(types)) {
      types = [types];
    }
    if (!as) {
      as = this.useSysField(this.sysFields.entity);
    }
    this.loadSelfIfNeed();
    let fields: Fields = {};

    fields[this.useSysField(this.sysFields.buffer)] =
      "$" + this.currentEntityPath;
    this.addFields(fields);
    this.lookupAncestorOfType(types, as);
    fields = {};

    fields[as] = {
      $cond: [
        { $in: ["$" + this.sysFields.buffer + ".type", types] },
        ["$" + this.sysFields.buffer],
        "$" + as,
      ],
    };
    this.addFields(fields);
    return this;
    // this.addFields()
  }

  lookupAncestorOfType(types: string[] | string, as?: FieldName): Pipeline {
    if (!Array.isArray(types)) {
      types = [types];
    }

    this.loadSelfByExternalIdIfNeed();
    if (!as) {
      as = this.useSysField(this.sysFields.entity);
    }

    // let fields = {
    //   fromToId: "toId",
    //   toFromId: "fromId",
    //   predicateMatch: { predicate: "IdentifiedObject_ParentObject" },
    // };
    this.graphLookup({
      from: "model_Links",
      startWith: `$${this.currentEntityIdPath}`,
      connectFromField: "toId",
      connectToField: "fromId",
      restrictSearchWithMatch: {
        $expr: {
          $and: [
            { $eq: ["$predicate", "IdentifiedObject_ParentObject"] },
            { $not: { $in: ["$fromType", types] } },
            { $not: "$deletedAt" },
          ],
        },
      },
      as: as,
    });
    let fields: Fields = {};
    fields[as] = {
      $filter: {
        input: `$${as}`,
        as: "item",
        cond: { $in: ["$$item.toType", types] },
      },
    };
    this.addFields(fields);
    this.unwind({ path: "$" + as, preserveNullAndEmptyArrays: true });
    this.entityId(as + "." + "toId");
    this.lookupSelf(as);
    return this;
  }

  comment(text: string): Pipeline {
    return this;
  }

  comment1(text: string): Pipeline {
    return this;
  }

  comment2(text: string): Pipeline {
    return this;
  }
}
