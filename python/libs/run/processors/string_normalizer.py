from df_prep import Task, Module


def create(module: Module):
    processor = module.create_processor(
        title="Нормализация строк",
        description="Удаление лишних пробелов, табуляции и переводов строки во всех полях коллекции.",
    )

    processor.add_named_input(name="input", title="Коллекция источник")
    processor.add_named_output(name="output", title="Целевая коллекция")

    def action(task: Task):
        items = task.get_named_input_reader("input").read_all()
        writer = task.get_named_output_writer("output")
        writer.clear()
        # todo реализовать логику обработки и вставку порциями
        items = writer.write_many(items)

    processor.set_action(action)
