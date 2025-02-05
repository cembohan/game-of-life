const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasStyle = getComputedStyle(canvas);
const backgroundColor = canvasStyle.backgroundColor;

// Default settings
let GRID_SIZE = 50; // Number of cells (e.g., 50x50)
let CELL_SIZE = 10; // Size of each cell in pixels
const GRID_COLOR = '#ddd';
const GRID_LINE_WIDTH = 0.5;

// Get references to the input fields and button
const gridSizeInput = document.getElementById('gridSize');
const cellSizeInput = document.getElementById('cellSize');
const applyButton = document.getElementById('applySettings');
const updateButton = document.getElementById('updateGrid');
const aliveCountElement = document.getElementById('aliveCount');

const tickSpeedInput = document.getElementById('tickSpeed');
const tickSpeedValue = document.getElementById('tickSpeedValue');
const startPauseButton = document.getElementById('startPause');
const clearButton = document.getElementById('clear');

let aliveCount = 0; // Counter for alive cells
let isRunning = false;
let animationFrameId = null;
let ticksPerSecond = parseInt(tickSpeedInput.value, 10);
let tickSpeed = 1000 / ticksPerSecond;

// Function to draw the grid
function drawGrid() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set canvas size based on grid size and cell size
  canvas.width = GRID_SIZE * CELL_SIZE;
  canvas.height = GRID_SIZE * CELL_SIZE;

  // Draw vertical lines
  for (let i = 0; i <= GRID_SIZE; i++) {
    const x = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let j = 0; j <= GRID_SIZE; j++) {
    const y = j * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Initial grid draw
drawGrid();

function updateGrid_base() {
  GRID_SIZE = Math.min(100, Math.max(10, parseInt(gridSizeInput.value, 10))); // Clamp between 10 and 100
  CELL_SIZE = Math.min(50, Math.max(5, parseInt(cellSizeInput.value, 10))); // Clamp between 5 and 50
  drawGrid();
}

// Add event listener to the apply button
applyButton.addEventListener('click', updateGrid_base);

const randomizeButton = document.getElementById('randomize');
let grid = new Array(GRID_SIZE);
function randomizeGrid() {
  // Create a 2D array to store cell states (alive = 1, dead = 0)
  grid = new Array(GRID_SIZE)
    .fill()
    .map(() =>
      new Array(GRID_SIZE).fill().map(() => (Math.random() > 0.75 ? 1 : 0))
    );

  // Draw the grid with the random states
  drawGrid();
  drawCells(grid);
}

function drawCells(grid) {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 1) {
        ctx.fillStyle = 'black';
        ctx.fillRect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      } else {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = GRID_COLOR;
        ctx.strokeRect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

randomizeButton.addEventListener('click', randomizeGrid);

function updateGrid() {
  aliveCount = 0;
  const newGrid = new Array(GRID_SIZE)
    .fill()
    .map(() => new Array(GRID_SIZE).fill(0));
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const neighbors = checkNeighbors(grid, i, j);
      const element = grid[i][j];
      if (element === 0) {
        // cell is dead
        if (neighbors === 3) {
          //cell needs exactly 3 neighbors to be born
          newGrid[i][j] = 1;
          aliveCount++;
        } else {
          newGrid[i][j] = 0;
        }
      } else {
        // cell is alive
        if (neighbors < 2 || neighbors > 3) {
          //cell dies if it has less than 2 or more than 3 neighbors
          newGrid[i][j] = 0;
        } else {
          newGrid[i][j] = 1;
          aliveCount++;
        }
      }
    }
  }
  aliveCountElement.textContent = aliveCount;
  drawCells(newGrid);
  grid = newGrid;
}

function checkNeighbors(grid, x, y) {
  let neighbors = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) {
        continue;
      }
      const xIndex = (x + i + GRID_SIZE) % GRID_SIZE;
      const yIndex = (y + j + GRID_SIZE) % GRID_SIZE;
      neighbors += grid[xIndex][yIndex] === 1 ? 1 : 0;
    }
  }
  return neighbors;
}

updateButton.addEventListener('click', updateGrid);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

tickSpeedInput.addEventListener('input', () => {
  ticksPerSecond = parseInt(tickSpeedInput.value, 10);
  tickSpeed = 1000 / ticksPerSecond; // Convert TPS to milliseconds
  tickSpeedValue.textContent = ticksPerSecond;
});

function updateTickSpeedLabel() {
  tickSpeedValue.textContent = tickSpeedInput.value;
}

// Update the label on page load
updateTickSpeedLabel();

startPauseButton.addEventListener('click', () => {
  if (isRunning) {
    isRunning = false;
    startPauseButton.textContent = 'Start';
    cancelAnimationFrame(animationFrameId);
  } else {
    isRunning = true;
    startPauseButton.textContent = 'Pause';
    runSimulation();
  }
});

function runSimulation() {
  if (!isRunning) {
    return;
  }
  updateGrid();
  animationFrameId = setTimeout(runSimulation, tickSpeed);
}

clearButton.addEventListener('click', () => {
  // Stop the simulation
  isRunning = false;
  startPauseButton.textContent = 'Start';
  cancelAnimationFrame(animationFrameId);

  // Clear the grid
  grid = new Array(GRID_SIZE).fill().map(() => new Array(GRID_SIZE).fill(0));
  drawCells(grid);
});
