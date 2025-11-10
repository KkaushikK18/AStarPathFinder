import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Shuffle, ChevronRight } from 'lucide-react';
import './AStarMaze.css';

const ROWS = 20;
const COLS = 30;

const CELL_TYPE = {
  EMPTY: 'EMPTY',
  WALL: 'WALL',
  START: 'START',
  END: 'END',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  PATH: 'PATH',
};

const MODE = {
  DRAW_WALL: 'DRAW_WALL',
  ERASE_WALL: 'ERASE_WALL',
  PLACE_START: 'PLACE_START',
  PLACE_END: 'PLACE_END',
};

const ALGORITHM = {
  ASTAR: 'ASTAR',
  DIJKSTRA: 'DIJKSTRA',
};

function App() {
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [start, setStart] = useState({ row: 10, col: 5 });
  const [end, setEnd] = useState({ row: 10, col: 24 });
  const [mode, setMode] = useState(MODE.DRAW_WALL);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [algorithm, setAlgorithm] = useState(ALGORITHM.ASTAR);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const generatorRef = useRef(null);
  const animationRef = useRef(null);

  function createEmptyGrid() {
    return Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({ type: CELL_TYPE.EMPTY }))
    );
  }

  const getCellType = useCallback((row, col) => {
    if (row === start.row && col === start.col) return CELL_TYPE.START;
    if (row === end.row && col === end.col) return CELL_TYPE.END;
    return grid[row][col].type;
  }, [grid, start, end]);

  const handleCellClick = useCallback((row, col) => {
    if (isRunning) return;

    if (mode === MODE.PLACE_START) {
      setStart({ row, col });
      setMode(MODE.DRAW_WALL);
    } else if (mode === MODE.PLACE_END) {
      setEnd({ row, col });
      setMode(MODE.DRAW_WALL);
    } else {
      toggleCell(row, col);
    }
  }, [mode, isRunning]);

  const toggleCell = useCallback((row, col) => {
    if (isRunning) return;
    if ((row === start.row && col === start.col) || (row === end.row && col === end.col)) {
      return;
    }

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(r => r.map(c => ({ ...c })));

      if (mode === MODE.DRAW_WALL) {
        newGrid[row][col].type = CELL_TYPE.WALL;
      } else if (mode === MODE.ERASE_WALL) {
        newGrid[row][col].type = CELL_TYPE.EMPTY;
      }

      return newGrid;
    });
  }, [mode, start, end, isRunning]);

  const handleMouseEnter = useCallback((row, col) => {
    if (isMouseDown && (mode === MODE.DRAW_WALL || mode === MODE.ERASE_WALL)) {
      toggleCell(row, col);
    }
  }, [isMouseDown, mode, toggleCell]);

  const clearVisualization = useCallback(() => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row =>
        row.map(cell => {
          if (cell.type === CELL_TYPE.OPEN ||
              cell.type === CELL_TYPE.CLOSED ||
              cell.type === CELL_TYPE.PATH) {
            return { type: CELL_TYPE.EMPTY };
          }
          return { ...cell };
        })
      );
      return newGrid;
    });
  }, []);

  const reset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    generatorRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    clearVisualization();
  }, [clearVisualization]);

  const fullReset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    generatorRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setGrid(createEmptyGrid());
    setStart({ row: 10, col: 5 });
    setEnd({ row: 10, col: 24 });
  }, []);

  const generateRandomMaze = useCallback(() => {
    if (isRunning) return;

    const newGrid = createEmptyGrid();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if ((row === start.row && col === start.col) ||
            (row === end.row && col === end.col)) {
          continue;
        }

        if (Math.random() < 0.3) {
          newGrid[row][col].type = CELL_TYPE.WALL;
        }
      }
    }

    setGrid(newGrid);
  }, [isRunning, start, end]);

  function* aStarGenerator(gridState, startPos, endPos, useHeuristic) {
    const openSet = [startPos];
    const closedSet = new Set();
    const cameFrom = new Map();

    const gScore = new Map();
    gScore.set(`${startPos.row},${startPos.col}`, 0);

    const fScore = new Map();
    const h = heuristic(startPos, endPos);
    fScore.set(`${startPos.row},${startPos.col}`, useHeuristic ? h : 0);

    function heuristic(a, b) {
      return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }

    function getNeighbors(pos) {
      const neighbors = [];
      const directions = [
        { row: -1, col: 0 },
        { row: 1, col: 0 },
        { row: 0, col: -1 },
        { row: 0, col: 1 },
      ];

      for (const dir of directions) {
        const newRow = pos.row + dir.row;
        const newCol = pos.col + dir.col;

        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
          if (gridState[newRow][newCol].type !== CELL_TYPE.WALL) {
            neighbors.push({ row: newRow, col: newCol });
          }
        }
      }

      return neighbors;
    }

    while (openSet.length > 0) {
      openSet.sort((a, b) => {
        const aKey = `${a.row},${a.col}`;
        const bKey = `${b.row},${b.col}`;
        return (fScore.get(aKey) || Infinity) - (fScore.get(bKey) || Infinity);
      });

      const current = openSet.shift();
      const currentKey = `${current.row},${current.col}`;

      if (current.row === endPos.row && current.col === endPos.col) {
        const path = [];
        let temp = current;
        while (temp) {
          path.unshift(temp);
          temp = cameFrom.get(`${temp.row},${temp.col}`);
        }
        yield { type: 'COMPLETE', path };
        return;
      }

      closedSet.add(currentKey);

      yield {
        type: 'STEP',
        current,
        openSet: [...openSet],
        closedSet: Array.from(closedSet).map(key => {
          const [row, col] = key.split(',').map(Number);
          return { row, col };
        }),
      };

      for (const neighbor of getNeighbors(current)) {
        const neighborKey = `${neighbor.row},${neighbor.col}`;

        if (closedSet.has(neighborKey)) continue;

        const tentativeGScore = (gScore.get(currentKey) || Infinity) + 1;

        // Add to open set if not already there
        const inOpenSet = openSet.some(n => n.row === neighbor.row && n.col === neighbor.col);
        
        if (!inOpenSet) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
          continue; // Not a better path
        }

        // This path is the best so far, record it
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        const h = heuristic(neighbor, endPos);
        fScore.set(neighborKey, tentativeGScore + (useHeuristic ? h : 0));
      }
    }

    yield { type: 'NO_PATH' };
  }

  const step = useCallback(() => {
    if (!generatorRef.current) {
      clearVisualization();

      const gridSnapshot = grid.map(row => row.map(cell => ({ ...cell })));
      generatorRef.current = aStarGenerator(
        gridSnapshot,
        start,
        end,
        algorithm === ALGORITHM.ASTAR
      );
      setIsRunning(true);
    }

    const result = generatorRef.current.next();

    if (result.done) {
      setIsRunning(false);
      generatorRef.current = null;
      return;
    }

    const value = result.value;

    if (value.type === 'STEP') {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row =>
          row.map(cell => {
            if (cell.type === CELL_TYPE.OPEN) {
              return { type: CELL_TYPE.EMPTY };
            }
            return { ...cell };
          })
        );

        for (const pos of value.closedSet) {
          if ((pos.row !== start.row || pos.col !== start.col) &&
              (pos.row !== end.row || pos.col !== end.col)) {
            newGrid[pos.row][pos.col].type = CELL_TYPE.CLOSED;
          }
        }

        for (const pos of value.openSet) {
          if ((pos.row !== start.row || pos.col !== start.col) &&
              (pos.row !== end.row || pos.col !== end.col)) {
            newGrid[pos.row][pos.col].type = CELL_TYPE.OPEN;
          }
        }

        return newGrid;
      });
    } else if (value.type === 'COMPLETE') {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));

        for (const pos of value.path) {
          if ((pos.row !== start.row || pos.col !== start.col) &&
              (pos.row !== end.row || pos.col !== end.col)) {
            newGrid[pos.row][pos.col].type = CELL_TYPE.PATH;
          }
        }

        return newGrid;
      });

      setIsRunning(false);
      generatorRef.current = null;
    } else if (value.type === 'NO_PATH') {
      alert('No path found!');
      setIsRunning(false);
      generatorRef.current = null;
    }
  }, [grid, start, end, algorithm, clearVisualization]);

  const run = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      return;
    }

    if (!isRunning) {
      clearVisualization();

      const gridSnapshot = grid.map(row => row.map(cell => ({ ...cell })));
      generatorRef.current = aStarGenerator(
        gridSnapshot,
        start,
        end,
        algorithm === ALGORITHM.ASTAR
      );
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [isRunning, isPaused, grid, start, end, algorithm, clearVisualization]);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused && generatorRef.current) {
      const animate = () => {
        step();

        if (generatorRef.current) {
          animationRef.current = setTimeout(() => {
            requestAnimationFrame(animate);
          }, speed);
        }
      };

      animationRef.current = setTimeout(() => {
        requestAnimationFrame(animate);
      }, speed);

      return () => {
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
      };
    }
  }, [isRunning, isPaused, speed, step]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>A* Maze Solver</h1>
        <p className="subtitle">Interactive Pathfinding Visualization</p>
      </header>

      <div className="controls-panel">
        <div className="control-group">
          <h3>Drawing Mode</h3>
          <div className="button-group">
            <button
              className={mode === MODE.DRAW_WALL ? 'active' : ''}
              onClick={() => setMode(MODE.DRAW_WALL)}
              disabled={isRunning}
            >
              Draw Walls
            </button>
            <button
              className={mode === MODE.ERASE_WALL ? 'active' : ''}
              onClick={() => setMode(MODE.ERASE_WALL)}
              disabled={isRunning}
            >
              Erase Walls
            </button>
            <button
              className={mode === MODE.PLACE_START ? 'active' : ''}
              onClick={() => setMode(MODE.PLACE_START)}
              disabled={isRunning}
            >
              Place Start
            </button>
            <button
              className={mode === MODE.PLACE_END ? 'active' : ''}
              onClick={() => setMode(MODE.PLACE_END)}
              disabled={isRunning}
            >
              Place End
            </button>
          </div>
        </div>

        <div className="control-group">
          <h3>Algorithm</h3>
          <div className="button-group">
            <button
              className={algorithm === ALGORITHM.ASTAR ? 'active' : ''}
              onClick={() => setAlgorithm(ALGORITHM.ASTAR)}
              disabled={isRunning}
            >
              A* (Manhattan)
            </button>
            <button
              className={algorithm === ALGORITHM.DIJKSTRA ? 'active' : ''}
              onClick={() => setAlgorithm(ALGORITHM.DIJKSTRA)}
              disabled={isRunning}
            >
              Dijkstra
            </button>
          </div>
        </div>

        <div className="control-group">
          <h3>Animation</h3>
          <div className="button-group">
            <button
              onClick={run}
              disabled={isRunning && !isPaused}
              className="icon-button"
            >
              <Play size={16} /> Run
            </button>
            <button
              onClick={step}
              disabled={isRunning && !isPaused}
              className="icon-button"
            >
              <ChevronRight size={16} /> Step
            </button>
            <button
              onClick={pause}
              disabled={!isRunning || isPaused}
              className="icon-button"
            >
              <Pause size={16} /> Pause
            </button>
            <button
              onClick={reset}
              className="icon-button"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>

        <div className="control-group">
          <h3>Maze</h3>
          <div className="button-group">
            <button
              onClick={generateRandomMaze}
              disabled={isRunning}
              className="icon-button"
            >
              <Shuffle size={16} /> Random Maze
            </button>
            <button
              onClick={fullReset}
              disabled={isRunning}
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="control-group">
          <h3>Speed: {speed}ms</h3>
          <input
            type="range"
            min="10"
            max="500"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="speed-slider"
          />
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-color start"></div>
          <span>Start (S)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color end"></div>
          <span>End (E)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color wall"></div>
          <span>Wall</span>
        </div>
        <div className="legend-item">
          <div className="legend-color open"></div>
          <span>Open Set</span>
        </div>
        <div className="legend-item">
          <div className="legend-color closed"></div>
          <span>Closed Set</span>
        </div>
        <div className="legend-item">
          <div className="legend-color path"></div>
          <span>Path</span>
        </div>
      </div>

      <div
        className="grid-container"
        onMouseDown={() => setIsMouseDown(true)}
        onMouseUp={() => setIsMouseDown(false)}
        onMouseLeave={() => setIsMouseDown(false)}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {row.map((cell, colIndex) => {
              const cellType = getCellType(rowIndex, colIndex);
              const isStartCell = rowIndex === start.row && colIndex === start.col;
              const isEndCell = rowIndex === end.row && colIndex === end.col;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`cell ${cellType.toLowerCase()}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                >
                  {isStartCell && <span className="cell-label">S</span>}
                  {isEndCell && <span className="cell-label">E</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
