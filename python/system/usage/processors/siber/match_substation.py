import pandas as pd
import re
from dpt import Module, Task, Processor
from run.processors.siber.utils.merge import merge_by_key_column
from run.processors.siber.utils.match_common import configure_common_ports


def create():
    processor = Processor(
        title="Сибирь. Сопоставление подстанций",
    )

    class_name = "Substation"
    configure_common_ports(processor, "Substation")

    processor.add_named_input(
        "old_matched",
        "Ранее сопоставленные данные",
        default_binding=f"{class_name}_matched_before",
    )

    def action(task: Task):
        df_rs = pd.DataFrame.from_dict(task.get_named_reader("rs").read_all())
        df_supa = pd.DataFrame.from_dict(task.get_named_reader("supa").read_all())
        df_old_matched = pd.DataFrame.from_dict(
            task.get_named_reader("old_matched").read_all()
        )
        df_matched, df_rs_unmatched, df_supa_unmatched, df_duplicates = _match(
            df_rs, df_supa, df_old_matched
        )

        def save(data, output_name):
            writer = task.get_named_writer(output_name)
            writer.clear()
            writer.write_many(data.to_dict("records"))
            writer.close()

        save(df_matched, "matched")
        save(df_rs_unmatched, "rs_unmatched")
        save(df_supa_unmatched, "supa_unmatched")
        save(df_duplicates, "duplicates")

    processor.set_action(action)
    return processor


def _match(df_rs, df_supa, df_old_matched):
    # import yaml
    # from data_io import load_data_from_db, insert_collection_into_db
    # from merge import merge_by_key_column

    # with open('params.yml', 'r') as f:
    #     params = yaml.full_load(f)
    # class_name = "Substation"

    be2region = {
        4200: "Кемеровская область",
        2400: "Красноярский край",
        2200: "Алтайский край",
        300: "Республика Бурятия",
        1900: "Республика Хакасия",
        7500: "Забайкальский край",
        400: "Республика Алтай",
        5500: "Омская область",
    }

    # load data
    # df_rs, df_supa, df_old_matched = load_data_from_db(class_name, params)

    # df_rs transform
    df_rs = df_rs[df_rs["name"].str.contains("110")]

    # ручное
    df_rs.loc[df_rs["name"] == "ПС 110 кВ Баженово", "Substations"] = "Омская область"
    df_rs.loc[
        df_rs["name"] == "ПС 110 кВ Береговая (МЭС)", "name"
    ] = "ПС 110 кВ БереговаяМЭС"
    df_rs.loc[
        df_rs["Uid"] == "5ea93f73-4576-4cf8-8693-4a2b87c83816", "Substations"
    ] = "Омская область"
    df_rs.loc[
        df_rs["name"] == "ПС 110 кВ Городская (Красноярск)", "name"
    ] = "Городская-кэс"
    df_rs.loc[df_rs["name"] == "ПС 110 кВ Городская (ВЭС)", "name"] = "Городская-вэс"
    df_rs.loc[df_rs["name"] == "ПС 110 кВ Городская (СЭС)", "name"] = "Городская-сэс"
    df_rs.loc[
        df_rs["Uid"] == "985a1a39-ba35-4baa-8647-d597ad014e40", "Substations"
    ] = "Омская область"
    df_rs.loc[
        df_rs["Uid"] == "66a545f3-f31b-4431-b970-8f41493b5e45", "Substations"
    ] = "Омская область"
    df_rs.loc[
        df_rs["name"] == "ПС 110 кВ ТПК Надеждинский", "Substations"
    ] = "Омская область"
    # ---

    # df_supa transform
    df_supa["БЕ"] = df_supa["БЕ"].astype("int")
    df_supa["region"] = df_supa["БЕ"].apply(lambda x: be2region.get(x))

    df_supa = df_supa.dropna(subset="region")

    # ручное
    df_supa.loc[
        df_supa["Название"] == "ПС 110 кВ Береговая (МЭС)", "Название"
    ] = "ПС 110 кВ БереговаяМЭС"
    df_supa.loc[
        df_supa["Дисп_наименование"] == "ПС 110 кВ Городская (КЭС)", "Название"
    ] = "Городская-кэс"
    df_supa.loc[
        df_supa["Дисп_наименование"] == "ПС 110 кВ Городская (ВЭС)", "Название"
    ] = "Городская-вэс"
    df_supa.loc[
        df_supa["Дисп_наименование"] == "ПС 110 кВ Городская (СЭС)", "Название"
    ] = "Городская-сэс"
    df_supa.loc[
        df_supa["Дисп_наименование"] == "ПС 110 кВ Забайкальск тяговая", "Название"
    ] = "ПС 110 кВ Забайкальск тяговая"
    # ---

    text2num = {
        "1": "один",
        "2": "два",
        "3": "три",
        "4": "четыре",
        "5": "пять",
        "6": "шесть",
        "7": "семь",
        "8": "восемь",
        "9": "девять",
    }

    def get_num(text):
        match = re.findall("[а-яА-Я]+-?\d", text)
        if match:
            num = re.findall("\d", match[0])[0]
            return re.sub("\d", f"{text2num[num]}", match[0])
        return text

    def get_name(text):
        text = text.replace("Н Бирилюссы", "Новобирилюссы")
        text = text.replace("Б.Мурта", "Большая Мурта")
        text = text.replace("Б.Салба", "Большая Салба")
        text = text.replace("Самон", "Сомон")
        text = text.replace("Кебезеньская", "Кебезенская")
        text = text.replace("Валуевская ", "Валуевская-")
        text = text.replace("Насосная станция оборотной воды", "Насосная Низовая")
        text = text.replace("Ново-Енисейский", "Новоенисейский")
        text = text.replace("Н.Енисейский", "Новоенисейский")
        text = text.replace("Ново-Широкая", "Новоширокая")
        text = text.replace('ПС "Октябрьская 2"', "Октябрьская-2")
        text = text.replace(
            "ПС 110 кВ Тепличная (Осинник. РЭС)", "ПС 110 кВ Осинниковская Тепличная"
        )
        text = text.replace('ПС "Улан-Удэнскптицефабрика (ПТФ)"', "ПС Птицефабрика")
        text = text.replace("Северная (ЗЭС)", "СевернаяЗЭС")
        text = text.replace("Сосново-Озерская", "Сосновоозерская")
        text = text.replace('ПС "Стройбаза" С', "ПС Стройбаза")
        text = text.replace(
            'ПС "Надеждинский ТПК" 110/10', "ПС 110 кВ ТПК Надеждинский"
        )
        text = text.replace("Устькалманская", "Усть-Калманская")
        text = text.replace("Цвет. мет", "Цветметные металлы")
        text = text.replace("ПС 110 кВ", "")
        text = text.replace("ТПС", "")
        text = text.replace("НПС", "")
        text = text.replace("ПС", "")
        text = text.replace("ПП", "")
        text = text.replace('"', "")
        text = text.replace("№", "")
        text = text.replace("кВ", "")
        text = text.replace("110", "")

        text = get_num(text)
        match = re.findall("[А-Яа-яёЁ]+[ -]?[А-Яа-яёЁ]+", text)
        if match:
            res = match[0].replace("ская", "")
            res = re.sub("ка[$ ]?", " ", res)
            res = res.replace("ё", "е")
            res = re.sub("Т$", "", res)
            res = res.strip()
            res = res.replace(" ", "-")
            return res.lower()
        return ""

    # name + region
    df_rs["name_norm"] = df_rs["name"].apply(get_name)
    df_supa["name_norm"] = df_supa["Название"].apply(get_name)

    df_rs["name_region"] = df_rs["name_norm"] + "_" + df_rs["Substations"]
    df_supa["name_region"] = df_supa["name_norm"] + "_" + df_supa["region"]

    # ручное
    df_rs.loc[
        (df_rs["name"].str.contains("ГПП-2 ЦБК"))
        & (df_rs["Substations"] == "Красноярский край"),
        "name_region",
    ] = "гпп-два-цбк Красноярский край"
    df_supa.loc[
        (df_supa["Название"].str.contains("ГПП-2 ЦБК"))
        & (df_supa["region"] == "Красноярский край"),
        "name_region",
    ] = "гпп-два-цбк Красноярский край"
    df_rs.loc[
        (df_rs["name"].str.contains("ГПП-2"))
        & (df_rs["Substations"] == "Республика Хакасия"),
        "name_region",
    ] = "гпп-два Республика Хакасия"
    df_supa.loc[
        (df_supa["Название"].str.contains("ГПП-2"))
        & (df_supa["region"] == "Республика Хакасия"),
        "name_region",
    ] = "гпп-два Республика Хакасия"
    df_rs.loc[
        (df_rs["name"] == "ПС 110 кВ 827 Объект")
        & (df_rs["Substations"] == "Забайкальский край"),
        "name_region",
    ] = "827-объект Забайкальский край"
    df_supa.loc[
        (df_supa["Название"] == "ПС 110 кВ Обьект 827")
        & (df_supa["region"] == "Забайкальский край"),
        "name_region",
    ] = "827-объект Забайкальский край"
    df_rs.loc[
        (df_rs["name"] == "ПС 110 кВ БНС ТЭЦ-3")
        & (df_rs["Substations"] == "Красноярский край"),
        "name_region",
    ] = "бнс-тэц-три_Красноярский край"
    df_supa.loc[
        (df_supa["Название"] == "ПС 110 кВ БНС ТЭЦ-3")
        & (df_supa["region"] == "Красноярский край"),
        "name_region",
    ] = "бнс-тэц-три_Красноярский край"
    df_supa.loc[
        (df_supa["Название"] == "СЗССМ ПС Карат (Ведомственая)")
        & (df_supa["region"] == "Республика Хакасия"),
        "name_region",
    ] = "карат_Республика Хакасия"
    # ---

    _, df_merge1, df_rs, df_supa, _ = merge_by_key_column(
        df_rs=df_rs, df_supa=df_supa, common_key_column="name_region"
    )

    # name_norm only
    _, df_merge2, df_rs, df_supa, df_duples = merge_by_key_column(
        df_rs=df_rs, df_supa=df_supa, common_key_column="name_norm"
    )

    needed_cols = ["Uid", "Техместо", "name", "Дисп_наименование", "Класс_rs"]
    columns2rename = {
        "Класс_rs": "Класс",
        "name": "Наименование",
        "Дисп_наименование": "Диспетчерское наименование",
    }
    df_union = pd.concat([df_merge1[needed_cols], df_merge2[needed_cols]]).rename(
        columns=columns2rename
    )

    # + сравнение с сопоставленными ранее
    uids_unmatched = set(df_rs["Uid"])
    try:
        uids_old_matched = set(df_old_matched["Uid"])
    except KeyError:
        uids_old_matched = set()

    res = []

    uids_common_now_before = uids_unmatched & uids_old_matched
    for uid in uids_common_now_before:
        techplace = df_old_matched[df_old_matched["Uid"] == uid]["Техместо"].values[0]
        controller = df_supa[df_supa["Техместо"] == techplace][
            "Дисп_наименование"
        ].values
        if controller.size == 0:
            controller = [""]
        res.append(
            (
                uid,
                techplace,
                df_rs[df_rs["Uid"] == uid]["name"].values[0],
                controller[0],
                df_rs[df_rs["Uid"] == uid]["Класс"].values[0],
            )
        )

    df_handy_res = pd.DataFrame(
        data=res,
        columns=[
            "Uid",
            "Техместо",
            "Наименование",
            "Диспетчерское наименование",
            "Класс",
        ],
    )
    techplaces_common_handy_res_union = set(df_handy_res["Техместо"]) & set(
        df_union["Техместо"]
    )
    df_handy_res = df_handy_res[
        ~df_handy_res["Техместо"].isin(techplaces_common_handy_res_union)
    ]

    # final result
    df_union_handy = pd.concat([df_union, df_handy_res])  # сопоставленные
    df_supa = df_supa[
        ~df_supa["Техместо"].isin(df_union_handy["Техместо"].unique())
    ]  # СУПА несопоставленные
    df_rs = df_rs[
        ~df_rs["Uid"].isin(df_union_handy["Uid"].unique())
    ]  # RS несопоставленные

    # insert_collection_into_db(
    #     class_name=class_name,
    #     params=params,
    #     collection_name=f"{class_name}_matched",
    #     df=df_union_handy,
    # )

    # insert_collection_into_db(
    #     class_name=class_name,
    #     params=params,
    #     collection_name="SUPA_unmatched",
    #     df=df_supa,
    # )

    # insert_collection_into_db(
    #     class_name=class_name, params=params, collection_name="RS_unmatched", df=df_rs
    # )

    # insert_collection_into_db(
    #     class_name=class_name,
    #     params=params,
    #     collection_name=f"{class_name}_duplicates",
    #     df=df_duples,
    # )

    print(
        "Сопоставлено",
        (df_union_handy.shape[0]) / (df_supa.shape[0] + df_union_handy.shape[0]),
        "СУПА",
    )
    print(
        "Сопоставлено",
        (df_union_handy.shape[0]) / (df_rs.shape[0] + df_union_handy.shape[0]),
        "RS",
    )
    return df_union_handy, df_supa, df_rs, df_duples
