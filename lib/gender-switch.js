import { html, css, LitElement } from './lit-core.min.js';

let gender = 'm';
export const getGender = _ => gender;
export const setGender = param => { gender = param }; 

export class GenderSwitch extends LitElement {
  static styles = css`
    #genderswitch {
      background: #aaa;
      padding: 1rem;
      width: 7rem;
      margin: 0 auto;
      border-radius: 0.75rem;
      display: inline-block;
    }

    #genderchoice {
      margin: 1rem;
      font: inherit;
      font-size: xx-large;
      display: inline-block;
      transform: translateY(-1rem);
    }

    #switch1 {
      display:none;
    }

    #switch1:checked + label .buttonbackground {
      background-color:#d8a2c5;
    }

    #switch1:checked + label .buttonslider {
      left: 2.5rem;         /* = buttonbackground-width / 2 */
      background:#eee;
    }

    #switch1 + label .buttonbackground:hover {
      cursor:pointer;
    }

    .buttonslider {
      background:#ddd;
      width:2.7rem;
      height:2.7rem;
      border-radius:50%;
      border:1px solid #aaa;
      position: absolute;
      left:0;
      top:-0.15rem;
      box-shadow: 0 4px 3px rgba(0,0,0,0.3);
      display: inline-block;
      transition: all 0.2s ease;
    }

    .buttonbackground {
      background-color:#7db8eb;
      width: 5rem;
      height: 2.5rem;          /* = width/2 */
      border-radius: 1.25rem;  /* = height/2 */
      box-shadow:
        0 2px 2px rgba(0,0,0,0.5) inset,
        0 -2px 0px rgba(255,255,255,0.5) inset;
      position: relative;
      margin: 0.5rem auto;
      display: inline-block;
      transition: background-color 0.2s ease;
    }`;

  static properties = {
    gender: {type: String, reflect: true},
  };

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', event => {
      // otherwise event is dispatched twice: 1. on click 2. on bubbling up input click 
      event.stopImmediatePropagation();
    });
  }

  _handleInputClick( event ){
    setGender( getGender() === 'm' ? 'w' : 'm' );
    this._genderChoice.innerText = getGender() === 'm' ? 'männlich' : 'weiblich';
    this.dispatchEvent( new CustomEvent("gender-changed", {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {
        gender: getGender(),
      }
    }));
  }

  get _genderChoice() {
    return this.renderRoot.querySelector('#genderchoice');
  }

  render() {
    return html`<div id="genderswitch">
                  <input @click="${this._handleInputClick}" id="switch1" type="checkbox">
                  <label for="switch1">
                    <span class="buttonbackground">
                      <span class="buttonslider"></span>
                    </span>
                  </label>
                </div>
                <div id="genderchoice">männlich</div>
              `;
  }
}
customElements.define('gender-switch', GenderSwitch);
