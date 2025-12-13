import spintax from './data/hb-spintax.json' with { type: 'json' };

const mainDiv = document.getElementById('main');

function spinRandomly( text ) {
  const regex = /\{([^{}]*)\}/;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const choices = match[1].split("|");
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    text = text.replace(match[0], randomChoice);
  }
  return text;
}

function* spinNext( text ){
  const regex = /\{([^{}]*)\}/;
  const match = regex.exec(text);
  
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

let nr = 0;
for (const item of spintax){
  nr += 1;
  const div = document.createElement('div');
  const {id, title, spintax} = item;

  div.innerHTML = `
    <div id="${id}">
      <h2>${nr}. ${title}</h2>
      <div class="spintax">${spintax}</div>
      <button class="random">Zufall!</button>
      <button class="spin">Spin!</button>
      <textarea class="generated" rows="5"></textarea>
    </div>
  `;
  mainDiv.appendChild( div );

  const textarea = div.querySelector('.generated');
  let spinGenerator = spinNext( spintax );
  textarea.value = spinGenerator.next().value;

  const randomButton = div.querySelector('.random');
  randomButton.addEventListener('click', event => {
    textarea.value = spinRandomly( spintax );
  });

  const spinButton = div.querySelector('.spin');
  let count = 0;
  spinButton.addEventListener('click', event => {
    count += 1;
    const nextValue = spinGenerator.next().value;
    if ( nextValue ){
      textarea.value = nextValue;
    } else {
      // start fresh
      spinGenerator = spinNext( spintax );
      textarea.value = `Alle ${count} Varianten angezeigt.`;
      count = 0;
    }
  });

}