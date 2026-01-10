/**
 *
 */

import {LitElement, html, css} from './lit-all.min.js';
import * as Idb from './idb-keyval.js';
import './quick-hb-record-editor.js';
import { encrypt } from './crypto.js';
import {JSZip} from './jszip.js';

export const INDEXEDDB_KEY = 'spintax';
export const INDEXEDDB_KEY_STRUCTURE = 'structure';
export const RECORD_STRUCTURE = {
      "id": "",
      "section": "",
      "category": "",
      "title": "",
      "shortcut": "",
      "spintax_m": "",
      "spintax_w": "",
      "spintax_p": ""
    };

/**
 * Database of spintax
 *
 */
export class QuickHbDatabase extends LitElement {
  static get styles() {
    return css`
      :host {
        
      }

      #header {
          display: flex;
          justify-content: space-between;
      }

      h2 { margin-top: 0; color: blue; display: inline-block; }

      #buttons {
        display: inline-block;
      }

      .hidden {
        display: none;
      }

      .blue-button {
          display: inline-block;
          padding: 0.3rem;
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
          
      .full-width {
          width: 90%;
          margin: 1rem;
          padding: 1rem;
      }
    `;
  }

  static get properties() {
    return {
      /**
       * Array of objects with spintax texts
       */
      database: {type: Array}
    };
  }

  constructor() {
    super();
    this.database = [];

    /**
     * Create a hidden input element for JSON file loading:
     * To load a local file in a web browser, you must use the <input type="file"> element pattern. 
     * Even though we are writing it in JavaScript, browsers require a "User Gesture" 
     * (like a click) to open the file picker for security reasons.
     */
    this._input = document.createElement('input');
    this._input.type = 'file';
    this._input.accept = '.json,application/json'; // Filter for JSON files
  }

  async firstUpdated() {
    this.database = await Idb.get( INDEXEDDB_KEY ) || [];
  }

  /**
   * Loads a JSON file from the local disk.
   * 
   * Works on Chrome and Safari: window.showOpenFilePicker API is more powerful, but Safari 
   * does not fully support it yet (as of early 2026, it remains partially implemented or 
   * behind flags in some versions). The method provided above is the most reliable cross-browser 
   * way to handle local files.
   * 
   * @returns {Promise<Object>} The parsed JSON data.
   */
  _inputClickPromise() {
    return new Promise((resolve, reject) => {
      // Listen for the file selection
        this._input.onchange = async (event) => {
          const file = event.target.files[0];
          if (!file) {
            reject(new Error("No file selected"));
            return;
          }

          try {
            // 3. Read the file as text
            // .text() is supported in Chrome 76+ and Safari 14+
            const text = await file.text();
            
            // 4. Parse and return the data
            const json = JSON.parse(text);
            resolve(json);
          } catch (err) {
            reject(new Error("Failed to parse JSON: " + err.message));
          }
        };

        // 5. Handle cancellation (optional)
        this._input.oncancel = () => {
          reject(new Error("User cancelled file selection"));
        };
        // Programmatically trigger the file picker
        this._input.click();
    });  
  }

  /**
   * Loads a JSON file from the local disk and stores it into IndexedDB.
   */
  async _load( event ) {
    let data; /** @type {Array} */
    try {
      data = await this._inputClickPromise();
    } catch (err) {
      alert("Error loading file: " + err);
    }
    // store array into Idb
    await Idb.set( INDEXEDDB_KEY, data );
    this.database = data;
    this.dispatchEvent( new CustomEvent('database-changed', {
      bubbles: true,
      composed: true,
      detail: {
        key: INDEXEDDB_KEY,
        size: data.length
      }
    }) );
  }

  /**
   * Saves data on the local disk.
   * 
   * Works on Chrome, not Safari: As of early 2026, the window.showSaveFilePicker() API 
   * (part of the File System Access API) allows for a more "native" experience where 
   * users can choose exactly where to save. However, it is still not supported in Safari.
   * 
   * Advantages: 
   * Native Experience: Instead of the file just dropping into the "Downloads" folder, 
   * the user gets a standard OS dialog to pick a folder and name the file.
   * Overwrite Protection: If the user selects an existing file, the browser handles 
   * the "Are you sure you want to overwrite?" warning automatically.
   * No Ghost Downloads: It doesn't require creating hidden <a> tags or temporary 
   * Blob URLs in memory.
   * Streaming: For very large JSON files, createWritable() is more memory-efficient 
   * than the older Blob method.
   */
  async _saveData( options ) {
    const { data, filename, description, mimetype } = options;
    try {
      // 1. Open the native "Save As" dialog
      /**
       * If you keep the handle returned by showSaveFilePicker in a variable, 
       * you can write to that same file again later without the user having to see the "Save As" 
       * dialog a second time (though the browser may prompt for permission again).
       */
      if ( ! this._handle ) this._handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description,
          accept: mimetype
        }],
      });

      // 2. Create a FileSystemWritableFileStream to write to
      const writable = await this._handle.createWritable();

      // 3. Write the data
      await writable.write(data);

      // 4. Close the file (this actually commits the changes to disk)
      await writable.close();

      console.log('File saved successfully to disk.');
    } catch (err) {
      // If the user cancels the picker, an AbortError is thrown
      if (err.name === 'AbortError') {
        alert('Save cancelled by user.');
      } else {
        alert('An error occurred during save:' + err);
      }
    }
  }

  /**
   * Saves spintax database from IndexedDB into a JSON file on the local disk.
   */
  async _save( event ) {
    this._saveData({
      data: JSON.stringify( await Idb.get( INDEXEDDB_KEY ), null, 2 ),
      filename: 'data.json',
      description: 'JSON Files',
      mimetype: { 'application/json': ['.json'] }
    });
  }

  async _zip( event ) {
    const encoder = new TextEncoder();
    const arraybuffer = encoder.encode( JSON.stringify( await Idb.get( INDEXEDDB_KEY ), null, 2 ) );
    const encryptedBinary = encrypt( arraybuffer, null, this.shadowRoot );
    const zip = new JSZip();
    zip.file( INDEXEDDB_KEY, encryptedBinary, { binary: true } );

    const defaultFileName = "db.zip";

    const zipContent = await zip.generateAsync({type:"uint8array"});

    const blob = new Blob([zipContent], {type: "application/x-zip"});

    this._saveData({
      data: blob,
      filename: 'db.zip',
      description: 'Zip Archive',
      mimetype: { 'application/zip': ['.zip'] }
    });
  }

  async _databaseChanged( event ) {
    if ( event.detail.action === 'record-deleted' ) {
      this.database = this.database.filter( rec => rec.id !== event.detail.key );
    } else { // 'record-changed'
      this.database = this.database.slice();
    }
    await Idb.set( INDEXEDDB_KEY, this.database );
    event.detail.size = this.database.length;
    // CustomEvent('database-changed') bubbles up
  }

  _plusButton( event ) {
    const database = this.database || [];
    let newKey = 'sach_007';
    do {
      newKey = prompt('Eindeutiger Schlüssel für neuen Eintrag?', newKey);
      if ( ! newKey ) return;
    } while ( database.map( rec => rec.id ).includes( newKey ) );
    const newRecord = { ...RECORD_STRUCTURE }; // shallow copy
    newRecord['id'] = newKey;
    database.push( newRecord );
    this.database = database.slice();
    Idb.set( INDEXEDDB_KEY, this.database );
    this.dispatchEvent( new CustomEvent('database-changed', {
      bubbles: true,
      composed: true,
      detail: {
        key: newKey,
        action: 'record-added',
        size: this.database.length
      }
    }) );
  }

  /**
   * update this component after a change in another component
   * 
   * see index.js Observer Pattern
   * 
   * @param {*} database - fresh instance from IndexedDB = Single Source of Truth
   * @param {*} event - contains details about what changed
   */
  updateAfterEvent( database, event ) {
    if ( ! event ) return; // updateAfterEvent call in initialization
    this.database = database;
  }

  render() {
      return html`
        <div id="header">
          <h2>QuickHB Spintax Database</h2>
           <div id="buttons">
            <button id="load" title="Lade Datenbank von lokaler Platte" class="blue-button" @click="${this._load}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-upload" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
              </svg>
              Lade</button>
            <button id="save" title="Speichere Datenbank auf lokale Platte" class="blue-button" @click="${this._save}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
              </svg>
              Speicher</button>
            <button id="zip" title="Erzeuge verschlüsseltes Zip-Archiv" class="blue-button" @click="${this._zip}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-zip" viewBox="0 0 16 16">
                <path d="M5 7.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v.938l.4 1.599a1 1 0 0 1-.416 1.074l-.93.62a1 1 0 0 1-1.11 0l-.929-.62a1 1 0 0 1-.415-1.074L5 8.438zm2 0H6v.938a1 1 0 0 1-.03.243l-.4 1.598.93.62.929-.62-.4-1.598A1 1 0 0 1 7 8.438z"/>
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1h-2v1h-1v1h1v1h-1v1h1v1H6V5H5V4h1V3H5V2h1V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5z"/>
              </svg>
              Zip</button>
          </div>
        </div>
        <p>Spintax-Texte für männliche und weibliche Form getrennt. Alternativen in geschweifte Klammern, Variablen in eckige Klammern schreiben. Männliche und weibliche Form müssen die gleichen Variablen enthalten.</p>
        <div id="record-list">  
          ${this.database?.map( ( rec ) => html`<quick-hb-record-editor
            .record=${rec}
            @database-changed="${this._databaseChanged}"
            ></quick-hb-record-editor>` )}
        </div>
        <button id="plus-button" class="blue-button full-width" @click="${this._plusButton}" title="Neu hinzufügen"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
  </svg></button>   
      `;
  }

}

window.customElements.define('quick-hb-database', QuickHbDatabase);