class InputConnector:
    def __init__(self, name):
        self.name = name

    def greet(self):
        msg = "Hello, my name is " + self.name
        print(msg)
        return msg