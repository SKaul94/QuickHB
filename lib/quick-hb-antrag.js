import { html, css, LitElement, render } from './lit-core.min.js';
import './quick-hb-editor.js'; 
import './structure-editor.js';

export class QuickHbAntrag extends LitElement {
    static properties = {
        // Diese Property wird von außen (index.html) befüllt
        database: { type: Array },
        // Gliederung
        structure: { type: Array },
        // Optional: Geschlecht global für den Antrag steuern
        gender: { type: String }
    };

    static styles = css`
        :host {
            display: block;
            font-family: sans-serif;
            padding: 1rem;
            border: 1px solid #ccc;
            border-radius: 8px;
            background-color: #f9fafb;
        }
        h2 { margin-top: 0; }
        
        /* Damit das Label des Editors (falls implementiert) oder eigene Labels gut aussehen */
        label { font-weight: bold; display: block; margin-bottom: 0.5rem; }
    `;

    constructor() {
        super();
        this.database = [];
        this.structure = [];
        this.gender = 'm';
    }

    firstUpdated() {
        this.structureEditor.addEventListener('structure-change', event => {
            this.structure = event.detail;
        });
    }

    updated( changedProperties ) {
        if ( changedProperties.has('structure') ) {
            if ( this.structureEditor && this.structure.length ) {
                if (!this._arraysEqual(this.structureEditor.value, this.structure)){
                    this.structureEditor.value = this.structure;
                }               
            }
        }
    }

    _arraysEqual(a, b) {
        return a.length === b.length &&
            a.every((v, i) => v === b[i]);
    }

    selectDatabase( selection ) {
        // 1. replace variables in database

        // 2. select relevant part of database
        return this.database.filter( item => item.section === selection );
    }

    get structureEditor() {
        return this.shadowRoot.getElementById('editor-structure'); 
    }

    getSectionEditor( idx ) {
        return this.shadowRoot.getElementById(`editor-${idx}`); 
    }

    render() {
        /**
         * Der Punkt vor .database ist essenziell! 
         * Setze die Property 'database', nicht das HTML-Attribut.
         * Da 'database' ein Array ist, funktionieren Attribute hier nicht.
         */
        return html`
            <h2>QuickHB Antrag</h2>
            <structure-editor id="editor-structure" label="Gliederung"></structure-editor>

            ${this.structure.map( ( header, idx ) => html`<quick-hb-editor 
                id="editor-${idx}"
                label="${idx+1}. ${header}" 
                .database=${this.selectDatabase( header )}
                .gender=${this.gender}
            ></quick-hb-editor>` )}
          `;
    }
}

customElements.define('quick-hb-antrag', QuickHbAntrag);