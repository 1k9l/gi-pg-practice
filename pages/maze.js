// File: pages/maze.js

import { useState } from 'react';
import Wallet, { AddressPurpose } from 'sats-connect';

/**
 * 1) We'll get addresses from Xverse, just like connect.js
 * 2) We'll fetch /address/<ADDRESS> to see all inscriptions
 * 3) We'll choose an inscription
 * 4) We'll generate a deterministic Maze from that inscription ID
 */

// Simple deterministic "hash string => integer array" function
// We'll use it to seed a random generator for the maze.
function hashStringToNumbers(str) {
  // Basic approach: transform each char code, sum & shift
  // This is not cryptographically strong, but it's enough for a stable "seed".
  let hash1 = 0x12345678;
  let hash2 = 0x87654321;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash1 = (hash1 ^ c) + ((hash1 << 5) + (hash1 >> 2)) | 0;
    hash2 = (hash2 ^ c) + ((hash2 << 6) + (hash2 >> 3)) | 0;
  }
  return [hash1 >>> 0, hash2 >>> 0]; // forced unsigned
}

// We'll do a small pseudo-random generator from two seeds.
function createSeededRandom([seed1, seed2]) {
  let s1 = seed1;
  let s2 = seed2;

  // Return a function that gives us a float between 0 and 1
  return function random() {
    // Some arbitrary operations
    s1 ^= s1 << 13; s1 ^= s1 >> 17; s1 ^= s1 << 5;
    s2 ^= s2 << 15; s2 ^= s2 >> 13; s2 ^= s2 << 7;
    // combine
    const t = (s1 + s2) >>> 0;
    // scale to [0, 1)
    return (t & 0xFFFFFF) / 16777216;
  };
}

/**
 * We'll create a small NxN maze with a random DFS carve-out.
 * We'll store it as ASCII lines. The function returns the ASCII string.
 */
function generateMazeASCII(inscriptionId) {
  const [hash1, hash2] = hashStringToNumbers(inscriptionId);
  const rand = createSeededRandom([hash1, hash2]);

  const N = 10; // Maze dimension
  // We'll represent a grid of cells, each cell has walls up/down/left/right
  // We'll store them in an array, then carve out with a DFS.
  const cells = [];
  for (let i = 0; i < N; i++) {
    cells.push([]);
    for (let j = 0; j < N; j++) {
      // each cell: { visited, walls: [top,right,bottom,left] }
      cells[i].push({
        visited: false,
        walls: [true, true, true, true]
      });
    }
  }

  // direction offsets: up(0),right(1),down(2),left(3)
  const dirOffsets = [
    [-1, 0], [0, 1], [1, 0], [0, -1]
  ];

  // DFS stack
  const stack = [[0, 0]];
  cells[0][0].visited = true;

  while (stack.length > 0) {
    const [row, col] = stack[stack.length - 1];

    // gather unvisited neighbors
    const neighbors = [];
    for (let d = 0; d < 4; d++) {
      const nr = row + dirOffsets[d][0];
      const nc = col + dirOffsets[d][1];
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && !cells[nr][nc].visited) {
        neighbors.push(d);
      }
    }

    if (neighbors.length === 0) {
      // backtrack
      stack.pop();
    } else {
      // pick a random direction
      const d = neighbors[Math.floor(rand() * neighbors.length)];
      // carve out
      cells[row][col].walls[d] = false;

      const nr = row + dirOffsets[d][0];
      const nc = col + dirOffsets[d][1];
      cells[nr][nc].visited = true;
      // also remove the opposite wall from the neighbor
      // 0->2, 1->3, 2->0, 3->1
      const opposite = (d + 2) % 4;
      cells[nr][nc].walls[opposite] = false;

      // push neighbor
      stack.push([nr, nc]);
    }
  }

  // Now build ASCII representation
  // We'll create top line, then for each row, for each cell, we do:
  //  if walls[0] -> a horizontal or else " "
  // It's simpler to do a 2-row approach: one for horizontal edges, one for vertical edges.
  let output = '';

  // top border
  output += ' _'.repeat(N) + '\n';

  for (let r = 0; r < N; r++) {
    let rowLine = '';
    let bottomLine = '';
    for (let c = 0; c < N; c++) {
      const cell = cells[r][c];
      const rightWall = cell.walls[1];
      const bottomWall = cell.walls[2];

      // For rowLine: if left wall or c=0, we add '|', else ' '
      if (c === 0) {
        rowLine += '|';
      }
      rowLine += cell.walls[0] ? '_' : ' ';
      // If rightWall, put '|', else ' '
      rowLine += rightWall ? '|' : ' ';

      // For bottomLine, maybe skip for brevity. We'll rely on rowLine's underscores.
      // But let's do a quick approach: if bottomWall => underscore beneath
      bottomLine += '  ';
    }
    output += rowLine + '\n';
    // We won't do bottomLine for a minimal approach
  }

  return output;
}


export default function MazePage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [ordinalsResult, setOrdinalsResult] = useState('');
  const [inscriptions, setInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState('');
  const [inscriptionDetail, setInscriptionDetail] = useState('');
  const [mazeASCII, setMazeASCII] = useState('');

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
      setMazeASCII('');

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
      setMazeASCII('');
      setInscriptionDetail('');
      setSelectedInscription('');
      setInscriptions([]);
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
      setMazeASCII('');
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

  // Step 4: Generate Maze from inscription ID
  function handleGenerateMaze() {
    if (!selectedInscription) {
      setDebugMessage('No inscription selected for maze generation.');
      return;
    }
    const maze = generateMazeASCII(selectedInscription);
    setMazeASCII(maze);
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

      {/* Step 4: Generate Maze from inscription */}
      {selectedInscription && (
        <div className="section">
          <h3>4) Generate Maze</h3>
          <button onClick={handleGenerateMaze}>
            Make Maze from Inscription ID
          </button>
          {mazeASCII && (
            <pre className="result" style={{ marginTop: '1rem' }}>
              {mazeASCII}
            </pre>
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
