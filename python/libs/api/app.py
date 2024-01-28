from flask import Flask, jsonify, request
import importlib
from flask import Flask, request
from flask_restplus import Api, Resource, fields

app = Flask(__name__)
api = Api(app)

# @app.route("/")  # Decorator to define the route for the homepage
# def hello_world():
#     module_name = "api.dynamic.siber.main"
#     module = importlib.import_module(module_name)
#     module = importlib.reload(module)
#     return {"items": module.main()}

# @app.route('/modules/<module_id>/processors/<processor_id>/tasks', methods=['POST'])
# def create_task(module_id, processor_id):
   
#     task_data = request.get_json() 
#     print(f"Received task data: {task_data}")
#     response_data = {
#         'message': 'Task created successfully!',
#         "module_id": module_id,
#         "processor_id": processor_id,
#     }
#     return jsonify(response_data), 201


# Define a User model
user_model = api.model('User', {
    'id': fields.Integer,
    'name': fields.String,
    'email': fields.String,
})

# In-memory storage for users
users = []

@api.route('/users')
class Users(Resource):
    @api.marshal_list_with(user_model)
    def get(self):
        """List all users"""
        return users

    @api.expect(user_model)
    @api.marshal_with(user_model)
    def post(self):
        """Create a new user"""
        user = api.payload
        user['id'] = len(users) + 1
        users.append(user)
        return user, 201

@api.route('/users/<int:id>')
class User(Resource):
    @api.marshal_with(user_model)
    def get(self, id):
        """Get a user by ID"""
        for user in users:
            if user['id'] == id:
                return user
        api.abort(404, f"User {id} doesn't exist")

    @api.expect(user_model)
    @api.marshal_with(user_model)
    def put(self, id):
        """Update a user by ID"""
        for user in users:
            if user['id'] == id:
                user.update(api.payload)
                return user
        api.abort(404, f"User {id} doesn't exist")

    @api.marshal_with(user_model)
    def delete(self, id):
        """Delete a user by ID"""
        global users
        users = [user for user in users if user['id'] != id]
        return '', 204


if __name__ == "__main__":
    app.run(debug=True)  # Start the development server
    # app.run(debug=False) 
