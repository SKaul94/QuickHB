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
      #id { margin-right: 1rem; }
      h2 { margin: 0 0 0 0; color: blue; }
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

  render() {
    return html`
      <div id="${this.record.id}" class="framed">
        <h2>
          <span id="id">"${this.record.id}":</span>
          <span id="title" contenteditable="true" @input="${this._handleInput}">${this.record.title}</span>
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