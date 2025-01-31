// File: pages/connect.js
import { useState } from 'react';
import Wallet, { AddressPurpose } from 'sats-connect';

export default function ConnectPage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [ordinalsResult, setOrdinalsResult] = useState('');
  const [inscriptions, setInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState('');
  const [inscriptionDetail, setInscriptionDetail] = useState('');

  const [debugMessage, setDebugMessage] = useState('');

  const baseOrdApiUrl = 'https://tx.ordstuff.info';

  // Step 1: Connect to wallet -> request addresses
  async function handleGetAddresses() {
    try {
      setDebugMessage('Requesting addresses from Xverse...');
      setAddresses([]);
      setSelectedAddress('');
      setOrdinalsResult('');
      setInscriptions([]);
      setSelectedInscription('');
      setInscriptionDetail('');

      const accountsResult = await Wallet.request('getAccounts', {
        purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
        message: 'Please share your BTC addresses for usage in Ordinals lookups.'
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

  // Step 2: For the chosen address, GET /address/<ADDRESS> from Ordinals API
  async function handleLookupAddress() {
    if (!selectedAddress) {
      setDebugMessage('No address selected.');
      return;
    }
    try {
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

  // Step 3: For the chosen inscription, GET /inscription/<INSCRIPTION_ID>
  async function handleLookupInscription() {
    if (!selectedInscription) {
      setDebugMessage('No inscription selected.');
      return;
    }
    try {
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

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Connect to Xverse</h2>

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

      {/* Step 2: Lookup address ordinals */}
      {addresses.length > 0 && (
        <div className="section">
          <h3>2) Lookup Ordinals for the Selected Address</h3>
          <button onClick={handleLookupAddress}>Fetch /address/&lt;ADDRESS&gt;</button>
          {ordinalsResult && (
            <pre className="result" style={{ marginTop: '1rem' }}>
              {ordinalsResult}
            </pre>
          )}
        </div>
      )}

      {/* Step 3: Select an inscription to see details */}
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
