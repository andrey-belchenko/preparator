from df_prep import system, Task, ParamType

processor = system.create_processor(
    name="string_normalizer",
    title="Нормализация строк",
    description="Удаление лишних пробелов, табуляции и переводов строки во всех полях коллекции.",
)

processor.add_output(name="input1", title="Коллекция источник")
processor.add_output(name="output1", title="Целевая коллекция")


def action(task: Task):
    items = task.get_input_reader("input1").read_all()
     # todo реализовать логику обработки и вставку порциями
    items = task.get_output_writer("output1").write_many(items)

processor.set_action(action)



