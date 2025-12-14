import spintax from './data/hb-spintax.json' with { type: 'json' };
import { spinRandomly, spinNext } from './lib/spintax.js';
import { Autocomplete } from './lib/autocomplete.js';
    
const textarea = document.getElementById('tathergang');
let gender = 'm';
const getGender = _ => gender;
new Autocomplete(textarea, spintax, getGender);

const genderSwitch = document.querySelector('#genderswitch > input');
const genderChoice = document.getElementById('genderchoice');

genderSwitch.addEventListener('click', event => {
  gender = gender === 'm' ? 'w' : 'm';
  genderChoice.innerText = gender === 'm' ? 'männlich' : 'weiblich';
  mainDiv.innerHTML = '';
  generateList();
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
        <h2>${nr}. ${title}</h2>
        <div class="spintax">${spintax}</div>
        <button class="random">Zufall!</button>
        <button class="spin">Spin!</button>
        <div contenteditable="true" class="generated"></textarea>
      </div>
    `;
    mainDiv.appendChild( div );

    const textarea = div.querySelector('.generated');
    let spinGenerator = spinNext( spintax );
    textarea.innerText = spinGenerator.next().value;

    const randomButton = div.querySelector('.random');
    randomButton.addEventListener('click', event => {
      textarea.innerText = spinRandomly( spintax );
    });

    const spinButton = div.querySelector('.spin');
    let count = 0;
    spinButton.addEventListener('click', event => {
      count += 1;
      const nextValue = spinGenerator.next().value;
      if ( nextValue ){
        textarea.innerText = nextValue;
      } else {
        // start fresh
        spinGenerator = spinNext( spintax );
        textarea.innerText = `Alle ${count} Varianten angezeigt.`;
        count = 0;
      }
    });
  }
}