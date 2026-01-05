/**
 *
 */

import {LitElement, html, css} from './lit-core.min.js';

/**
 * An example element.
 *
 */
export class QuickHbRecordEditor extends LitElement {
  static get styles() {
    return css`
      :host {
        
      }
      .framed { border: thin solid grey; padding: 0.3rem; margin-bottom: 0.6rem; }
      #id { 
        margin-right: 1rem; 
        cursor: not-allowed;
      }
      h2 {
        margin: 0 0 0 0; color: blue;
        display: flex;
        align-items: center; /* Vertically centers them if they have different heights */
        gap: 10px;           /* Modern way to add spacing between the spans */
      }

      /* Target the 3rd span specifically */
      h2 span:last-child {
        margin-left: auto;
      }
      #delete {
        cursor: pointer;
      }  
      label { font-weight: bold; }
      [contenteditable=true] {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          letter-spacing: -0.011em;
          color: #37352f; /* Deep charcoal, easier on eyes than pure black */
          background-color: var(--bg-body);
          
          padding: 1rem
          margin: 0 auto;
          
          cursor: text;
          
          /* Smooth transition for focus */
          border: 1px solid transparent;
          transition: border-color 0.8s ease;
      }

      [contenteditable=true]:focus {
          /* Instead of a harsh outline, use a soft border or side bar */
          border-left: 2px solid #007bff;
      }
      [contenteditable=true]::selection {
          background: rgba(0, 123, 255, 0.2);
      }
      .editor {
        margin: 0 0 0.3rem 0;
      }
      .inline {
        display: inline-block;
      }  
    `;
  }

  static get properties() {
    return {
      /**
       * The record to be edited
       */
      record: {type: Object}
    };
  }

  constructor() {
    super();
    this.record = {};
  }

  _handleInput( event ) {
    const target = event.target;
    this.record[ target.id ] = target.innerText; // no re-rendering
    // with re-rendering:
    // this.record = { ...this.record,
    //   [ target.id ]: target.innerText
    // };
    this.dispatchEvent( new CustomEvent('record-changed', {
      bubbles: true,
      composed: true,
      detail: {
        key: target.id,
        value: target.innerText
      }
    }) );
  }

  _delete( event ) {
    this.dispatchEvent( new CustomEvent('record-delete', {
      bubbles: true,
      composed: true,
      detail: {
        key: this.record.id
      }
    }) );
  }

  render() {
    return html`
      <div id="${this.record.id}" class="framed">
        <h2>
          <span id="id">"${this.record.id}":</span>
          <span id="title" contenteditable="true" @input="${this._handleInput}">${this.record.title}</span>
          <span id="delete" title="Löschen" @click="${this._delete}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
            </svg>
          </span>
        </h2>
        <label class="inline">Section</label>
        <div id="section" class="editor inline" contenteditable="true" @input="${this._handleInput}">
          ${this.record.section}
        </div>
        <label class="inline">Category</label>
        <div id="category" class="editor inline" contenteditable="true" @input="${this._handleInput}">
          ${this.record.category}
        </div>
        <label class="inline">Shortcut</label>
        <div id="shortcut" class="editor inline" contenteditable="true" @input="${this._handleInput}">
          ${this.record.shortcut}
        </div>
        <br>
        <label>Männlich</label>
        <div id="spintax_m" class="editor" contenteditable="true" @input="${this._handleInput}">
          ${this.record.spintax_m}
        </div>
        <label>Weiblich</label>
        <div id="spintax_w" class="editor" contenteditable="true" @input="${this._handleInput}">
          ${this.record.spintax_w}
        </div>
      </div>
    `;
  }

}

window.customElements.define('quick-hb-record-editor', QuickHbRecordEditor);