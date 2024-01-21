type FieldPath = string;

type Expression = FieldPath | number | boolean;

interface ComparisonCondition {
  $eq?: [Expression, Expression];
  $gt?: [Expression, Expression];
  $gte?: [Expression, Expression];
  $lt?: [Expression, Expression];
  $lte?: [Expression, Expression];
  $ne?: [Expression, Expression];
}

interface LogicalCondition {
  $and?: Expression[];
  $or?: Expression[];
  $not?: Expression;
  $nor?: Expression[];
}

interface ArithmeticCondition {
  $add?: Expression[];
  $subtract?: Expression[];
  $multiply?: Expression[];
  $divide?: Expression[];
  $mod?: [Expression, Expression];
}

interface ExprCondition extends ComparisonCondition, LogicalCondition, ArithmeticCondition {}

interface MatchCondition {
  $eq?: Expression;
  $gt?: Expression;
  $gte?: Expression;
  $lt?: Expression;
  $lte?: Expression;
  $ne?: Expression;
}

type MatchExpression = {
  [field in FieldPath]?: MatchCondition;
} & { $expr?: ExprCondition };

interface MatchStage {
  $match: MatchExpression;
}

interface Accumulator {
  $sum?: Expression;
  $avg?: Expression;
  $first?: Expression;
  $last?: Expression;
  $max?: Expression;
  $min?: Expression;
  $push?: Expression;
  $addToSet?: Expression;
}

interface GroupStage {
  $group: {
    _id: Expression;
    [field: string]: Accumulator | Expression;
  };
}

type Stage = MatchStage | GroupStage;

type Pipeline = Stage[];


const pipeline: Pipeline = [
    { $match: { id: { $gt: 20 } } },
    { $group: { _id: '$name', total: { $sum: 1 } } },
  ];