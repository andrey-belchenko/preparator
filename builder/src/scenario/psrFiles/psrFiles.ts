import {  MultiStepFlow } from "_sys/classes/Flow";
import { Pipeline } from "_sys/classes/Pipeline";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as utils from "_sys/utils";


export const flow: MultiStepFlow = {
  src: __filename,
  trigger: col.in_СозданиеДок,
  comment: "Замена файлов PowerSystemResource",
  operation:[
    {
      src: __filename,
      input: col.in_СозданиеДок,
      output: sysCol.model_Input,
      idSource: "platform",
      pipeline: new Pipeline()
        .addFields({ "payload.body.messageId": "$messageId" })
        .replaceRoot("$payload.body")
        .entityExtId("code","КИСУР")
        .lookupSelf()
        .unwindEntity()
        .inverseLookupChildrenOfType("PsrFile","PsrFile_psr","f")
        .unwindEntity()
        .project({
          messageId: "$messageId",
          model: {
            "@action": "delete",
            "@id": "$f.id",
          },
        })
        .build(),
    },
    {
      src: __filename,
      input: col.in_СозданиеДок,
      output: sysCol.model_Input,
      idSource: "КИСУР",
      pipeline: new Pipeline()
        .addFields({ "payload.body.messageId": "$messageId" })
        .replaceRoot("$payload.body")
        // фильтр по наличию объекта на который пришли файлы
        // .entityExtId("code","КИСУР")
        // .lookupSelf()
        // .unwindEntity()
        .unwind("$files")
        .project({
          messageId: "$messageId",
          model: {
            "@type": "PsrFile",
            "@action": "create",
            "@id": {$concat:["File","$files.doknr"]},
            IdentifiedObject_name: "$files.filename",
            PsrFile_description: "$files.description",
            PsrFile_mimeType: "$files.mimetype",
            PsrFile_docNumber: "$files.doknr",
            PsrFile_fileId: "$files.ph_objid",
            PsrFile_psr: {
              "@action": "link",
              "@id": "$code",
            },
          },
        })
        .build(),
    }
  ]
};

// utils.compileFlow(flow.operation[0]);
