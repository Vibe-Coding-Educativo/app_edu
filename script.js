document.addEventListener('DOMContentLoaded', () => {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSj_hltRI4Q0QolINWJVcKxCMMjfpdiCkKzSdgp9d8RlGTdUU1UIKvaj-TBSkq0JQGneDhfUkSQuFzy/pub?output=csv';

    // --- State Variables ---
    let allApps = [];
    let favorites = new Set();
    let showingFavoritesOnly = false;
    let isCustomView = false;
    let currentPage = 1;
    let itemsPerPage = 50; // Default value, will be overwritten by localStorage if available
    let activeFilters = {
        area_conocimiento: new Set(), nivel_educativo: new Set(),
        tipo_recurso: new Set(), plataforma: new Set(),
        nombre_autor: new Set(), palabras_clave: new Set(),
    };

    const REQUIRED_FIELDS = ['correo_autor', 'nombre_autor', 'titulo_app', 'url_app'];

    // --- DOM Elements ---
    const elements = {
        loadingMsg: document.getElementById('loading-message'),
        errorMsg: document.getElementById('error-message'),
        noResultsMsg: document.getElementById('no-results-message'),
        noFavoritesMsg: document.getElementById('no-favorites-message'),
        appsContainer: document.getElementById('apps-container'),
        filtersContainer: document.getElementById('filters-container'),
        resultsCounter: document.getElementById('results-counter'),
        activeFiltersDisplay: document.getElementById('active-filters-display'),
        actionsBar: document.getElementById('actions-bar'),
        searchInput: document.getElementById('search-input'),
        clearSearchBtn: document.getElementById('clear-search-btn'),
        toggleFiltersBtn: document.getElementById('toggle-filters-btn'),
        toggleFavoritesBtn: document.getElementById('toggle-favorites-btn'),
        filterPanel: document.getElementById('filter-panel'),
        customViewMsg: document.getElementById('custom-view-message'),
        shareUrlBtn: document.getElementById('share-url-btn'),
        shareFavoritesBtn: document.getElementById('share-favorites-btn'),
        clearFavoritesBtn: document.getElementById('clear-favorites-btn'),
        clearAllBtn: document.getElementById('clear-all-btn'),
        itemsPerPageSelector: document.getElementById('items-per-page-selector'),
        paginationContainer: document.getElementById('pagination-container'),
    };

    function normalizeString(str) {
        if (!str) return '';
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function loadFavorites() {
        try {
            const storedFavorites = localStorage.getItem('educationalAppsFavorites');
            if (storedFavorites) {
                favorites = new Set(JSON.parse(storedFavorites));
            }
        } catch (e) {
            console.error("Error loading favorites from localStorage", e);
            favorites = new Set();
        }
    }

    function saveFavorites() {
        try {
            localStorage.setItem('educationalAppsFavorites', JSON.stringify([...favorites]));
        } catch (e) {
             console.error("Error saving favorites to localStorage", e);
        }
    }

    function processData(data) {
        const FULL_COLUMN_KEYS = [
            'timestamp', 'correo_autor', 'nombre_autor', 'titulo_app', 'url_app',
            'descripcion_app', 'plataforma', 'tipo_recurso', 'nivel_educativo',
            'area_conocimiento', 'palabras_clave', 'licencia', 'eliminar_registro'
        ];

        const rows = data.slice(1);
        const mappedData = rows.map(rowArray => {
            const newRow = {};
            FULL_COLUMN_KEYS.forEach((key, index) => {
                newRow[key] = rowArray[index] ? rowArray[index].trim() : '';
            });
            return newRow;
        });

        const urlsToDelete = new Set();
        mappedData.forEach(app => {
            if (normalizeString(app.eliminar_registro) === 'si' && app.url_app) {
                urlsToDelete.add(app.url_app.trim());
            }
        });

        const appsWithoutDeleted = mappedData.filter(app =>
            !app.url_app || !urlsToDelete.has(app.url_app.trim())
        );

        const validApps = appsWithoutDeleted.filter(app => {
            if (REQUIRED_FIELDS.some(field => !app[field])) return false;
            try { new URL(app.url_app); return true; } catch (_) { return false; }
        });

        const seenUrls = new Set();
        const finalData = [];
        for (let i = validApps.length - 1; i >= 0; i--) {
            const app = validApps[i];
            const url = app.url_app.trim();

            if (!seenUrls.has(url)) {
                seenUrls.add(url);
                app.key = url;
                finalData.push(app);
            }
        }
        return finalData;
    }

    function setupFilters(apps) {
        const filterCategories = [
            { id: 'area_conocimiento', name: 'Área de Conocimiento', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>' },
            { id: 'nivel_educativo', name: 'Nivel Educativo', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.7.9 3.2 2.3 4.1"/><path d="M16 17a3 3 0 0 0-3-3 3 3 0 0 0-3 3v2h6v-2Z"/></svg>' },
            { id: 'tipo_recurso', name: 'Tipo de Recurso', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.28 2.22a2.22 2.22 0 0 0-3.14 0l-12 12a2.22 2.22 0 0 0 0 3.14l3.14 3.14a2.22 2.22 0 0 0 3.14 0l12-12a2.22 2.22 0 0 0 0-3.14Z"/><path d="m14 7 3 3"/><path d="M5.5 16.5 10 12"/></svg>' },
            { id: 'plataforma', name: 'Plataforma', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'},
            { id: 'nombre_autor', name: 'Autor/a', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'},
        ];

        filterCategories.forEach(cat => {
            const values = new Set(apps.flatMap(app => app[cat.id]?.split(',') || []).map(v => v.trim()).filter(Boolean));
            if (values.size === 0) return;

            const sortedValues = Array.from(values).sort((a,b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
            const details = document.createElement('details');
            details.className = 'border-b border-gray-200 last:border-b-0 pb-4';
            details.innerHTML = `
                <summary class="flex justify-between items-center cursor-pointer py-2">
                    <div class="flex items-center gap-3"><span class="text-gray-500">${cat.icon}</span><span class="font-semibold text-gray-800">${cat.name}</span></div>
                    <span class="arrow transition-transform text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></span>
                </summary>
                <div class="pt-3 flex flex-wrap gap-2" data-category="${cat.id}">
                    ${sortedValues.map(value => `<button class="filter-btn text-sm font-medium py-1.5 px-3 rounded-full" data-filter="${value}">${value}</button>`).join('')}
                </div>`;
            elements.filtersContainer.appendChild(details);
        });
    }

    function getPlatformStyle(platform) {
        const STYLES = {'Gemini': 'border-purple-500', 'Claude': 'border-orange-500', 'ChatGPT': 'border-teal-500', 'Web (HTML/JS propio)': 'border-blue-500', 'GitHub Pages': 'border-black', 'Google Sites': 'border-sky-500', 'Default': 'border-gray-400'};
        if (!platform) return STYLES.Default;
        const key = Object.keys(STYLES).find(k => platform.includes(k) && k !== 'Default');
        return STYLES[key] || STYLES.Default;
    }

    function displayApps(apps) {
        elements.appsContainer.innerHTML = '';
        elements.noResultsMsg.classList.toggle('hidden', apps.length > 0 || (showingFavoritesOnly && favorites.size === 0) || isCustomView);
        elements.noFavoritesMsg.classList.toggle('hidden', !showingFavoritesOnly || apps.length > 0 || favorites.size > 0 || isCustomView);

        if (showingFavoritesOnly && favorites.size > 0 && apps.length === 0) {
             elements.noResultsMsg.classList.remove('hidden');
        }

        if (!isCustomView) {
            elements.resultsCounter.textContent = `Mostrando ${apps.length} de ${allApps.length} aplicaciones.`;
        }

        const effectiveItemsPerPage = itemsPerPage === 'all' ? apps.length : parseInt(itemsPerPage);
        const startIndex = (currentPage - 1) * effectiveItemsPerPage;
        const endIndex = startIndex + effectiveItemsPerPage;
        const paginatedApps = apps.slice(startIndex, endIndex);

        paginatedApps.forEach(app => {
            const card = document.createElement('div');
            card.className = `card bg-white rounded-lg shadow-sm overflow-hidden flex flex-col ${getPlatformStyle(app.plataforma)}`;

            const isFavorite = favorites.has(app.key);
            const favClass = isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500';

            // --- Start: Read More/Less Logic ---
            const fullDescription = app.descripcion_app || 'No hay descripción.';
            let descriptionHtml;

            if (fullDescription.length > 100) {
                const shortDescription = fullDescription.substring(0, 100).trim();
                descriptionHtml = `
                    <div class="description-container text-gray-600 text-sm mb-4 flex-grow">
                        <p class="short-desc">${shortDescription}... <a href="#" class="read-more font-semibold text-blue-600 hover:underline">más</a></p>
                        <p class="long-desc hidden">${fullDescription} <a href="#" class="read-less font-semibold text-blue-600 hover:underline">menos</a></p>
                    </div>`;
            } else {
                descriptionHtml = `<p class="text-gray-600 text-sm mb-4 flex-grow">${fullDescription}</p>`;
            }
            // --- End: Read More/Less Logic ---

            card.innerHTML = `
                <div class="p-5 flex-grow flex flex-col relative">
                    <button class="favorite-btn absolute top-3 right-3 p-1 rounded-full bg-white/50 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-red-400" title="Añadir/quitar de favoritos" data-key="${app.key}">
                        <svg class="w-6 h-6 transition-colors duration-200 ${favClass}" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                    </button>
                    <p class="text-sm font-semibold text-gray-600 mb-3 pr-8">${app.plataforma || 'Sin plataforma'}</p>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${app.titulo_app}</h3>
                    <p class="text-sm text-gray-500 mb-3">por <span class="font-medium">${createFilterLink(app.nombre_autor, 'nombre_autor')}</span></p>
                    ${descriptionHtml}
                    <div class="text-xs text-gray-500 space-y-1 mt-auto">
                        ${app.nivel_educativo ? `<p><strong>Nivel:</strong> ${createFilterLink(app.nivel_educativo, '
