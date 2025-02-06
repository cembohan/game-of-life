Conway's Game of Life

Welcome to my implementation of Conway's Game of Life! This project is my first interactive JavaScript project, created as part of my journey to learn the basics of JavaScript, HTML, and CSS. It's a simple yet fascinating simulation that demonstrates how complex patterns can emerge from a set of basic rules.
What is Conway's Game of Life?

Conway's Game of Life is a cellular automaton devised by mathematician John Horton Conway in 1970. It's a zero-player game, meaning its evolution is determined by its initial state, requiring no further input from the user. The game is played on a grid of cells, each of which can be alive (1) or dead (0). The state of each cell evolves based on a set of simple rules.
Rules of the Game

    Survival: A live cell with 2 or 3 live neighbors survives to the next generation.

    Death:

        A live cell with fewer than 2 live neighbors dies (underpopulation).

        A live cell with more than 3 live neighbors dies (overpopulation).

    Birth: A dead cell with exactly 3 live neighbors becomes a live cell (reproduction).

These rules are applied simultaneously to every cell in the grid, creating the next generation of cells.
Features of This Implementation

    Interactive Grid: Click on cells to toggle them between alive and dead states.

    Simulation Controls:

        Start/Pause: Start or pause the simulation.

        Clear: Reset the grid to all dead cells.

    Adjustable Speed: Use the slider to control the simulation speed (ticks per second).

    Alive Cell Counter: Displays the number of alive cells in real-time.

How to Use

    Set the Initial State:

        Click on cells to toggle them between alive (black) and dead (white).

        You can create your own patterns or use predefined ones (e.g., gliders, pulsars).

    Run the Simulation:

        Click the Start button to begin the simulation.

        Use the slider to adjust the speed of the simulation.

    Pause or Reset:

        Click the Pause button to stop the simulation.

        Click the Clear button to reset the grid to all dead cells.

Technologies Used

    HTML: Structure of the webpage.

    CSS: Styling and layout of the grid, controls, and counter.

    JavaScript: Logic for the simulation, grid updates, and interactivity.

Why I Built This

This project is my first step into the world of interactive web development. As a computer science student, I wanted to create something that combines my interest in algorithms with my desire to learn JavaScript. Conway's Game of Life was the perfect choice because of its simplicity, elegance, and the fascinating patterns it generates.

Through this project, I learned:

    How to manipulate the DOM using JavaScript.

    How to use the HTML5 <canvas> element for rendering.

    How to handle user input (clicks, slider changes, button presses).

    The basics of game loops and simulation logic.

How to Run the Project

    You can run it using the url: https://cembohan.github.io/game-of-life/
