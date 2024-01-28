from flask_restx import Api, Resource, fields


def create_models(api: Api):
    project_model = api.model(
        "Project",
        {
            "name": fields.String(),
            # "modules": fields.Nested(fields.List(fields.Nested(module_model))),
        },
    )

    port_info_model = api.model(
        "PortInfo",
        {
            "name": fields.String(),
            "default_binding": fields.String(),
            "read_only": fields.Boolean(),
            "schema": fields.Raw(),  # Handle schema data flexibly
        },
    )

    module_model = api.model(
        "Module",
        {
            "project": fields.Nested(project_model),
            "name": fields.String(),
            # "processors": fields.Nested(fields.List(fields.Nested(processor_model))),
        },
    )

    processor_model = api.model(
        "Processor",
        {
            "module": fields.Nested(module_model),
            "name": fields.String(),
            "inputs": fields.List(fields.Nested(port_info_model)),
            "outputs": fields.List(fields.Nested(port_info_model)),
        },
    )

    return project_model, module_model, processor_model, port_info_model
