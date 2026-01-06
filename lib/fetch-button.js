/**
 * fetch-button.js
 */
import { LitElement, html, css } from './lit-core.min.js';
import { decrypt, bytesToString } from './crypto.js';
import * as Idb from './idb-keyval.js';
import { JSZip } from './jszip.js';

class FetchButton extends LitElement {
  static properties = {
    url: { type: String },
    _isLoading: { type: Boolean, state: true },
    _status: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: system-ui, sans-serif;
    }

    .blue-button {
          display: inline-block;
          padding: 0.3rem 0.6rem;
          font: inherit;
          text-align: center;
          border: thin solid;
          border-radius: 6px;
          border-color: white black black white;
          box-shadow: 4px 4px 3px 0 #777777;
          background-color: #9dd2f6;
          cursor: pointer;
    }

    .blue-button:focus {
          outline: none;
          background-color: deepskyblue;
    }

    .blue-button:active {
          outline: none;
          background-color: deepskyblue;
          transform: translateY(6px);
    } 

    .abort-btn {
      background-color: #ff4444;
      color: white;
      border: none;
      border-radius: 4px;
    }
    .status {
      font-size: 0.9em;
      color: #666;
    }
  `;

  constructor() {
    super();
    this.url = '';
    this._isLoading = false;
    this._status = '';
    this._abortController = null;
  }

  async _handleFetch() {
    let url = this.url;
    url = prompt( 'Welches ZIP-Archiv laden?', url );
    if ( ! url ) {
      this._status = 'Error: No URL provided';
      return;
    }

    this._isLoading = true;
    this._status = 'Fetching...';
    this._abortController = new AbortController();

    try {
      // 1. Fetch the ZIP file
      const response = await fetch(url, {
        signal: this._abortController.signal
      });

      if (!response.ok) throw new Error(` fetching ${url}! HTTP status: ${response.status}`);
      
      const blob = await response.blob();
      this._status = 'Unzipping...';

      // 2. Unzip using JSZip
      const zip = await JSZip.loadAsync(blob);
      
      // We process all files found in the ZIP
      const fileNames = Object.keys(zip.files);
      
      for (const name of fileNames) {
        if (zip.files[name].dir) continue;

        this._status = `Decrypting ${name}...`;
        const encryptedData = await zip.files[name].async('uint8array');

        // 3. Decrypt using crypto.js (Browser Crypto API)
        // Note: decrypt() calls getPassword() internally if second arg is missing
        const decryptedBuffer = await decrypt(encryptedData);
        
        // Convert decrypted ArrayBuffer to JSON
        const decryptedUint8 = new Uint8Array(decryptedBuffer);
        const jsonText = bytesToString(decryptedUint8);
        const jsonData = JSON.parse(jsonText);

        // 4. Store into IndexedDB
        this._status = `Storing ${name} in DB...`;
        await Idb.set(name, jsonData);
        this.dispatchEvent( new CustomEvent('database-changed', {
          bubbles: true,
          composed: true,
          detail: {
            name
          }
        }) );
        setTimeout(_=>{ this._status = ''}, 5000);
      }

      this._status = 'Complete: Data stored in IndexedDB';
    } catch (err) {
      if (err.name === 'AbortError') {
        this._status = 'Fetch aborted.';
      } else {
        this._status = `Error: ${err.message}`;
        console.error(err);
      }
    } finally {
      this._isLoading = false;
      this._abortController = null;
    }
  }

  _handleAbort() {
    if (this._abortController) {
      this._abortController.abort();
    }
  }

  render() {
    return html`
      <button 
        class="blue-button"
        @click="${this._handleFetch}" 
        ?disabled="${this._isLoading}">
        ${this._isLoading ? 'Processing...' : 'Lade Zip'}
      </button>

      ${this._isLoading 
        ? html`
            <button class="abort-btn" @click="${this._handleAbort}">
              Abort
            </button>` 
        : ''}

      <span class="status">${this._status}</span>
    `;
  }
}

customElements.define('fetch-button', FetchButton);