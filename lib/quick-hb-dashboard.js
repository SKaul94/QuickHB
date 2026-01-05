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
    this.message = this._database ? 'Datenbank geladen' : 'Keine Datenbank geladen';
    this.statistics = `Anzahl Spintax-Regeln: ${this._database?.length || 0}.`;
  }

  async _dbLoaded( event ) {
    this.message = `Zip-Archiv mit Spintax-Datenbank geladen ${new Date().toLocaleString('de-DE')}`;
    this._database = await Idb.get( INDEXEDDB_KEY );
    this.statistics = `Anzahl Spintax-Regeln: ${this._database?.length || 0}.`;
  }

  render() {
    return html`
      <div id="header">
        <h2>QuickHB Dashboard</h2>
        <div id="buttons">
          <fetch-button url="./data/db.zip" @db-loaded="${this._dbLoaded}"></fetch-button>
        </div>
      </div>
      <p>Willkommen! Hier ist der aktuelle Status:</p>
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