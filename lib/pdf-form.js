import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.mjs';
import { renderPdfWithForms, extractFormData } from './/pdf-form-renderer.js';

// Worker setzen (Essentiell)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.mjs';

const fileInput = document.getElementById('fileInput');
const container = document.getElementById('pdfContainer');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();

    // PDF laden
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdfDoc = await loadingTask.promise;

    console.log(`PDF geladen mit ${pdfDoc.numPages} Seiten.`);

    // Unsere Funktion aufrufen
    await renderPdfWithForms(pdfDoc, container, 1.2); // 1.2 ist der Zoom-Faktor
});

// Beispiel: Daten auslesen
document.getElementById('saveBtn').addEventListener('click', () => {
    const data = extractFormData(container);
    console.log("Formular Daten:", data);
    alert(JSON.stringify(data, null, 2));
});