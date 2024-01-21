import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import * as col from "collections";
import { compileFlow } from "_sys/utils";
export const flows: Flow[] = [
  {
    src: __filename,
    input: thisCol.flow_LineSpan_ACLineSegment_forUpsert,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [
      {
        $project: {
          model: {
            "@type": "LineSpan",
            "@id": "$_id",
            LineSpan_ACLineSegment: {
              "@type": "ACLineSegment",
              "@id": "$aclsId",
              "@idSource": "processor",
            },
          },
        },
      },
    ],
  },
  // Цепочка пролетов с фазами B C привязываются к тому же ACLS что и пролет с фазой A от которого цепочка отходит 
  {
    src: __filename,
    input: thisCol.flow_LineSpan_ACLineSegment_forUpsert,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [
      {
        $lookup: {
          from: col.flow_LineSpan_buffer_skipped,
          localField: "_id",
          foreignField: "_id",
          as: "s",
        },
      },
      { $unwind: "$s" },
      { $unwind: "$s.spans" },
      {
        $project: {
          model: {
            "@type": "LineSpan",
            "@id": "$s.spans",
            LineSpan_ACLineSegment: {
              "@type": "ACLineSegment",
              "@id": "$aclsId",
              "@idSource": "processor",
            },
          },
        },
      },
    ],
  },
  
  {
    src: __filename,
    input: thisCol.flow_LineSpan_ACLineSegment_forDelete,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [
      {
        $project: {
          model: {
            "@type": "LineSpan",
            "@id": "$_id",
            LineSpan_ACLineSegment: {
              "@type": "ACLineSegment",
              "@id": "$aclsId",
              "@action": "deleteLink",
              "@idSource": "processor",
            },
          },
        },
      },
    ],
  },
  // Цепочка пролетов с фазами B C отвязывается от того же ACLS что и пролет с фазой A от которого цепочка отходит. Корректность работы под сомнением. Не проверено.
  {
    src: __filename,
    input: thisCol.flow_LineSpan_ACLineSegment_forDelete,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: [
      {
        $lookup: {
          from: col.flow_LineSpan_buffer_skipped,
          localField: "_id",
          foreignField: "_id",
          as: "s",
        },
      },
      { $unwind: "$s" },
      { $unwind: "$s.spans" },
      {
        $project: {
          model: {
            "@type": "LineSpan",
            "@id": "$s.spans",
            LineSpan_ACLineSegment: {
              "@type": "ACLineSegment",
              "@id": "$aclsId",
              "@action": "deleteLink",
              "@idSource": "processor",
            },
          },
        },
      },
    ],
  },
];
