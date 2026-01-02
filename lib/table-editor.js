class TableEditor extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._keys = [];
    this._values = {};

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          margin-top: 0.5rem;
          display: block;
          font-family: sans-serif;
        }

        table {
          border-collapse: collapse;
          width: 100%;
        }

        th, td {
          border: 1px solid #ccc;
          padding: 0.5rem;
          vertical-align: top;
        }

        th {
          background: #f3f4f6;
          text-align: left;
          width: 30%;
          color: blue;
        }

        .value {
          min-height: 1.5rem;
          outline: none;
        }

        .value:focus {
          background: #eef2ff;
          cursor: text;
        }

        label {
          font-weight: bold;
          font-size: large;
        }
      </style>

      <label>Bitte Werte eintragen:</label>
      <table>
        <tbody></tbody>
      </table>
    `;

    this.tbody = this.shadowRoot.querySelector('tbody');
  }

  /* ==========================
     Properties
     ========================== */

  set keys(arr) {
    if (!Array.isArray(arr)) return;
    if ( this._arraysEqual( this._keys, arr ) ) return;
    this._keys = arr;
    this._render();
  }

  get keys() {
    return this._keys;
  }

  set values(obj) {
    if ( this._objectsEqual( this._values, obj ) ) return;
    this._values = obj; // { ...obj };
    this._render();
  }

  get values() {
    return this._values; // { ...this._values };
  }

  get entries() {
    return Object.entries( this.values );
  }

  _arraysEqual(a, b) {
    return a.length === b.length &&
      a.every((v, i) => v === b[i]);
  }

  _objectsEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;

    const keysA = Object.keys(a);
    if (keysA.length !== Object.keys(b).length) return false;

    return keysA.every(
        key => Object.prototype.hasOwnProperty.call(b, key)
            && a[key] === b[key]
    );
  }


  /* ==========================
     Rendering
     ========================== */

  _render() {
    this.tbody.innerHTML = '';

    this._keys.forEach(key => {
      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.innerText = '['+key+']';

      const td = document.createElement('td');
      const div = document.createElement('div');
      div.className = 'value';
      div.contentEditable = 'true';
      div.innerText = this._values[key] ?? '';

      div.addEventListener('input', () => {
        const value = div.innerText;
        this._values[key] = value;

        this.dispatchEvent(new CustomEvent('value-changed', {
          detail: { key, value },
          bubbles: true,
          composed: true
        }));
      });

      td.appendChild(div);
      tr.append(th, td);
      this.tbody.appendChild(tr);
    });
  }
}

customElements.define('table-editor', TableEditor);