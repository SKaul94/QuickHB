import spintax from './data/hb-spintax.json' with { type: 'json' };
import { spinRandomly, spinNext } from './lib/spintax.js';
import { Autocomplete } from './lib/autocomplete.js';
    
const editorDiv = document.getElementById('tathergang'); 
editorDiv.innerHTML = `<span id="placeholder">${editorDiv.getAttribute('placeholder')}</span>`;
const placeholderListener = event => {
  editorDiv.innerText = '';
  editorDiv.removeEventListener('click', placeholderListener);
  editorDiv.removeEventListener('input', placeholderListener);
  editorDiv.focus();
};
editorDiv.addEventListener('click', placeholderListener );
editorDiv.addEventListener('input', placeholderListener );
editorDiv.focus();

let gender = 'm';
const getGender = _ => gender;
new Autocomplete(editorDiv, spintax, getGender);

const genderSwitch = document.querySelector('#genderswitch > input');
const genderChoice = document.getElementById('genderchoice');

genderSwitch.addEventListener('click', event => {
  gender = gender === 'm' ? 'w' : 'm';
  genderChoice.innerText = gender === 'm' ? 'männlich' : 'weiblich';
  mainDiv.innerHTML = '';
  generateList();
});

const copyTextSpan = document.getElementById('copytext');
copyTextSpan.addEventListener('click', async event => {
  try {
    await navigator.clipboard.writeText(editorDiv.innerText);
  } catch (err) {
    console.error('Fehler beim Kopieren des Textes: ', err);
  }
});

const deleteTextSpan = document.getElementById('deletetext');
deleteTextSpan.addEventListener('click', event => {
  editorDiv.innerText = '';
  editorDiv.focus();
});


const mainDiv = document.getElementById('main');
generateList(); // inside main div

function generateList(){
  let nr = 0;
  for (const item of spintax){
    nr += 1;
    const div = document.createElement('div');
    const {id, title, spintax_m, spintax_w} = item;
    const spintax = gender==='m' ? spintax_m : spintax_w;

    div.innerHTML = `
      <div id="${id}">
        <h2 class="text-4xl font-bold">${nr}. ${title}</h2>
        <div class="spintax">${spintax}</div>
        <button type="button" class="random">Zufall</button>
        <button type="button" class="spin">Spin</button>
        <div contenteditable="true" class="generated"></div>
      </div>
    `;
    mainDiv.appendChild( div );

    const generatedDiv = div.querySelector('.generated');
    let spinGenerator = spinNext( spintax );
    generatedDiv.innerText = spinGenerator.next().value;

    const randomButton = div.querySelector('.random');
    randomButton.addEventListener('click', event => {
      generatedDiv.innerText = spinRandomly( spintax );
    });

    const spinButton = div.querySelector('.spin');
    let count = 0;
    spinButton.addEventListener('click', event => {
      count += 1;
      const nextValue = spinGenerator.next().value;
      if ( nextValue ){
        generatedDiv.innerText = nextValue;
      } else {
        // start fresh
        spinGenerator = spinNext( spintax );
        generatedDiv.innerText = `Alle ${count} Varianten angezeigt.`;
        count = 0;
      }
    });
  }
}