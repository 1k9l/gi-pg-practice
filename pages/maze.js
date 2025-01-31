// File: pages/maze.js

import { useState, useEffect, useRef } from 'react';
import Wallet, { AddressPurpose } from 'sats-connect';

/* ----------- Maze Generation Helpers ----------- */
function hashStringToNumbers(str) {
  // Simple (non-cryptographic) hash to produce two seeds.
  let h1 = 0x12345678;
  let h2 = 0x87654321;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = (h1 ^ c) + ((h1 << 5) + (h1 >> 2)) | 0;
    h2 = (h2 ^ c) + ((h2 << 6) + (h2 >> 3)) | 0;
  }
  return [h1 >>> 0, h2 >>> 0];
}

function createSeededRandom([seed1, seed2]) {
  let s1 = seed1;
  let s2 = seed2;
  return function random() {
    s1 ^= s1 << 13; s1 ^= s1 >> 17; s1 ^= s1 << 5;
    s2 ^= s2 << 15; s2 ^= s2 >> 13; s2 ^= s2 << 7;
    const t = (s1 + s2) >>> 0;
    return (t & 0xffffff) / 16777216;
  };
}

// DFS-based maze generation. Returns a 2D array of cells,
// where each cell is { walls: [top, right, bottom, left], visited: bool }.
function buildMazeFromInscriptionID(inscriptionId, size = 10) {
  const seeds = hashStringToNumbers(inscriptionId);
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
    [-1, 0], [0, 1], [1, 0], [0, -1] // up, right, down, left
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

/* ----------- MazeCanvas Component ----------- */
// This component renders a playable maze on a canvas.
// Props:
//   cells: 2D maze array
//   cellSize: pixel size of each cell (default 40)
//   exitMarker: if true, the bottom-right cell’s bottom wall is removed and marked.
function MazeCanvas({ cells, cellSize = 40, exitMarker = false }) {
  const canvasRef = useRef(null);
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const size = cells.length;
  const canvasSize = cellSize * size;

  useEffect(() => {
    function handleKey(e) {
      if (isComplete) return;
      let dir = -1;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dir = 0; break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dir = 1; break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dir = 2; break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dir = 3; break;
        default:
          return;
      }
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
  }, [playerPos, isComplete, cells]);

  useEffect(() => {
    if (playerPos.r === size - 1 && playerPos.c === size - 1) {
      setIsComplete(true);
    }
  }, [playerPos, size]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;

    // Draw maze walls
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = cells[r][c];
        const x = c * cellSize;
        const y = r * cellSize;
        // Draw top wall
        if (cell.walls[0]) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
          ctx.stroke();
        }
        // Draw right wall
        if (cell.walls[1]) {
          ctx.beginPath();
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        // Draw bottom wall—unless exitMarker is true and this is the exit cell.
        if (cell.walls[2] && !(exitMarker && r === size - 1 && c === size - 1)) {
          ctx.beginPath();
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        // Draw left wall
        if (cell.walls[3]) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
          ctx.stroke();
        }
      }
    }

    // Draw exit marker if requested: a gap in the bottom wall of the bottom-right cell.
    if (exitMarker) {
      const exitX = (size - 1) * cellSize;
      const exitY = (size - 1) * cellSize;
      ctx.fillStyle = '#000'; // match background
      ctx.fillRect(exitX + cellSize/2 - 5, exitY + cellSize - 2, 10, 4);
    }

    // Draw the player (as a green circle)
    ctx.fillStyle = '#0F0';
    const px = playerPos.c * cellSize + cellSize / 2;
    const py = playerPos.r * cellSize + cellSize / 2;
    ctx.beginPath();
    ctx.arc(px, py, cellSize / 5, 0, 2 * Math.PI);
    ctx.fill();

    // If solved, display a victory message.
    if (isComplete) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(0, canvasSize / 2 - 30, canvasSize, 60);
      ctx.fillStyle = '#000';
      ctx.font = `${cellSize}px sans-serif`;
      ctx.fillText('You solved it!', 30, canvasSize / 2 + 10);
    }
  }, [cells, playerPos, isComplete, cellSize, canvasSize, size, exitMarker]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{ border: '1px solid #fff', display: 'block', marginTop: '1rem' }}
    />
  );
}

/* ----------- MazePage Component ----------- */
export default function MazePage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [ordinalsResult, setOrdinalsResult] = useState('');
  const [inscriptions, setInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState('');
  const [inscriptionDetail, setInscriptionDetail] = useState('');
  const [mazeCellsSmall, setMazeCellsSmall] = useState(null);
  const [mazeCellsLarge, setMazeCellsLarge] = useState(null);
  const [debugMessage, setDebugMessage] = useState('');

  const baseOrdApiUrl = 'https://tx.ordstuff.info';

  // Step 1: Connect & get addresses
  async function handleGetAddresses() {
    try {
      setDebugMessage('Requesting addresses from Xverse...');
      setAddresses([]);
      setSelectedAddress('');
      setOrdinalsResult('');
      setInscriptions([]);
      setSelectedInscription('');
      setInscriptionDetail('');
      setMazeCellsSmall(null);
      setMazeCellsLarge(null);

      const accountsResult = await Wallet.request('getAccounts', {
        purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
        message: 'Share addresses for Maze generation.'
      });

      if (!accountsResult || accountsResult.status !== 'success' || !Array.isArray(accountsResult.result)) {
        setDebugMessage(`Unexpected getAccounts response:\n${JSON.stringify(accountsResult, null, 2)}`);
        return;
      }

      const extracted = accountsResult.result.map(entry => entry.address).filter(Boolean);
      if (extracted.length === 0) {
        setDebugMessage('No addresses found from Xverse getAccounts call.');
        return;
      }

      setAddresses(extracted);
      setSelectedAddress(extracted[0]);
      setDebugMessage(`Addresses retrieved:\n${extracted.join('\n')}`);
    } catch (error) {
      setDebugMessage(`Error retrieving addresses: ${error.message}`);
    }
  }

  // Step 2: Lookup /address/<ADDRESS>
  async function handleLookupAddress() {
    if (!selectedAddress) {
      setDebugMessage('No address selected.');
      return;
    }
    try {
      setInscriptionDetail('');
      setSelectedInscription('');
      setInscriptions([]);
      setMazeCellsSmall(null);
      setMazeCellsLarge(null);
      setOrdinalsResult('Looking up address...');

      const res = await fetch(`${baseOrdApiUrl}/address/${selectedAddress}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(`HTTP ${res.status} - ${errTxt}`);
      }
      const data = await res.json();
      setOrdinalsResult(JSON.stringify(data, null, 2));

      if (Array.isArray(data.inscriptions)) {
        setInscriptions(data.inscriptions);
        if (data.inscriptions.length > 0) {
          setSelectedInscription(data.inscriptions[0]);
        }
      } else {
        setInscriptions([]);
      }
    } catch (error) {
      setOrdinalsResult('');
      setDebugMessage(`Error looking up address ordinals: ${error.message}`);
    }
  }

  // Step 3: Lookup inscription detail
  async function handleLookupInscription() {
    if (!selectedInscription) {
      setDebugMessage('No inscription selected.');
      return;
    }
    try {
      setMazeCellsSmall(null);
      setMazeCellsLarge(null);
      setInscriptionDetail('Fetching inscription details...');
      const res = await fetch(`${baseOrdApiUrl}/inscription/${selectedInscription}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(`HTTP ${res.status} - ${errTxt}`);
      }
      const data = await res.json();
      setInscriptionDetail(JSON.stringify(data, null, 2));
    } catch (error) {
      setInscriptionDetail('');
      setDebugMessage(`Error fetching inscription detail: ${error.message}`);
    }
  }

  // Step 4: Generate 10x10 maze
  function handleGenerateSmallMaze() {
    if (!selectedInscription) {
      setDebugMessage('No inscription selected for small maze generation.');
      return;
    }
    const cells = buildMazeFromInscriptionID(selectedInscription, 10);
    setMazeCellsSmall(cells);
  }

  // Step 5: Generate 100x100 maze with exit marker
  function handleGenerateLargeMaze() {
    if (!selectedInscription) {
      setDebugMessage('No inscription selected for large maze generation.');
      return;
    }
    const cells = buildMazeFromInscriptionID(selectedInscription, 100);
    setMazeCellsLarge(cells);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Maze Generator from Inscriptions</h2>

      {/* Step 1: Get Addresses */}
      <div className="section">
        <h3>1) Get Addresses</h3>
        <button onClick={handleGetAddresses}>Connect &amp; Get Addresses</button>
        {addresses.length > 0 && (
          <>
            <p style={{ marginTop: '1rem' }}>Select an Address:</p>
            <select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              style={{ padding: '0.3rem', background: '#222', color: '#fff' }}
            >
              {addresses.map((addr) => (
                <option key={addr} value={addr}>{addr}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Step 2: Lookup address */}
      {addresses.length > 0 && (
        <div className="section">
          <h3>2) Lookup Ordinals for Selected Address</h3>
          <button onClick={handleLookupAddress}>Fetch /address/&lt;ADDRESS&gt;</button>
          {ordinalsResult && (
            <pre className="result" style={{ marginTop: '1rem' }}>
              {ordinalsResult}
            </pre>
          )}
        </div>
      )}

      {/* Step 3: Lookup inscription detail */}
      {inscriptions.length > 0 && (
        <div className="section">
          <h3>3) Inspect an Inscription</h3>
          <p style={{ marginBottom: '0.5rem' }}>Select an inscription ID:</p>
          <select
            value={selectedInscription}
            onChange={(e) => setSelectedInscription(e.target.value)}
            style={{ padding: '0.3rem', background: '#222', color: '#fff' }}
          >
            {inscriptions.map((insc) => (
              <option key={insc} value={insc}>{insc}</option>
            ))}
          </select>
          <button onClick={handleLookupInscription} style={{ marginLeft: '1rem' }}>
            Lookup /inscription/&lt;ID&gt;
          </button>
          {inscriptionDetail && (
            <pre className="result" style={{ marginTop: '1rem' }}>
              {inscriptionDetail}
            </pre>
          )}
        </div>
      )}

      {/* Step 4: Generate 10x10 Maze */}
      {selectedInscription && (
        <div className="section">
          <h3>4) Generate 10×10 Playable Maze</h3>
          <button onClick={handleGenerateSmallMaze}>
            Make Small Maze from Inscription ID
          </button>
          <p style={{ marginTop: '0.5rem' }}>
            Use arrow keys or WASD to move. Start is top-left; goal is bottom-right.
          </p>
          {mazeCellsSmall && (
            <MazeCanvas cells={mazeCellsSmall} cellSize={40} exitMarker={false} />
          )}
        </div>
      )}

      {/* Step 5: Generate 100x100 Maze with Exit */}
      {selectedInscription && (
        <div className="section">
          <h3>5) Generate 100×100 Playable Maze with Exit</h3>
          <button onClick={handleGenerateLargeMaze}>
            Make Large Maze from Inscription ID
          </button>
          <p style={{ marginTop: '0.5rem' }}>
            Use arrow keys or WASD to move. Start is top-left. The exit is marked by an opening at the bottom-right.
          </p>
          {mazeCellsLarge && (
            // For a 100x100 maze, we use a smaller cell size (e.g. 8px) so it fits the screen.
            <MazeCanvas cells={mazeCellsLarge} cellSize={8} exitMarker={true} />
          )}
        </div>
      )}

      {/* Debug Messages */}
      {debugMessage && (
        <div className="section">
          <h3>Debug</h3>
          <pre className="result">{debugMessage}</pre>
        </div>
      )}
    </div>
  );
}
