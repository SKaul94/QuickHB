import { getCaretCoordinates } from './caret.js';
import { spinRandomly } from './spintax.js';

export class Autocomplete {
    constructor(textarea, database, getGenderFn) {
        this.textarea = textarea;
        this.database = database;
        this.getGender = getGenderFn; // Funktion, die 'm' oder 'w' zurückgibt
        
        // State
        this.currentFocus = -1;
        this.matches = [];
        
        // UI erstellen
        this.listEl = document.createElement('ul');
        this.listEl.className = 'autocomplete-list hidden'; 
        // Tailwind Klassen für das Dropdown (müssen im HTML/CSS definiert sein oder via CDN geladen)
        // Wir setzen hier inline styles für Unabhängigkeit, aber nutzen Tailwind Klassen für Look
        this.listEl.style.position = 'absolute';
        this.listEl.style.zIndex = '1000';
        this.listEl.style.backgroundColor = 'white';
        this.listEl.style.border = '1px solid #ccc';
        this.listEl.style.borderRadius = '4px';
        this.listEl.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        this.listEl.style.maxHeight = '200px';
        this.listEl.style.overflowY = 'auto';
        this.listEl.style.width = '300px';
        this.listEl.style.padding = '0';
        this.listEl.style.margin = '0';
        this.listEl.style.listStyle = 'none';
        
        document.body.appendChild(this.listEl);

        // Event Listener binden
        this.textarea.addEventListener('input', (e) => this.onInput(e));
        this.textarea.addEventListener('keydown', (e) => this.onKeydown(e));
        
        // Schließen wenn man woanders hinklickt
        document.addEventListener('click', (e) => {
            if (e.target !== this.textarea && e.target !== this.listEl) {
                this.closeList();
            }
        });
    }

    onInput(e) {
        const val = this.textarea.value;
        const cursorPos = this.textarea.selectionEnd;
        
        // Wort vor dem Cursor finden
        const textBeforeCursor = val.substring(0, cursorPos);
        const words = textBeforeCursor.split(/[\s\n]+/);
        const currentWord = words[words.length - 1];

        // Mindestens 2 Zeichen für Trigger
        if (!currentWord || currentWord.length < 2) {
            this.closeList();
            return;
        }

        // Filtern (Case insensitive)
        const term = currentWord.toLowerCase();
        this.matches = this.database.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(term);
            const shortcutMatch = item.shortcut && item.shortcut.toLowerCase().startsWith(term);
            return titleMatch || shortcutMatch;
        }).slice(0, 5); // Max 5 Vorschläge

        if (this.matches.length > 0) {
            this.renderList(currentWord);
            this.positionList(cursorPos);
        } else {
            this.closeList();
        }
    }

    renderList(triggerWord) {
        this.listEl.innerHTML = '';
        this.listEl.style.display = 'block';
        this.currentFocus = 0; // Erster Eintrag automatisch ausgewählt

        this.matches.forEach((item, index) => {
            const li = document.createElement('li');
            li.style.padding = '8px 12px';
            li.style.cursor = 'pointer';
            li.style.borderBottom = '1px solid #f0f0f0';
            
            // Preview Text (Gender beachten)
            const gender = this.getGender();
            const rawSpintax = (gender === 'w' && item.spintax_w) ? item.spintax_w : item.spintax_m;
            // Entferne grob die Spintax Klammern für saubere Vorschau
            const preview = rawSpintax.replace(/\{([^{}|]+)\|.*?\}/g, '$1').substring(0, 50) + '...';

            li.innerHTML = `
                <div style="font-weight:bold; font-size:14px;">${item.title} <span style="font-weight:normal; color:#888; font-size:11px;">(${item.shortcut})</span></div>
                <div style="font-size:12px; color:#555;">${preview}</div>
            `;

            // Highlight Logik
            if (index === 0) li.style.backgroundColor = '#e6f7ff';

            li.addEventListener('click', () => {
                this.insertItem(item, triggerWord);
            });
            
            // Mouseover Effekt
            li.addEventListener('mouseover', () => {
                this.setActive(index);
            });

            this.listEl.appendChild(li);
        });
    }

    positionList(cursorPos) {
        const coords = getCaretCoordinates(this.textarea, cursorPos);
        
        // Position relativ zur Textarea im Viewport berechnen
        const rect = this.textarea.getBoundingClientRect();
        
        // Absolute Position auf der Seite = Scrollposition + Elementposition + CaretOffset
        const top = window.scrollY + rect.top + coords.top + coords.height; 
        const left = window.scrollX + rect.left + coords.left;

        this.listEl.style.top = `${top}px`;
        // Verhindern, dass es rechts rausläuft
        if (left + 300 > window.innerWidth) {
            this.listEl.style.left = `${window.innerWidth - 320}px`;
        } else {
            this.listEl.style.left = `${left}px`;
        }
    }

    onKeydown(e) {
        if (this.listEl.style.display === 'none') return;

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
                // Trigger Wort aus Input holen (nochmal, da es sich geändert haben könnte)
                const val = this.textarea.value;
                const textBefore = val.substring(0, this.textarea.selectionEnd);
                const words = textBefore.split(/[\s\n]+/);
                const trigger = words[words.length - 1];
                
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

        // Styles resetten
        for (let i = 0; i < items.length; i++) {
            items[i].style.backgroundColor = '#fff';
        }
        // Active setzen
        if (items[index]) {
            items[index].style.backgroundColor = '#e6f7ff'; // Helles Blau als Highlight
        }
    }

    insertItem(item, triggerWord) {
        const gender = this.getGender();
        const rawText = (gender === 'w' && item.spintax_w) ? item.spintax_w : item.spintax_m;
        const finalText = spinRandomly(rawText);

        const val = this.textarea.value;
        const cursorPos = this.textarea.selectionEnd;
        
        // Text VOR dem Triggerwort
        const startOfTrigger = cursorPos - triggerWord.length;
        const textBefore = val.substring(0, startOfTrigger);
        const textAfter = val.substring(cursorPos);

        // Einsetzen
        this.textarea.value = textBefore + finalText + " " + textAfter;
        
        // Cursor neu setzen (Hinter den eingefügten Text)
        const newCursorPos = startOfTrigger + finalText.length + 1; // +1 für Leerzeichen
        this.textarea.selectionStart = this.textarea.selectionEnd = newCursorPos;
        this.textarea.focus();

        this.closeList();
    }

    closeList() {
        this.listEl.style.display = 'none';
        this.matches = [];
        this.currentFocus = -1;
    }
}