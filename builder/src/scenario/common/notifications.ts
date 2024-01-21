import { OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as col from "collections";
import { Pipeline } from "_sys/classes/Pipeline";
import * as utils from "_sys/utils";
import * as uiCol from "view/ui/collections";

const recipients = [
  "belchenko-av@adms.ru",
  "matyushkin-ye@adms.ru",
  "sukhanov-op@adms.ru",
  // "davlatov-rn@adms.ru",

  // "abakumov.ay@mrsk-1.ru",
  // "Aleksandrov.IM@mrsk-1.ru",
  // "bikmeev.ik@meket.ru",
  // "galitskiy.ap@mrsk-1.ru",
  // "Kalinovskaya.AV@mrsk-1.ru",
  // "Kirichenko.SeA@mrsk-1.ru",
  // "Morozova.AA@mrsk-1.ru",
  // "Nasonova.KV@mrsk-1.ru",
  // "Nevzorov.EV@mrsk-1.ru",
  // "Osipov.AA@mrsk-1.ru",
  // "Ostanin.GeG@mrsk-1.ru",
  // "Pavlenko.AO@mrsk-1.ru",
  // "Pokusaev.VS@mrsk-1.ru",
  // "sazykin.av@mrsk-1.ru",
  // "fedko.ds@mrsk-1.ru",
  // "Shlykova.EY@mrsk-1.ru",
];

const blockedDtoFlow: SingleStepFlow = {
  comment: "Заполнение коллекции уведомлений для отправки по email",
  src: __filename,
  input: uiCol.view_blockedDto,
  output: col.out_notifications,
  operationType: OperationType.sync,
  // sendingId заполняется сервисом отправки почты, туда записывается uuid
  mergeKey: ["id", "sendingId"],
  pipeline: new Pipeline()
    .match({ status: "Требуется сопоставление" })
    .group({
      _id: "1",
    })
    .project({
      id: "$_id",
      sendingId: "", // если поле не существует или null merge выдает ошибку
      isSent: { $literal: false },
      recipients: recipients,
      subject: "РС-20: получены сообщения по не сопоставленным объектам",
      body: concat(
        "Получены сообщения по не сопоставленным объектам ",
        dmLink("Отложенные сообщения", "BlockedMessages"),
        br(),
        "Требуется выполнить сопоставление объектов ",
        dmLink("Сопоставление", "IdMatching")
      ),
    })
    .build(),
};

const skSentObjectsFlow: SingleStepFlow = {
  comment: "Заполнение коллекции уведомлений для отправки по email",
  src: __filename,
  input: col.flow_skSentObjects,
  output: col.out_notifications,
  operationType: OperationType.sync,
  // sendingId заполняется сервисом отправки почты, туда записывается uuid
  mergeKey: ["id", "sendingId"],
  pipeline: new Pipeline()
    .matchExpr("$rcCode")
    // Алгоритм: собираем изменения по коду контейнера, к ним добавляем изменения из ранее собранного уведомления, если оно не отправлено, и перезаписываем уведомление, а если отправлено создается новое уведомление.
    // группируем по коду контейнера и собираем оборудование
    .group({
      _id: "$rcCode",
      items: { $push: "$$ROOT" },
    })
    // подхватываем уже собранное оборудование из предыдущей версии уведомления по этому контейнеру, если уведомление еще не отправлено
    .lookup({
      from: col.out_notifications,
      let: {
        id: "$_id",
      },
      pipeline: new Pipeline()
        .matchExpr({ $eq: ["$id", "$$id"] })
        .matchExpr({ $not: "$isSent" })
        .unwind("$equipment")
        .replaceRoot("$equipment")
        .build(),
      as: "prev",
    })
    // объединяем оборудование в один массив
    .addFields({
      items: { $concatArrays: ["$prev", "$items"] },
    })
    // отставляем только уникальные значения
    .unwind("$items")
    .replaceRoot("$items")
    .sort({ itemChangedAt: -1 })
    .group({
      _id: "$id",
      item: { $first: "$$ROOT" },
    })
    .unwind("$item")
    .replaceRoot("$item")
    // опять группируем по корневому контейнеру
    .sort({ isCreated: -1, isDeleted: -1, type: 1 })
    .group({
      _id: "$rcCode",
      item: { $first: "$$ROOT" },
      items: { $push: "$$ROOT" },
    })
    .project({
      id: "$_id",
      sendingId: "", // если поле не существует или null merge выдает ошибку
      isSent: { $literal: false },
      // пока хардкод , можно завести настоечную таблицу, можно заполнять ее по данным из keycloack в будущем
      recipients: recipients,
      subject: {
        $concat: [
          "РС-20: изменение ",
          "$item.rcType",
          " ",
          "$item.rcCode",
          " ",
          "$item.rcName",
        ],
      },
      equipment: "$items",
      body: concat(
        "Изменения по контейнеру оборудования:",
        br(),
        ul(
          prop("Тип контейнера", "$item.rcType"),
          prop("Наименование", "$item.rcName"),
          prop("Код ТМ", "$item.rcCode"),
          prop("Идентификатор", "$item.rcId")
        ),
        dmTreeLink("Перейти в витрину", "$item.rcId", "$item.rcId"),
        br(),
        br(),
        table(
          hrow(
            "Событие",
            "Тип объекта",
            "Наименование",
            "Код ТМ",
            "Идентификатор",
            "Дата и время изменения",
            "Ссылка на оборудование"
          ),
          {
            $reduce: {
              input: "$items",
              initialValue: "",
              in: {
                $concat: [
                  "$$value",
                  row(
                    // {
                    //   $cond: [
                    //     "$$this.isCreated",
                    //     "Создание",
                    //     {
                    //       $cond: ["$$this.isDeleted", "Удаление", "Изменение"],
                    //     },
                    //   ],
                    // },
                    {
                      $switch: {
                        branches: [
                          {
                            case: {
                              $and: [
                                "$$this.isDeleted",
                                // TODO Это не корректно, доделать
                                "$$this.isCreated",
                              ],
                            },
                            then: "Удаление",
                          },
                          {
                            case: {
                              $and: [
                                "$$this.isDeleted",
                                // TODO Это не корректно, доделать
                                { $not: "$$this.isCreated" },
                              ],
                            },
                            then: "Запрос на удаление",
                          },
                          {
                            case: "$$this.isCreated",
                            then: "Создание",
                          },
                        ],
                        default: "Изменение",
                      },
                    },
                    "$$this.type",
                    "$$this.name",
                    "$$this.code",
                    "$$this.id",
                    {
                      $dateToString: {
                        format: "%Y.%m.%d %H:%M",
                        date: "$$this.itemChangedAt",
                      },
                    },
                    dmTreeLink("Перейти в витрину", "$item.rcId", "$$this.id")
                  ),
                ],
              },
            },
          }
        )
      ),
    })
    .build(),
};

export const flows = [skSentObjectsFlow, blockedDtoFlow];

function element(tag: string, content: any[], attr = "") {
  return concat(`\n<${tag} ${attr}>\n`, ...content, `\n</${tag}>`);
}

function concat(...args: any[]) {
  return {
    $concat: args,
  };
}

function ul(...content: any[]) {
  return element("ul", content);
}

function li(...content: any[]) {
  return element("li", content);
}

function prop(name: string, value: string) {
  return li(name, ": ", val(value));
}

function br() {
  return "<br/>\n";
}

function table(...content: any[]) {
  return element(
    "table",
    content,
    'border="1" cellspacing="0" cellpadding="3"'
  );
}

function tr(...content: any[]) {
  return element("tr", content);
}

function td(...content: any[]) {
  return element("td", content);
}

function th(...content: any[]) {
  return element("th", content);
}

function tval(value: any) {
  return td(val(value));
}

function row(...cellValues: any[]) {
  let cells: any[] = [];
  for (let cellValue of cellValues) {
    cells.push(tval(cellValue));
  }
  return tr(...cells);
}

function hrow(...cellValues: any[]) {
  let cells: any[] = [];
  for (let cellValue of cellValues) {
    cells.push(th(cellValue));
  }
  return tr(...cells);
}

function val(value: any) {
  return {
    $ifNull: [value, ""],
  };
}

// const baseUrl = "http://exchange-ui.mrsk.oastu.lan";
function dmTreeLink(text: string, filterId: string, focusId: string) {
  const baseUrl = "[uiUrl]";
  return concat(
    `\n<a target="_blank" href="${baseUrl}/#/ObjectTree?treeState=%7B%22columns%22%3A%5B%7B%22name%22%3A%22name%22%2C%22dataField%22%3A%22name%22%2C%22sortIndex%22%3A0%2C%22sortOrder%22%3A%22asc%22%7D%5D%2C%22filterValue%22%3A%5B%22id%22%2C%22%3D%22%2C%22`,
    filterId,
    "%22%5D%2C%22focusedRowKey%22%3A%22",
    focusId,
    `%22%7D">`,
    text,
    "</a>"
  );
}

function dmLink(text: string, page: string) {
  const baseUrl = "[uiUrl]";
  return concat(
    `<a target="_blank" href="${baseUrl}/#/${page}">`,
    text,
    "</a>"
  );
}

// utils.compileFlow(blockedDtoFlow);
