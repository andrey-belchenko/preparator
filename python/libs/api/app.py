from flask import Flask
import importlib


app = Flask(__name__)


@app.route("/")  # Decorator to define the route for the homepage
def hello_world():
    module_name = "api.dynamic.siber.main"
    module = importlib.import_module(module_name)
    module = importlib.reload(module)
    return {"items": module.main()}

if __name__ == "__main__":
    # app.run(debug=True)  # Start the development server
    app.run(debug=False) 
