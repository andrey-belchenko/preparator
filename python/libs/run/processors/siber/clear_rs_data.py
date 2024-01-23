import re
import pandas as pd
from df_prep import Task, Module

def _clear_iri(text):
    match = re.findall("#.*", text)
    if match:
        res = match[0].replace('"', "").replace("#", "")
        return res

def _transform_rs(df, equip_class):
    if equip_class == "PowerTransformer":
        df = df[~df["Substation_Uid"].isnull()]

    if equip_class == "Substation":
        df["Класс"] = "Substation"
        for col in ["name", "Region"]:
            df[col] = df[col].apply(
                lambda x: x.replace('"', "").replace("=", "")
                if isinstance(x, str)
                else ""
            )
        df["Uid"] = df["Uid"].apply(_clear_iri)
    if equip_class == "VoltageLevel":
         # Фильтруем РУ RS без нейтрали, т.к. в supa только РУ
        df = df[~((df["name"].str.contains("ейтраль")) | (df["name"] == "0"))]
               
    df = df.drop_duplicates()
    return df


def create(module: Module):
    processor = module.create_processor(
        title="Сибирь. Очистка данных из платформы",
    )
    processor.add_default_input()
    processor.add_default_output()

    def action(task: Task):
        items = list(task.get_input_reader().read_all())
        writer =  task.get_output_writer()
        writer.clear()
        if (len(items)>0):
            equip_class =  items[0]["Класс"]
            df = pd.DataFrame.from_dict(items)
            df = _transform_rs(df,equip_class)
            writer.write_many(df.to_dict("records"))
        writer.close()

    processor.set_action(action)
