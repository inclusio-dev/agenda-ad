// Funzione per caricare e analizzare il file JSON
async function loadProgram() {
    try {
        // Carica il file JSON direttamente dalla stessa cartella
        const response = await fetch('2025.json');
        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }
        const programData = await response.json();
        return programData;
    } catch (error) {
        console.error('Errore nel caricamento del programma:', error);
        return [];
    }
}

// Funzione per ottenere il colore CSS in base al colore esadecimale
function getColorClass(hexColor) {
    if (!hexColor) return 'color-white';
    
    switch(hexColor.toUpperCase()) {
        case '#FFFFFF': return 'color-white';
        case '#FF0000': return 'color-red';
        case '#00FF00': return 'color-green';
        case '#0000FF': return 'color-blue';
        case '#00FFFF': return 'color-cyan';
        case '#FF00FF': return 'color-magenta';
        default: return 'color-white';
    }
}

// Funzione per creare una lista di relatori
function createPresentersList(presenters) {
    if (!presenters || presenters === '') return '';
    
    // Dividi la stringa dei presentatori
    // La divisione è complessa perché i presentatori possono essere formattati in modi diversi
    // Esempio: "Nome Cognome (Ruolo @ Azienda), Altro Nome (Ruolo)"
    let presentersList = [];
    
    // Suddividi per virgole, ma non quelle tra parentesi
    let inParenthesis = false;
    let currentPresenter = '';
    
    for (let i = 0; i < presenters.length; i++) {
        const char = presenters[i];
        
        if (char === '(') inParenthesis = true;
        else if (char === ')') inParenthesis = false;
        
        if (char === ',' && !inParenthesis) {
            if (currentPresenter.trim()) {
                presentersList.push(currentPresenter.trim());
            }
            currentPresenter = '';
        } else {
            currentPresenter += char;
        }
    }
    
    // Aggiungi l'ultimo presentatore
    if (currentPresenter.trim()) {
        presentersList.push(currentPresenter.trim());
    }
    
    // Se non ci sono stati relatori identificati, usa l'intera stringa
    if (presentersList.length === 0 && presenters.trim()) {
        presentersList = [presenters];
    }
    
    // Crea la lista HTML
    let html = '<div class="event-presenter"><strong>Relatori:</strong>';
    html += '<ul class="presenters-list">';
    
    presentersList.forEach(presenter => {
        html += `<li>${presenter}</li>`;
    });
    
    html += '</ul></div>';
    return html;
}

// Funzione per generare l'HTML di un evento
function createEventCard(item) {
    const colorClass = getColorClass(item.color);
    
    let tagsHtml = '';
    if (item.tags && item.tags.length > 0 && item.tags !== '') {
        const tagsList = typeof item.tags === 'string' ? item.tags.split(',') : [];
        if (tagsList.length > 0) {
            tagsHtml = '<div class="event-tags">';
            tagsList.forEach(tag => {
                tagsHtml += `<span class="tag">${tag.trim()}</span>`;
            });
            tagsHtml += '</div>';
        }
    }

    return `
        <div class="event-card ${colorClass}" data-id="${item.id}">
            <div class="event-id">ID: ${item.id}</div>
            <h4 class="event-title">${item.title || 'Titolo non disponibile'}</h4>
            <div class="event-location">${item.location || ''}</div>
            ${item.presenters && item.presenters !== '' ? createPresentersList(item.presenters) : ''}
            ${item.description && item.description !== '' ? 
                `<div class="event-description">${item.description}</div>` : ''}
            ${tagsHtml}
        </div>
    `;
}

// Funzione per renderizzare il programma
function renderProgram(data, filters = {}) {
    const container = document.getElementById('program-container');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-message">Nessun dato disponibile</div>';
        return;
    }

    // Applica i filtri
    let filteredData = [...data];
    
    // Filtro per giorno
    if (filters.day && filters.day !== 'all') {
        filteredData = filteredData.filter(day => day.date === filters.day);
    }

    // Crea l'HTML per ogni giorno
    let hasEvents = false;
    
    filteredData.forEach(day => {
        // Determina se è un giorno di workshop o di sessioni normali
        const isWorkshopDay = day.label.toLowerCase().includes('workshop');
        const sectionClass = isWorkshopDay ? 'workshop-section' : 'session-section';
        
        let dayHtml = `
            <div class="day-section ${sectionClass}" data-date="${day.date}">
                <h2 class="day-header">${day.label}</h2>
        `;

        // Per ogni fascia oraria del giorno
        day.events.forEach(event => {
            // Filtra gli elementi in base alla location se specificato
            let filteredItems = event.items;
            if (filters.location && filters.location !== 'all') {
                filteredItems = filteredItems.filter(item => item.location === filters.location);
            }

            // Filtra per testo di ricerca
            if (filters.searchText && filters.searchText.trim() !== '') {
                const searchLower = filters.searchText.toLowerCase().trim();
                filteredItems = filteredItems.filter(item => 
                    (item.title && item.title.toLowerCase().includes(searchLower)) ||
                    (item.description && item.description.toLowerCase().includes(searchLower)) ||
                    (item.presenters && item.presenters.toLowerCase().includes(searchLower)) ||
                    (item.tags && item.tags.toLowerCase().includes(searchLower))
                );
            }

            // Se non ci sono elementi dopo il filtro, salta questa fascia oraria
            if (filteredItems.length === 0) return;

            hasEvents = true;
            
            // Determina se questa fascia oraria contiene workshop
            const containerClass = isWorkshopDay ? 'workshop-container' : 'session-container';
            
            dayHtml += `
                <div class="time-slot">
                    <h3 class="time">${event.start}</h3>
                    <div class="event-container ${containerClass}">
            `;

            // Aggiungi ogni evento nella fascia oraria
            filteredItems.forEach(item => {
                dayHtml += createEventCard(item);
            });

            dayHtml += `
                    </div>
                </div>
            `;
        });

        dayHtml += `</div>`;
        
        // Aggiungi la sezione del giorno solo se ha eventi
        if (hasEvents) {
            container.innerHTML += dayHtml;
            hasEvents = false;
        }
    });

    // Messaggio se non ci sono risultati
    if (container.innerHTML === '') {
        container.innerHTML = '<div class="empty-message">Nessun evento corrisponde ai filtri selezionati</div>';
    }
}

// Funzione per popolare i filtri
function populateFilters(data) {
    const dayFilter = document.getElementById('day-filter');
    const locationFilter = document.getElementById('location-filter');
    
    // Popola le date
    const dates = new Set();
    data.forEach(day => {
        dates.add(day.date);
    });
    
    dates.forEach(date => {
        const dayLabel = data.find(d => d.date === date)?.label || date;
        const option = document.createElement('option');
        option.value = date;
        option.textContent = dayLabel;
        dayFilter.appendChild(option);
    });
    
    // Popola le location
    const locations = new Set();
    data.forEach(day => {
        day.events.forEach(event => {
            event.items.forEach(item => {
                if (item.location) locations.add(item.location);
            });
        });
    });
    
    [...locations].sort().forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
}

// Funzione di inizializzazione
async function init() {
    const programData = await loadProgram();
    
    if (programData && programData.length > 0) {
        // Salva i dati globalmente per uso più facile nei filtri
        window.programData = programData;
        
        // Popola i filtri
        populateFilters(programData);
        
        // Renderizza il programma iniziale
        renderProgram(programData);
        
        // Imposta gli event listener per i filtri
        document.getElementById('day-filter').addEventListener('change', applyFilters);
        document.getElementById('location-filter').addEventListener('change', applyFilters);
        document.getElementById('search-button').addEventListener('click', applyFilters);
        document.getElementById('search-input').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                applyFilters();
            }
        });
        document.getElementById('reset-button').addEventListener('click', resetFilters);
    }
}

// Funzione per applicare i filtri
function applyFilters() {
    const dayValue = document.getElementById('day-filter').value;
    const locationValue = document.getElementById('location-filter').value;
    const searchText = document.getElementById('search-input').value;
    
    renderProgram(window.programData, {
        day: dayValue,
        location: locationValue,
        searchText: searchText
    });
}

// Funzione per resettare i filtri
function resetFilters() {
    document.getElementById('day-filter').value = 'all';
    document.getElementById('location-filter').value = 'all';
    document.getElementById('search-input').value = '';
    
    renderProgram(window.programData);
}

// Carica il file JSON quando il documento è pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inizializzazione dell'applicazione
    init();
});