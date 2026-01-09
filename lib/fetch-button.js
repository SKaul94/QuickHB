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
        setTimeout(_=>{ this._status = ''}, 5000);
      }

      this._status = 'Complete: Data stored in IndexedDB';
      // event looping ???
      this.dispatchEvent( new CustomEvent('database-changed', {
          bubbles: true,
          composed: true,
          detail: {
            action: 'loaded',
            url,
            fileNames,
            time: new Date().toLocaleString('de-DE')
          }
      }) );
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
      <span title="${this._isLoading ? 'Processing...' : 'Lade Zip'}"
        @click="${this._handleFetch}" 
        ?disabled="${this._isLoading}">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="${this._isLoading?'red':'blue'}" class="bi bi-cloud-download" viewBox="0 0 16 16">
          <path d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383"/>
          <path d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.293V5.5a.5.5 0 0 0-1 0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708z"/>
        </svg>
      </span>

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