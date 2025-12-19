// Regex sucht nach der innersten Gruppe ohne weitere geschweifte Klammern
export const spintaxRegex = /\{([^{}]*)\}/;

/**
 * Liefert zufällige Ersetzung.
 * Löst verschachtelte Spintax zufällig auf: {Hallo|Hi} {Welt|Leute}
 */
export function spinRandomly( text ) {
  if (!text) return "";
  let match;
  while ((match = spintaxRegex.exec(text)) !== null) {
    const choices = match[1].split("|");
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    text = text.replace(match[0], randomChoice);
  }
  return text;
}

/**
 * Generator zur Aufzählung aller Ersetzungen.
 * Löst verschachtelte Spintax seriell auf: {Hallo|Hi} {Welt|Leute} erzeugt 4 Ersetzungen
 */
export function* spinNext( text ){
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

export function spintaxList(listDiv, spintax, gender){
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
        <button type="button" class="random blue-button">Zufall</button>
        <button type="button" class="spin blue-button">Spin</button>
        <div contenteditable="true" class="generated"></div>
      </div>
    `;
    listDiv.appendChild( div );

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
        generatedDiv.innerText = `Alle ${count-1} Varianten angezeigt.`;
        count = 0;
      }
    });
  }
}