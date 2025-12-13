import spintax from './data/hb-spintax.json' with { type: 'json' };

const mainDiv = document.getElementById('main');
let gender = 'm';
const genderSwitch = document.querySelector('#genderswitch > input');
const genderChoice = document.getElementById('genderchoice');
const spintaxRegex = /\{([^{}]*)\}/;

genderSwitch.addEventListener('click', event => {
  gender = gender === 'm' ? 'w' : 'm';
  genderChoice.innerText = gender === 'm' ? 'männlich' : 'weiblich';
  mainDiv.innerHTML = '';
  generateList();
});

function spinRandomly( text ) {
  let match;
  while ((match = spintaxRegex.exec(text)) !== null) {
    const choices = match[1].split("|");
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    text = text.replace(match[0], randomChoice);
  }
  return text;
}

function* spinNext( text ){
  const match = spintaxRegex.exec(text);
  if (match !== null) {
    const choices = match[1].split("|");
    for (let nextChoice = 0; nextChoice < choices.length; nextChoice++){
      const newText = text.replace(match[0], choices[nextChoice]);
      yield* spinNext( newText );
    }
  } else {
    yield text;
  }
}

generateList();

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