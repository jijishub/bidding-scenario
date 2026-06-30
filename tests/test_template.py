"""
 how to use it: python -m unittest tests/test_template.py

 this is a sample unit test for the template rendering functionality. It uses the unittest framework to test 
 that the Jinja2 template correctly renders star positions based on provided data.
"""
import unittest

from fastapi.templating import Jinja2Templates


class TemplateRenderingTests(unittest.TestCase):
    def test_star_positions_are_rendered_from_data(self):
        templates = Jinja2Templates(directory="templates")
        rendered = templates.get_template("index.html").render(
            stars=[{"x": 5, "y": 7, "char": "*"}]
        )

        self.assertIn('data-left="6.25"', rendered)
        self.assertIn('data-top="35"', rendered)


if __name__ == "__main__":
    unittest.main()
