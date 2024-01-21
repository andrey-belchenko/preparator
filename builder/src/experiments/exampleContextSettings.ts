import { ContextSetting } from "_sys/classes/MessageContextSetting";

export const contextSettings: ContextSetting[] = [
  {
    messageType: "СозданиеЯчейки_Тест",
    idSource: "КИСУР",
    contextQueries: [
      {
        queryId: "http://ontology.adms.ru/UIP/modeler/config#SemanticQuery_d7ddbc37-0f95-4a32-9997-4a34bf8e5f81",
        rootIds: ["$Тело.КодТехническогоОбъекта"],
      },
      {
        queryId: "http://ontology.adms.ru/UIP/modeler/config#SemanticQuery_798a5aa1-b8f9-484d-a78f-92a784918465",
        rootIds: ["$Тело.ВышестоящийОбъект"],
      },
    ],
  },
];
