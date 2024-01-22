from df_prep import Task, ParamType, Module


def create(module: Module):
    processor = module.create_processor(
        name="string_normalizer",
        title="Нормализация строк",
        description="Удаление лишних пробелов, табуляции и переводов строки во всех полях коллекции.",
    )

    processor.add_input(name="input", title="Коллекция источник")
    processor.add_output(name="output", title="Целевая коллекция")

    def action(task: Task):
        items = task.get_input_reader("input").read_all()
        writer = task.get_output_writer("output")
        writer.clear()
        # todo реализовать логику обработки и вставку порциями
        items = writer.write_many(items)

    processor.set_action(action)
