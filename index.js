// import spintax from './data/hb-spintax.json' with { type: 'json' };
// import sectionSpintax from './data/section-spintax.json' with { type: 'json' };
// import structure from './data/structure.json' with { type: 'json' };
import { spintaxList } from './lib/spintax.js';
import { getGender } from './lib/gender-switch.js';
import * as Idb from './lib/idb-keyval.js';
import { INDEXEDDB_KEY, INDEXEDDB_KEY_STRUCTURE } from './lib/quick-hb-database.js';

/**
 * State Management & Router Logik - Begin
 */
document.addEventListener("DOMContentLoaded", async () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.view-section');

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
 /**
 * State Management & Router Logik - End
 */   

    /**
     * Global wiring of components via Events
     */
    const antrag1 = document.getElementById('antrag1');
    // initial assignment triggers re-rendering
    antrag1.database = await Idb.get( INDEXEDDB_KEY );
    
    const dashboard = document.getElementById('quick-dashboard');
    const spintaxDatabase = document.getElementById('spintax-database');
    
    spintaxDatabase.addEventListener('indexeddb-set', loadEventHandler );
    dashboard.addEventListener('db-loaded', loadEventHandler );

    async function loadEventHandler( event ) {
        const database = await Idb.get( INDEXEDDB_KEY );
        // on every load event, get the new database
        antrag1.database = database;
        // write the new message to the dashboard
        dashboard.message = `Neue Datenbank geladen ${new Date().toLocaleString('de-DE')}`;
        dashboard.statistics = `Anzahl Spintax-Regeln: ${database?.length || 0}.`;

        spintaxDatabase.database = database;
    }

});






