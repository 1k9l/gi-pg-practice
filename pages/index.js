import { useState } from 'react';

export default function Home() {
  // For each endpoint, we store any user input & result in local state:
  const [addressInput, setAddressInput] = useState('');
  const [addressResult, setAddressResult] = useState('');

  const [blockHashInput, setBlockHashInput] = useState('');
  const [blockHashResult, setBlockHashResult] = useState('');

  const [blockHeightInput, setBlockHeightInput] = useState('');
  const [blockHeightResult, setBlockHeightResult] = useState('');

  const [blockCountResult, setBlockCountResult] = useState('');
  const [blockHashTipResult, setBlockHashTipResult] = useState('');
  const [blockHashByHeightInput, setBlockHashByHeightInput] = useState('');
  const [blockHashByHeightResult, setBlockHashByHeightResult] = useState('');
  const [blockHeightTipResult, setBlockHeightTipResult] = useState('');
  const [blocksResult, setBlocksResult] = useState('');
  const [blockTimeResult, setBlockTimeResult] = useState('');

  const [decodeTxInput, setDecodeTxInput] = useState('');
  const [decodeTxResult, setDecodeTxResult] = useState('');

  const [inscriptionIdInput, setInscriptionIdInput] = useState('');
  const [inscriptionResult, setInscriptionResult] = useState('');

  const [childIndexInput, setChildIndexInput] = useState('');
  const [inscriptionChildResult, setInscriptionChildResult] = useState('');

  const [postInscriptionsInput, setPostInscriptionsInput] = useState('["inscriptionID1","inscriptionID2"]');
  const [postInscriptionsResult, setPostInscriptionsResult] = useState('');

  const [getInscriptionsResult, setGetInscriptionsResult] = useState('');
  const [inscriptionsPageInput, setInscriptionsPageInput] = useState('');
  const [inscriptionsPageResult, setInscriptionsPageResult] = useState('');

  const [inscriptionsBlockHeightInput, setInscriptionsBlockHeightInput] = useState('');
  const [inscriptionsBlockHeightResult, setInscriptionsBlockHeightResult] = useState('');

  const [installShResult, setInstallShResult] = useState('');

  const [outputInput, setOutputInput] = useState('');
  const [outputResult, setOutputResult] = useState('');

  const [postOutputsInput, setPostOutputsInput] = useState('["txid:0","txid:1"]');
  const [postOutputsResult, setPostOutputsResult] = useState('');

  const [outputsAddressInput, setOutputsAddressInput] = useState('');
  const [outputsTypeInput, setOutputsTypeInput] = useState('any');
  const [outputsAddressResult, setOutputsAddressResult] = useState('');

  const [runeInput, setRuneInput] = useState('');
  const [runeResult, setRuneResult] = useState('');

  const [runesResult, setRunesResult] = useState('');
  const [runesPageInput, setRunesPageInput] = useState('');
  const [runesPageResult, setRunesPageResult] = useState('');

  const [satInput, setSatInput] = useState('');
  const [satResult, setSatResult] = useState('');

  const [statusResult, setStatusResult] = useState('');

  const [txInput, setTxInput] = useState('');
  const [txResult, setTxResult] = useState('');

  const baseUrl = 'https://tx.ordstuff.info';

  // Helper function to handle GET requests
  async function handleGetRequest(endpoint, setResult) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(err.message);
    }
  }

  // Helper function to handle POST requests
  async function handlePostRequest(endpoint, body, setResult) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: body,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(err.message);
    }
  }

  return (
    <div>
      {/* Simple Nav Bar Placeholder */}
      <div className="navbar">
        <h1>Ordinal API Tester</h1>
        <div className="links">
          {/* Add future pages/links here */}
          <span>Home</span>
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        {/* /address/<ADDRESS> */}
        <div className="section">
          <h2>GET /address/&lt;ADDRESS&gt;</h2>
          <label>Address:</label>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="bc1p..."
          />
          <button
            onClick={() =>
              handleGetRequest(`/address/${addressInput}`, setAddressResult)
            }
          >
            Fetch Address Info
          </button>
          {addressResult && <pre className="result">{addressResult}</pre>}
        </div>

        {/* /block/<BLOCKHASH> */}
        <div className="section">
          <h2>GET /block/&lt;BLOCKHASH&gt;</h2>
          <label>Block Hash:</label>
          <input
            type="text"
            value={blockHashInput}
            onChange={(e) => setBlockHashInput(e.target.value)}
            placeholder="000000000019d668..."
          />
          <button
            onClick={() =>
              handleGetRequest(`/block/${blockHashInput}`, setBlockHashResult)
            }
          >
            Fetch Block by Hash
          </button>
          {blockHashResult && <pre className="result">{blockHashResult}</pre>}
        </div>

        {/* /block/<BLOCKHEIGHT> */}
        <div className="section">
          <h2>GET /block/&lt;BLOCKHEIGHT&gt;</h2>
          <label>Block Height:</label>
          <input
            type="number"
            value={blockHeightInput}
            onChange={(e) => setBlockHeightInput(e.target.value)}
            placeholder="e.g. 0"
          />
          <button
            onClick={() =>
              handleGetRequest(
                `/block/${blockHeightInput}`,
                setBlockHeightResult
              )
            }
          >
            Fetch Block by Height
          </button>
          {blockHeightResult && <pre className="result">{blockHeightResult}</pre>}
        </div>

        {/* /blockcount */}
        <div className="section">
          <h2>GET /blockcount</h2>
          <button onClick={() => handleGetRequest('/blockcount', setBlockCountResult)}>
            Get Latest Block Height
          </button>
          {blockCountResult && <pre className="result">{blockCountResult}</pre>}
        </div>

        {/* /blockhash */}
        <div className="section">
          <h2>GET /blockhash</h2>
          <button onClick={() => handleGetRequest('/blockhash', setBlockHashTipResult)}>
            Get Latest Block Hash
          </button>
          {blockHashTipResult && (
            <pre className="result">{blockHashTipResult}</pre>
          )}
        </div>

        {/* /blockhash/<BLOCKHEIGHT> */}
        <div className="section">
          <h2>GET /blockhash/&lt;BLOCKHEIGHT&gt;</h2>
          <label>Block Height:</label>
          <input
            type="number"
            value={blockHashByHeightInput}
            onChange={(e) => setBlockHashByHeightInput(e.target.value)}
          />
          <button
            onClick={() =>
              handleGetRequest(
                `/blockhash/${blockHashByHeightInput}`,
                setBlockHashByHeightResult
              )
            }
          >
            Get Hash By Height
          </button>
          {blockHashByHeightResult && (
            <pre className="result">{blockHashByHeightResult}</pre>
          )}
        </div>

        {/* /blockheight */}
        <div className="section">
          <h2>GET /blockheight</h2>
          <button
            onClick={() => handleGetRequest('/blockheight', setBlockHeightTipResult)}
          >
            Get Latest Block Height
          </button>
          {blockHeightTipResult && (
            <pre className="result">{blockHeightTipResult}</pre>
          )}
        </div>

        {/* /blocks */}
        <div className="section">
          <h2>GET /blocks</h2>
          <button onClick={() => handleGetRequest('/blocks', setBlocksResult)}>
            Get Latest 100 Blocks
          </button>
          {blocksResult && <pre className="result">{blocksResult}</pre>}
        </div>

        {/* /blocktime */}
        <div className="section">
          <h2>GET /blocktime</h2>
          <button onClick={() => handleGetRequest('/blocktime', setBlockTimeResult)}>
            Get Time Of Latest Block
          </button>
          {blockTimeResult && <pre className="result">{blockTimeResult}</pre>}
        </div>

        {/* /decode/<TXID> */}
        <div className="section">
          <h2>GET /decode/&lt;TRANSACTION_ID&gt;</h2>
          <label>Transaction ID:</label>
          <input
            type="text"
            value={decodeTxInput}
            onChange={(e) => setDecodeTxInput(e.target.value)}
            placeholder="Enter TXID"
          />
          <button
            onClick={() =>
              handleGetRequest(`/decode/${decodeTxInput}`, setDecodeTxResult)
            }
          >
            Decode Transaction
          </button>
          {decodeTxResult && <pre className="result">{decodeTxResult}</pre>}
        </div>

        {/* /inscription/<INSCRIPTION_ID> */}
        <div className="section">
          <h2>GET /inscription/&lt;INSCRIPTION_ID&gt;</h2>
          <label>Inscription ID:</label>
          <input
            type="text"
            value={inscriptionIdInput}
            onChange={(e) => setInscriptionIdInput(e.target.value)}
            placeholder="abcdef1234...i0"
          />
          <button
            onClick={() =>
              handleGetRequest(`/inscription/${inscriptionIdInput}`, setInscriptionResult)
            }
          >
            Get Inscription Info
          </button>
          {inscriptionResult && <pre className="result">{inscriptionResult}</pre>}
        </div>

        {/* /inscription/<INSCRIPTION_ID>/<CHILD> */}
        <div className="section">
          <h2>GET /inscription/&lt;INSCRIPTION_ID&gt;/&lt;CHILD&gt;</h2>
          <label>Inscription ID:</label>
          <input
            type="text"
            value={inscriptionIdInput}
            onChange={(e) => setInscriptionIdInput(e.target.value)}
            placeholder="abcdef1234...i0"
          />
          <label>Child (number):</label>
          <input
            type="number"
            value={childIndexInput}
            onChange={(e) => setChildIndexInput(e.target.value)}
          />
          <button
            onClick={() =>
              handleGetRequest(
                `/inscription/${inscriptionIdInput}/${childIndexInput}`,
                setInscriptionChildResult
              )
            }
          >
            Get Child Info
          </button>
          {inscriptionChildResult && (
            <pre className="result">{inscriptionChildResult}</pre>
          )}
        </div>

        {/* POST /inscriptions */}
        <div className="section">
          <h2>POST /inscriptions</h2>
          <label>Array of Inscription IDs (JSON):</label>
          <textarea
            rows={3}
            value={postInscriptionsInput}
            onChange={(e) => setPostInscriptionsInput(e.target.value)}
          />
          <button
            onClick={() =>
              handlePostRequest(
                '/inscriptions',
                postInscriptionsInput,
                setPostInscriptionsResult
              )
            }
          >
            POST Inscriptions
          </button>
          {postInscriptionsResult && (
            <pre className="result">{postInscriptionsResult}</pre>
          )}
        </div>

        {/* GET /inscriptions */}
        <div className="section">
          <h2>GET /inscriptions</h2>
          <button onClick={() => handleGetRequest('/inscriptions', setGetInscriptionsResult)}>
            Get Latest 100 Inscriptions
          </button>
          {getInscriptionsResult && (
            <pre className="result">{getInscriptionsResult}</pre>
          )}
        </div>

        {/* GET /inscriptions/<PAGE> */}
        <div className="section">
          <h2>GET /inscriptions/&lt;PAGE&gt;</h2>
          <label>Page #:</label>
          <input
            type="number"
            value={inscriptionsPageInput}
            onChange={(e) => setInscriptionsPageInput(e.target.value)}
            placeholder="0,1,2..."
          />
          <button
            onClick={() =>
              handleGetRequest(
                `/inscriptions/${inscriptionsPageInput}`,
                setInscriptionsPageResult
              )
            }
          >
            Get Inscriptions By Page
          </button>
          {inscriptionsPageResult && (
            <pre className="result">{inscriptionsPageResult}</pre>
          )}
        </div>

        {/* GET /inscriptions/block/<BLOCKHEIGHT> */}
        <div className="section">
          <h2>GET /inscriptions/block/&lt;BLOCKHEIGHT&gt;</h2>
          <label>Block Height:</label>
          <input
            type="number"
            value={inscriptionsBlockHeightInput}
            onChange={(e) => setInscriptionsBlockHeightInput(e.target.value)}
          />
          <button
            onClick={() =>
              handleGetRequest(
                `/inscriptions/block/${inscriptionsBlockHeightInput}`,
                setInscriptionsBlockHeightResult
              )
            }
          >
            Get Inscriptions For Block
          </button>
          {inscriptionsBlockHeightResult && (
            <pre className="result">{inscriptionsBlockHeightResult}</pre>
          )}
        </div>

        {/* GET /install.sh */}
        <div className="section">
          <h2>GET /install.sh</h2>
          <button onClick={() => handleGetRequest('/install.sh', setInstallShResult)}>
            Fetch install.sh
          </button>
          {installShResult && <pre className="result">{installShResult}</pre>}
        </div>

        {/* GET /output/<OUTPOINT> */}
        <div className="section">
          <h2>GET /output/&lt;OUTPOINT&gt;</h2>
          <label>Outpoint (txid:index):</label>
          <input
            type="text"
            value={outputInput}
            onChange={(e) => setOutputInput(e.target.value)}
            placeholder="abcdef1234:0"
          />
          <button
            onClick={() => handleGetRequest(`/output/${outputInput}`, setOutputResult)}
          >
            Fetch Output
          </button>
          {outputResult && <pre className="result">{outputResult}</pre>}
        </div>

        {/* POST /outputs */}
        <div className="section">
          <h2>POST /outputs</h2>
          <label>Array of Outpoints (JSON):</label>
          <textarea
            rows={3}
            value={postOutputsInput}
            onChange={(e) => setPostOutputsInput(e.target.value)}
          />
          <button
            onClick={() =>
              handlePostRequest('/outputs', postOutputsInput, setPostOutputsResult)
            }
          >
            POST Outputs
          </button>
          {postOutputsResult && (
            <pre className="result">{postOutputsResult}</pre>
          )}
        </div>

        {/* GET /outputs/<ADDRESS>?type=xxx */}
        <div className="section">
          <h2>GET /outputs/&lt;ADDRESS&gt; [type=optional]</h2>
          <label>Address:</label>
          <input
            type="text"
            value={outputsAddressInput}
            onChange={(e) => setOutputsAddressInput(e.target.value)}
            placeholder="1abc..."
          />
          <label>Type (any|cardinal|inscribed|runic):</label>
          <input
            type="text"
            value={outputsTypeInput}
            onChange={(e) => setOutputsTypeInput(e.target.value)}
            placeholder="any"
          />
          <button
            onClick={() =>
              handleGetRequest(
                `/outputs/${outputsAddressInput}?type=${outputsTypeInput}`,
                setOutputsAddressResult
              )
            }
          >
            Get UTXOs By Address
          </button>
          {outputsAddressResult && (
            <pre className="result">{outputsAddressResult}</pre>
          )}
        </div>

        {/* GET /rune/<RUNE> */}
        <div className="section">
          <h2>GET /rune/&lt;RUNE&gt;</h2>
          <label>Rune Ticker or ID:</label>
          <input
            type="text"
            value={runeInput}
            onChange={(e) => setRuneInput(e.target.value)}
            placeholder="e.g. UNCOMMONGOODS"
          />
          <button
            onClick={() => handleGetRequest(`/rune/${runeInput}`, setRuneResult)}
          >
            Get Rune Info
          </button>
          {runeResult && <pre className="result">{runeResult}</pre>}
        </div>

        {/* GET /runes */}
        <div className="section">
          <h2>GET /runes</h2>
          <button onClick={() => handleGetRequest('/runes', setRunesResult)}>
            Get Last 100 Runes
          </button>
          {runesResult && <pre className="result">{runesResult}</pre>}
        </div>

        {/* GET /runes/<PAGE> */}
        <div className="section">
          <h2>GET /runes/&lt;PAGE&gt;</h2>
          <label>Page #:</label>
          <input
            type="number"
            value={runesPageInput}
            onChange={(e) => setRunesPageInput(e.target.value)}
            placeholder="0,1,2..."
          />
          <button
            onClick={() =>
              handleGetRequest(`/runes/${runesPageInput}`, setRunesPageResult)
            }
          >
            Get Runes By Page
          </button>
          {runesPageResult && <pre className="result">{runesPageResult}</pre>}
        </div>

        {/* GET /sat/<SAT> */}
        <div className="section">
          <h2>GET /sat/&lt;SAT&gt;</h2>
          <label>Satoshi number:</label>
          <input
            type="text"
            value={satInput}
            onChange={(e) => setSatInput(e.target.value)}
            placeholder="e.g. 2099994106992659"
          />
          <button onClick={() => handleGetRequest(`/sat/${satInput}`, setSatResult)}>
            Get Sat Info
          </button>
          {satResult && <pre className="result">{satResult}</pre>}
        </div>

        {/* GET /status */}
        <div className="section">
          <h2>GET /status</h2>
          <button onClick={() => handleGetRequest('/status', setStatusResult)}>
            Get Server Status
          </button>
          {statusResult && <pre className="result">{statusResult}</pre>}
        </div>

        {/* GET /tx/<TRANSACTION_ID> */}
        <div className="section">
          <h2>GET /tx/&lt;TRANSACTION_ID&gt;</h2>
          <label>TXID:</label>
          <input
            type="text"
            value={txInput}
            onChange={(e) => setTxInput(e.target.value)}
            placeholder="abcdef1234..."
          />
          <button
            onClick={() => handleGetRequest(`/tx/${txInput}`, setTxResult)}
          >
            Fetch TX
          </button>
          {txResult && <pre className="result">{txResult}</pre>}
        </div>
      </div>
    </div>
  );
}
