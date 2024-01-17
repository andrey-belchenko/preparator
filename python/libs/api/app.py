from flask import Flask



app = Flask(__name__)


@app.route("/")  # Decorator to define the route for the homepage
def hello_world():
    from api.root import items
    import api.dynamic
    return {"items": items}


if __name__ == "__main__":
    app.run(debug=True)  # Start the development server
