document.addEventListener('DOMContentLoaded', () => {
    // La clave del arreglo: Se mueven la inicialización de los elementos
    // y toda la lógica principal DENTRO del listener 'DOMContentLoaded'.

    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSj_hltRI4Q0QolINWJVcKxCMMjfpdiCkKzSdgp9d8RlGTdUU1UIKvaj-TBSkq0JQGneDhfUkSQuFzy/pub?output=csv';

    // --- State Variables ---
    let allApps = [];
    let favorites = { "General": [] };
    let showingFavoritesOnly = false;
    let isCustomView = false;
    let currentPage = 1;
    let itemsPerPage = 25; // Se actualiza desde localStorage si existe
    let activeFilters = {
        area_conocimiento: new Set(), nivel_educativo: new Set(),
        tipo_recurso: new Set(), plataforma: new Set(),
        nombre_autor: new Set(), palabras_clave: new Set(),
    };
    let currentAppKeyForModal = null;
    let activeFavoriteTab = 'General';
    let categoryToDelete = null;

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
        clearFavoritesBtn: document.getElementById('clear-favorites-btn'),
        clearAllBtn: document.getElementById('clear-all-btn'),
        itemsPerPageSelector: document.getElementById('items-per-page-selector'),
        paginationContainer: document.getElementById('pagination-container'),
        favoritesTabsContainer: document.getElementById('favorites-tabs-container'),
        categoryModal: document.getElementById('category-modal'),
        categoryModalTitle: document.getElementById('category-modal-title'),
        categorySelect: document.getElementById('category-select'),
        newCategoryInput: document.getElementById('new-category-input'),
        categoryModalError: document.getElementById('category-modal-error'),
        saveCategoryBtn: document.getElementById('save-category-btn'),
        cancelCategoryBtn: document.getElementById('cancel-category-btn'),
        removeFavoriteBtn: document.getElementById('remove-favorite-btn'),
        deleteCategoryModal: document.getElementById('delete-category-modal'),
        deleteCategoryConfirmText: document.getElementById('delete-category-confirm-text'),
        confirmDeleteCategoryBtn: document.getElementById('confirm-delete-category-btn'),
        cancelDeleteCategoryBtn: document.getElementById('cancel-delete-category-btn'),
    };
    
    // --- GESTIÓN DEL TEMA (CLARO/OSCURO) ---
    function setupThemeManager() {
        const themeButtons = {
            light: document.getElementById('theme-light-btn'),
            dark: document.getElementById('theme-dark-btn'),
            system: document.getElementById('theme-system-btn'),
        };
        const htmlEl = document.documentElement;

        function applyTheme(theme) {
            // Actualiza la clase en <html> y la preferencia en localStorage
            if (theme === 'dark') {
                htmlEl.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else if (theme === 'light') {
                htmlEl.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else { // 'system'
                localStorage.removeItem('theme');
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    htmlEl.classList.add('dark');
                } else {
                    htmlEl.classList.remove('dark');
                }
            }

            // Actualiza el estado visual de los botones
            Object.values(themeButtons).forEach(btn => btn.classList.remove('active'));
            if (themeButtons[theme]) {
                themeButtons[theme].classList.add('active');
            }
        }

        // Listener para cambios en el tema del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            // Solo aplica el cambio si el usuario no ha forzado un modo manual
            if (!localStorage.getItem('theme')) {
                applyTheme('system');
            }
        });

        // Listeners para los botones
        themeButtons.light.addEventListener('click', () => applyTheme('light'));
        themeButtons.dark.addEventListener('click', () => applyTheme('dark'));
        themeButtons.system.addEventListener('click', () => applyTheme('system'));

        // Carga inicial del tema
        const savedTheme = localStorage.getItem('theme') || 'system';
        applyTheme(savedTheme);
    }

    function normalizeString(str) { if (!str) return ''; return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    function loadFavorites() { try { const storedFavorites = localStorage.getItem('educationalAppsFavorites'); if (storedFavorites) { const parsed = JSON.parse(storedFavorites); if (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) { favorites = parsed; if (!favorites["General"]) { favorites["General"] = []; } } else { if(Array.isArray(parsed)) { favorites = { "General": parsed }; saveFavorites(); } else { favorites = { "General": [] }; } } } } catch (e) { console.error("Error loading favorites from localStorage", e); favorites = { "General": [] }; } }
    function saveFavorites() { try { Object.keys(favorites).forEach(cat => { if (cat !== "General" && favorites[cat].length === 0) { delete favorites[cat]; } }); localStorage.setItem('educationalAppsFavorites', JSON.stringify(favorites)); } catch (e) { console.error("Error saving favorites to localStorage", e); } }
    function isFavorite(appKey) { return Object.values(favorites).some(arr => arr.includes(appKey)); }
    function findCategoryForApp(appKey) { return Object.keys(favorites).find(cat => favorites[cat].includes(appKey)); }
    function getTotalFavoritesCount() { return Object.values(favorites).reduce((sum, arr) => sum + arr.length, 0); }

    function displayApps(apps) { const totalFavorites = getTotalFavoritesCount(); elements.noResultsMsg.classList.toggle('hidden', apps.length > 0 || (showingFavoritesOnly && totalFavorites === 0) || isCustomView); elements.noFavoritesMsg.classList.toggle('hidden', !showingFavoritesOnly || apps.length > 0 || totalFavorites > 0 || isCustomView); if (showingFavoritesOnly) { elements.favoritesTabsContainer.classList.remove('hidden'); renderFavoriteTabsAndContent(apps); } else { elements.favoritesTabsContainer.classList.add('hidden'); elements.appsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'; renderAppGrid(apps); } if (!isCustomView) { elements.resultsCounter.textContent = `Mostrando ${apps.length} de ${allApps.length} aplicaciones.`; } }
    function renderAppGrid(appsToRender, container = elements.appsContainer) { container.innerHTML = ''; const effectiveItemsPerPage = itemsPerPage === 'all' ? appsToRender.length : parseInt(itemsPerPage); const startIndex = (currentPage - 1) * effectiveItemsPerPage; const endIndex = startIndex + effectiveItemsPerPage; const paginatedApps = appsToRender.slice(startIndex, endIndex); paginatedApps.forEach(app => { const card = createAppCard(app); container.appendChild(card); }); if (container === elements.appsContainer) { setupPagination(appsToRender.length); } }
    
    function renderFavoriteTabsAndContent(allFavoriteApps) {
        elements.favoritesTabsContainer.innerHTML = '';
        elements.appsContainer.innerHTML = '';
        setupPagination(0);
        const sortedCategories = Object.keys(favorites).sort((a,b) => a.localeCompare(b));
        const tabsList = document.createElement('div');
        tabsList.className = 'flex border-b border-gray-200 dark:border-gray-700 flex-wrap';
        sortedCategories.forEach(category => {
            if (favorites[category].length === 0 && category !== 'General') return;
            const tabButton = document.createElement('button');
            tabButton.className = 'fav-tab-btn flex items-center';
            tabButton.dataset.category = category;
            if (category === activeFavoriteTab) { tabButton.classList.add('active'); }
            let tabContent = `<span>${category} (${favorites[category].length})</span>`;
            if (category !== 'General') { tabContent += `<span class="delete-category-btn" title="Eliminar categoría '${category}'"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></span>`; }
            tabButton.innerHTML = tabContent;
            tabButton.addEventListener('click', (e) => { if (e.target.closest('.delete-category-btn')) return; activeFavoriteTab = category; renderFavoriteTabsAndContent(allFavoriteApps); });
            const deleteBtn = tabButton.querySelector('.delete-category-btn');
            if (deleteBtn) { deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); openDeleteCategoryModal(category); }); }
            tabsList.appendChild(tabButton);
        });
        elements.favoritesTabsContainer.appendChild(tabsList);
        const activeCategoryHeader = document.createElement('div');
        activeCategoryHeader.className = 'flex justify-between items-center mt-4 mb-4';
        activeCategoryHeader.innerHTML = `<h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">${activeFavoriteTab}</h2><button class="share-category-btn text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 dark:text-blue-400 dark:hover:text-blue-300"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>Compartir esta categoría</button>`;
        elements.appsContainer.appendChild(activeCategoryHeader);
        activeCategoryHeader.querySelector('.share-category-btn').addEventListener('click', (e) => { e.preventDefault(); copyToClipboard(generateShareableURL('category', activeFavoriteTab)); });
        const appsInActiveCategory = allFavoriteApps.filter(app => (favorites[activeFavoriteTab] || []).includes(app.key));
        const categoryGrid = document.createElement('div');
        categoryGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
        appsInActiveCategory.forEach(app => { const card = createAppCard(app); categoryGrid.appendChild(card); });
        elements.appsContainer.appendChild(categoryGrid);
        elements.appsContainer.className = '';
    }

    function createAppCard(app) { const card = document.createElement('div'); card.className = `card bg-white rounded-lg shadow-sm overflow-hidden flex flex-col dark:bg-gray-800 ${getPlatformStyle(app.plataforma)}`; const isFav = isFavorite(app.key); const favClass = isFav ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'; const fullDescription = app.descripcion_app || 'No hay descripción.'; let descriptionHtml; if (fullDescription.length > 350) { const shortDescription = fullDescription.substring(0, 350).trim(); descriptionHtml = `<div class="description-container text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow"><p class="short-desc">${shortDescription}... <a href="#" class="read-more font-semibold text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">más</a></p><p class="long-desc hidden">${fullDescription} <a href="#" class="read-less font-semibold text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">menos</a></p></div>`; } else { descriptionHtml = `<p class="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow">${fullDescription}</p>`; } card.innerHTML = `<div class="p-5 flex-grow flex flex-col relative"><button class="favorite-btn absolute top-3 right-3 p-1 rounded-full bg-white/50 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-700/50 dark:hover:bg-gray-700/90" title="Gestionar favorito" data-key="${app.key}"><svg class="w-6 h-6 transition-colors duration-200 ${favClass}" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg></button><p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 pr-8">${app.plataforma || 'Sin plataforma'}</p><h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${app.titulo_app}</h3><p class="text-sm text-gray-500 dark:text-gray-400 mb-3">por <span class="font-medium">${createFilterLink(app.nombre_autor, 'nombre_autor')}</span></p>${descriptionHtml}<div class="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-auto"><p><strong>Nivel:</strong> ${app.nivel_educativo ? createFilterLink(app.nivel_educativo, 'nivel_educativo') : ''}</p><p><strong>Área:</strong> ${app.area_conocimiento ? createFilterLink(app.area_conocimiento, 'area_conocimiento') : ''}</p><p><strong>Licencia:</strong> ${app.licencia || ''}</p></div></div><div class="p-4 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex flex-wrap mb-3 min-h-[2rem]">${app.palabras_clave?.split(',').filter(k => k.trim()).map(k => `<span class="keyword-tag ${activeFilters.palabras_clave.has(k.trim()) ? 'active' : ''} bg-sky-100 text-sky-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full dark:bg-sky-900 dark:text-sky-300" data-keyword="${k.trim()}">${k.trim()}</span>`).join('') || ''}</div><a href="${app.url_app}" target="_blank" class="block w-full text-center bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors">Visitar Aplicación</a></div>`; return card; }
    
    function openDeleteCategoryModal(categoryName) { categoryToDelete = categoryName; elements.deleteCategoryConfirmText.innerHTML = `Se borrará la categoría "<strong>${categoryName}</strong>" y todas sus aplicaciones. Esta acción no se puede deshacer.`; elements.deleteCategoryModal.classList.remove('hidden'); }
    function closeDeleteCategoryModal() { elements.deleteCategoryModal.classList.add('hidden'); categoryToDelete = null; }
    function confirmDeleteCategory() { if (categoryToDelete && categoryToDelete !== 'General') { delete favorites[categoryToDelete]; if (activeFavoriteTab === categoryToDelete) { activeFavoriteTab = 'General'; } finishFavoriteUpdate(); } closeDeleteCategoryModal(); }
    function finishFavoriteUpdate() { saveFavorites(); applyAndDisplay(); closeCategoryModal(); }
    
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
    
        const deleteCutoff = new Map();
    
        mappedData.forEach(app => {
            if (normalizeString(app.eliminar_registro) === 'si' && app.url_app) {
                const url = app.url_app.trim();
                const ts = new Date(app.timestamp).getTime();
                const prev = deleteCutoff.get(url) ?? -Infinity;
                if (ts > prev) deleteCutoff.set(url, ts);
            }
        });
    
        const appsWithoutDeleted = mappedData.filter(app => {
            if (!app.url_app) return true;
            const cut = deleteCutoff.get(app.url_app.trim());
            if (cut === undefined) return true;
            return new Date(app.timestamp).getTime() > cut;
        });
    
        const validApps = appsWithoutDeleted.filter(app => {
            if (REQUIRED_FIELDS.some(field => !app[field])) return false;
            try {
                new URL(app.url_app);
                return true;
            } catch (_) {
                return false;
            }
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

    function setupFilters(apps) { const filterCategories = [ { id: 'area_conocimiento', name: 'Área de Conocimiento', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>' }, { id: 'nivel_educativo', name: 'Nivel Educativo', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.7.9 3.2 2.3 4.1"/><path d="M16 17a3 3 0 0 0-3-3 3 3 0 0 0-3 3v2h6v-2Z"/></svg>' }, { id: 'tipo_recurso', name: 'Tipo de Recurso', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.28 2.22a2.22 2.22 0 0 0-3.14 0l-12 12a2.22 2.22 0 0 0 0 3.14l3.14 3.14a2.22 2.22 0 0 0 3.14 0l12-12a2.22 2.22 0 0 0 0-3.14Z"/><path d="m14 7 3 3"/><path d="M5.5 16.5 10 12"/></svg>' }, { id: 'plataforma', name: 'Plataforma', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'}, { id: 'nombre_autor', name: 'Autor/a', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}, ]; filterCategories.forEach(cat => { const values = new Set(apps.flatMap(app => app[cat.id]?.split(',') || []).map(v => v.trim()).filter(Boolean)); if (values.size === 0) return; const sortedValues = Array.from(values).sort((a,b) => a.localeCompare(b, 'es', { sensitivity: 'base' })); const details = document.createElement('details'); details.className = 'border-b border-gray-200 last:border-b-0 pb-4 dark:border-gray-700'; details.innerHTML = `<summary class="flex justify-between items-center cursor-pointer py-2"><div class="flex items-center gap-3"><span class="text-gray-500 dark:text-gray-400">${cat.icon}</span><span class="font-semibold text-gray-800 dark:text-gray-200">${cat.name}</span></div><span class="arrow transition-transform text-gray-500 dark:text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></span></summary><div class="pt-3 flex flex-wrap gap-2" data-category="${cat.id}">${sortedValues.map(value => `<button class="filter-btn text-sm font-medium py-1.5 px-3 rounded-full" data-filter="${value}">${value}</button>`).join('')}</div>`; elements.filtersContainer.appendChild(details); }); }
    
    // --- FUNCIÓN MEJORADA ---
    function getPlatformStyle(platform) {
        const STYLES = {
            'Gemini': 'border-purple-500 dark:border-purple-400',
            'Claude': 'border-orange-500 dark:border-orange-400',
            'ChatGPT': 'border-teal-500 dark:border-teal-400',
            'Web (HTML/JS propio)': 'border-blue-500 dark:border-blue-400',
            'GitHub Pages': 'border-black dark:border-gray-200',
            'Google Sites': 'border-sky-500 dark:border-sky-400',
            'Default': 'border-gray-400 dark:border-gray-500'
        };
        if (!platform) return STYLES.Default;
        const key = Object.keys(STYLES).find(k => platform.includes(k) && k !== 'Default');
        return STYLES[key] || STYLES.Default;
    }

    function setupPagination(totalItems) { elements.paginationContainer.innerHTML = ''; const effectiveItemsPerPage = itemsPerPage === 'all' ? totalItems : parseInt(itemsPerPage); if (totalItems <= effectiveItemsPerPage) return; const totalPages = Math.ceil(totalItems / effectiveItemsPerPage); const prevButton = document.createElement('button'); prevButton.textContent = 'Anterior'; prevButton.className = 'pagination-btn'; prevButton.disabled = currentPage === 1; prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; applyAndDisplay(); window.scrollTo(0, 0); } }); elements.paginationContainer.appendChild(prevButton); const pageInfo = document.createElement('span'); pageInfo.textContent = `Página ${currentPage} de ${totalPages}`; pageInfo.className = 'dark:text-gray-400'; elements.paginationContainer.appendChild(pageInfo); const nextButton = document.createElement('button'); nextButton.textContent = 'Siguiente'; nextButton.className = 'pagination-btn'; nextButton.disabled = currentPage === totalPages; nextButton.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; applyAndDisplay(); window.scrollTo(0, 0); } }); elements.paginationContainer.appendChild(nextButton); }
    function createFilterLink(text, category) { return text.split(',').map(v => v.trim()).filter(Boolean).map(val => `<a href="#" class="filter-link" data-category="${category}" data-filter="${val}">${val}</a>`).join(', '); }
    function updateControls() { elements.activeFiltersDisplay.innerHTML = ''; let hasActiveFilter = false; Object.entries(activeFilters).forEach(([category, filterSet]) => { if(filterSet.size === 0) return; hasActiveFilter = true; const catName = document.querySelector(`[data-category="${category}"]`)?.closest('details')?.querySelector('.font-semibold')?.textContent || 'Palabra Clave'; filterSet.forEach(filterValue => { const tag = document.createElement('div'); tag.className = 'flex items-center bg-gray-200 text-gray-800 text-sm font-medium pl-3 pr-2 py-1 rounded-full dark:bg-gray-600 dark:text-gray-200'; tag.innerHTML = `<span>${catName}: ${filterValue}</span><button class="ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white" data-category="${category}" data-filter="${filterValue}" title="Eliminar filtro">&times;</button>`; elements.activeFiltersDisplay.appendChild(tag); }); }); const totalFavorites = getTotalFavoritesCount(); const hasSearchText = elements.searchInput.value.length > 0; const showFilterActions = hasActiveFilter || hasSearchText; const showFavoriteActions = showingFavoritesOnly && totalFavorites > 0; const showActionsBar = showFilterActions || showFavoriteActions; elements.actionsBar.classList.toggle('hidden', !showActionsBar); elements.actionsBar.parentElement.classList.toggle('justify-between', showActionsBar); elements.actionsBar.parentElement.classList.toggle('justify-end', !showActionsBar); if (showActionsBar) { elements.shareUrlBtn.classList.toggle('hidden', !showFilterActions); elements.clearAllBtn.classList.toggle('hidden', !showFilterActions); elements.clearFavoritesBtn.classList.toggle('hidden', !showFavoriteActions); } }
    function resetAllFilters(options = {}) { currentPage = 1; if (!options.preserveSearch) { elements.searchInput.value = ''; elements.clearSearchBtn.classList.add('hidden'); } for (const category in activeFilters) activeFilters[category].clear(); document.querySelectorAll('.filter-btn.active').forEach(btn => btn.classList.remove('active')); elements.filtersContainer.querySelectorAll('details').forEach(d => { d.open = false; }); showingFavoritesOnly = false; elements.toggleFavoritesBtn.classList.remove('active'); applyAndDisplay(); }
    
    function clearAllFavorites() {
        if (getTotalFavoritesCount() > 0) {
            if (confirm("¿Estás seguro de que quieres borrar TODAS las categorías y marcadores de favoritos? Esta acción no se puede deshacer.")) {
                currentPage = 1;
                favorites = { "General": [] };
                activeFavoriteTab = 'General';
                saveFavorites();
                applyAndDisplay();
            }
        }
    }

    const paramMapping = { subject: 'area_conocimiento', level: 'nivel_educativo', type: 'tipo_recurso', platform: 'plataforma', author: 'nombre_autor', keyword: 'palabras_clave', search: 'search', fav_category: 'fav_category' }; function generateShareableURL(type = 'filters', value = '') { const params = new URLSearchParams(); if (type === 'category' && value && favorites[value]) { params.set('fav_category', value); params.set('ids', favorites[value].join(',')); } else { const reverseMapping = Object.fromEntries(Object.entries(paramMapping).map(a => a.reverse())); if (elements.searchInput.value) params.set('search', elements.searchInput.value); for (const category in activeFilters) { if (activeFilters[category].size > 0) { const paramName = reverseMapping[category]; if (paramName) params.set(paramName, [...activeFilters[category]].join(',')); } } } return `${window.location.origin}${window.location.pathname}?${params.toString()}`; }
    function copyToClipboard(text) { if (!text) return; navigator.clipboard.writeText(text).then(() => { const msg = document.getElementById('copy-confirm-msg'); msg.classList.remove('opacity-0', '-translate-y-5'); setTimeout(() => msg.classList.add('opacity-0', '-translate-y-5'), 2000); }); }
    function applyUrlParams() { const params = new URLSearchParams(window.location.search); const ids = params.get('ids'); const favCategory = params.get('fav_category'); if (ids) { isCustomView = true; const sharedKeys = new Set(ids.split(',')); const sharedApps = allApps.filter(app => sharedKeys.has(app.key)); elements.searchInput.disabled = true; elements.toggleFiltersBtn.disabled = true; elements.toggleFavoritesBtn.disabled = true; elements.filterPanel.classList.add('hidden'); elements.itemsPerPageSelector.disabled = true; const message = favCategory ? `Estás viendo la categoría de favoritos "<strong>${favCategory}</strong>".` : `Estás viendo una colección personalizada de <strong>${sharedApps.length}</strong> aplicaciones.`; elements.customViewMsg.innerHTML = `${message} <button id="exit-custom-view" class="font-bold underline ml-2 hover:text-blue-600 dark:hover:text-blue-400">Ver todas</button>`; elements.customViewMsg.classList.remove('hidden'); document.getElementById('exit-custom-view').addEventListener('click', () => { window.location.href = window.location.pathname; }); elements.appsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'; renderAppGrid(sharedApps); elements.resultsCounter.textContent = `Mostrando una colección de ${sharedApps.length} aplicaciones.`; } else { isCustomView = false; applyFiltersFromURL(); applyAndDisplay(); } }
    function applyFiltersFromURL() { const params = new URLSearchParams(window.location.search); params.forEach((value, key) => { const category = paramMapping[key.toLowerCase()]; if (!category) return; const valuesFromUrl = value.split(','); if (category === 'search') { elements.searchInput.value = value; elements.clearSearchBtn.classList.toggle('hidden', !elements.searchInput.value); } else if (activeFilters[category]) { valuesFromUrl.forEach(urlVal => { activeFilters[category].add(urlVal); const normalized = normalizeString(urlVal); document.querySelectorAll(`[data-category="${category}"] .filter-btn`).forEach(btn => { if (normalizeString(btn.dataset.filter).includes(normalized)) btn.classList.add('active'); }); }); } }); }
    function applyAndDisplay() { const searchText = normalizeString(elements.searchInput.value); let appsToFilter = allApps; if (showingFavoritesOnly) { const favoriteKeys = new Set(Object.values(favorites).flat()); appsToFilter = allApps.filter(app => favoriteKeys.has(app.key)); } const filteredApps = appsToFilter.filter(app => { if (searchText && !normalizeString(Object.values(app).join(' ')).includes(searchText)) { return false; } for (const category in activeFilters) { const selectedFilters = activeFilters[category]; if (selectedFilters.size === 0) continue; const appValuesRaw = app[category] || ''; if (!appValuesRaw) return false; const appValues = appValuesRaw.split(',').map(v => v.trim()); const hasMatch = appValues.some(appVal => [...selectedFilters].some(filterVal => normalizeString(appVal) === normalizeString(filterVal)) ); if (!hasMatch) return false; } return true; }); displayApps(filteredApps); updateControls(); }
    function openCategoryModal(appKey) { currentAppKeyForModal = appKey; const app = allApps.find(a => a.key === appKey); if (!app) return; elements.categoryModalTitle.textContent = `Gestionar "${app.titulo_app}"`; elements.newCategoryInput.value = ''; elements.categoryModalError.classList.add('hidden'); elements.categorySelect.innerHTML = ''; const sortedCategories = Object.keys(favorites).sort((a,b) => a.localeCompare(b)); sortedCategories.forEach(cat => { const option = document.createElement('option'); option.value = cat; option.textContent = cat; elements.categorySelect.appendChild(option); }); const currentCategory = findCategoryForApp(appKey); if (currentCategory) { elements.categorySelect.value = currentCategory; elements.removeFavoriteBtn.classList.remove('hidden'); } else { elements.categorySelect.value = "General"; elements.removeFavoriteBtn.classList.add('hidden'); } elements.categoryModal.classList.remove('hidden'); }
    function closeCategoryModal() { elements.categoryModal.classList.add('hidden'); currentAppKeyForModal = null; }
    function saveFavoriteToCategory() { const newCategoryName = elements.newCategoryInput.value.trim(); let targetCategory = elements.categorySelect.value; if (newCategoryName) { const existingCategory = Object.keys(favorites).find(cat => cat.toLowerCase() === newCategoryName.toLowerCase()); if(existingCategory && existingCategory !== newCategoryName) { elements.categoryModalError.textContent = `La categoría "${existingCategory}" ya existe.`; elements.categoryModalError.classList.remove('hidden'); return; } targetCategory = newCategoryName; } if (!targetCategory) { elements.categoryModalError.textContent = 'Por favor, elige o crea un nombre de categoría válido.'; elements.categoryModalError.classList.remove('hidden'); return; } removeFavorite(currentAppKeyForModal, false); if (!favorites[targetCategory]) { favorites[targetCategory] = []; } if (!favorites[targetCategory].includes(currentAppKeyForModal)) { favorites[targetCategory].push(currentAppKeyForModal); } finishFavoriteUpdate(); }
    function removeFavorite(appKey, shouldUpdateUI = true) { const category = findCategoryForApp(appKey); if (category) { favorites[category] = favorites[category].filter(key => key !== appKey); if (shouldUpdateUI) { finishFavoriteUpdate(); } } }

    function setupEventListeners() {
        elements.toggleFiltersBtn.addEventListener('click', () => elements.filterPanel.classList.toggle('hidden'));
        elements.toggleFavoritesBtn.addEventListener('click', () => { showingFavoritesOnly = !showingFavoritesOnly; elements.toggleFavoritesBtn.classList.toggle('active'); currentPage = 1; if (showingFavoritesOnly) { const favCats = Object.keys(favorites); activeFavoriteTab = favCats.includes(activeFavoriteTab) ? activeFavoriteTab : 'General'; elements.filterPanel.classList.add('hidden'); elements.toggleFiltersBtn.classList.remove('active'); } applyAndDisplay(); });
        elements.appsContainer.addEventListener('click', e => { const favBtn = e.target.closest('.favorite-btn'); if (favBtn) { e.preventDefault(); openCategoryModal(favBtn.dataset.key); return; } const keywordTag = e.target.closest('.keyword-tag'); if (keywordTag) { e.preventDefault(); const keyword = keywordTag.dataset.keyword; currentPage = 1; if (activeFilters.palabras_clave.has(keyword)) { activeFilters.palabras_clave.delete(keyword); } else { activeFilters.palabras_clave.add(keyword); } applyAndDisplay(); return; } const filterLink = e.target.closest('.filter-link'); if (filterLink) { e.preventDefault(); const { category, filter } = filterLink.dataset; const correspondingButton = document.querySelector(`#filters-container [data-category='${category}'] [data-filter='${filter}']`); if (correspondingButton) { currentPage = 1; correspondingButton.click(); } } const target = e.target; if (target.classList.contains('read-more') || target.classList.contains('read-less')) { e.preventDefault(); const container = target.closest('.description-container'); container.querySelector('.short-desc').classList.toggle('hidden'); container.querySelector('.long-desc').classList.toggle('hidden'); } });
        elements.searchInput.addEventListener('input', () => { elements.clearSearchBtn.classList.toggle('hidden', !elements.searchInput.value); currentPage = 1; applyAndDisplay(); });
        elements.clearSearchBtn.addEventListener('click', () => { elements.searchInput.value = ''; elements.clearSearchBtn.classList.add('hidden'); currentPage = 1; applyAndDisplay(); elements.searchInput.focus(); });
        elements.itemsPerPageSelector.addEventListener('change', (e) => { const value = e.target.value; itemsPerPage = value === 'all' ? 'all' : parseInt(value, 10); localStorage.setItem('itemsPerPagePref', value); currentPage = 1; applyAndDisplay(); });
        elements.filtersContainer.addEventListener('click', e => { const target = e.target.closest('button.filter-btn'); if (!target) return; const category = target.parentElement.dataset.category; const filter = target.dataset.filter; target.classList.toggle('active'); currentPage = 1; if (activeFilters[category].has(filter)) { activeFilters[category].delete(filter); } else { activeFilters[category].add(filter); } applyAndDisplay(); });
        elements.activeFiltersDisplay.addEventListener('click', e => { const target = e.target.closest('button'); if (!target) return; const { category, filter } = target.dataset; if (activeFilters[category] && activeFilters[category].has(filter)) { const correspondingButton = document.querySelector(`#filters-container [data-category='${category}'] [data-filter='${filter}']`); if (correspondingButton) { currentPage = 1; correspondingButton.click(); } else { activeFilters[category].delete(filter); currentPage = 1; applyAndDisplay(); } } });
        document.getElementById('reset-filters-btn').addEventListener('click', () => resetAllFilters({ preserveSearch: true }));
        elements.clearAllBtn.addEventListener('click', () => resetAllFilters());
        elements.shareUrlBtn.addEventListener('click', () => copyToClipboard(generateShareableURL('filters')));
        elements.clearFavoritesBtn.addEventListener('click', clearAllFavorites);
        elements.saveCategoryBtn.addEventListener('click', saveFavoriteToCategory);
        elements.cancelCategoryBtn.addEventListener('click', closeCategoryModal);
        elements.removeFavoriteBtn.addEventListener('click', () => removeFavorite(currentAppKeyForModal));
        const helpBtn = document.getElementById('help-btn'); const helpModal = document.getElementById('help-modal'); const closeHelpBtn = document.getElementById('close-help-btn'); const helpFrame = document.getElementById('help-frame'); let helpFrameLoaded = false; helpBtn.addEventListener('click', () => { helpModal.classList.remove('hidden'); if (!helpFrameLoaded) { helpFrame.src = 'ayuda.html'; helpFrameLoaded = true; } }); closeHelpBtn.addEventListener('click', () => { helpModal.classList.add('hidden'); }); helpModal.addEventListener('click', e => { if (e.target.id === 'help-modal') { helpModal.classList.add('hidden'); } });
        elements.confirmDeleteCategoryBtn.addEventListener('click', confirmDeleteCategory);
        elements.cancelDeleteCategoryBtn.addEventListener('click', closeDeleteCategoryModal);
    }
    
    // --- Inicialización ---
    
    setupThemeManager();
    loadFavorites();

    Papa.parse(CSV_URL, {
        download: true, header: false, skipEmptyLines: true,
        complete: (results) => {
            elements.loadingMsg.style.display = 'none';
            allApps = processData(results.data);
            if(allApps.length > 0) {
                const savedItemsPerPage = localStorage.getItem('itemsPerPagePref') || '25';
                itemsPerPage = savedItemsPerPage === 'all' ? 'all' : parseInt(savedItemsPerPage, 10);
                elements.itemsPerPageSelector.value = savedItemsPerPage;
                setupFilters(allApps);
                setupEventListeners();
                applyUrlParams();
            } else {
                elements.noResultsMsg.classList.remove('hidden');
            }
        },
        error: (error) => {
            console.error("Error al cargar o parsear el CSV:", error);
            elements.loadingMsg.style.display = 'none';
            elements.errorMsg.classList.remove('hidden');
        }
    });

    const INTERVAL_MIN = 15; const lastPing = Number(localStorage.getItem('visit_ping') || 0); const now = Date.now(); if (now - lastPing > INTERVAL_MIN * 60 * 1000) { const img = new Image(); img.src = 'https://bilateria.org/vce/stats/contador.php?' + now; img.style.display = 'none'; document.body.appendChild(img); localStorage.setItem('visit_ping', now.toString()); } fetch('https://bilateria.org/vce/stats/total.php?' + now) .then(response => response.text()) .then(totalVisitas => { const visitBox = document.getElementById('visit-box'); if (!visitBox) return; const modal = document.getElementById('stats-modal'); const closeModalBtn = document.getElementById('modal-close-btn'); const modalIframe = document.getElementById('modal-iframe'); if (!modal || !closeModalBtn || !modalIframe) return; visitBox.innerHTML = ''; const statsLink = document.createElement('a'); statsLink.href = '#'; statsLink.textContent = `${totalVisitas.trim()} visitas desde el 1 de julio de 2025`; visitBox.appendChild(statsLink); statsLink.addEventListener('click', (event) => { event.preventDefault(); modalIframe.src = 'https://bilateria.org/vce/stats/stats.html'; modal.style.display = 'flex'; }); const closeModal = () => { modal.style.display = 'none'; modalIframe.src = 'about:blank'; }; closeModalBtn.addEventListener('click', closeModal); modal.addEventListener('click', (event) => { if (event.target === modal) { closeModal(); } }); }) .catch(() => { const visitBox = document.getElementById('visit-box'); if (visitBox) { visitBox.innerHTML = '–'; } });
});
