/*TODO List:
-Add a density option for Randomizing.
-Add a way to draw on the grid.
-Add a generation counter.
-Add a way to possibly detect oscillations.
*/

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasStyle = getComputedStyle(canvas);
const backgroundColor = canvasStyle.backgroundColor;

// Default settings
let GRID_SIZE = 50; // Number of cells (e.g., 50x50)
let CELL_SIZE = 10; // Size of each cell in pixels
let grid;
let generationCount = 0;
let generationCounterElement = document.getElementById('generationCount');
const GRID_COLOR = '#ddd';
const GRID_LINE_WIDTH = 0.5;

// Get references to the input fields and button
const gridSizeInput = document.getElementById('gridSize');
const cellSizeInput = document.getElementById('cellSize');
const applyButton = document.getElementById('applySettings');
const updateButton = document.getElementById('updateGrid');
const aliveCountElement = document.getElementById('aliveCount');
const densityInput = document.getElementById('density');
const densityValue = document.getElementById('densityValue');

const tickSpeedInput = document.getElementById('tickSpeed');
const tickSpeedValue = document.getElementById('tickSpeedValue');
const startPauseButton = document.getElementById('startPause');
const clearButton = document.getElementById('clear');

let aliveCount = 0; // Counter for alive cells
let isRunning = false;
let animationFrameId = null;
let ticksPerSecond = parseInt(tickSpeedInput.value, 10);
let tickSpeed = 1000 / ticksPerSecond;
let density_percent = (100 - parseInt(densityInput.value, 10)) / 100;

let isDrawing = false;
let lastCell = { x: -1, y: -1 };

let previousStates = new Map();
let cycleLogs = document.getElementById('cycleLogs');
let loggedCycles = new Set();
let cycleCounts = new Map();
let firstGridHash = null; // Store the very first grid hash

if (cycleLogs === null) {
  cycleLogs = document.createElement('div');
  cycleLogs.id = 'cycleLogs';
  document.body.appendChild(cycleLogs);
}
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
initializeGrid();

function updateGrid_base() {
  GRID_SIZE = Math.min(100, Math.max(10, parseInt(gridSizeInput.value, 10))); // Clamp between 10 and 100
  CELL_SIZE = Math.min(50, Math.max(5, parseInt(cellSizeInput.value, 10))); // Clamp between 5 and 50
  drawGrid();
  initializeGrid();
}

// Add event listener to the apply button
applyButton.addEventListener('click', updateGrid_base);

const randomizeButton = document.getElementById('randomize');
function randomizeGrid() {
  // Create a 2D array to store cell states (alive = 1, dead = 0)
  console.log(density_percent);
  grid = new Array(GRID_SIZE)
    .fill()
    .map(() =>
      new Array(GRID_SIZE)
        .fill()
        .map(() => (Math.random() > density_percent ? 1 : 0))
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

  generationCount++;
  generationCounterElement.textContent = generationCount;

  const gridHash = hashGrid(grid);

  if (previousStates.has(gridHash)) {
    const firstOccurrence = previousStates.get(gridHash);
    let cycleInfo = cycleCounts.get(gridHash);

    if (!cycleInfo) {
      cycleInfo = {
        cycleLength: null,
        occurrences: 0,
        startGeneration: firstOccurrence,
        initialHash: gridHash,
      };
      cycleCounts.set(gridHash, cycleInfo);
    }

    cycleInfo.occurrences++;

    if (cycleInfo.occurrences >= 2 && cycleInfo.cycleLength === null) {
      cycleInfo.cycleLength = generationCount - cycleInfo.startGeneration;
    } else if (
      cycleInfo.occurrences >= 2 &&
      gridHash === cycleInfo.initialHash
    ) {
      const cycleKey = `${cycleInfo.initialHash}-${cycleInfo.cycleLength}`;
      if (!loggedCycles.has(cycleKey)) {
        const logEntry = document.createElement('p');
        logEntry.textContent = `Cycle detected! Length: ${cycleInfo.cycleLength} generations (Starting at generation ${cycleInfo.startGeneration})`;
        cycleLogs.appendChild(logEntry);
        loggedCycles.add(cycleKey);
      }
      // DO NOT reset cycleInfo here. Let it continue to track.
    }
  } else {
    previousStates.set(gridHash, generationCount);
    cycleCounts.clear(); // Clear cycleCounts when a new state is encountered
  }
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

densityInput.addEventListener('input', () => {
  density_percent = (100 - parseInt(densityInput.value, 10)) / 100;
  densityValue.textContent = densityInput.value;
});

function updateTickSpeedLabel() {
  tickSpeedValue.textContent = tickSpeedInput.value;
}

function updateDensityLabel() {
  densityValue.textContent = densityInput.value;
}

// Update the label on page load
updateTickSpeedLabel();
updateDensityLabel();

startPauseButton.addEventListener('click', () => {
  if (isRunning) {
    isRunning = false;
    startPauseButton.textContent = 'Start';
    cancelAnimationFrame(animationFrameId);
  } else {
    isRunning = true;
    startPauseButton.textContent = 'Pause';
    if (generationCount === 0) {
      previousStates.clear();
      cycleLogs.innerHTML = '';
      loggedCycles.clear();
      cycleCounts.clear();
      firstGridHash = null; // Reset firstGridHash
    }
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
  initializeGrid();
  generationCount = 0;
  generationCounterElement.textContent = generationCount;
  previousStates.clear();
  cycleLogs.innerHTML = '';
  loggedCycles.clear();
  cycleCounts.clear();
  firstGridHash = null; // Reset firstGridHash
});

function initializeGrid() {
  grid = new Array(GRID_SIZE).fill().map(() => new Array(GRID_SIZE).fill(0));
  drawCells(grid);
  updateInputFields();
}
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseleave', endDrawing);

function startDrawing(e) {
  isDrawing = true;
  const { x, y } = getGridCell(e);
  toggleCell(x, y);
  lastCell = { x, y };
}

function draw(e) {
  if (!isDrawing) return;
  const { x, y } = getGridCell(e);

  // Only update if we moved to a new cell
  if (x !== lastCell.x || y !== lastCell.y) {
    toggleCell(x, y);
    lastCell = { x, y };
  }
}

function endDrawing() {
  isDrawing = false;
  lastCell = { x: -1, y: -1 };
}

function getGridCell(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  return {
    x: Math.floor(mouseX / CELL_SIZE),
    y: Math.floor(mouseY / CELL_SIZE),
  };
}

function toggleCell(x, y) {
  // Ensure coordinates are within grid bounds
  if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
    grid[x][y] = grid[x][y] ? 0 : 1;
    drawSingleCell(x, y); // Optimized to only redraw the changed cell
  }
}

// Modified draw function to handle single cells
function drawSingleCell(x, y) {
  if (grid[x][y] === 0) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    ctx.strokeStyle = GRID_COLOR;
    ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  } else {
    ctx.fillStyle = 'black';
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }
}

function updateInputFields() {
  gridSizeInput.value = GRID_SIZE;
  cellSizeInput.value = CELL_SIZE;
}

function hashGrid(grid) {
  // Convert the 2D grid to a string for hashing.
  let hashString = '';
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      hashString += grid[i][j];
    }
  }
  return hashString; // A simple string hash.  Consider a better hash if performance is critical.
}
