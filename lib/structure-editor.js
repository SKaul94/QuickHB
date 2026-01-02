/**
 * StructureEditor is a CustomElement, not a LitElement
 * because the Lit update management disturbs imperative update handling.
 */
class StructureEditor extends HTMLElement {

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

    this._lastStructure = [];
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

  _getStructure() {
    return [...this.ol.querySelectorAll('li')]
      .map(li => li.innerText.trim())
      .filter(Boolean);
  }

  _emitIfChanged() {
    const structure = this._getStructure();

    if (!this._arraysEqual(structure, this._lastStructure)) {
      this._lastStructure = structure;

      this.dispatchEvent(new CustomEvent('structure-change', {
        detail: structure,
        bubbles: true,
        composed: true
      }));
    }
  }

  _arraysEqual(a, b) {
    return a.length === b.length &&
      a.every((v, i) => v === b[i]);
  }

  /* =======================
     Optional API
     ======================= */

  set value(arr) {
    this.ol.innerHTML = '';
    arr.forEach(text => {
      const li = document.createElement('li');
      li.innerText = text;
      this.ol.appendChild(li);
    });
    this._emitIfChanged();
  }

  get value() {
    return this._getStructure();
  }
}

customElements.define('structure-editor', StructureEditor);