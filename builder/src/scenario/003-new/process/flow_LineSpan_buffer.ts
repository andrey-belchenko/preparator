import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as col from "collections";
import * as inputCol from "../input/_collections";
import * as sysCol from "_sys/collections";
import { Pipeline } from "_sys/classes/Pipeline";
import * as thisCol from "./_collections";
import * as utils from "_sys/utils";
export const flows: Flow[] = [
  //Получение затронутых пролетов
  {
    src: __filename,
    input: thisCol.flow_affected_LineSpan_ext,
    output: col.flow_LineSpan_list,
    operationType: OperationType.replace,
    pipeline: new Pipeline()
      .entityId("_id", "LineSpan")
      .lookupSelf("ls")
      .unwindEntity()
      .matchExpr("$ls.model.LineSpan_isInUse")
      .lookupParentOfType("AccountPartLine", "LineSpan_AccountPartLine", "apl")
      .unwindEntity()
      // .lookupParentOfType("Line", "AccountPartLine_Line", "l")
      // .unwindEntity()
      // .matchExpr({ $not: "$l.model.Line_isNotMatched" })
      .addFields({
        startTowerId: { $ifNull: ["$ls.model.LineSpan_StartTower", "-"] },
        endTowerId: { $ifNull: ["$ls.model.LineSpan_EndTower", "-"] },
      })
      .project({
        _id: "$ls.id",
        id: "$ls.id",
        lineId: "$apl.model.AccountPartLine_Line",
        baseVoltage: "$apl.model.AccountPartLine_BaseVoltage",
        code: "$ls.extId.КИСУР",
        model: "$ls.model",
      })
      .build(),
  },
  // Подготовка дополнительных пролетов без фазы А, которые идут параллельно пролетам с фазой А, чтобы потом добавить их к тому же ACLS flow_LineSpan_buffer_skipped
  {
    src: __filename,
    input: col.flow_LineSpan_list,
    output: col.flow_LineSpan_buffer_skipped,
    operationType: OperationType.replace,
    pipeline: [
      {
        $match: {
          $expr: { $not: "$model.LineSpan_aWireTypeName" },
        },
      },
      {
        $addFields: {
          startTowerId: { $ifNull: ["$model.LineSpan_StartTower", "-"] },
        },
      },
      {
        $lookup: {
          from: col.flow_LineSpan_list,
          localField: "startTowerId",
          foreignField: "model.LineSpan_EndTower",
          as: "prev",
        },
      },
      {
        $unwind: "$prev",
      },
      {
        $addFields: {
          rootId: {
            $cond: [
              "$prev.model.LineSpan_aWireTypeName",
              "$prev.id",
              "$$REMOVE",
            ],
          },
        },
      },
    ],
  },
  {
    src: __filename,
    input: col.flow_LineSpan_buffer_skipped,
    output: col.flow_LineSpan_buffer_skipped,
    operationType: OperationType.replace,
    pipeline: [
      {
        $match: {
          $expr: "$rootId",
        },
      },
      {
        $group: {
          _id: "$rootId",
          tower: { $first: "$model.LineSpan_StartTower" },
        },
      },
      {
        $graphLookup: {
          from: col.flow_LineSpan_buffer_skipped,
          startWith: "$tower",
          connectFromField: "model.LineSpan_EndTower",
          connectToField: "startTowerId",
          as: "spans",
        },
      },
      {
        $project: {
          rootId: "$_id",
          spans: "$spans._id",
        },
      },
    ],
  },
  //Добавление признака isLast к каждому пролету.
  //isLast=true если к-во непосредственно следующих за текущим пролетов <> 1 или подключен КА, иначе false.
  //(Следующие сегменты собираются по соответствию конечной и начальной опоры)
  {
    src: __filename,
    input: col.flow_LineSpan_list,
    output: col.flow_LineSpan_buffer,
    operationType: OperationType.replace,
    pipeline: [
      {
        // спорная логика, анализируем только пролеты на которых есть фаза А, см комментарии к MC-256
        $match: {
          $expr: "$model.LineSpan_aWireTypeName",
        },
      },
      // следующие пролеты
      {
        $lookup: {
          from: col.flow_LineSpan_list,
          let: { id: { $ifNull: ["$model.LineSpan_EndTower", "-"] } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$model.LineSpan_StartTower", "$$id"] },
              },
            },
            {
              // спорная логика, анализируем только пролеты на которых есть фаза А, см комментарии к MC-256
              $match: {
                $expr: "$model.LineSpan_aWireTypeName",
              },
            },
            {
              $group: {
                _id: 1,
                count: {
                  $sum: 1,
                },

                wire: {
                  $addToSet: "$model.LineSpan_aWireTypeName",
                },
                id: {
                  $addToSet: "$id",
                },
              },
            },
            {
              $unset: ["_id"],
            },
          ],
          as: "next",
        },
      },
      {
        $unwind: {
          path: "$next",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isSameWire: {
            $cond: [
              { $eq: [{ $size: { $ifNull: ["$next.wire", []] } }, 1] },
              // если есть один следующий пролет и марка провода совпадает то true
              {
                $eq: [
                  { $first: "$next.wire" },
                  {
                    $ifNull: ["$model.LineSpan_aWireTypeName", "-"],
                  },
                ],
              },
              false,
            ],
          },
        },
      },
      // ком. аппарат(ы), раньше цеплялись по опоре, теперь (когда убрана ссылка на опору) приходится использовать более изощренный способ (через следующие пролеты), чтобы не менять дальнейшую логику
      {
        $lookup: {
          from: col.model_Links,
          let: {
            nextLsIds: { $ifNull: ["$next.id", []] },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$toId", "$$nextLsIds"] },
                    { $eq: ["$predicate", "Switch_LineSpan"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: 1,
                id: {
                  $first: "$fromId",
                },
              },
            },
            // todo подхватывался удаленный КА, deletedAt на model_Links нет, этот лукап - костыль, чтобы такого не было, разобраться MC-282
            {
              $lookup: {
                from: col.model_Entities,
                localField: "id",
                foreignField: "id",
                as: "s",
              },
            },
            {
              $unwind: "$s",
            },
            {
              $unset: "s",
            },
          ],
          as: "switch",
        },
      },
      {
        $unwind: {
          path: "$switch",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isLast: {
            $or: [
              { $ne: ["$next.count", 1] },
              { $not: "$isSameWire" },
              "$switch.id",
            ],
          },
          switchId: "$switch.id",
        },
      },

      { $unset: ["next", "switch"] },
    ],
  },
  // Добавление поля prev (ссылка на предыдущий пролет).
  // Prev определяется по соответствию начальной и конечной опоры.
  // Если предыдущий пролет помечен признаком isLast, то ссылка на него не записывается
  // Таким образом пролеты которые должны войти в один ACLS связываются через поле prev начиная с конечного пролета
  // Эти данные записываются в промежуточную коллекцию
  {
    src: __filename,
    input: col.flow_LineSpan_buffer,
    output: col.flow_LineSpan_buffer,
    operationType: OperationType.replace,
    pipeline: [
      {
        $addFields: {
          startTowerId: { $ifNull: ["$model.LineSpan_StartTower", "-"] },
          endTowerId: { $ifNull: ["$model.LineSpan_EndTower", "-"] },
        },
      },
      {
        $lookup: {
          from: col.flow_LineSpan_buffer,
          localField: "startTowerId",
          foreignField: "model.LineSpan_EndTower",
          as: "prev",
        },
      },
      {
        $addFields: {
          // Крайний пролет области которая находится в обработке. Используется в логике обработки ConnectivityNode
          isBeginOfArea: { $eq: [{ $size: "$prev" }, 0] },
        },
      },
      {
        $unwind: {
          path: "$prev",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: col.flow_LineSpan_buffer,
          localField: "endTowerId",
          foreignField: "model.LineSpan_StartTower",
          as: "next",
        },
      },
      {
        $addFields: {
          // оригинальная связь
          anyPrev: "$prev._id",
          // связь с разрывами acls
          prev: { $cond: ["$prev.isLast", "$$REMOVE", "$prev._id"] },
          startTowerId: "$$REMOVE",
          // Крайний пролет области которая находится в обработке. Используется в логике обработки ConnectivityNode
          isEndOfArea: { $eq: [{ $size: "$next" }, 0] },
        },
      },
      { $unset: ["next"] },
    ],
  },
  // Добавление информации о КА для дальнейшего построения связей между acls
  {
    src: __filename,
    input: col.flow_LineSpan_buffer,
    output: col.flow_LineSpan_buffer,
    operationType: OperationType.sync,
    pipeline: new Pipeline()
      .entityId("switchId")
      .lookupSelf("swtchEntity")
      .unwindEntity()
      .lookupChildren("ConductingEquipment_Terminals", "switchTerminal")
      .addFields({
        t1: {
          $filter: {
            input: "$switchTerminal",
            as: "item",
            cond: {
              $eq: ["$$item.model.Terminal_index", 1],
            },
          },
        },
        t2: {
          $filter: {
            input: "$switchTerminal",
            as: "item",
            cond: {
              $eq: ["$$item.model.Terminal_index", 2],
            },
          },
        },
      })
      .unwind("$t1")
      .unwind("$t2")
      .lookupParent("Switch_LineSpan", "ls")
      .unwind("$ls")
      // вот добавленная информация
      .addFields({
        swtch: {
          id: "$swtchEntity.extId.processor",
          startTerminalId: "$t1.extId.processor",
          endTerminalId: "$t2.extId.processor",
          lineSpanId: "$ls.id",
        },
      })
      .unset(["t1", "t2", "switchTerminal", "switchId", "swtchEntity"])
      // остальное убираем
      .build(),
  },
];

// import * as utils from "_sys/utils"
// utils.compileFlows(flows.slice(0, 3));
