/**
 * Berechnet die x/y Koordinaten des Cursors in einer Textarea
 * Basierend auf der bewährten Logic von 'textarea-caret'
 */
export function getCaretCoordinates(element, position) {
    const div = document.createElement('div');
    const style = getComputedStyle(element);

    // Diese Styles müssen kopiert werden, damit das Div identisch zur Textarea ist
    const props = [
        'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'paddingTop',
        'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight',
        'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign',
        'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing'
    ];

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap'; // Wichtig für Zeilenumbrüche
    div.style.wordWrap = 'break-word'; // Wichtig für lange Wörter
    div.style.top = '0px';
    div.style.left = '0px';

    // Styles übertragen
    props.forEach(prop => {
        div.style[prop] = style.getPropertyValue(prop);
    });

    document.body.appendChild(div);

    // Text bis zum Cursor kopieren
    div.textContent = element.value.substring(0, position);

    // Ein Span für die exakte Position
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    const coordinates = {
        top: span.offsetTop + parseInt(style['borderTopWidth']),
        left: span.offsetLeft + parseInt(style['borderLeftWidth']),
        height: parseInt(style['lineHeight']) || 20 // Fallback
    };

    document.body.removeChild(div);
    return coordinates;
}