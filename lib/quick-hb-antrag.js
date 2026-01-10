import { html, css, LitElement } from './lit-all.min.js';
import './quick-hb-editor.js'; 
import { defaultStructure } from './structure-editor.js';
import { RegexSquareBrackets } from './table-editor.js';
import { getGender } from './gender-switch.js';
import * as Idb from './idb-keyval.js';
import { INDEXEDDB_KEY, INDEXEDDB_KEY_STRUCTURE } from './quick-hb-database.js';
import defaultSpintaxDatabase from '../data/hb-spintax.json' with { type: 'json' };

export class QuickHbAntrag extends LitElement {
    static properties = {
        // Input Property 
        database: { type: Array },
        variables: { type: Object, state: true },
        _structure: { state: true }
    };

    static styles = css`
        :host {
            display: block;
            font-family: sans-serif;
            padding: 1rem;
        }
        #header {
            display: flex;
            justify-content: space-between;
        }

        h2 { margin-top: 0; color: blue; display: inline-block; }

        .blue-button {
            display: inline-block;
            padding: 0.3rem;
            margin: 0 0.3rem 0 10rem;
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
        
        /* Damit das Label des Editors (falls implementiert) oder eigene Labels gut aussehen */
        label { font-weight: bold; display: block; margin-bottom: 0.5rem; }
    `;

    async firstUpdated() {
        // Single Source of Truth = IndexedDB
        this.database = await Idb.get( INDEXEDDB_KEY ) || [];  
        this.variables = this.tableEditor?.values || { 'Datum': new Date().toLocaleString('de-DE') };
        this._structure = this.structure;
    }

    get _spintaxKey(){
        return 'spintax_' + getGender();
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
                    RegexSquareBrackets,      
                    (_, varName) => `<span title="siehe Tabelle [${varName}]" class="quick-variable" data-name="${varName}">${this.variables?.[varName] || '['+varName+']'}</span>`
                );
            }
        }
        return copy;
    }

    /**
     * Select relevant part of database.
     * If section is a non-empty string, the rule should be applied only to sections with this name.
     * If section is empty, the rule should be applied to all sections.
     * 
     * @param {String} header 
     * @returns subset of database with variables substituted by their values
     */
    selectDatabase(header) {
        let resultSubset = this.database?.filter(rec => rec.section === header || ! rec.section );
        if ( ! resultSubset?.length ) resultSubset = this.database;
        if ( ! resultSubset?.length ) resultSubset = defaultSpintaxDatabase;
        return resultSubset.map(rec => this.applyVariablesToRecord(rec));
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

    getAllSectionEditors() {
        return this.shadowRoot.querySelectorAll('.editor-section');
    }

    _handleGenderChange( event ){
        this.gender = getGender();
    }
    
    /**
     * update this component after a change in another component
     * 
     * see index.js Observer Pattern
     * 
     * @param {*} database - fresh instance from IndexedDB = Single Source of Truth
     * @param {*} event - contains details about what changed
     */
    updateAfterEvent( database, event ){
        if ( ! event ) return;
        this.database = database;
    }

    get structure() {
        return this.structureEditor?.structure || defaultStructure;
    }

    /**
     * compile all contents into a single document
     */
    compileFinalAntrag() {
        const blocks = [];

        this.structure.forEach(( header, idx ) => {
            blocks.push(`<h2>${idx+1}. ${header}</h2>`);
            const editor = this.getSectionEditor( idx );
            const finalText = editor.editorElement.innerText;
            if (finalText) blocks.push(`<div>${finalText}</div>`);
        });

        return blocks.join('\n\n');
    }
    
    /**
     * export as TXT file
     */
    exportTXT() {
        const result = this.compileFinalAntrag();
        this.downloadText(result, 'Antrag.txt');
    }

    downloadText(content, filename) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    }

    exportPdf() {
        const content = this.compileFinalAntrag();
        const html = this.buildPdfHtml(content);
        this.openPrintWindow(html);
    }

    buildPdfHtml(text) {
        // const paragraphs = text
        //     .split('\n\n')
        //     .map(p => `<p>${this.escapeHtml(p)}</p>`)
        //     .join('');

        return `
            <!doctype html>
            <html lang="de">
            <head>
            <meta charset="utf-8">
            <title>Antrag</title>

            <style>
            @page {
                margin: 25mm;
                @bottom-right {
                    content: counter(page);
                }
            }

            body {
                font-family: serif;
                font-size: 12pt;
                line-height: 1.5;
            }

            h1 {
                text-align: center;
                margin-bottom: 2rem;
            }

            p {
                margin: 0 0 1rem 0;
                text-align: justify;
            }

            .center {
                text-align: center;
            }

            .section {
                font-weight: bold;
                margin-top: 2rem;
            }
            </style>
            </head>

            <body>
                <h1>Antrag</h1>
                <p class="center">${new Date().toLocaleString("de-DE")}</p>
                ${text}
            </body>
        </html>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    }

    openPrintWindow(html) {
        const win = window.open('', '_blank');

        win.document.open();
        win.document.write(html);
        win.document.close();

        win.focus();
        win.print();
    }

    /**
     * propagate changes in the table editor to the next higher level: this
     * @param {CustomEvent} event - value-changed inside table editor 
     */
    _valueChanged( event ) {
        this.variables = this.tableEditor.values;
        // The following update is triggered by Lit update management automatically:
        // for ( const sectionEditor of this.getAllSectionEditors() ) {
        //     sectionEditor.variables = this.variables;
        // } 
    }

    /**
     * propagate changes in the structure editor to the next higher level: this
     * @param {CustomEvent} event - structure-changed inside structure editor 
     */
    _structureChanged( event ) {
        // propagate changes in the structure editor to the next higher level: this
       this._structure = [ ...this.structure ]; 
    }

    render() {
        /**
         * Der Punkt vor .database ist essenziell: 
         * Setze die Property 'database', nicht das HTML-Attribut.
         * Da 'database' ein Array ist, funktionieren Attribute hier nicht.
         * Jedesmal wenn sich der Wert ändert, wirft Lit das Update Mangement an. 
         */
        return html`
            <div id="header">
                <h2>QuickHB Antrag</h2>
                <button id="export" class="blue-button" @click=${this.exportPdf}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-printer" viewBox="0 0 16 16">
                    <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
                    <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1"/>
                </svg><br>    
                Drucken</button>    
            </div>
            <gender-switch class="antrag" @gender-changed="${this._handleGenderChange}"></gender-switch>
            <structure-editor id="editor-structure" .database=${this.database} label="Gliederung" @structure-changed="${this._structureChanged}"></structure-editor>
            <table-editor id="editor-table" .database=${this.database} @value-changed="${this._valueChanged}"></table-editor>
            ${this._structure?.map( ( header, idx ) => html`<quick-hb-editor 
                id="editor-${idx}"
                class="editor-section"
                label="${idx+1}. ${header}" 
                .database=${this.selectDatabase( header )}
                .variables=${this.variables}
                .gender=${getGender()}
            ></quick-hb-editor>` )}
          `;
    }
}

customElements.define('quick-hb-antrag', QuickHbAntrag);