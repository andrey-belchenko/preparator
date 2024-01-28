from flask import Flask
from flask_restx import Api, Resource, fields , reqparse
from pymongo import MongoClient
from flask import request
from api.models import create_models

_app = Flask(__name__)
_api = Api(_app, title="DPT python server API")

_project_model, _module_model, _processor_model, _port_info_model = create_models(_api)

_project_namespace = _api.namespace("projects")


mongo = MongoClient(f"mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017")

_collection_prefix = "sys_python_"

parser = reqparse.RequestParser()
parser.add_argument("db_name", type=str, required=True, help="The name of the database to access")

@_project_namespace.route("/")
class ProjectList(Resource):
    @_api.marshal_list_with(_project_model)
    def get(self):
        args = parser.parse_args()  # Parse request with the defined parser
        db_name = args["db_name"]  # Access the parsed db_name
        db = mongo[db_name]
        collection = db[f"{_collection_prefix}project"]
        return list(collection.find({}))


# Model for user data
user_model = _api.model(
    "User",
    {
        "id": fields.Integer(readonly=True, description="The user ID"),
        "name": fields.String(required=True, description="The user's name"),
    },
)

# Sample user data (replace with your actual data source)
users = [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
]

# Namespace for user-related endpoints
user_namespace = _api.namespace("users", description="Operations on users")


@user_namespace.route("/")
class UserList(Resource):
    @_api.marshal_list_with(user_model)
    def get(self):
        """Retrieve a list of all users."""
        return users

    @_api.expect(user_model)
    @_api.marshal_with(user_model, code=201)
    def post(self):
        """Create a new user."""
        new_user = _api.payload
        # Validate and add the user to the data source (implementation omitted)
        users.append(new_user)
        return new_user, 201


@user_namespace.route("/<int:user_id>")
@_api.response(404, "User not found")
class User(Resource):
    @_api.marshal_with(user_model)
    def get(self, user_id):
        """Retrieve a specific user by ID."""
        user = next((user for user in users if user["id"] == user_id), None)
        if user:
            return user
        else:
            _api.abort(404)


if __name__ == "__main__":
    _app.run(debug=True)
