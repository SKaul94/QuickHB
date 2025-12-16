import { getCaretCoordinates } from './caret.js';
import { spinRandomly } from './spintax.js';

export class Autocomplete {
    constructor(editorEl, database, getGenderFn) {
        this.editor = editorEl;
        this.database = database;
        this.getGender = getGenderFn;
        
        // State
        this.currentFocus = -1;
        this.matches = [];
        this.isVisible = false;
        this.savedRange = null; // HIER: Wir merken uns die Position
        
        // UI erstellen
        this.listEl = document.createElement('ul');
        this.listEl.className = 'autocomplete-list hidden';
        
        // Styles (Inline für Funktionalität, besser via CSS Klasse lösen)
        this.listEl.style.position = 'absolute';
        this.listEl.style.zIndex = '1000';
        this.listEl.style.backgroundColor = 'white';
        this.listEl.style.border = '1px solid #ccc';
        this.listEl.style.borderRadius = '4px';
        this.listEl.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        this.listEl.style.maxHeight = '200px';
        this.listEl.style.overflowY = 'auto';
        this.listEl.style.width = '300px';
        this.listEl.style.display = 'none';

        document.body.appendChild(this.listEl);

        // Events
        this.editor.addEventListener('input', () => this.onInput());
        this.editor.addEventListener('keydown', (e) => this.onKeydown(e));
        
        // Schließen bei Klick außerhalb
        document.addEventListener('click', (e) => {
            if (e.target !== this.editor && !this.listEl.contains(e.target)) {
                this.closeList();
            }
        });
    }

    onInput() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const focusNode = selection.focusNode;
        // Sicherstellen, dass wir im Text sind
        if (focusNode.nodeType !== Node.TEXT_NODE) {
            this.closeList();
            return;
        }

        const cursorOffset = selection.focusOffset;
        const textContent = focusNode.textContent;
        const textBeforeCursor = textContent.substring(0, cursorOffset);
        
        // Letztes Wort holen
        const words = textBeforeCursor.split(/[\s\n\u00A0]+/);
        const currentWord = words[words.length - 1];

        if (!currentWord || currentWord.length < 2) {
            this.closeList();
            return;
        }

        // Suche
        const term = currentWord.toLowerCase();
        this.matches = this.database.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(term);
            const shortcutMatch = item.shortcut && item.shortcut.toLowerCase().startsWith(term);
            return titleMatch || shortcutMatch;
        }).slice(0, 5);

        if (this.matches.length > 0) {
            // WICHTIG: Bevor wir rendern, speichern wir die aktuelle Range!
            // cloneRange() ist wichtig, da sich die Live-Range ändern könnte
            this.savedRange = selection.getRangeAt(0).cloneRange();
            
            this.renderList(currentWord);
            this.positionList();
        } else {
            this.closeList();
        }
    }

    renderList(triggerWord) {
        this.listEl.innerHTML = '';
        this.listEl.style.display = 'block';
        this.isVisible = true;
        this.currentFocus = 0;

        this.matches.forEach((item, index) => {
            const li = document.createElement('li');
            li.style.padding = '8px 12px';
            li.style.cursor = 'pointer';
            li.style.borderBottom = '1px solid #f0f0f0';
            
            const gender = this.getGender();
            const rawSpintax = (gender === 'w' && item.spintax_w) ? item.spintax_w : item.spintax_m;
            const preview = rawSpintax.replace(/\{([^{}|]+)\|.*?\}/g, '$1').substring(0, 45) + '...';

            li.innerHTML = `
                <div style="font-weight:bold; font-size:14px;">${item.title} <span style="font-weight:normal; color:#888; font-size:11px;">(${item.shortcut})</span></div>
                <div style="font-size:12px; color:#555;">${preview}</div>
            `;

            if (index === 0) li.style.backgroundColor = '#e6f7ff';

            // WICHTIG: 'mousedown' statt 'click' und preventDefault()!
            // Das verhindert, dass der Editor den Fokus verliert, wenn man klickt.
            li.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Verhindert Fokusverlust
                this.insertItem(item, triggerWord);
            });
            
            li.addEventListener('mouseover', () => {
                this.setActive(index);
            });

            this.listEl.appendChild(li);
        });
    }

    positionList() {
        // Wir nutzen caret.js (muss vorhanden sein)
        const coords = getCaretCoordinates();
        this.listEl.style.top = `${coords.top + coords.height}px`;
        this.listEl.style.left = `${coords.left}px`;
    }

    onKeydown(e) {
        if (!this.isVisible) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.currentFocus++;
            this.setActive(this.currentFocus);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.currentFocus--;
            this.setActive(this.currentFocus);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (this.currentFocus > -1 && this.matches[this.currentFocus]) {
                // Bei Enter müssen wir das Triggerwort neu aus dem DOM lesen, 
                // da savedRange evtl. leicht veraltet ist, falls der User weitergetippt hat.
                // Aber für Enter im Fluss ist current Selection okay.
                const selection = window.getSelection();
                const textNode = selection.focusNode;
                const offset = selection.focusOffset;
                const textBefore = textNode.textContent.substring(0, offset);
                const trigger = textBefore.split(/[\s\n\u00A0]+/).pop();
                
                // Für Tastatur-Input aktualisieren wir savedRange auf aktuell
                this.savedRange = selection.getRangeAt(0).cloneRange();
                
                this.insertItem(this.matches[this.currentFocus], trigger);
            }
        } else if (e.key === 'Escape') {
            this.closeList();
        }
    }

    setActive(index) {
        const items = this.listEl.getElementsByTagName('li');
        if (index >= items.length) index = 0;
        if (index < 0) index = items.length - 1;
        this.currentFocus = index;

        for (let i = 0; i < items.length; i++) {
            items[i].style.backgroundColor = '#fff';
        }
        if (items[index]) {
            items[index].style.backgroundColor = '#e6f7ff';
        }
    }

    insertItem(item, triggerWord) {
        // 1. Prüfen, ob wir eine gespeicherte Range haben
        if (!this.savedRange) return;

        const gender = this.getGender();
        const rawText = (gender === 'w' && item.spintax_w) ? item.spintax_w : item.spintax_m;
        const finalText = spinRandomly(rawText) + "\u00A0";

        // 2. Die Range wiederherstellen/nutzen
        const range = this.savedRange;
        
        // Container und Offset aus der Range holen
        const textNode = range.startContainer;
        const endOffset = range.startOffset;
        
        // Startpunkt berechnen (Ende - Länge des getippten Wortes)
        const startOffset = endOffset - triggerWord.length;

        // Sicherheitscheck: Verhindern, dass wir negativ gehen
        if (startOffset < 0) {
            this.closeList();
            return; 
        }

        try {
            // Range auf das Triggerwort setzen
            range.setStart(textNode, startOffset);
            range.setEnd(textNode, endOffset);
            
            // Wort löschen
            range.deleteContents();

            // Neuen Text einfügen
            const newNode = document.createTextNode(finalText);
            range.insertNode(newNode);
            
            // 3. Cursor hinter das neue Wort setzen und Editor fokussieren
            range.setStartAfter(newNode);
            range.setEndAfter(newNode);
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            this.editor.focus();
        } catch (e) {
            console.error("Fehler beim Einfügen:", e);
        }

        this.closeList();
    }

    closeList() {
        this.listEl.style.display = 'none';
        this.isVisible = false;
        this.matches = [];
        this.currentFocus = -1;
        this.savedRange = null; // Range zurücksetzen
    }
}