# A* Maze Solver

An interactive web application that visualizes the A* pathfinding algorithm and Dijkstra's algorithm in real-time on a customizable grid.

## Features

- **Interactive Grid**: 20×30 grid where you can draw walls, set start/end points
- **Dual Algorithms**: Toggle between A* (Manhattan heuristic) and Dijkstra (heuristic = 0)
- **Step-by-Step Visualization**: Watch the algorithm explore nodes in real-time
- **Animation Controls**: Run, Step, Pause, and Reset functionality
- **Speed Control**: Adjustable animation speed (10ms to 500ms per step)
- **Random Maze Generator**: Generate random mazes with ~30% wall density
- **Responsive Design**: Works on desktop and mobile devices

## Algorithm Overview

### A* Algorithm
A* is an informed search algorithm that uses a heuristic to guide its search. It maintains two sets:
- **Open Set**: Nodes to be evaluated
- **Closed Set**: Nodes already evaluated

For each node, A* calculates:
- `g(n)`: Cost from start to node n
- `h(n)`: Heuristic estimate from node n to goal (Manhattan distance)
- `f(n) = g(n) + h(n)`: Total estimated cost

The algorithm always expands the node with the lowest f-score, guaranteeing the shortest path.

### Dijkstra's Algorithm
Dijkstra is essentially A* with h(n) = 0. It explores nodes uniformly in all directions without a heuristic, guaranteeing the shortest path but typically exploring more nodes.

### Complexity
- **Time Complexity**: O(E log V) where E = edges, V = vertices (nodes)
- **Space Complexity**: O(V) for storing open/closed sets and parent references

## How to Run

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**: Navigate to `http://localhost:5173`

## How to Use

1. **Set Start/End**: Click "Place Start" or "Place End" buttons, then click a cell
2. **Draw Walls**: Click "Draw Walls" and click/drag on cells to create obstacles
3. **Erase Walls**: Click "Erase Walls" to remove obstacles
4. **Choose Algorithm**: Toggle between "A* (Manhattan)" and "Dijkstra"
5. **Run**: Click "Run" to animate the pathfinding process
6. **Step**: Click "Step" to advance one algorithm iteration at a time
7. **Random Maze**: Generate a random maze layout
8. **Speed**: Adjust the slider to control animation speed
9. **Reset**: Clear the visualization and start over

## Color Legend

- 🟦 **Blue**: Start cell (S)
- 🟥 **Red**: End cell (E)
- ⬛ **Black**: Wall (obstacle)
- 🟩 **Green**: Open set (nodes to be evaluated)
- 🟨 **Yellow**: Closed set (evaluated nodes)
- 🟪 **Purple**: Final path from start to end

## Suggested Extensions for Reports

1. **Diagonal Movement**: Modify neighbors function to include diagonal moves (cost √2)
2. **Weighted Cells**: Add terrain types with different traversal costs (mud, grass, road)
3. **Alternative Heuristics**:
   - Euclidean distance: `sqrt((x2-x1)² + (y2-y1)²)`
   - Chebyshev distance: `max(|x2-x1|, |y2-y1|)`
   - Octile distance for diagonal movement
4. **Bidirectional A***: Search from both start and end simultaneously
5. **Jump Point Search**: Optimize A* for uniform-cost grids
6. **Maze Generation Algorithms**:
   - Recursive backtracker (DFS-based)
   - Prim's algorithm
   - Kruskal's algorithm
7. **Performance Metrics**: Display nodes explored, path length, time taken
8. **Multiple Pathfinding Algorithms**: Add BFS, DFS, Greedy Best-First
9. **Dynamic Obstacles**: Allow walls to appear/disappear during search
10. **3D Visualization**: Extend to a 3D grid

## Implementation Notes

- Uses generator functions for step-by-step algorithm execution
- 4-directional movement (up, down, left, right) by default
- Priority queue implemented with array sorting (can be optimized with binary heap)
- Start and End cells are always walkable (cannot be walls)
- Drawing is disabled during algorithm animation

## Technologies Used

- React 18+ (Functional components with hooks)
- Vite (Build tool and dev server)
- CSS3 (Responsive grid layout)
- Lucide React (Icons)

## License

MIT
