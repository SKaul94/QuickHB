import { html, css, LitElement, render } from './lit-core.min.js';
import './quick-hb-editor.js'; 
import './structure-editor.js';
import './table-editor.js';
import { getGender } from './gender-switch.js';

export class QuickHbAntrag extends LitElement {
    static properties = {
        // Diese Property wird von außen (index.html) befüllt
        database: { type: Array },
        // Gliederung
        structure: { type: Array },
        // Variables inside database spintax, e.g. name, date, age, ...
        variables: { type: Object },
        // Optional: Geschlecht global für den Antrag steuern
        gender: { type: String }
    };

    static styles = css`
        :host {
            display: block;
            font-family: sans-serif;
            padding: 1rem;
        }
        h2 { margin-top: 0; color: blue; }
        
        /* Damit das Label des Editors (falls implementiert) oder eigene Labels gut aussehen */
        label { font-weight: bold; display: block; margin-bottom: 0.5rem; }
    `;

    constructor() {
        super();
        this.database = [];
        this.structure = [];
        this.variables = {};
        this.gender = getGender();
        this.regex = /\[([^\[\]]+)\]/g;
    }

    firstUpdated() {
        this.structureEditor.addEventListener('structure-change', event => {
            this.structure = event.detail;
        });
        
        this.tableEditor.addEventListener('value-changed', e => {
            const { key, value } = e.detail;
            if ( value === this.variables[ key ] ) return;
            // this.variables[ key ] = value;
            this.variables = {
                ...this.variables,
                [key]: value
            };
            // all variables in all editors are replaced by new value
            // simply by Lit Update Mangement and assigning this.variables a new value
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

    get _spintaxKey(){
        return 'spintax_' + getGender();
    }

    /**
     * Erzeuge Liste aller Variablen, die in den Spintax-Texten in der Datenbank vorkommen
     * Variablen sind durch eckige Klammern gekennzeichnet: [Var]
     */
    get variablesFromDatabase(){
        if ( ! this.database || ! this.database.length ) return null;
        // caching: retrieve variables from database only once
        if ( this._variablesFromDatabase ) return this._variablesFromDatabase;
        const variableSet = new Set();
        for (const rec of this.database){
            for (const key of Object.keys(rec)){
                if ( key === this._spintaxKey ){
                    const text = rec[key];
                    const matches = Array.from(text.matchAll( this.regex ));
                    if ( matches.length ){
                        for ( const match of matches ){
                            variableSet.add( match[1] );
                        }
                    }
                }
            }
        } 
        this._variablesFromDatabase = Array.from( variableSet );
        return this._variablesFromDatabase;
    }

    /**
     * replace variables by values in spintax texts stored in this.database
     * @param {Object} rec - record in this.database
     * @returns copy of object with variables replaced by values
     */
    applyVariablesToRecord(rec) {
        const copy = structuredClone(rec);

        for (const key of Object.keys(copy)) {
            if ( key === this._spintaxKey ) {
            copy[key] = copy[key].replaceAll(
                    this.regex,      
                    (_, varName) => `<span title="siehe Tabelle [${varName}]" class="quick-variable" data-name="${varName}">${this.variables[varName] || '['+varName+']'}</span>`
                );
            }
        }
        return copy;
    }

    /**
     * select relevant part of database
     * @param {*} header 
     * @returns subset of database with variables substituted by their values
     */
    selectDatabase(header) {
        return this.database
            .filter(rec => rec.section === header)
            .map(rec => this.applyVariablesToRecord(rec));
    }

    get structureEditor() {
        return this.shadowRoot.getElementById('editor-structure'); 
    }

    get tableEditor() {
        return this.shadowRoot.getElementById('editor-table'); 
    }

    getSectionEditor( idx ) {
        return this.shadowRoot.getElementById(`editor-${idx}`); 
    }

    _handleGenderChange( event ){
        this.gender = getGender();
    }

    render() {
        /**
         * Der Punkt vor .database ist essenziell: 
         * Setze die Property 'database', nicht das HTML-Attribut.
         * Da 'database' ein Array ist, funktionieren Attribute hier nicht.
         * Jedesmal wenn sich der Wert ändert, wirft Lit das Update Mangement an. 
         */
        return html`
            <h2>QuickHB Antrag</h2>
            <gender-switch class="antrag" @gender-changed="${this._handleGenderChange}"></gender-switch>
            <structure-editor id="editor-structure" label="Gliederung"></structure-editor>
            <table-editor id="editor-table" .keys=${this.variablesFromDatabase || ['Datum']}></table-editor>
            ${this.structure.map( ( header, idx ) => html`<quick-hb-editor 
                id="editor-${idx}"
                label="${idx+1}. ${header}" 
                .database=${this.selectDatabase( header )}
                .variables=${this.variables}
                .gender=${getGender()}
            ></quick-hb-editor>` )}
          `;
    }
}

customElements.define('quick-hb-antrag', QuickHbAntrag);