import random


def generate_star_field(width, height, density):
    """
    Generate a star field with random star positions.

    Parameters:
    width (int): The width of the star field.
    height (int): The height of the star field.
    density (float): The density of stars in the field (0.0 to 1.0).
    """
    stars = []
    star_types = ['.', '*', '✦']
    num_stars = int(width * height * density)

    for _ in range(num_stars):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        char = random.choice(star_types)
        stars.append({'x': x, 'y': y, 'char': char})

    return stars
