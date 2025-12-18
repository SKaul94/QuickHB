// pdf-form-renderer.js

import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.mjs';

// Worker muss gesetzt sein
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.mjs';

export async function renderPdfWithForms(pdfDocument, container, scale = 1.5) {
    container.innerHTML = ''; 
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        await renderPage(pdfDocument, pageNum, container, scale);
    }
}

async function renderPage(pdfDocument, pageNum, container, scale) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // 1. Wrapper erstellen
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'pdf-page-wrapper';
    pageWrapper.style.width = `${viewport.width}px`;
    pageWrapper.style.height = `${viewport.height}px`;
    // Wichtig für absolute Positionierung der Layer
    pageWrapper.style.position = 'relative'; 
    container.appendChild(pageWrapper);

    // 2. Canvas Layer (Hintergrund)
    const canvas = document.createElement('canvas');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.display = 'block';
    pageWrapper.appendChild(canvas);

    const canvasContext = canvas.getContext('2d');
    const renderContext = {
        canvasContext,
        viewport
    };
    
    // Canvas rendern
    page.render(renderContext);

    // 3. Annotation Layer (HTML Formularfelder) vorbereiten
    const divLayer = document.createElement('div');
    divLayer.className = 'annotationLayer';
    pageWrapper.appendChild(divLayer);

    // CSS Variablen für PDF.js Skalierung setzen
    divLayer.style.setProperty('--scale-factor', viewport.scale);

    // Annotations Daten holen
    const annotations = await page.getAnnotations();

    // --- KORREKTUR FÜR PDF.JS v4.x ---
    
    // Instanz der AnnotationLayer Klasse erstellen
    const annotationLayer = new pdfjsLib.AnnotationLayer({
        div: divLayer,
        viewport: viewport.clone({ dontFlip: true }),
        page: page,
        accessibilityManager: null, // Null ist hier okay für einfache Darstellung
        annotationCanvasMap: null,
    });

    // Render Methode der Instanz aufrufen
    await annotationLayer.render({
        annotations: annotations,
        viewport: viewport.clone({ dontFlip: true }),
        div: divLayer,
        linkService: null,       // Links brauchen wir hier gerade nicht zwingend
        downloadManager: null,
        renderInteractiveForms: true, // WICHTIG: Das generiert die HTML Inputs
    });
}

/**
 * Extrahiert Daten aus den generierten Feldern
 */
export function extractFormData(container) {
    const data = {};
    const inputs = container.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.name) {
            if (input.type === 'checkbox' || input.type === 'radio') {
                if (input.checked) {
                    data[input.name] = input.value;
                }
            } else {
                data[input.name] = input.value;
            }
        }
    });
    return data;
}