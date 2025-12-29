import spintax from './data/hb-spintax.json' with { type: 'json' };
import { spintaxList } from './lib/spintax.js';
import { Autocomplete } from './lib/autocomplete.js';
import { getGender } from './lib/gender-switch.js';

/**
 * State Management & Router Logik
 */
document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.view-section');
    const indicator = document.getElementById('indicator');
    const navContainer = document.getElementById('nav-container');

    // Funktion: UI basierend auf der Route aktualisieren
    const updateUI = (routeId) => {
        // Fallback, falls Route leer oder ungültig ist
        if (!routeId || !document.getElementById(routeId)) {
            routeId = 'dashboard';
        }

        // 1. Aktiven Tab finden und hervorheben
        let activeTab = null;
        tabs.forEach(tab => {
            if (tab.dataset.target === routeId) {
                tab.classList.add('active');
                activeTab = tab;
            } else {
                tab.classList.remove('active');
            }
        });

        // 2. Indikator unter den aktiven Tab schieben
        

        // 3. Inhalt anzeigen
        sections.forEach(section => {
            if (section.id === routeId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    };

    // Funktion: Navigation auslösen
    const navigateTo = (routeId) => {
        // Wenn wir schon dort sind, nichts tun (verhindert doppelte History-Einträge)
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash === routeId) return;

        // Push State für History (damit Back-Button geht)
        history.pushState({ view: routeId }, null, `#${routeId}`);
        
        updateUI(routeId);
    };

    // Event Listener für Klicks auf Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetId = tab.dataset.target;
            navigateTo(targetId);
        });
    });

    // Event Listener für den Back/Forward-Button des Browsers (History API)
    window.addEventListener('popstate', (event) => {
        // Hash aus der URL lesen
        const routeId = window.location.hash.replace('#', '');
        updateUI(routeId);
    });

    // Initialisierung beim Laden der Seite
    const initialRoute = window.location.hash.replace('#', '');
    updateUI(initialRoute);
});

/**
 * Spintax Editor
 */
document.querySelector('#spintax quick-hb-editor').database = spintax;

/**
 * Gender Switch
 */
document.querySelector('gender-switch.spintax').addEventListener('gender-changed', event => {
  const listDiv = document.getElementById('spintax-list');
  listDiv.innerHTML = '';
  spintaxList(listDiv, spintax, getGender());
});

spintaxList(document.getElementById('spintax-list'), spintax, getGender()); // add list inside div

