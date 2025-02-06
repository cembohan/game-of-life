/* Game of Life Refactored */

class CycleDetector {
  constructor() {
    this.previousStates = new Map();
    this.loggedCycles = new Set();
    this.cycleCounts = new Map();
  }

  checkForCycles(gridHash, generation) {
    if (this.previousStates.has(gridHash)) {
      this.handleCycleDetection(gridHash, generation);
    } else {
      this.previousStates.set(gridHash, generation);
      this.cycleCounts.clear();
    }
  }

  handleCycleDetection(gridHash, generation) {
    const firstOccurrence = this.previousStates.get(gridHash);
    let cycleInfo = this.cycleCounts.get(gridHash) || {
      cycleLength: null,
      occurrences: 0,
      startGeneration: firstOccurrence,
      initialHash: gridHash,
    };

    cycleInfo.occurrences++;

    if (cycleInfo.occurrences >= 2 && !cycleInfo.cycleLength) {
      cycleInfo.cycleLength = generation - cycleInfo.startGeneration;
    }

    if (cycleInfo.cycleLength && gridHash === cycleInfo.initialHash) {
      this.logCycle(cycleInfo);
    }

    this.cycleCounts.set(gridHash, cycleInfo);
  }

  logCycle(cycleInfo) {
    const cycleKey = `${cycleInfo.initialHash}-${cycleInfo.cycleLength}`;
    if (!this.loggedCycles.has(cycleKey)) {
      const logEntry = document.createElement('p');
      logEntry.textContent = `Cycle detected! Length: ${cycleInfo.cycleLength} generations (Starting at generation ${cycleInfo.startGeneration})`;
      document.getElementById('cycleLogs').appendChild(logEntry);
      this.loggedCycles.add(cycleKey);
    }
  }

  reset() {
    this.previousStates.clear();
    this.loggedCycles.clear();
    this.cycleCounts.clear();
    document.getElementById('cycleLogs').innerHTML = '';
  }
}

const GameOfLife = (() => {
  // Configuration Constants
  const DEFAULTS = {
    MIN_GRID_SIZE: 10,
    MAX_GRID_SIZE: 100,
    MIN_CELL_SIZE: 5,
    MAX_CELL_SIZE: 50,
    GRID_COLOR: '#ddd',
    GRID_LINE_WIDTH: 0.5,
    INITIAL_TICK_SPEED: 5,
    INITIAL_DENSITY: 50,
  };

  // DOM Elements
  const elements = {
    canvas: document.getElementById('gameCanvas'),
    generationCount: document.getElementById('generationCount'),
    gridSizeInput: document.getElementById('gridSize'),
    cellSizeInput: document.getElementById('cellSize'),
    applyButton: document.getElementById('applySettings'),
    randomizeButton: document.getElementById('randomize'),
    updateButton: document.getElementById('updateGrid'),
    aliveCount: document.getElementById('aliveCount'),
    densityInput: document.getElementById('density'),
    densityValue: document.getElementById('densityValue'),
    tickSpeedInput: document.getElementById('tickSpeed'),
    tickSpeedValue: document.getElementById('tickSpeedValue'),
    startPauseButton: document.getElementById('startPause'),
    clearButton: document.getElementById('clear'),
    cycleLogs: document.getElementById('cycleLogs') || createCycleLogs(),
  };

  // State Management
  const state = {
    grid: [],
    generation: 0,
    aliveCells: 0,
    isRunning: false,
    animationId: null,
    isDrawing: false,
    lastCell: { x: -1, y: -1 },
    cellSize: parseInt(elements.cellSizeInput.value, 10),
    gridSize: parseInt(elements.gridSizeInput.value, 10),
    tickSpeed: 1000 / parseInt(elements.tickSpeedInput.value, 10),
    density: (100 - parseInt(elements.densityInput.value, 10)) / 100,
    previousStates: new Map(),
    cycleDetector: new CycleDetector(),
  };

  // Canvas Context
  const ctx = elements.canvas.getContext('2d');
  const backgroundColor = getComputedStyle(elements.canvas).backgroundColor;

  // Module Initialization
  function init() {
    setupEventListeners();
    applySettings();
  }

  // Event Handling
  function setupEventListeners() {
    elements.applyButton.addEventListener('click', applySettings);
    elements.randomizeButton.addEventListener('click', randomizeGrid);
    elements.updateButton.addEventListener('click', updateGeneration);
    elements.startPauseButton.addEventListener('click', toggleSimulation);
    elements.clearButton.addEventListener('click', clearGrid);

    elements.tickSpeedInput.addEventListener('input', updateTickSpeed);
    elements.densityInput.addEventListener('input', updateDensity);

    elements.canvas.addEventListener('mousedown', startDrawing);
    elements.canvas.addEventListener('mousemove', draw);
    elements.canvas.addEventListener('mouseup', endDrawing);
    elements.canvas.addEventListener('mouseleave', endDrawing);
  }

  // Grid Management
  function initializeGrid() {
    state.grid = createEmptyGrid();
    drawFullGrid();
  }

  function createEmptyGrid() {
    return Array(state.gridSize)
      .fill()
      .map(() => Array(state.gridSize).fill(0));
  }

  function resizeGrid() {
    elements.canvas.width = state.gridSize * state.cellSize;
    elements.canvas.height = state.gridSize * state.cellSize;
  }

  // Drawing Functions
  function drawFullGrid() {
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    drawGridLines();
    drawAllCells();
  }

  function drawGridLines() {
    ctx.strokeStyle = DEFAULTS.GRID_COLOR;
    ctx.lineWidth = DEFAULTS.GRID_LINE_WIDTH;

    // Vertical lines
    for (let i = 0; i <= state.gridSize; i++) {
      const x = i * state.cellSize;
      drawLine(x, 0, x, elements.canvas.height);
    }

    // Horizontal lines
    for (let j = 0; j <= state.gridSize; j++) {
      const y = j * state.cellSize;
      drawLine(0, y, elements.canvas.width, y);
    }
  }

  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawAllCells() {
    state.grid.forEach((row, x) => {
      row.forEach((cell, y) => drawCell(x, y, cell));
    });
  }

  function drawCell(x, y, alive) {
    ctx.fillStyle = alive ? 'black' : backgroundColor;
    ctx.fillRect(
      x * state.cellSize,
      y * state.cellSize,
      state.cellSize,
      state.cellSize
    );

    if (!alive) {
      ctx.strokeStyle = DEFAULTS.GRID_COLOR;
      ctx.strokeRect(
        x * state.cellSize,
        y * state.cellSize,
        state.cellSize,
        state.cellSize
      );
    }
  }

  // Simulation Logic
  function updateGeneration() {
    const newGrid = createEmptyGrid();
    let aliveCount = 0;

    state.grid.forEach((row, x) => {
      row.forEach((cell, y) => {
        const neighbors = countNeighbors(x, y);
        newGrid[x][y] = getNewCellState(cell, neighbors);
        aliveCount += newGrid[x][y];
      });
    });

    state.grid = newGrid;
    state.aliveCells = aliveCount;
    state.generation++;

    drawAllCells();
    updateUI();
    detectCycles();
  }

  function countNeighbors(x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const xCell = (x + i + state.gridSize) % state.gridSize;
        const yCell = (y + j + state.gridSize) % state.gridSize;
        count += state.grid[xCell][yCell];
      }
    }
    return count;
  }

  function getNewCellState(currentState, neighbors) {
    return currentState === 1
      ? neighbors === 2 || neighbors === 3
        ? 1
        : 0
      : neighbors === 3
      ? 1
      : 0;
  }

  // Cycle Detection
  function detectCycles() {
    const gridHash = state.grid.flat().join('');
    state.cycleDetector.checkForCycles(gridHash, state.generation);
  }

  // User Interaction
  function applySettings() {
    state.gridSize = clamp(
      parseInt(elements.gridSizeInput.value, 10),
      DEFAULTS.MIN_GRID_SIZE,
      DEFAULTS.MAX_GRID_SIZE
    );

    state.cellSize = clamp(
      parseInt(elements.cellSizeInput.value, 10),
      DEFAULTS.MIN_CELL_SIZE,
      DEFAULTS.MAX_CELL_SIZE
    );

    resizeGrid();
    initializeGrid();
    updateUI();
  }

  function randomizeGrid() {
    state.grid = state.grid.map((row) =>
      row.map(() => (Math.random() > state.density ? 1 : 0))
    );
    drawAllCells();
    state.generation = 0;
    updateUI();
  }

  function toggleSimulation() {
    state.isRunning = !state.isRunning;
    elements.startPauseButton.textContent = state.isRunning ? 'Pause' : 'Start';

    if (state.isRunning) {
      state.cycleDetector.reset();
      runSimulation();
    } else {
      cancelAnimationFrame(state.animationId);
    }
  }

  function runSimulation() {
    if (!state.isRunning) return;
    updateGeneration();
    state.animationId = setTimeout(() => runSimulation(), state.tickSpeed);
  }

  function clearGrid() {
    state.isRunning = false;
    state.generation = 0;
    state.aliveCells = 0;
    state.cycleDetector.reset();
    initializeGrid();
    updateUI();
  }

  // Drawing Tools
  function startDrawing(e) {
    state.isDrawing = true;
    const { x, y } = getCellCoordinates(e);
    toggleCellState(x, y);
    state.lastCell = { x, y };
  }

  function draw(e) {
    if (!state.isDrawing) return;
    const { x, y } = getCellCoordinates(e);

    if (x !== state.lastCell.x || y !== state.lastCell.y) {
      toggleCellState(x, y);
      state.lastCell = { x, y };
    }
  }

  function endDrawing() {
    state.isDrawing = false;
    state.lastCell = { x: -1, y: -1 };
  }

  function getCellCoordinates(e) {
    const rect = elements.canvas.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / state.cellSize),
      y: Math.floor((e.clientY - rect.top) / state.cellSize),
    };
  }

  function toggleCellState(x, y) {
    if (x < 0 || x >= state.gridSize || y < 0 || y >= state.gridSize) return;
    state.grid[x][y] = state.grid[x][y] ? 0 : 1;
    drawCell(x, y, state.grid[x][y]);
  }

  // UI Updates
  function updateUI() {
    elements.generationCount.textContent = state.generation;
    elements.aliveCount.textContent = state.aliveCells;
    elements.densityValue.textContent = Math.round((1 - state.density) * 100);
    elements.tickSpeedValue.textContent = Math.round(1000 / state.tickSpeed);
  }

  function updateTickSpeed() {
    state.tickSpeed = 1000 / parseInt(elements.tickSpeedInput.value, 10);
    updateUI();
  }

  function updateDensity() {
    state.density = (100 - parseInt(elements.densityInput.value, 10)) / 100;
    updateUI();
  }

  // Helper Functions
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function createCycleLogs() {
    const div = document.createElement('div');
    div.id = 'cycleLogs';
    document.body.appendChild(div);
    return div;
  }

  // Expose public methods
  return { init };
})();

// Cycle Detection Module

// Initialize the application
GameOfLife.init();
