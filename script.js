document.addEventListener('DOMContentLoaded', () => {
    init();
    setupDialogAccessibility();
});

// Aggiunta funzione per configurare l'accessibilità del dialog
function setupDialogAccessibility() {
    const dialog = document.querySelector('#speakerDialog');
    
    // Gestione click fuori dal dialog
    dialog.addEventListener('click', (event) => {
        // Se il click è sul dialog stesso (non su un suo contenuto)
        if (event.target === dialog) {
            closeDialog();
        }
    });
    
    // Imposta il focus iniziale sul pulsante di chiusura quando si apre il dialog
    dialog.addEventListener('open', () => {
        const closeButton = dialog.querySelector('.close');
        if (closeButton) {
            setTimeout(() => closeButton.focus(), 100);
        }
    });
}

async function loadProgram() {
    try {
        const response = await fetch('agendas.json');
        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }
        const programData = await response.json();
        return programData.data;
    } catch (error) {
        console.error('Errore nel caricamento del programma:', error);
        return [];
    }
}

function getColorClass(hexColor) {
    if (!hexColor) return 'color-white';
    
    switch(hexColor.toUpperCase()) {
        case '#FFFFFF': return 'color-white';
        case '#B51963': return 'color-dark-pink';
        case '#054FB9': return 'color-dark-blue';
        case '#006400': return 'color-green';
        case '#00B4C5': return 'color-tiffany';
        case '#E47895': return 'color-pink';
        case '#F57600': return 'color-orange';
        case '#9B8BF4': return 'color-lilla';
        default: return 'color-white';
    }
}
// class="list-icon" aria-hidden="true" width="16" height="16"
const iconList = `
<svg class="list-icon" aria-hidden="true" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM241 377c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l87-87-87-87c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0L345 239c9.4 9.4 9.4 24.6 0 33.9L241 377z"/></svg>
`;

function createSpeakersList(speakers) {
    let html = '<div class="event-presenter"><strong>Speaker:</strong>';
    html += '<ul class="presenters-list">';
    
    speakers.forEach(speaker => {
        let job = ' ';

        if(!speaker.job_title && speaker.organization) {
            job += `(${speaker.organization})`;
        }

        if(speaker.job_title && !speaker.organization) {
            job += `(${speaker.job_title})`;
        }

        if(speaker.job_title && speaker.organization) {
            job += `(${speaker.job_title} @ ${speaker.organization})`;
        }

        html += `<li>
            ${iconList}
            <button 
                data-id="${speaker.id}"
                data-firstname="${speaker.first_name.replace(/"/g, '&quot;')}"
                data-lastname="${speaker.last_name.replace(/"/g, '&quot;')}"
                data-jobtitle="${(speaker.job_title || '').replace(/"/g, '&quot;')}"
                data-organization="${(speaker.organization || '').replace(/"/g, '&quot;')}"
                data-bio="${(speaker.bio || '').replace(/"/g, '&quot;')}"
                data-picture="${(speaker.profile_picture_url || '')}"
                onClick="openSpeakerModal(event)"
                class="not-print"
                aria-haspopup="dialog"
            >
            ${speaker.first_name+' '+speaker.last_name}
            </button>
            <span class="not-print">${job}</span>
            <span class="only-print">${speaker.first_name.replace(/"/g, '&quot;')} ${speaker.last_name.replace(/"/g, '&quot;')} ${ `(${(speaker.organization || '').replace(/"/g, '&quot;')})`}</span>
        </li>`;

    });
    
    html += '</ul></div>';
    return html;
}

function openSpeakerModal(e) {
    const id = e.target.getAttribute('data-id');
    const firstName = e.target.getAttribute('data-firstname');
    const lastName = e.target.getAttribute('data-lastname');
    const jobTitle = e.target.getAttribute('data-jobtitle');
    const organization = e.target.getAttribute('data-organization');
    const bio = e.target.getAttribute('data-bio');
    const picture = e.target.getAttribute('data-picture');

    const dialog = document.querySelector('#speakerDialog');
    
    document.querySelector('#name').textContent = firstName;
    document.querySelector('#surname').textContent = lastName;
    document.querySelector('#jobTitle').textContent = jobTitle || '';
    document.querySelector('#organization').textContent = organization || '';
    document.querySelector('#bio').textContent = bio || '';
    document.querySelector('#picture') ? document.querySelector('#picture').style.backgroundImage = "url('"+picture+"')" || '' : '';
    
    // Salva l'elemento che aveva il focus prima di aprire il dialog
    dialog.lastActiveElement = document.activeElement;
    
    dialog.showModal();
    document.querySelector("body").style.overflow = "hidden";
    
    // Annuncio per screen reader che il dialog è stato aperto
    announceToScreenReader(`Dialog aperto: Dettagli di ${firstName} ${lastName}`);
}

function closeDialog(){
    const dialog = document.querySelector('#speakerDialog');
    document.querySelector("body").style.overflow = "auto";
    dialog.close();
    
    // Ripristina il focus all'elemento che era attivo prima dell'apertura del dialog
    if (dialog.lastActiveElement) {
        dialog.lastActiveElement.focus();
    }
    
    // Annuncio per screen reader che il dialog è stato chiuso
    announceToScreenReader('Dialog chiuso');
}

// Funzione ausiliaria per annunci di screen reader
function announceToScreenReader(message) {
    // Cerca un elemento esistente per gli annunci, o ne crea uno
    let announcer = document.getElementById('sr-announcer');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'sr-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.position = 'absolute';
        announcer.style.width = '1px';
        announcer.style.height = '1px';
        announcer.style.overflow = 'hidden';
        announcer.style.clip = 'rect(0, 0, 0, 0)';
        document.body.appendChild(announcer);
    }
    
    // Aggiorna il contenuto per far scattare l'annuncio
    announcer.textContent = message;
}

function handleKeydownDialog(event){
    if (event.key === 'Escape' || event.key === 'Esc' || event.keyCode === 27) {        
        closeDialog();
        event.preventDefault();
    }
}

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

    /* ${item.presenters && item.presenters !== '' ? createPresentersList(item.presenters) : ''} */

    return `
        <div class="event-card ${colorClass}" data-id="${item.id}">
         <div class="event-id">ID: ${item.id}</div> 
            <div class="event-location">${item.location || ''}</div>
            <h4 class="event-title">${item.title || 'Titolo non disponibile'}</h4>
            
            ${item.speakers && item.speakers.length ? createSpeakersList(item.speakers) : ''}
            ${item.description && item.description !== '' ? 
                `<div class="event-description"><details><summary>Leggi abstract</summary>${item.description}</details></div>` : ''}
            ${tagsHtml}
        </div>
    `;
}

function renderProgram(data, filters = {}) {
    const container = document.getElementById('program-container');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-message">Nessun dato disponibile</div>';
        return;
    }

    // Applica i filtri
    let filteredData = [...data];
    
    if (filters.agenda && filters.agenda !== 'all') {
        filteredData = filteredData.filter(agenda => agenda.id == filters.agenda);
    }

    // Crea l'HTML per ogni giorno
    let hasEvents = false;
    
    filteredData.forEach(el => {
        // Determina se è un giorno di workshop o di sessioni normali
        const isWorkshopDay = el.label.toLowerCase().includes('workshop');
        const sectionClass = isWorkshopDay ? 'workshop-section' : 'session-section';
        
        let elHtml = `
            <div class="day-section ${sectionClass}" data-id="${el.id}">
                <h2 class="day-header">${el.label}</h2>
        `;

        // Per ogni fascia oraria del giorno
        el.events.forEach(event => {
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
            
            elHtml += `
                <div class="time-slot">
                    <h3 class="time">${event.start}</h3>
                    <div class="event-container ${containerClass}">
            `;

            // Aggiungi ogni evento nella fascia oraria
            filteredItems.forEach(item => {
                elHtml += createEventCard(item);
            });

            elHtml += `
                    </div>
                </div>
            `;
        });

        elHtml += `</div>`;
        
        // Aggiungi la sezione del giorno solo se ha eventi
        if (hasEvents) {
            container.innerHTML += elHtml;
            hasEvents = false;
        }
    });

    // Messaggio se non ci sono risultati
    if (container.innerHTML === '') {
        container.innerHTML = '<div class="empty-message">Nessun evento corrisponde ai filtri selezionati</div>';
    }
}

function populateFilters(data) {
    const agendaFilter = document.getElementById('agenda-filter');
    const locationFilter = document.getElementById('location-filter');
    
    // Popola le date
    data.forEach(el => {
        const option = document.createElement('option');
        option.value = el.id;
        option.textContent = el.label;
        
        agendaFilter.appendChild(option);
    });
    
    // Popola le location
    const locations = new Set();
    data.forEach(day => {
        day.events.forEach(event => {
            event.items.forEach(item => {
                if (item.location && item.location !== "Reception" && item.location !== "Area Pranzo / Coffee Break") {
                    locations.add(item.location);
                }
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
        document.getElementById('agenda-filter').addEventListener('change', applyFilters);
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
async function applyFilters() {
    const agendaValue = document.getElementById('agenda-filter').value;
    let locationValue = document.getElementById('location-filter').value;
    const searchText = document.getElementById('search-input').value;
    const locationFilter = document.getElementById('location-filter');

    const data = await loadProgram();
    
    // Aggiorno lista locations sulla base del filtro agenda applicato
    const locations = new Set();
    data.forEach(agenda => {
        if(agendaValue === "all" || agendaValue == agenda.id) {
            agenda.events.forEach(event => {
                event.items.forEach(item => {
                    if (item.location && item.location !== "Reception" && item.location !== "Area Pranzo / Coffee Break") {
                        locations.add(item.location);
                    }
                });
            });
        }
    });

    if(locationValue == "all" || !locations.has(locationValue)) {
        locationValue = "all";
        locationFilter.innerHTML = '';
    
        const option = document.createElement('option');
        option.value = "all";
        option.textContent = "Tutte le location";
        locationFilter.appendChild(option);
        
        [...locations].sort().forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }
    
    renderProgram(window.programData, {
        agenda: agendaValue,
        location: locationValue,
        searchText: searchText
    });
}

// Funzione per resettare i filtri
function resetFilters() {
    document.getElementById('agenda-filter').value = 'all';
    document.getElementById('location-filter').value = 'all';
    document.getElementById('search-input').value = '';
    
    renderProgram(window.programData);
}