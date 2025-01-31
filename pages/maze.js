// File: pages/maze.js
import { useState, useEffect, useRef } from 'react';
import Wallet, { AddressPurpose } from 'sats-connect';

// Maze generation helpers
function hashStringToNumbers(str) {
  // Quick 'hash' to produce two seeds from a string
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

// Generate a solvable NxN maze using DFS carve-out approach
// Each cell => { walls: [top,right,bottom,left], visited: bool }
function buildMazeFromInscriptionID(inscriptionId, size = 10) {
  const seeds = hashStringToNumbers(inscriptionId);
  const rand = createSeededRandom(seeds);

  const cells = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push({
        walls: [true, true, true, true], // top,right,bottom,left
        visited: false
      });
    }
    cells.push(row);
  }

  const stack = [[0, 0]];
  cells[0][0].visited = true;

  // directions: 0=up,1=right,2=down,3=left
  const offsets = [
    [-1, 0], [0, 1], [1, 0], [0, -1]
  ];

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    // find unvisited neighbors
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
      // Opposite wall on neighbor
      const opp = (d + 2) % 4;
      cells[nr][nc].walls[opp] = false;
      stack.push([nr, nc]);
    }
  }

  return cells;
}

/**
 * MazeCanvas is the playable area:
 * - We display the maze in a <canvas>.
 * - Player can move with arrow keys or WASD from top-left to bottom-right.
 */
function MazeCanvas({ cells }) {
  const canvasRef = useRef(null);
  const [playerR, setPlayerR] = useState(0);
  const [playerC, setPlayerC] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const size = cells.length;
  const cellPx = 40; // each cell is 40x40 in the canvas
  const canvasSize = cellPx * size;

  // We'll handle movement on keydown
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
      // check walls
      const current = cells[playerR][playerC];
      if (!current.walls[dir]) {
        // means no wall in that direction
        let newR = playerR, newC = playerC;
        if (dir === 0) newR--;
        if (dir === 1) newC++;
        if (dir === 2) newR++;
        if (dir === 3) newC--;
        setPlayerR(newR);
        setPlayerC(newC);
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playerR, playerC, isComplete, cells]);

  // Check for completion whenever player moves
  useEffect(() => {
    if (playerR === size - 1 && playerC === size - 1) {
      setIsComplete(true);
    }
  }, [playerR, playerC, size]);

  // Draw the maze on each render or player move
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // draw each cell's walls
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = cells[r][c];
        const x = c * cellPx;
        const y = r * cellPx;

        // walls order: top(0),right(1),bottom(2),left(3)
        // top
        if (cell.walls[0]) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellPx, y);
          ctx.stroke();
        }
        // right
        if (cell.walls[1]) {
          ctx.beginPath();
          ctx.moveTo(x + cellPx, y);
          ctx.lineTo(x + cellPx, y + cellPx);
          ctx.stroke();
        }
        // bottom
        if (cell.walls[2]) {
          ctx.beginPath();
          ctx.moveTo(x, y + cellPx);
          ctx.lineTo(x + cellPx, y + cellPx);
          ctx.stroke();
        }
        // left
        if (cell.walls[3]) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellPx);
          ctx.stroke();
        }
      }
    }

    // draw the player
    ctx.fillStyle = '#00FF00';
    const px = playerC * cellPx + cellPx / 2;
    const py = playerR * cellPx + cellPx / 2;
    ctx.beginPath();
    ctx.arc(px, py, cellPx / 5, 0, 2 * Math.PI);
    ctx.fill();

    // if done, draw a big "WIN" message
    if (isComplete) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(0, canvasSize / 2 - 30, canvasSize, 60);
      ctx.fillStyle = '#000';
      ctx.font = '30px sans-serif';
      ctx.fillText('You solved it!', 30, canvasSize / 2 + 10);
    }
  }, [cells, playerR, playerC, isComplete, cellPx, canvasSize, size]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{
        border: '1px solid #fff',
        display: 'block',
        marginTop: '1rem'
      }}
    />
  );
}


export default function MazePage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [ordinalsResult, setOrdinalsResult] = useState('');
  const [inscriptions, setInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState('');
  const [inscriptionDetail, setInscriptionDetail] = useState('');
  const [mazeCells, setMazeCells] = useState(null);

  const [debugMessage, setDebugMessage] = useState('');

  const baseOrdApiUrl = 'https://tx.ordstuff.info';

  // Step 1: Connect + get addresses
  async function handleGetAddresses() {
    try {
      setDebugMessage('Requesting addresses from Xverse...');
      setAddresses([]);
      setSelectedAddress('');
      setOrdinalsResult('');
      setInscriptions([]);
      setSelectedInscription('');
      setInscriptionDetail('');
      setMazeCells(null);

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

  // Step 2: For chosen address, GET /address/<ADDRESS>
  async function handleLookupAddress() {
    if (!selectedAddress) {
      setDebugMessage('No address selected.');
      return;
    }
    try {
      setInscriptionDetail('');
      setSelectedInscription('');
      setInscriptions([]);
      setMazeCells(null);
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

  // Step 3: For chosen inscription, GET /inscription/<INSCRIPTION_ID>
  async function handleLookupInscription() {
    if (!selectedInscription) {
      setDebugMessage('No inscription selected.');
      return;
    }
    try {
      setMazeCells(null);
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

  // Step 4: Generate playable Maze from inscription
  function handleGenerateMaze() {
    if (!selectedInscription) {
      setDebugMessage('No inscription selected for maze generation.');
      return;
    }
    const cells = buildMazeFromInscriptionID(selectedInscription, 10);
    setMazeCells(cells);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Maze Generator from Inscriptions</h2>

      {/* Step 1: Connect & Get Addresses */}
      <div className="section">
        <h3>1) Get Addresses</h3>
        <button onClick={handleGetAddresses}>Connect & Get Addresses</button>
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

      {/* Step 2: Lookup address -> inscriptions */}
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

      {/* Step 3: Inspect inscription detail */}
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

      {/* Step 4: Generate playable Maze from inscription */}
      {selectedInscription && (
        <div className="section">
          <h3>4) Generate Playable Maze</h3>
          <button onClick={handleGenerateMaze}>
            Make Maze from Inscription ID
          </button>
          <p style={{ marginTop: '0.5rem' }}>
            Use arrow keys or WASD to move. Start is top-left, goal is bottom-right.
          </p>
          {mazeCells && (
            <MazeCanvas cells={mazeCells} />
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
