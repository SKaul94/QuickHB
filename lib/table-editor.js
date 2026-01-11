import { LitElement, html, css, repeat } from './lit-all.min.js';

export const RegexSquareBrackets = /\[([^\[\]]+)\]/g;

export class TableEditor extends LitElement {
  static properties = {
    // Input property
    database: { type: Array },
    // Internal state to store discovered variable names
    _variables: { state: true },
    // Internal state to store the values entered for those variables
    _variableValues: { state: true }
  };

  get values() {
    return this._variableValues;
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
    if ( ! event ) return;
    if ( database ) this.database = database;
  }

  static styles = css`
    :host { display: block; font-family: system-ui, sans-serif; padding: 1rem; }
    :host * { box-sizing: border-box; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #ddd; }
    th, td { text-align: center; border-bottom: 1px solid #ddd; }
    th { background-color: #f8f9fa; font-weight: bold; }
    td:first-child { text-align: center; };  
    input { 
      width: 100%; padding: 6px; box-sizing: border-box; 
      border: 1px solid #ccc; border-radius: 4px; 
    }
    .blue { color: blue; }  
    .empty { color: #666; font-style: italic; }
    [contenteditable=true] {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        letter-spacing: -0.011em;
        color: #37352f; /* Deep charcoal, easier on eyes than pure black */
        background-color: #d6e5eaff;
        
        padding: 0 0.2rem;
        margin: 0 auto;
        min-width: 3rem;
        
        cursor: text;
        
        /* Smooth transition for focus */
        border: 1px solid transparent;
        transition: border-color 0.8s ease;
    }

    [contenteditable=true]:focus {
        /* Instead of a harsh outline, use a soft border or side bar */
        border: thin solid #007bff;
        background: rgba(0, 123, 255, 0.2);
        box-shadow: 5px 5px 15px 5px #000000;
        
    }
    [contenteditable=true]::selection {
        background: rgba(0, 123, 255, 0.2);
    }
    [contenteditable=true]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
    }
    .editor {
      width: 100%;
      margin: 0;
    }
    .inline {
      display: inline-block;
    }
  `;

  constructor() {
    super();
    this.database = [];
    this._variables = [];
    this._variableValues = {}; // Structure: { "X": "Value 1", "Y": "Value 2" }
  }

  // Lifecycle: Runs whenever properties change, but before rendering
  willUpdate(changedProperties) {
    if (changedProperties.has('database')) {
      this._extractVariables();
    }
  }

  _extractVariables() {
    const foundVars = new Set();

    // 1. Scan all spintax_m fields for variables [Name]
    this.database?.forEach(item => {
      if (item.spintax_m) {
        let match;
        while ((match = RegexSquareBrackets.exec(item.spintax_m)) !== null) {
          foundVars.add(match[1]);
        }
      }
    });

    // 2. Convert to sorted array for consistent rendering
    const newVarsList = Array.from(foundVars).sort();

    // 3. Clean up _variableValues (remove values for variables that no longer exist)
    const updatedValues = { ...this._variableValues };
    Object.keys(updatedValues).forEach(key => {
      if (!foundVars.has(key)) delete updatedValues[key];
    });

    this._variables = newVarsList;
    this._variableValues = updatedValues;
  }

  _handleInput(varName, event) {
    const newValue = event.target.innerText.trim();
    this._variableValues = {
      ...this._variableValues,
      [varName]: newValue
    };
    
    // Dispatch custom event so parent components can react to the edit
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: { allValues: this._variableValues, changed: varName, value: newValue },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (this._variables.length === 0) {
      return html`<p class="empty">No variables found in database (search patterns like [VarName]).</p>`;
    }

    return html`
      <table>
        <thead>
          <tr>
            <th>Variablen-Name</th>
            <th>Variablen-Wert</th>
          </tr>
        </thead>
        <tbody>
          ${repeat(
            this._variables,
            (varName) => varName, // Unique key for efficient re-rendering
            (varName) => html`
              <tr>
                <td><strong class="blue">[${varName}]</strong></td>
                <td>
                  <div 
                    class="editor inline" 
                    contenteditable="true"
                    .value="${this._variableValues[varName] || ''}" 
                    @input="${(e) => this._handleInput(varName, e)}"
                    data-placeholder="Wert für ${varName}..."
                  ></div>
                </td>
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }
}

customElements.define('table-editor', TableEditor);