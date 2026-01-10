/**
 * StructureEditor is a CustomElement, not a LitElement
 * because the Lit update management disturbs imperative update handling.
 * 
 * Double use:
 * 1. Display structure given by the database
 * 2. Let the user edit his own structure
 */

export const defaultStructure = ['Antrag'];

export class StructureEditor extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          margin-top: 0.5rem;
          display: block;
          font-family: sans-serif;
        }

        label {
          font-weight: bold;
          font-size: large;
        }

        .editor {
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 0.5rem;
          min-height: 4rem;
        }

        .editor:focus {
          outline: none;
          border-color: #3b82f6;
        }

        ol {
          margin: 0;
          padding-left: 1.5rem;
        }

        li {
          margin: 0.25rem 0;
        }
      </style>

      <label>${this.getAttribute('label')}</label>
      <div class="editor" contenteditable="true">
        <ol>
          <li></li>
        </ol>
      </div>
    `;

    this.editor = this.shadowRoot.querySelector('.editor');
    this.ol = this.shadowRoot.querySelector('ol');

    this.internalStructure = this.externalStructure;
    this._edited = false; // turns true as soon as it is edited once
  }

  connectedCallback() {
    this._emitIfChanged(); // for initial value
    this.editor.addEventListener('input', this._onInput);
    this._observer = new MutationObserver(this._onMutation);
    this._observer.observe(this.ol, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  disconnectedCallback() {
    this.editor.removeEventListener('input', this._onInput);
    this._observer.disconnect();
  }

  /* =======================
     Event Handling
     ======================= */

  _onInput = () => {
    this._edited = true;
    this._normalize();
    this._emitIfChanged();
  };

  _onMutation = () => {
    this._normalize();
    this._emitIfChanged();
  };

  /* =======================
     Core Logic
     ======================= */

  _normalize() {
    // Entferne alles außer <li> direkt unter <ol>
    [...this.ol.children].forEach(node => {
      if (node.tagName !== 'LI') node.remove();
    });

    // Leere <li> am Ende zulassen (für UX), aber keine mehrfachen
    const items = [...this.ol.querySelectorAll('li')];
    for (let i = items.length - 2; i >= 0; i--) {
      if (!items[i].textContent.trim()) {
        items[i].remove();
      }
    }

    // Mindestens ein <li> sicherstellen
    if (!this.ol.querySelector('li')) {
      this.ol.appendChild(document.createElement('li'));
    }
  }

  set database(db) {
    this._database = db;
    if ( ! this._edited ) this.internalStructure = this.externalStructure;
    this._emitIfChanged();
  }

  get database() {
    return this._database;
  }

  /**
   * get internal structure from editor or external structure inferred from database
   */
  get structure() {
    return this._edited ? this.internalStructure : this.externalStructure;
  }

  /**
   * compute external structure from database
   */
  get externalStructure() {
    // get list of sections from database
    this._externalStructure = [];
    for (const rec of this.database || []) {
      const section = rec.section;
      if (section && !this._externalStructure.includes(section)) this._externalStructure.push(section);
    }
    this._externalStructure = this._externalStructure.length ? this._externalStructure : defaultStructure;
    return this._externalStructure;
  }

  /**
   * internal structure is the content of the editor
   */
  get internalStructure() {
    return [...this.ol.querySelectorAll('li')]
      .map(li => li.innerText.trim())
      .filter(Boolean);
  }

  set internalStructure( arr ) {
    if ( ! arr ) return;
    this.ol.innerHTML = '';
    arr.forEach(text => {
      const li = document.createElement('li');
      li.innerText = text;
      this.ol.appendChild(li);
    });
    this._emitIfChanged();
  }

  _emitIfChanged() {
    const structure = this.structure;

    if (!this._arraysEqual(structure, this._internalStructure)) {
      this._internalStructure = structure;

      this.dispatchEvent(new CustomEvent('structure-change', {
        detail: structure,
        bubbles: true,
        composed: true
      }));
    }
  }

  _arraysEqual(a, b) {
    return a && b && a.length === b.length &&
      a.every((v, i) => v === b[i]);
  }

}

customElements.define('structure-editor', StructureEditor);