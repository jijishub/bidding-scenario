import os

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def render_stars(stars, width, height):
    #create an empty grid filled with spaces
    grid = [[' ' for _ in range(width)] for _ in range(height)]

    #place each star in the grid
    for star in stars:
        x, y = star['x'], star['y']
        if 0 <= x < width and 0 <= y < height:
            grid[y][x] = star['char']

    #print the grid to the terminal
    for row in grid:
        print(''.join(row)) 
        