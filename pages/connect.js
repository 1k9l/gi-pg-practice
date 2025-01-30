import { useState } from 'react';
import Wallet, { AddressPurpose } from 'sats-connect';

/**
 * This page uses sats-connect to request addresses from the Xverse wallet,
 * then uses the GET /address/<ADDRESS> endpoint from your existing Ordinals API
 * page (https://tx.ordstuff.info) to fetch inscriptions/outputs for a chosen address.
 * The user can then select an inscription to see its details.
 */
export default function ConnectPage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [ordinalsResult, setOrdinalsResult] = useState('');   // text output from /address/<ADDRESS>
  const [inscriptions, setInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState('');
  const [inscriptionDetail, setInscriptionDetail] = useState('');

  // For debugging any error or extra messages
  const [debugMessage, setDebugMessage] = useState('');

  const baseOrdApiUrl = 'https://tx.ordstuff.info';

  // Step 1: Connect to wallet -> Request addresses
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
      setSelectedAddress(extracted[0]); // pick the first as default
      setDebugMessage(`Addresses retrieved:\n${extracted.join('\n')}`);
    } catch (error) {
      setDebugMessage(`Error retrieving addresses: ${error.message}`);
    }
  }

  // Step 2: For the chosen address, call GET /address/<ADDRESS> from the Ordinals API
  async function handleLookupAddress() {
    if (!selectedAddress) {
      setDebugMessage('No address selected.');
      return;
    }
    try {
      setInscriptionDetail('');
      setSelectedInscription('');
      setInscriptions([]);
      setOrdinalsResult('Looking up...');

      const url = `${baseOrdApiUrl}/address/${selectedAddress}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(`HTTP ${res.status} - ${errTxt}`);
      }
      const data = await res.json();
      setOrdinalsResult(JSON.stringify(data, null, 2));

      // If 'inscriptions' is present in the response, let's store them
      if (data.inscriptions && Array.isArray(data.inscriptions)) {
        setInscriptions(data.inscriptions);
        if (data.inscriptions.length > 0) {
          setSelectedInscription(data.inscriptions[0]);
        }
      } else {
        setInscriptions([]);
      }
    } catch (error) {
      setOrdinalsResult('');
      setDebugMessage(`Error looking up ordinals: ${error.message}`);
    }
  }

  // Step 3: For the chosen inscription, call GET /inscription/<INSCRIPTION_ID>
  async function handleLookupInscription() {
    if (!selectedInscription) {
      setDebugMessage('No inscription selected.');
      return;
    }
    try {
      setInscriptionDetail('Fetching inscription details...');
      const url = `${baseOrdApiUrl}/inscription/${selectedInscription}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
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
    <div style={{ color: '#fff', padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Xverse Connect</h1>

      {/* Step 1: Connect to wallet */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleGetAddresses}
          style={{ background: '#0070f3', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px' }}
        >
          Connect & Get Addresses
        </button>
        {addresses.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <label style={{ marginRight: '0.5rem' }}>Select Address:</label>
            <select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              style={{ background: '#222', color: '#fff', padding: '0.3rem 1rem', borderRadius: '4px' }}
            >
              {addresses.map((addr) => (
                <option key={addr} value={addr}>{addr}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Step 2: Lookup address ordinals */}
      {addresses.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={handleLookupAddress}
            style={{ background: '#0070f3', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px' }}
          >
            Lookup Ordinals for Selected Address
          </button>
          {ordinalsResult && (
            <pre style={{ background: '#000', marginTop: '1rem', padding: '1rem', whiteSpace: 'pre-wrap' }}>
              {ordinalsResult}
            </pre>
          )}
        </div>
      )}

      {/* Step 3: Show inscriptions list, let user pick, then GET /inscription/<ID> */}
      {inscriptions.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Inscription:</label>
          <select
            style={{ background: '#222', color: '#fff', padding: '0.3rem 1rem', borderRadius: '4px', marginBottom: '0.5rem' }}
            value={selectedInscription}
            onChange={(e) => setSelectedInscription(e.target.value)}
          >
            {inscriptions.map((insc) => (
              <option key={insc} value={insc}>{insc}</option>
            ))}
          </select>
          <br />
          <button
            onClick={handleLookupInscription}
            style={{ background: '#0070f3', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px' }}
          >
            Lookup This Inscription
          </button>

          {inscriptionDetail && (
            <pre style={{ background: '#000', marginTop: '1rem', padding: '1rem', whiteSpace: 'pre-wrap' }}>
              {inscriptionDetail}
            </pre>
          )}
        </div>
      )}

      {/* Debug messages */}
      {debugMessage && (
        <div style={{ background: '#222', padding: '1rem', marginTop: '1rem', border: '1px solid #444' }}>
          <strong>Debug:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#0f0' }}>{debugMessage}</pre>
        </div>
      )}
    </div>
  );
}
