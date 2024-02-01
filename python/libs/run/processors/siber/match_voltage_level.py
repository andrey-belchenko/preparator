import pandas as pd
import re
from dpt import Module, Task, Processor
from run.processors.siber.utils.merge import merge_by_key_column
from run.processors.siber.utils.match_common import configure_common_ports

# import yaml
# from data_io import load_data_from_db, insert_collection_into_db
# from merge import merge_by_key_column


def create():
    processor = Processor(
        title="Сибирь. Сопоставление РУ",
    )

    class_name = "VoltageLevel"
    configure_common_ports(processor, class_name)

    processor.add_named_input(
        "Substation_matched",
        "Сопоставленные подстанции",
        default_binding=f"Substation_matched",
    )

    def action(task: Task):
        df_rs = pd.DataFrame.from_dict(task.get_named_reader("rs").read_all())
        df_supa = pd.DataFrame.from_dict(task.get_named_reader("supa").read_all())
        df_Substation_matched = pd.DataFrame.from_dict(
            task.get_named_reader("Substation_matched").read_all()
        )
        df_matched, df_rs_unmatched, df_supa_unmatched, df_duplicates = _match(
            df_rs, df_supa, df_Substation_matched
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


def _match(df_rs, df_supa, df_substations_matched):
    import warnings

    warnings.filterwarnings("ignore")

    # Берем Техместо из ПС (ранее сопоставленных). Кладем в RS20
    techplace_substations_matched = set(df_substations_matched["Техместо"].tolist())
    techplace_substations_supa = set(df_supa["ВерхнееТМ"].tolist())

    uid_substations_matched = set(df_substations_matched["Uid"].tolist())
    uid_substations_rs = set(df_rs["Substation_Uid"].tolist())

    uid2techplace = dict(
        zip(df_substations_matched["Uid"], df_substations_matched["Техместо"])
    )
    test = []
    for key in uid2techplace.keys():
        test.append(
            uid2techplace[key]
            == df_substations_matched[df_substations_matched["Uid"] == key][
                "Техместо"
            ].values[0]
        )

    assert all(test) == True
    df_rs["Техместо_ПС"] = df_rs["Substation_Uid"].apply(lambda x: uid2techplace.get(x))

    # Код РУ + Техместо
    def get_oru(text):
        if text in ["110", "110 кВ", "РП-110 кВ"]:
            text = "РУ 110"
        if text in ["ОР-110кВ", "ОРУ"]:
            text = "ОРУ 110"
        match = re.findall(".?РУ?.?[- ]*110", text)
        if match:
            res = match[0].lower().replace(" ", "").replace("-", "")
            return res
        return ""

    df_rs["code"] = df_rs["name"].apply(get_oru)
    df_supa["code"] = df_supa["Название"].apply(get_oru)

    df_supa["code_techplace"] = df_supa["code"] + "_" + df_supa["ВерхнееТМ"]
    df_rs["code_techplace"] = df_rs["code"] + "_" + df_rs["Техместо_ПС"]

    _, df_merge1, df_rs, df_supa, _ = merge_by_key_column(
        df_rs=df_rs, df_supa=df_supa, common_key_column="code_techplace"
    )

    # По оставшимся только Техместо
    df_supa["techplace"] = df_supa["ВерхнееТМ"]
    df_rs["techplace"] = df_rs["Техместо_ПС"]

    _, df_merge2, df_rs, df_supa, df_duples = merge_by_key_column(
        df_rs=df_rs, df_supa=df_supa, common_key_column="techplace"
    )

    # final result
    needed_cols = ["Uid", "Техместо", "name", "Название", "Класс"]
    columns2rename = {"name": "Наименование", "Название": "Дисп_наименование"}

    df_union = pd.concat([df_merge1, df_merge2])
    df_res = df_union[needed_cols].rename(columns=columns2rename)
    df_supa = df_supa[~df_supa["Техместо"].isin(df_res["Техместо"].unique())]
    df_rs = df_rs[~df_rs["Uid"].isin(df_res["Uid"].unique())]

    print(
        "Сопоставлено", (df_res.shape[0]) / (df_supa.shape[0] + df_res.shape[0]), "СУПА"
    )
    print("Сопоставлено", (df_res.shape[0]) / (df_rs.shape[0] + df_res.shape[0]), "RS")

    return df_res, df_supa, df_rs, df_duples
