/**
 *
 */

import {LitElement, html, css} from './lit-core.min.js';
import * as Idb from './idb-keyval.js';
import './quick-hb-record-editor.js';

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
          width: 100%;
          margin: 1rem;
          padding: 1rem;
          transform: translateX(-1rem);
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
  async _load() {
    let data; /** @type {Array} */
    try {
      data = await this._inputClickPromise();
    } catch (err) {
      alert("Error loading file: " + err);
    }
    // store array into Idb
    await Idb.set( INDEXEDDB_KEY, data );
    this.database = data;
    this.dispatchEvent( new CustomEvent('indexeddb-set', {
      bubbles: true,
      composed: true,
      detail: {
        key: INDEXEDDB_KEY,
        size: data.length
      }
    }) );
  }

  /**
   * Saves spintax database from IndexedDB into a JSON file on the local disk.
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
  async _save() {
    const data = await Idb.get( INDEXEDDB_KEY );
    try {
      // 1. Open the native "Save As" dialog
      /**
       * If you keep the handle returned by showSaveFilePicker in a variable, 
       * you can write to that same file again later without the user having to see the "Save As" 
       * dialog a second time (though the browser may prompt for permission again).
       */
      if ( ! this._handle ) this._handle = await window.showSaveFilePicker({
        suggestedName: 'data.json',
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });

      // 2. Create a FileSystemWritableFileStream to write to
      const writable = await this._handle.createWritable();

      // 3. Write the formatted JSON string
      const content = JSON.stringify(data, null, 2);
      await writable.write(content);

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

  async _recordChanged( event ) {
    await Idb.set( INDEXEDDB_KEY, this.database );
  }

  async _recordDelete( event ) {
    this.database = this.database.filter( rec => rec.id !== event.detail.key );
    await Idb.set( INDEXEDDB_KEY, this.database );
  }

  _plusButton( event ) {
    let newKey = 'sach_007';
    do {
      newKey = prompt('Eindeutiger Schlüssel für neuen Eintrag?', newKey);
    } while ( this.database.map( rec => rec.id ).includes( newKey ) );
    const newRecord = { ...RECORD_STRUCTURE }; // shallow copy
    newRecord['id'] = newKey;
    this.database.push( newRecord );
    this.database = this.database.slice();
  }

  render() {
    return html`
      <div id="header">
        <h2>QuickHB Spintax Database</h2>
        <div id="buttons">
          <button id="load" class="blue-button" @click="${this._load}">Load</button>
          <button id="save" class="blue-button" @click="${this._save}">Save</button>
        </div>
      </div>
      <div id="record-list">  
        ${this.database.map( ( rec ) => html`<quick-hb-record-editor
          .record=${rec}
          @record-changed="${this._recordChanged}"
          @record-delete="${this._recordDelete}"
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