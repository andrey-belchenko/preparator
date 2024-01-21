import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "../_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";

export const flow: MultiStepFlow = {
  src: __filename,
  comment:
    "Формирование данных по линейным КА для загрузки в интеграционную БД",
  operation: [
    // {
    //   input: thisCol.KISUR_LineSwitchTower,
    //   output: sysCol.model_Input,
    //   operationType: OperationType.insert,
    //   useDefaultFilter: false,
    //   pipeline: [
    //     {
    //       $project: {
    //         model: {
    //           "@id": "$КодКА",
    //           "@idSource": "КИСУР",
    //           Switch_Tower: {
    //             "@idSource": "КИСУР",
    //             "@type": "Tower",
    //             "@id": "$КодОпоры",
    //           },
    //         },
    //       },
    //     },
    //   ],
    // },
    {
      input: thisCol.KISUR_LineSwitchTower,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .matchExpr("$КодСледующегоПролета")
        .lookup({
          from: thisCol.KISUR_LineSpan,
          localField: "КодСледующегоПролета",
          foreignField: "КодПролета",
          as: "ls",
        })
        .unwind("$ls")
        .project({
          model: {
            "@id": "$КодКА",
            "@idSource": "КИСУР",
            "@lastSource": "keep",
            Switch_LineSpan: {
              "@idSource": "КИСУР",
              "@type": "LineSpan",
              "@lastSource": "keep",
              "@id": "$КодСледующегоПролета",
            },
          },
        })
        .build(),
    },
  ],
};

// utils.compileFlow(flow);
