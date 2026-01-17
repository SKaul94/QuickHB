import { LitElement, html, css, repeat } from './lit-all.min.js';
import * as Idb from './idb-keyval.js';
import { INDEXEDDB_PERSON_KEY } from './quick-hb-database.js';

class JsonFormEditor extends LitElement {
  static properties = {
    // Das importierte Array (z.B. ["Name", "Email", "Stadt"])
    fields: { type: Array },
    // Das Resultat-Objekt { Name: "...", Email: "..." }
    data: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      font-family: sans-serif;
    }
    h2 { margin-top: 0; color: blue; display: inline-block; }
    table {
      width: 100%;
      border-collapse: collapse;
      border: thin solid grey;
    }
    td {
      padding: 8px;
      border: 1px solid #ddd;
      vertical-align: top;
    }
    .label-col {
      width: 30%;
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .input-col {
      width: 70%;
    }
    [contenteditable] {
      width: 100%;
      min-height: 1.2em;
      outline: none;
      padding: 2px;
    }
    [contenteditable]:focus {
      background-color: #fffdf0;
      box-shadow: inset 0 0 3px rgba(0,0,0,0.1);
    }
  `;

  constructor() {
    super();
    this.fields = [];
    this.data = {};
  }

  // Initialisiert das Datenobjekt, wenn neue Felder geladen werden
  willUpdate(changedProperties) {
    if (changedProperties.has('fields') && Array.isArray(this.fields)) {
      const newData = { ...this.data };
      this.fields.forEach(field => {
        if (!(field in newData)) {
          newData[field] = ""; // Initialwert
        }
      });
      this.data = newData;
    }
  }

  // Realtime Update des Objekts
  _handleInput(field, event) {
    const newValue = event.target.innerText;

    // Wir aktualisieren das Objekt intern
    this.data[field] = newValue;

    // Optional: Event an die Außenwelt senden
    this.dispatchEvent(new CustomEvent('data-changed', {
      detail: { data: this.data },
      bubbles: true,
      composed: true
    }));
  }

  async updateAfterEvent(database, event) {
    this.fields = await Idb.get(INDEXEDDB_PERSON_KEY);
  }

  render() {
    if (!this.fields || this.fields.length === 0) {
      return html`<p>Lade Felder...</p>`;
    }

    return html`
      <h2>QuickHB Personalien</h2>
      <table>
        <tbody>
          ${repeat(this.fields, (field) => field, (field) => html`
            <tr>
              <td class="label-col">${field}</td>
              <td class="input-col">
                <div 
                  contenteditable="true"
                  @input="${(e) => this._handleInput(field, e)}"
                >${this.data[field]}</div>
              </td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }
}

customElements.define('json-form-editor', JsonFormEditor);