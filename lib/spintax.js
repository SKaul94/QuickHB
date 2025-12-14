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