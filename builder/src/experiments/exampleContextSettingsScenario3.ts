import { ContextSetting } from "_sys/classes/MessageContextSetting";

export const contextSettings: ContextSetting[] = [
  {
    messageType: "СозданиеУчасткаМагистрали",
    idSource: "КИСУР",
    contextQueries: [
      {
        queryId: "[ИД семантического запроса]",
        rootIds: ["$Тело.ЛЭП.КодТехническогоОбъекта"],
      },
    ],
  },
  {
    messageType: "СозданиеОтпайки",
    idSource: "КИСУР",
    contextQueries: [
      {
        queryId: "[ИД семантического запроса]",
        rootIds: ["$Тело.ЛЭП.КодТехническогоОбъекта"],
      },
    ],
  },
  {
    messageType: "РазделениеУчасткаМагистралиКА",
    idSource: "КИСУР",
    contextQueries: [
      {
        queryId: "[ИД семантического запроса]",
        rootIds: ["$Тело.ЛЭП.КодТехническогоОбъекта"],
      },
    ],
  },
  {
    messageType: "УдалениеКА",
    idSource: "КИСУР",
    contextQueries: [
      {
        queryId: "[ИД семантического запроса]",
        rootIds: ["$Тело.ЛЭП.КодТехническогоОбъекта"],
      },
    ],
  },
  {
    messageType: "УдалениеСегмента",
    idSource: "КИСУР",
    contextQueries: [
      {
        queryId: "[ИД семантического запроса]",
        rootIds: ["$Тело.ЛЭП.КодТехническогоОбъекта"],
      },
    ],
  },
];