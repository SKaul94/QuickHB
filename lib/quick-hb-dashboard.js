/**
 * QuickHbDashboard
 */

import {LitElement, html, css} from './lit-core.min.js';
import * as Idb from './idb-keyval.js';
import { INDEXEDDB_KEY } from './quick-hb-database.js';
import './fetch-button.js';

/**
 * Overview of Application status with some utility functions
 */
export class QuickHbDashboard extends LitElement {
  static get styles() {
    return css`
      :host {

      }
      
      #header {
          display: flex;
          justify-content: space-between;
      }

      h2 { margin-top: 0; color: blue; display: inline-block; }

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
      
      p { line-height: 1.6; color: var(--text-muted); margin-bottom: 16px; }

      .hidden {
        display: none;
      }

      /* Kleine visuelle Elemente für Demo-Zwecke */
      .demo-card {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 8px;
          margin-top: 10px;
          border-left: 4px solid var(--primary);
      }
    `;
  }

  static get properties() {
    return {
      message: {type: String},
      statistics: {type: String}
    };
  }

  async firstUpdated() {
    this._database = await Idb.get( INDEXEDDB_KEY );
    this.message = this._database ? html`Spintax-Datenbank im Browser` : html`Keine Datenbank geladen`;
    this.statistics = `Anzahl Spintax-Regeln: ${this._database?.length || 0}.`;
  }

  /**
   * Database has been loaded via Fetch Button from some URL
   * @param {CustomEvent} event database-changed
   */
  _databaseChanged( event ) {
    const { url, fileNames, time } = event.detail;
    this.message = `${fileNames} geladen von ${url} um ${time}.`;
    this.statistics = `Anzahl Spintax-Regeln: ${this._database?.length || 0}.`;
    // CustomEvent('database-changed') is bubbled with action: 'loaded'
  }

  /**
   * Database has been deleted via Click on FetchButton
   * @param {PointerEvent} event click 
   */
  async _delete( event ) {
    await Idb.del( INDEXEDDB_KEY );
    this.message = `Datenbank gelöscht.`;
    this.statistics = '';
    this.dispatchEvent( new CustomEvent('database-changed', {
      bubbles: true,
      composed: true,
      detail: { action: 'deleted' }
    }) );
  }

  updateAfterEvent( database, event ) {
    if ( ! event ) return; // updateAfterEvent call in initialization
    const { action, key, size } = event.detail;
    // this.message = `${action} key:${key} size:${size}`;

  }

  render() {
    return html`
      <div id="header">
        <h2>QuickHB Dashboard</h2>
        <div id="buttons">
          <fetch-button title="Spintax-Datenbank via URL aus dem Internet laden" url="./data/db.zip" @database-changed="${this._databaseChanged}"></fetch-button>
          <span id="delete" title="Spintax-Datenbank löschen" @click="${this._delete}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="blue" class="bi bi-trash3" viewBox="0 0 16 16">
              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
            </svg>
          </span>        
        </div>
      </div>
      <p class="${this._database ? 'hidden' : ''}">Am Anfang bitte zuerst Zip laden.</p>
      <div class="demo-card">
          <strong>Datenbank:</strong> ${this.message}
      </div>
      <div class="demo-card" style="border-color: #00c853;">
          <strong>Statistik:</strong> ${this.statistics}
      </div>
    `;
  }

}

window.customElements.define('quick-hb-dashboard', QuickHbDashboard);