from flask import Flask
from flask_restx import Api, Resource, fields

app = Flask(__name__)
api = Api(app, title="User API", description="A simple API to manage users")

# Model for user data
user_model = api.model("User", {
    "id": fields.Integer(readonly=True, description="The user ID"),
    "name": fields.String(required=True, description="The user's name"),
})

# Sample user data (replace with your actual data source)
users = [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
]

# Namespace for user-related endpoints
user_namespace = api.namespace("users", description="Operations on users")

@user_namespace.route("/")
class UserList(Resource):
    @api.marshal_list_with(user_model)
    def get(self):
        """Retrieve a list of all users."""
        return users

    @api.expect(user_model)
    @api.marshal_with(user_model, code=201)
    def post(self):
        """Create a new user."""
        new_user = api.payload
        # Validate and add the user to the data source (implementation omitted)
        users.append(new_user)
        return new_user, 201

@user_namespace.route("/<int:user_id>")
@api.response(404, "User not found")
class User(Resource):
    @api.marshal_with(user_model)
    def get(self, user_id):
        """Retrieve a specific user by ID."""
        user = next((user for user in users if user["id"] == user_id), None)
        if user:
            return user
        else:
            api.abort(404)

if __name__ == "__main__":
    app.run(debug=True)