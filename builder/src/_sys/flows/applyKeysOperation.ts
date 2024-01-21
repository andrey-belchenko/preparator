import {
  FilterType,
  Flow,
  MultiStepFlow,
  OperationType,
  WhenMatchedOperation,
} from "_sys/classes/Flow";
import * as col from "collections";
import * as sysCol from "_sys/collections";
import * as difOutput from "_sys/flows/diffOutput";
import { Pipeline } from "_sys/classes/Pipeline";
import * as utils from "_sys/utils";
import * as trig from "triggers";
// todo  в sys не должно быть ссылок на preparation и view учесть при наведении порядка
// наверное убрать этот файл из sys
import { createFlows as matchProcessingFlows } from "preparation/matchProcessing/_all";
import {
  MatchingStatus,
  BlockedMessageStatus,
  OperationStatus,
} from "view/ui/statuses";
import * as viewCol from "view/ui/collections";

// - Статистика и статус в журнале операций
// - Запись сопоставленных ключей в модель
// - Обработка новых сопоставленных ключей
// - Удалить forbidden
// - Изменить статус в сопоставлении
// - Найти сообщения и отправить на обработку
// - Изменить статус в отложенных сообщениях
// - Изменить статус в журнале
export const flow: MultiStepFlow = {
  src: __filename,
  trigger: trig.trigger_ExtraMatchingApply,
  operation: [
    {
      input: sysCol.sys_applyKeysOperation,
      filterType: FilterType.changedAt,
      output: sysCol.sys_applyKeysOperation,
      operationType: OperationType.sync,
      whenMatched: WhenMatchedOperation.merge,
      comment: "Статистика и статус в журнале операций",
      pipeline: new Pipeline()
        .lookup({
          from: sysCol.sys_model_ExtraIdMatching,
          localField: "id",
          foreignField: "applyOperationId",
          as: "m",
        })
        .project({
          _id: "$_id",
          status: OperationStatus.processing,
          startedAt: "$$NOW",
          entitiesCount: { $size: "$m" },
        })
        .build(),
    },
    {
      input: sysCol.sys_applyKeysOperation,
      filterType: FilterType.changedAt,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      comment: "Запись сопоставленных ключей в модель",
      pipeline: new Pipeline()
        .lookup({
          from: sysCol.sys_model_ExtraIdMatching,
          localField: "id",
          foreignField: "applyOperationId",
          as: "m",
        })
        .unwind("$m")
        .matchExpr({ $not: "$m.allowCreate" })
        .entityId("m.platformId")
        .lookupSelf("e")
        .unwindEntity()
        .addFields({
          id: {
            $arrayToObject: [
              [
                ["$m.idSource", "$m.id"],
                ["processor", "$m.id"],
                ["platform", "$m.platformId"],
              ],
            ],
          },
        })
        .project({
          model: {
            "@type": "$e.type",
            "@id": "$id",
            "@action": "update",
            PowerSystemResource_ccsCode: "$m.id",
          },
        })
        .build(),
    },
    ...matchProcessingFlows(true),
    {
      input: sysCol.sys_applyKeysOperation,
      filterType: FilterType.changedAt,
      output: sysCol.sys_model_ForbiddenEntities,
      operationType: OperationType.sync,
      whenMatched: WhenMatchedOperation.merge,
      comment:
        "Удаление записей о том, что запрещена обработка объектов, для объектов, по которым появилось сопоставление",
      pipeline: new Pipeline()
        .lookup({
          from: sysCol.sys_model_ExtraIdMatching,
          localField: "id",
          foreignField: "applyOperationId",
          as: "m",
        })
        .unwind("$m")
        .lookup({
          from: sysCol.sys_model_ForbiddenEntities,
          localField: "m.fullId",
          foreignField: "fullId",
          as: "o",
        })
        .unwind("$o")
        .project({
          _id: "$o._id",
          deletedAt: "$$NOW",
        })
        .build(),
    },
    {
      input: sysCol.sys_applyKeysOperation,
      filterType: FilterType.changedAt,
      output: sysCol.sys_model_ExtraIdMatching,
      operationType: OperationType.sync,
      whenMatched: WhenMatchedOperation.merge,
      comment: "Статус в сопоставлении",
      pipeline: new Pipeline()
        .lookup({
          from: sysCol.sys_model_ExtraIdMatching,
          localField: "id",
          foreignField: "applyOperationId",
          as: "m",
        })
        .unwind("$m")
        .project({
          _id: "$m._id",
          status: MatchingStatus.processed,
        })
        .build(),
    },
    {
      input: sysCol.sys_applyKeysOperation,
      filterType: FilterType.changedAt,
      output: sysCol.sys_model_BlockedDto,
      operationType: OperationType.sync,
      whenMatched: WhenMatchedOperation.merge,
      comment: "Пометка отложенных dto",
      mergeKey: "id",
      pipeline: new Pipeline()
        .lookup({
          from: sysCol.sys_model_ExtraIdMatching,
          localField: "id",
          foreignField: "applyOperationId",
          as: "m",
        })
        .lookup({
          from: sysCol.sys_model_BlockedDtoEntities,
          localField: "m.fullId",
          foreignField: "entityId",
          as: "de",
        })
        .lookup({
          from: sysCol.sys_model_BlockedDto,
          localField: "de.dtoId",
          foreignField: "id",
          as: "d",
        })
        .unwind("$d")
        .lookup({
          from: viewCol.view_blockedDto,
          localField: "d._id",
          foreignField: "_id",
          as: "vd",
        })
        .unwind("$vd")
        .match({ "vd.status": BlockedMessageStatus.ready })
        .project({
          id: "$d.id",
          applyOperationId: "$id",
        })
        .build(),
    },
    {
      input: sysCol.sys_applyKeysOperation,
      filterType: FilterType.changedAt,
      output: sysCol.sys_applyKeysOperation,
      operationType: OperationType.sync,
      whenMatched: WhenMatchedOperation.merge,
      comment: "Статистика в журнале операций",
      pipeline: new Pipeline()
        .lookup({
          from: sysCol.sys_model_BlockedDto,
          localField: "id",
          foreignField: "applyOperationId",
          as: "d",
        })
        .project({
          _id: "$_id",
          messagesCount: { $size: "$d" },
        })
        .build(),
    },
    {
      input: sysCol.sys_model_BlockedDto,
      filterType: FilterType.batchId,
      output: sysCol.sys_MessageInput,
      operationType: OperationType.sync,
      comment: "Повторная отправка сообщений по разблокированным dto",
      pipeline: new Pipeline()
        .lookup({
          from: sysCol.sys_model_BlockedMessages,
          localField: "lastMessageId",
          foreignField: "_id",
          as: "m",
        })
        .unwind("$m")
        .replaceRoot("$m.msg")
        .build(),
    },
    {
      input: sysCol.sys_model_BlockedDto,
      filterType: FilterType.batchId,
      output: sysCol.sys_model_BlockedDto,
      operationType: OperationType.sync,
      comment: "Дата обработки для отложенных сообщений",
      whenMatched: WhenMatchedOperation.merge,
      pipeline: new Pipeline()
        .project({
          _id: "$_id",
          processedAt: "$$NOW",
        })
        .build(),
    },
    {
      input: sysCol.sys_applyKeysOperation,
      filterType: FilterType.changedAt,
      output: sysCol.sys_applyKeysOperation,
      operationType: OperationType.sync,
      whenMatched: WhenMatchedOperation.merge,
      comment: "Статус в журнале операций",
      pipeline: new Pipeline()
        .project({
          _id: "$_id",
          status: OperationStatus.ready,
          finishedAt: "$$NOW",
        })
        .build(),
    },

    // {
    //   input: sysCol.sys_model_UnblockedDto,
    //   filterType:FilterType.changedAt,
    //   output: sysCol.sys_MessageInput,
    //   operationType: OperationType.sync,
    //   comment: "Повторная отправка сообщений по разблокированным dto",
    //   pipeline: new Pipeline()
    //     .lookup({
    //       from: sysCol.sys_model_BlockedMessages,
    //       localField: "lastMessageId",
    //       foreignField: "_id",
    //       as: "m",
    //     })
    //     .unwind("$m")
    //     .replaceRoot("$m.msg")
    //     .build(),
    // },
  ],
};

// utils.compileFlow(flow.operation[flow.operation.length-1])
