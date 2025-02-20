// File: pages/tap-demo.js
import { useState, useEffect, useRef } from 'react';

/* ========= Helper Functions ========= */
function hashStringToNumbers(str) {
  let h1 = 0x12345678;
  let h2 = 0x87654321;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = ((h1 ^ c) + ((h1 << 5) + (h1 >> 2))) | 0;
    h2 = ((h2 ^ c) + ((h2 << 6) + (h2 >> 3))) | 0;
  }
  return [h1 >>> 0, h2 >>> 0];
}

function createSeededRandom([seed1, seed2]) {
  let s1 = seed1;
  let s2 = seed2;
  return function random() {
    s1 ^= s1 << 13;
    s1 ^= s1 >> 17;
    s1 ^= s1 << 5;
    s2 ^= s2 << 15;
    s2 ^= s2 >> 13;
    s2 ^= s2 << 7;
    const t = (s1 + s2) >>> 0;
    return (t & 0xffffff) / 16777216;
  };
}

/* ========= Maze Generation Helpers ========= */
function buildMazeFromSeed(seed, size = 10) {
  const seeds = hashStringToNumbers(seed);
  const rand = createSeededRandom(seeds);
  const cells = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push({ walls: [true, true, true, true], visited: false });
    }
    cells.push(row);
  }
  const stack = [[0, 0]];
  cells[0][0].visited = true;
  const offsets = [
    [-1, 0], // up
    [0, 1],  // right
    [1, 0],  // down
    [0, -1]  // left
  ];
  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors = [];
    for (let d = 0; d < 4; d++) {
      const nr = r + offsets[d][0];
      const nc = c + offsets[d][1];
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !cells[nr][nc].visited) {
        neighbors.push(d);
      }
    }
    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const d = neighbors[Math.floor(rand() * neighbors.length)];
      cells[r][c].walls[d] = false;
      const nr = r + offsets[d][0];
      const nc = c + offsets[d][1];
      cells[nr][nc].visited = true;
      const opposite = (d + 2) % 4;
      cells[nr][nc].walls[opposite] = false;
      stack.push([nr, nc]);
    }
  }
  return cells;
}

/* ========= Deterministic Pellet Generation for Snake ========= */
function getDeterministicPellet(assetId, pelletNumber, gridSize) {
  const seedStr = assetId + ':' + pelletNumber;
  const [seed1, seed2] = hashStringToNumbers(seedStr);
  const rand = createSeededRandom([seed1, seed2]);
  const x = Math.floor(rand() * gridSize);
  const y = Math.floor(rand() * gridSize);
  return { x, y };
}

function getPelletPosition(assetId, pelletNumber, snake, gridSize) {
  let candidate = getDeterministicPellet(assetId, pelletNumber, gridSize);
  const collides = snake.some(segment => segment.x === candidate.x && segment.y === candidate.y);
  if (!collides) return candidate;
  // Fallback: use additional salt to generate candidate until free cell is found.
  const seedStr = assetId + ':' + pelletNumber + ':fallback';
  const [seed1, seed2] = hashStringToNumbers(seedStr);
  const rand = createSeededRandom([seed1, seed2]);
  for (let i = 0; i < gridSize * gridSize; i++) {
    const x = Math.floor(rand() * gridSize);
    const y = Math.floor(rand() * gridSize);
    if (!snake.some(segment => segment.x === x && segment.y === y)) {
      return { x, y };
    }
  }
  return candidate;
}

/* ========= MazeCanvas Component with Start/Restart ========= */
function MazeCanvas({ cells, cellSize = 40, exitMarker = false }) {
  const canvasRef = useRef(null);
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const size = cells.length;
  const canvasSize = cellSize * size;

  useEffect(() => {
    function handleKey(e) {
      // Handle space for starting or restarting.
      if (e.key === ' ') {
        if (!gameStarted) {
          setGameStarted(true);
          return;
        }
        if (isComplete) {
          // Restart maze: reset player and game state.
          setPlayerPos({ r: 0, c: 0 });
          setIsComplete(false);
          return;
        }
      }
      if (!gameStarted || isComplete) return;

      let dir = -1;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dir = 0;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dir = 1;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dir = 2;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dir = 3;
      else return;
      const { r, c } = playerPos;
      const current = cells[r][c];
      if (!current.walls[dir]) {
        let newR = r, newC = c;
        if (dir === 0) newR--;
        if (dir === 1) newC++;
        if (dir === 2) newR++;
        if (dir === 3) newC--;
        setPlayerPos({ r: newR, c: newC });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playerPos, isComplete, cells, gameStarted]);

  useEffect(() => {
    if (playerPos.r === size - 1 && playerPos.c === size - 1) {
      setIsComplete(true);
    }
  }, [playerPos, size]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    // Draw maze background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = cells[r][c];
        const x = c * cellSize;
        const y = r * cellSize;
        // Top wall
        if (cell.walls[0]) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
          ctx.stroke();
        }
        // Right wall
        if (cell.walls[1]) {
          ctx.beginPath();
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        // Bottom wall (skip exit cell if needed)
        if (cell.walls[2] && !(exitMarker && r === size - 1 && c === size - 1)) {
          ctx.beginPath();
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        // Left wall
        if (cell.walls[3]) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
          ctx.stroke();
        }
      }
    }
    if (exitMarker) {
      // Mark exit by removing a small segment in the bottom wall of the bottom-right cell.
      const exitX = (size - 1) * cellSize;
      const exitY = (size - 1) * cellSize;
      ctx.fillStyle = '#000';
      ctx.fillRect(exitX + cellSize / 2 - 5, exitY + cellSize - 2, 10, 4);
    }
    // If game hasn't started, display instructions.
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = '#fff';
      ctx.font = `${cellSize}px sans-serif`;
      ctx.fillText('Press Space to Start', 20, canvasSize / 2);
      return;
    }
    // Draw player as a green circle.
    ctx.fillStyle = '#0F0';
    const px = playerPos.c * cellSize + cellSize / 2;
    const py = playerPos.r * cellSize + cellSize / 2;
    ctx.beginPath();
    ctx.arc(px, py, cellSize / 5, 0, 2 * Math.PI);
    ctx.fill();
    // If solved, display victory message and restart instructions.
    if (isComplete) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(0, canvasSize / 2 - 30, canvasSize, 60);
      ctx.fillStyle = '#000';
      ctx.font = `${cellSize * 0.8}px sans-serif`;
      ctx.fillText('You solved it! Press Space to Restart', 10, canvasSize / 2 + 10);
    }
  }, [cells, playerPos, isComplete, cellSize, canvasSize, size, exitMarker, gameStarted]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{ border: '1px solid #fff', display: 'block', marginTop: '1rem' }}
    />
  );
}

/* ========= SnakeGame Component with Start/Restart and Queued Input ========= */
function SnakeGame({ assetId }) {
  const canvasRef = useRef(null);
  const gridSize = 20;
  const cellSize = 20;
  
  // Initial snake state.
  const initialSnake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  
  const [snake, setSnake] = useState(initialSnake);
  const [direction, setDirection] = useState('right');
  const [nextDirection, setNextDirection] = useState(null);
  const [pelletNumber, setPelletNumber] = useState(1);
  const [pellet, setPellet] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Set pellet position deterministically whenever pelletNumber or snake changes.
  useEffect(() => {
    if (assetId) {
      setPellet(getPelletPosition(assetId, pelletNumber, snake, gridSize));
    }
  }, [assetId, pelletNumber, snake]);

  // Game loop: move the snake every 150ms.
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const interval = setInterval(() => {
      setSnake(prev => {
        // Process queued direction change (only one per tick).
        let currentDir = direction;
        if (nextDirection) {
          // Ensure not reversing.
          if (
            (direction === 'up' && nextDirection !== 'down') ||
            (direction === 'down' && nextDirection !== 'up') ||
            (direction === 'left' && nextDirection !== 'right') ||
            (direction === 'right' && nextDirection !== 'left')
          ) {
            currentDir = nextDirection;
            setDirection(nextDirection);
          }
          setNextDirection(null);
        }
        const head = prev[0];
        let newHead = { ...head };
        if (currentDir === 'up') newHead.y -= 1;
        else if (currentDir === 'down') newHead.y += 1;
        else if (currentDir === 'left') newHead.x -= 1;
        else if (currentDir === 'right') newHead.x += 1;

        // Check boundaries.
        if (newHead.x < 0 || newHead.x >= gridSize || newHead.y < 0 || newHead.y >= gridSize) {
          setGameOver(true);
          return prev;
        }
        // Check self collision.
        if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        let newSnake;
        // Check if pellet is eaten.
        if (pellet && newHead.x === pellet.x && newHead.y === pellet.y) {
          newSnake = [newHead, ...prev];
          setPelletNumber(prevNum => prevNum + 1);
        } else {
          newSnake = [newHead, ...prev.slice(0, -1)];
        }
        return newSnake;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [direction, nextDirection, pellet, gridSize, gameOver, gameStarted]);

  // Key controls with queued direction and start/restart.
  useEffect(() => {
    function handleKey(e) {
      if (e.key === ' ') {
        if (!gameStarted) {
          setGameStarted(true);
          return;
        }
        if (gameOver) {
          // Restart snake game.
          setSnake(initialSnake);
          setDirection('right');
          setNextDirection(null);
          setPelletNumber(1);
          setGameOver(false);
          setGameStarted(true);
          return;
        }
      }
      if (!gameStarted || gameOver) return;
      let newDir = null;
      if (['w', 'W', 'ArrowUp'].includes(e.key) && direction !== 'down') newDir = 'up';
      else if (['s', 'S', 'ArrowDown'].includes(e.key) && direction !== 'up') newDir = 'down';
      else if (['a', 'A', 'ArrowLeft'].includes(e.key) && direction !== 'right') newDir = 'left';
      else if (['d', 'D', 'ArrowRight'].includes(e.key) && direction !== 'left') newDir = 'right';
      if (newDir && !nextDirection) {
        setNextDirection(newDir);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [direction, nextDirection, gameStarted, gameOver]);

  // Draw snake game on canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, gridSize * cellSize, gridSize * cellSize);

    // If game hasn't started, show instructions.
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, gridSize * cellSize, gridSize * cellSize);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.fillText('Press Space to Start', gridSize * cellSize / 2 - 70, gridSize * cellSize / 2);
      return;
    }

    // Draw pellet.
    if (pellet) {
      ctx.fillStyle = 'red';
      ctx.fillRect(pellet.x * cellSize, pellet.y * cellSize, cellSize, cellSize);
    }
    // Draw snake.
    ctx.fillStyle = 'lime';
    snake.forEach(segment => {
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize);
    });
    // If game over, overlay message.
    if (gameOver) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(0, gridSize * cellSize / 2 - 20, gridSize * cellSize, 40);
      ctx.fillStyle = '#000';
      ctx.font = '20px sans-serif';
      ctx.fillText('Game Over! Press Space to Restart', gridSize * cellSize / 2 - 100, gridSize * cellSize / 2 + 7);
    }
  }, [snake, pellet, gameOver, gridSize, cellSize, gameStarted]);

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>6) Snake Game</h3>
      <p>
        Use WASD or arrow keys to control the snake. Each pellet’s (food) location is
        deterministically set by your asset’s identifier and pellet round. (Press Space to start/restart.)
      </p>
      <canvas
        ref={canvasRef}
        width={gridSize * cellSize}
        height={gridSize * cellSize}
        style={{ border: '1px solid #fff', marginTop: '1rem' }}
      />
    </div>
  );
}

/* ========= Main Page Component ========= */
export default function TapDemoMazePage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [inscriptions, setInscriptions] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assetDetail, setAssetDetail] = useState('');
  const [mazeSmall, setMazeSmall] = useState(null);
  const [mazeLarge, setMazeLarge] = useState(null);
  const [debugMsg, setDebugMsg] = useState('');

  // Top instructions for the demo page.
  const instructions = `INSTRUCTIONS:
1) Press Space to start each game.
2) Use Arrow Keys or WASD to navigate.
3) In Snake, only one direction change per tick is accepted.
4) When a game is over, press Space to restart.`;

  // Step 1: Connect using Tap Wallet API.
  async function handleConnectTapWallet() {
    if (typeof window.tapwallet === 'undefined') {
      setDebugMsg('Tap Wallet is not installed.');
      return;
    }
    try {
      setDebugMsg('Connecting to Tap Wallet...');
      const accounts = await window.tapwallet.requestAccounts();
      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        setDebugMsg('No accounts returned.');
        return;
      }
      setAddresses(accounts);
      setSelectedAddress(accounts[0]);
      setDebugMsg(`Connected: ${accounts.join(', ')}`);
    } catch (error) {
      setDebugMsg(`Error connecting: ${error.message}`);
    }
  }

  // Step 2: Fetch inscriptions (or fallback identifier) from Tap Wallet.
  async function handleGetInscriptions() {
    if (!selectedAddress) {
      setDebugMsg('No address selected.');
      return;
    }
    try {
      setDebugMsg('Fetching inscriptions...');
      const res = await window.tapwallet.getInscriptions(0, 50);
      if (!res || typeof res !== 'object' || !Array.isArray(res.list)) {
        setDebugMsg(`Unexpected response: ${JSON.stringify(res)}`);
        return;
      }
      setInscriptions(res.list);
      if (res.list.length > 0) {
        const id = res.list[0].inscriptionId || res.list[0].address;
        setSelectedAssetId(id);
      }
      setDebugMsg(`Fetched ${res.list.length} inscriptions.`);
    } catch (error) {
      setDebugMsg(`Error fetching inscriptions: ${error.message}`);
    }
  }

  // Step 3: Confirm the asset identifier.
  function handleConfirmAsset() {
    if (!selectedAssetId) {
      setDebugMsg('No asset selected.');
      return;
    }
    setAssetDetail(`Asset identifier: ${selectedAssetId}`);
  }

  // Step 4: Generate 10×10 Maze.
  function handleGenerateSmallMaze() {
    if (!selectedAssetId) {
      setDebugMsg('No asset selected for maze generation.');
      return;
    }
    const cells = buildMazeFromSeed(selectedAssetId, 10);
    setMazeSmall(cells);
  }

  // Step 5: Generate 100×100 Maze with an exit marker.
  function handleGenerateLargeMaze() {
    if (!selectedAssetId) {
      setDebugMsg('No asset selected for maze generation.');
      return;
    }
    const cells = buildMazeFromSeed(selectedAssetId, 100);
    setMazeLarge(cells);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Tap Wallet Maze & Snake Demo</h2>
      <pre style={{ background: '#222', color: '#fff', padding: '0.5rem' }}>
        {instructions}
      </pre>
      <p>
        This demo uses the Tap Wallet API to connect, fetch your asset identifiers, and generate
        deterministic games from them.
      </p>

      {/* Step 1: Connect */}
      <div style={{ marginBottom: '1rem' }}>
        <h3>1) Connect to Tap Wallet</h3>
        <button onClick={handleConnectTapWallet} style={{ padding: '0.5rem 1rem' }}>
          Connect Tap Wallet
        </button>
        {addresses.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ marginRight: '0.5rem' }}>Select Address:</label>
            <select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              style={{ padding: '0.3rem', background: '#222', color: '#fff' }}
            >
              {addresses.map((addr) => (
                <option key={addr} value={addr}>
                  {addr}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Step 2: Fetch Inscriptions */}
      {addresses.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3>2) Fetch Inscriptions</h3>
          <button onClick={handleGetInscriptions} style={{ padding: '0.5rem 1rem' }}>
            Fetch Inscriptions
          </button>
          {inscriptions.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ marginRight: '0.5rem' }}>Select Asset:</label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                style={{ padding: '0.3rem', background: '#222', color: '#fff' }}
              >
                {inscriptions.map((insc) => {
                  const id = insc.inscriptionId || insc.address;
                  return (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Confirm Asset */}
      {selectedAssetId && (
        <div style={{ marginBottom: '1rem' }}>
          <h3>3) Confirm Asset Identifier</h3>
          <button onClick={handleConfirmAsset} style={{ padding: '0.5rem 1rem' }}>
            Confirm Asset
          </button>
          {assetDetail && (
            <pre style={{ marginTop: '0.5rem', background: '#111', padding: '0.5rem', color: '#0f0' }}>
              {assetDetail}
            </pre>
          )}
        </div>
      )}

      {/* Step 4: 10×10 Maze */}
      {selectedAssetId && (
        <div style={{ marginBottom: '1rem' }}>
          <h3>4) Generate 10×10 Maze</h3>
          <button onClick={handleGenerateSmallMaze} style={{ padding: '0.5rem 1rem' }}>
            Generate Small Maze
          </button>
          <p style={{ marginTop: '0.5rem' }}>
            Use arrow keys or WASD to move. Start is top-left; goal is bottom-right. (Press Space to start/restart.)
          </p>
          {mazeSmall && <MazeCanvas cells={mazeSmall} cellSize={40} exitMarker={false} />}
        </div>
      )}

      {/* Step 5: 100×100 Maze */}
      {selectedAssetId && (
        <div style={{ marginBottom: '1rem' }}>
          <h3>5) Generate 100×100 Maze with Exit</h3>
          <button onClick={handleGenerateLargeMaze} style={{ padding: '0.5rem 1rem' }}>
            Generate Large Maze
          </button>
          <p style={{ marginTop: '0.5rem' }}>
            Use arrow keys or WASD to move. Start is top-left; exit is marked at bottom-right. (Press Space to start/restart.)
          </p>
          {mazeLarge && <MazeCanvas cells={mazeLarge} cellSize={8} exitMarker={true} />}
        </div>
      )}

      {/* Step 6: Snake Game */}
      {selectedAssetId && <SnakeGame assetId={selectedAssetId} />}

      {/* Debug Output */}
      {debugMsg && (
        <div style={{ marginBottom: '1rem' }}>
          <h3>Debug Info</h3>
          <pre style={{ background: '#000', padding: '0.5rem', color: '#0f0' }}>
            {debugMsg}
          </pre>
        </div>
      )}
    </div>
  );
}
