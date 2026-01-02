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

    /**
     * compile all contents into a single document
     */
    compileFinalAntrag() {
        const blocks = [];

        this.structure.forEach(( header, idx ) => {
            const editor = this.getSectionEditor( idx );
            const finalText = editor.editorElement.innerText;
            if (finalText) blocks.push(`<h2>${idx+1}. ${header}</h2><div>${finalText}</div>`);
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
                <p class="center">${new Date().toLocaleDateString("de-DE")}</p>
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
                <button id="export" class="blue-button" @click=${this.exportPdf}>Export</button>
            </div>
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