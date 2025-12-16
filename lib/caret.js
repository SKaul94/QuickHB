/**
 * Ermittelt die x/y Koordinaten des Cursors in einem ContentEditable Element.
 * Nutzt native Browser-APIs.
 */
export function getCaretCoordinates() {
    const selection = window.getSelection();
    
    // Wenn keine Auswahl existiert oder wir nicht im Fokus sind
    if (selection.rangeCount === 0) {
        return { top: 0, left: 0, height: 20 };
    }

    // Wir holen uns den Bereich (Range) der aktuellen Auswahl
    const range = selection.getRangeAt(0);
    
    // getClientRects liefert die Position(en) des Cursors
    // (Collapsed Range = Cursor Position)
    let rect = range.getBoundingClientRect();

    // Fallback: Wenn der Cursor am Anfang einer leeren Zeile steht, 
    // ist rect manchmal 0. Wir prüfen, ob width/height 0 sind.
    if (rect.width === 0 && rect.height === 0) {
         // Ein Trick: Wir fügen temporär ein unsichtbares Zeichen ein, messen es und löschen es wieder.
         // Oder einfacher: Wir nehmen das getClientRects()[0]
         const rects = range.getClientRects();
         if (rects.length > 0) {
             rect = rects[0];
         }
    }

    return {
        top: rect.top + window.scrollY,  // Scroll-Offset beachten!
        left: rect.left + window.scrollX,
        height: rect.height || 20
    };
}