import unittest
from df_prep.connectors import InputConnector

class TestInputConnector(unittest.TestCase):
    def test_greet(self):
        obj = InputConnector("Bard")
        greeting = obj.greet()
        self.assertEqual(greeting, "Hello, my name is Bard")

if __name__ == "__main__":
    unittest.main()