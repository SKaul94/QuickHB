import { LitElement, html, css } from './lit-core.min.js';

/**
 * Hilfsfunktion: Spintax auflösen
 * Input: "{Hallo|Hi} Welt" -> Output: "Hi Welt" (zufällig)
 */
function spinText(text) {
    if (!text) return "";
    let matches;
    const regex = /\{([^{}]+)\}/;
    while ((matches = regex.exec(text)) !== null) {
        const options = matches[1].split("|");
        const randomOption = options[Math.floor(Math.random() * options.length)];
        text = text.replace(matches[0], randomOption);
    }
    return text;
}

export class QuickHbEditor extends LitElement {
    static properties = {
        label: { type: String },
        database: { type: Array }, // Die Textbausteine in Spintax-Format
        // Variables inside database spintax, e.g. name, date, age, ...
        variables: { type: Object },
        gender: { type: String },  // 'm' oder 'w'
        placeholder: { type: String },
        
        // Interner State für das Dropdown
        _matches: { state: true },
        _selectedIndex: { state: true },
        _isVisible: { state: true },
        _listPosition: { state: true }
    };

    static styles = css`
        :host {
            margin-top: 0.5rem;
            display: block;
            position: relative;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin-bottom: 1rem;
        }

        label {
          font-weight: bold;
          font-size: large;
        }

        .quick-variable {
          font-weight: bold;
          color: blue;
        }

        ol {
            margin: 0 0 0 0.5rem;
            padding: 0 0 0 0.5rem;
        }

        .icon-button {
          cursor: pointer;
          padding: 0.5rem;
        }

        .icon-button > svg:active {
          cursor: grabbing;
          transform: translateY(4px);
        }

        .editor {
            width: 100%;
            min-height: 5rem;
            padding: 0.5rem;
            border: 1px solid #d1d5db; /* gray-300 */
            border-radius: 0.375rem;
            background-color: white;
            overflow-y: auto;
            white-space: pre-wrap;
            line-height: 1.5;
            box-sizing: border-box; 
            cursor: text;
        }

        /* Placeholder via CSS - erscheint nur wenn leer */
        .editor:empty::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            display: block;
        }

        .editor:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); /* blue-500 ring */
            border-color: #3b82f6;
        }

        /* Autocomplete Liste */
        .autocomplete-list {
            position: absolute;
            z-index: 50;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            max-height: 200px;
            overflow-y: auto;
            width: 300px;
            margin: 0;
            padding: 0;
            list-style: none;
            text-align: left;
        }

        .item {
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
        }

        .item:last-child { border-bottom: none; }
        .item.active { background-color: #e0f2fe; } /* blue-100 highlight */
        .item:hover { background-color: #f0f9ff; }

        .title { font-weight: bold; font-size: 0.875rem; }
        .shortcut { font-weight: normal; color: #9ca3af; font-size: 0.75rem; }
        .preview { font-size: 0.75rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    `;

    constructor() {
        super();
        this.label = 'Label';
        this.database = [];
        this.gender = 'm';
        this.placeholder = 'Text eingeben...';

        this.lightDOMHTML = this.innerHTML;
        this.lightDOMTextLines = this.textContent.split("\n");
        this.lightDOMNodeList = this.childNodes;

        this.queue = [];

        this._matches = [];
        this._selectedIndex = 0;
        this._isVisible = false;
        this._listPosition = { top: 0, left: 0 };
        this._savedRange = null;

        // Binden für Event-Listener Entfernung
        this._boundOutsideClick = this._handleOutsideClick.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('click', this._boundOutsideClick);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('click', this._boundOutsideClick);
    }

    updated( changedProperties ) {
        if ( changedProperties.has('variables') ) {
            const quickVariables = this.editorElement.querySelectorAll('.quick-variable');
            for ( const quickVariableSpan of quickVariables ){
                const content = quickVariableSpan.innerText;
                const value = this.variables[ quickVariableSpan.dataset.name ];
                if ( content !== value ) {
                   quickVariableSpan.innerText = value; 
                }
            }
        }
    }

    get editorElement() {
        return this.shadowRoot.getElementById('editor');
    }

    async _copyText( event ) {
      try {
        await navigator.clipboard.writeText( this.editorElement.innerText );
      } catch (err) {
        console.error('Fehler beim Kopieren des Textes: ', err);
      }
    }

    _deleteText( event ) {
      this.editorElement.innerText = '';
      this.editorElement.focus();
    }

    render() {
        return html`
            <label>${this.label}</label>
            <span id="copytext" @click="${this._copyText}" class="icon-button" title="Text in den Zwischenspeicher kopieren"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                  </svg>
            </span>
            <span id="deletetext" @click="${this._deleteText}" class="icon-button" title="Diesen Text löschen">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"></path>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"></path>
              </svg>
            </span>
            <div 
                id="editor" 
                class="editor" 
                contenteditable="true"
                data-placeholder="${this.placeholder}"
                @input="${this._handleInput}"
                @keydown="${this._handleKeydown}"
            ></div>

            ${this._isVisible && this._matches.length > 0 ? html`
                <ul class="autocomplete-list" 
                    style="top: ${this._listPosition.top}px; left: ${this._listPosition.left}px;">
                    ${this._matches.map((item, index) => html`
                        <li class="item ${index === this._selectedIndex ? 'active' : ''}"
                            @mousedown="${(e) => this._handleItemClick(e, item)}"
                            @mouseover="${() => this._selectedIndex = index}"
                        >
                            <div class="title">${item.title} <span class="shortcut">(${item.shortcut})</span></div>
                            <div class="preview">${this._getPreview(item)}</div>
                        </li>
                    `)}
                </ul>
            ` : ''}
        `;
    }

    // --- LOGIK ---

    _getPreview(item) {
        const raw = this.gender === 'w' ? (item.spintax_w || item.spintax_m) : item.spintax_m;
        // Klammern entfernen für Preview
        return raw.replace(/\{([^{}|]+)\|.*?\}/g, '$1').substring(0, 40) + '...';
    }

    _handleOutsideClick(e) {
        const path = e.composedPath();
        // Wenn Klick nicht auf Editor und nicht auf Liste -> Schließen
        if (!path.includes(this.editorElement) && !path.includes(this.shadowRoot.querySelector('.autocomplete-list'))) {
            this._closeList();
        }
    }

    _handleInput() {
        if ( ! this.database.length ) return; // no database - no autofill

        const selection = window.getSelection();
        let currentRange = null;

        // 1. Shadow DOM Barriere durchbrechen
        if (typeof selection.getComposedRanges === 'function' && this.shadowRoot) {
            // Die Syntax mit dem Object-Wrapper hat bei dir funktioniert:
            const composedRanges = selection.getComposedRanges({ shadowRoots: [this.shadowRoot] });
            if (composedRanges.length > 0) {
                currentRange = composedRanges[0];
            }
        }
        
        // 2. Fallback (falls getComposedRanges in anderen Browsern anders heißt oder versagt)
        if (!currentRange && selection.rangeCount > 0) {
            const rawRange = selection.getRangeAt(0);
            if (this.editorElement.contains(rawRange.startContainer)) {
                currentRange = rawRange;
            }
        }

        if (!currentRange) {
            this._closeList();
            return;
        }

        let node = currentRange.startContainer;
        let offset = currentRange.startOffset;

        // 3. Wenn Container das DIV selbst ist (passiert bei leeren Zeilen oder am Anfang)
        if (node.nodeType !== Node.TEXT_NODE) {
            if (node === this.editorElement) {
                if (node.childNodes.length === 0) {
                    // Ganz leer -> Abbruch (Autofill braucht Wortanfang)
                    this._closeList();
                    return;
                } 
                // Versuch, das richtige Kind-Element zu finden
                if (offset > 0 && node.childNodes[offset - 1].nodeType === Node.TEXT_NODE) {
                    node = node.childNodes[offset - 1];
                    offset = node.textContent.length;
                } else if (node.firstChild && node.firstChild.nodeType === Node.TEXT_NODE) {
                    node = node.firstChild;
                    offset = 0;
                } else {
                    this._closeList();
                    return;
                }
            } else {
                this._closeList();
                return;
            }
        }

        // Sicherstellen, dass es wirklich Text ist
        if (node.nodeType !== Node.TEXT_NODE) {
            this._closeList();
            return;
        }

        // Wort vor dem Cursor holen
        const textBefore = node.textContent.substring(0, offset);
        const words = textBefore.split(/[\s\n\u00A0]+/);
        const currentWord = words[words.length - 1];

        if (!currentWord || currentWord.length < 2) {
            this._closeList();
            return;
        }

        // Filtern
        const term = currentWord.toLowerCase();
        this._matches = this.database.filter(item => {
            const t = item.title.toLowerCase();
            const s = item.shortcut ? item.shortcut.toLowerCase() : '';
            return t.includes(term) || s.startsWith(term);
        }).slice(0, 5);

        if (this._matches.length > 0) {
            // Wir speichern eine explizite Range auf den Textknoten
            const r = document.createRange();
            r.setStart(node, offset);
            r.setEnd(node, offset);
            this._savedRange = r;

            this._isVisible = true;
            this._selectedIndex = 0;
            this._calculatePosition(r);
        } else {
            this._closeList();
        }
    }

    _calculatePosition(activeRange) {
        let rect;
        const rects = activeRange.getClientRects();
        
        if (rects.length > 0) {
            rect = rects[0];
        } else {
            rect = activeRange.getBoundingClientRect();
        }

        // Fix für 0x0 Rects (z.B. Zeilenanfang)
        if (rect.width === 0 && rect.height === 0) {
            const editorRect = this.editorElement.getBoundingClientRect();
            rect = {
                top: editorRect.top + this.editorElement.scrollTop,
                left: editorRect.left + this.editorElement.scrollLeft, 
                bottom: editorRect.top + 24 // Annahme Zeilenhöhe
            };
        }

        const hostRect = this.getBoundingClientRect();
        
        // Relativ zum Host-Element berechnen
        const top = (rect.bottom - hostRect.top) + this.editorElement.scrollTop;
        const left = (rect.left - hostRect.left) + this.editorElement.scrollLeft;

        this._listPosition = { top, left };
    }

    _handleItemClick(e, item) {
        e.preventDefault(); // Fokus im Editor behalten
        this._insertItem(item);
    }

    _handleKeydown(e) {
        if (!this._isVisible) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this._selectedIndex = (this._selectedIndex + 1) % this._matches.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this._selectedIndex = (this._selectedIndex - 1 + this._matches.length) % this._matches.length;
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (this._matches[this._selectedIndex]) {
                // Bei Enter müssen wir sicherstellen, dass savedRange aktuell ist,
                // da Keydown nach Input feuert. Meist passt das, aber sicher ist sicher:
                this._insertItem(this._matches[this._selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            this._closeList();
        }
    }

    _insertItem(item) {
        if (!this._savedRange) return;

        const gender = this.gender || 'm';
        const rawText = (gender === 'w' && item.spintax_w) ? item.spintax_w : item.spintax_m;
        const finalText = spinText(rawText) + "\u00A0"; // Geschütztes Leerzeichen

        const range = this._savedRange;
        const node = range.startContainer;
        const offset = range.startOffset;

        // Triggerwort löschen
        const textBefore = node.textContent.substring(0, offset);
        const triggerWord = textBefore.split(/[\s\n\u00A0]+/).pop();
        const startOffset = offset - triggerWord.length;

        if (startOffset < 0) {
            this._closeList();
            return; 
        }

        try {
            range.setStart(node, startOffset);
            range.setEnd(node, offset);
            range.deleteContents();

            // const newNode = document.createTextNode(finalText);
            const newNode = document.createElement('span');
            newNode.innerHTML = finalText; 
            range.insertNode(newNode);

            range.setStartAfter(newNode);
            range.setEndAfter(newNode);
            range.collapse(false);
            
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            
            this.editorElement.focus();
        } catch (e) {
            console.error("Insert Error", e);
        }

        this._closeList();
    }

    _closeList() {
        this._isVisible = false;
        this._matches = [];
        this._savedRange = null;
    }
}

customElements.define('quick-hb-editor', QuickHbEditor);