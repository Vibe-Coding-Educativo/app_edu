document.addEventListener('DOMContentLoaded', () => {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSj_hltRI4Q0QolINWJVcKxCMMjfpdiCkKzSdgp9d8RlGTdUU1UIKvaj-TBSkq0JQGneDhfUkSQuFzy/pub?output=csv';

    // --- State Variables ---
    let allApps = [];
    let favorites = { "General": [] };
    let showingFavoritesOnly = false;
    let isCustomView = false;
    let currentPage = 1;
    let itemsPerPage = 50;
    let activeFilters = {
        area_conocimiento: new Set(), nivel_educativo: new Set(),
        tipo_recurso: new Set(), plataforma: new Set(),
        nombre_autor: new Set(), palabras_clave: new Set(),
    };
    let currentAppKeyForModal = null;
    let activeFavoriteTab = 'General';
    let categoryToDelete = null; // Para la confirmación de borrado

    const REQUIRED_FIELDS = ['correo_autor', 'nombre_autor', 'titulo_app', 'url_app'];

    // --- DOM Elements ---
    const elements = {
        // ... (otros elementos)
        favoritesTabsContainer: document.getElementById('favorites-tabs-container'),
        categoryModal: document.getElementById('category-modal'),
        categoryModalTitle: document.getElementById('category-modal-title'),
        categorySelect: document.getElementById('category-select'),
        newCategoryInput: document.getElementById('new-category-input'),
        categoryModalError: document.getElementById('category-modal-error'),
        saveCategoryBtn: document.getElementById('save-category-btn'),
        cancelCategoryBtn: document.getElementById('cancel-category-btn'),
        removeFavoriteBtn: document.getElementById('remove-favorite-btn'),
        // Nuevos elementos del modal de eliminación
        deleteCategoryModal: document.getElementById('delete-category-modal'),
        deleteCategoryConfirmText: document.getElementById('delete-category-confirm-text'),
        confirmDeleteCategoryBtn: document.getElementById('confirm-delete-category-btn'),
        cancelDeleteCategoryBtn: document.getElementById('cancel-delete-category-btn'),
    };
    
    // El resto del script...
    // Las funciones de carga, guardado, etc. se mantienen igual.
    // La función clave modificada es `renderFavoriteTabsAndContent`.

    function renderFavoriteTabsAndContent(allFavoriteApps) {
        elements.favoritesTabsContainer.innerHTML = '';
        elements.appsContainer.innerHTML = '';
        setupPagination(0);

        const sortedCategories = Object.keys(favorites).sort((a,b) => a.localeCompare(b));
        const tabsList = document.createElement('div');
        tabsList.className = 'flex border-b border-gray-200 flex-wrap';
        
        sortedCategories.forEach(category => {
            if (favorites[category].length === 0 && category !== 'General') return;
            
            const tabButton = document.createElement('button');
            tabButton.className = 'fav-tab-btn flex items-center';
            tabButton.dataset.category = category;

            if (category === activeFavoriteTab) {
                tabButton.classList.add('active');
            }

            // Contenido del botón: Nombre, contador y botón de borrar (si aplica)
            let tabContent = `<span>${category} (${favorites[category].length})</span>`;
            if (category !== 'General') {
                tabContent += `<span class="delete-category-btn" title="Eliminar categoría '${category}'">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                               </span>`;
            }
            tabButton.innerHTML = tabContent;

            // Event listener para cambiar de pestaña
            tabButton.addEventListener('click', (e) => {
                // Asegurarse de no activar al hacer clic en el botón de borrar
                if (e.target.closest('.delete-category-btn')) return;
                activeFavoriteTab = category;
                renderFavoriteTabsAndContent(allFavoriteApps);
            });
            
            // Event listener para el botón de borrar
            const deleteBtn = tabButton.querySelector('.delete-category-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evita que se dispare el cambio de pestaña
                    openDeleteCategoryModal(category);
                });
            }

            tabsList.appendChild(tabButton);
        });
        elements.favoritesTabsContainer.appendChild(tabsList);

        // Renderizar el contenido de la pestaña activa...
        const activeCategoryHeader = document.createElement('div');
        activeCategoryHeader.className = 'flex justify-between items-center mt-4 mb-4';
        activeCategoryHeader.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800">${activeFavoriteTab}</h2>
            <button class="share-category-btn text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                Compartir esta categoría
            </button>`;
        
        elements.appsContainer.appendChild(activeCategoryHeader);
        
        activeCategoryHeader.querySelector('.share-category-btn').addEventListener('click', (e) => {
            e.preventDefault();
            copyToClipboard(generateShareableURL('category', activeFavoriteTab));
        });

        const appsInActiveCategory = allFavoriteApps.filter(app => (favorites[activeFavoriteTab] || []).includes(app.key));
        
        const categoryGrid = document.createElement('div');
        categoryGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
        appsInActiveCategory.forEach(app => {
            const card = createAppCard(app);
            categoryGrid.appendChild(card);
        });
        elements.appsContainer.appendChild(categoryGrid);
        elements.appsContainer.className = '';
    }

    // --- Nuevas funciones para el modal de borrado ---
    function openDeleteCategoryModal(categoryName) {
        categoryToDelete = categoryName;
        elements.deleteCategoryConfirmText.innerHTML = `Se borrará la categoría "<strong>${categoryName}</strong>" y todas sus aplicaciones. Esta acción no se puede deshacer.`;
        elements.deleteCategoryModal.classList.remove('hidden');
    }

    function closeDeleteCategoryModal() {
        elements.deleteCategoryModal.classList.add('hidden');
        categoryToDelete = null;
    }

    function confirmDeleteCategory() {
        if (categoryToDelete && categoryToDelete !== 'General') {
            delete favorites[categoryToDelete];
            // Si la categoría activa era la que se borró, cambiar a "General"
            if (activeFavoriteTab === categoryToDelete) {
                activeFavoriteTab = 'General';
            }
            finishFavoriteUpdate(); // Esta función ya guarda y refresca la UI
        }
        closeDeleteCategoryModal();
    }

    // --- En `setupEventListeners` añadir los listeners del nuevo modal ---
    function setupEventListeners() {
        // ... (todos los listeners anteriores)
        elements.confirmDeleteCategoryBtn.addEventListener('click', confirmDeleteCategory);
        elements.cancelDeleteCategoryBtn.addEventListener('click', closeDeleteCategoryModal);
    }

    function finishFavoriteUpdate() {
        saveFavorites();
        applyAndDisplay();
        closeCategoryModal();
    }
    
    // Aquí iría el resto del código JS que no ha cambiado.
    // Para que sea funcional, debes copiar todo el contenido del script.js 
    // de la respuesta anterior y solo modificar/añadir lo que se indica aquí.
    
    // Para completitud, se incluye el resto del script que es igual:
    function normalizeString(str) { if (!str) return ''; return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    function loadFavorites() { try { const storedFavorites = localStorage.getItem('educationalAppsFavorites'); if (storedFavorites) { const parsed = JSON.parse(storedFavorites); if (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) { favorites = parsed; if (!favorites["General"]) { favorites["General"] = []; } } else { if(Array.isArray(parsed)) { favorites = { "General": parsed }; saveFavorites(); } else { favorites = { "General": [] }; } } } } catch (e) { console.error("Error loading favorites from localStorage", e); favorites = { "General": [] }; } }
    function saveFavorites() { try { Object.keys(favorites).forEach(cat => { if (cat !== "General" && favorites[cat].length === 0) { delete favorites[cat]; } }); localStorage.setItem('educationalAppsFavorites', JSON.stringify(favorites)); } catch (e) { console.error("Error saving favorites to localStorage", e); } }
    function isFavorite(appKey) { return Object.values(favorites).some(arr => arr.includes(appKey)); }
    function findCategoryForApp(appKey) { return Object.keys(favorites).find(cat => favorites[cat].includes(appKey)); }
    function getTotalFavoritesCount() { return Object.values(favorites).reduce((sum, arr) => sum + arr.length, 0); }
    function displayApps(apps) { const totalFavorites = getTotalFavoritesCount(); elements.noResultsMsg.classList.toggle('hidden', apps.length > 0 || (showingFavoritesOnly && totalFavorites === 0) || isCustomView); elements.noFavoritesMsg.classList.toggle('hidden', !showingFavoritesOnly || apps.length > 0 || totalFavorites > 0 || isCustomView); if (showingFavoritesOnly) { elements.favoritesTabsContainer.classList.remove('hidden'); renderFavoriteTabsAndContent(apps); } else { elements.favoritesTabsContainer.classList.add('hidden'); elements.appsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'; renderAppGrid(apps); } if (!isCustomView) { elements.resultsCounter.textContent = `Mostrando ${apps.length} de ${allApps.length} aplicaciones.`; } }
    function renderAppGrid(appsToRender, container = elements.appsContainer) { container.innerHTML = ''; const effectiveItemsPerPage = itemsPerPage === 'all' ? appsToRender.length : parseInt(itemsPerPage); const startIndex = (currentPage - 1) * effectiveItemsPerPage; const endIndex = startIndex + effectiveItemsPerPage; const paginatedApps = appsToRender.slice(startIndex, endIndex); paginatedApps.forEach(app => { const card = createAppCard(app); container.appendChild(card); }); if (container === elements.appsContainer) { setupPagination(appsToRender.length); } }
    function createAppCard(app) { const card = document.createElement('div'); card.className = `card bg-white rounded-lg shadow-sm overflow-hidden flex flex-col ${getPlatformStyle(app.plataforma)}`; const isFav = isFavorite(app.key); const favClass = isFav ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'; const fullDescription = app.descripcion_app || 'No hay descripción.'; let descriptionHtml; if (fullDescription.length > 350) { const shortDescription = fullDescription.substring(0, 350).trim(); descriptionHtml = `<div class="description-container text-gray-600 text-sm mb-4 flex-grow"><p class="short-desc">${shortDescription}... <a href="#" class="read-more font-semibold text-blue-600 hover:underline">más</a></p><p class="long-desc hidden">${fullDescription} <a href="#" class="read-less font-semibold text-blue-600 hover:underline">menos</a></p></div>`; } else { descriptionHtml = `<p class="text-gray-600 text-sm mb-4 flex-grow">${fullDescription}</p>`; } card.innerHTML = `<div class="p-5 flex-grow flex flex-col relative"><button class="favorite-btn absolute top-3 right-3 p-1 rounded-full bg-white/50 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-red-400" title="Gestionar favorito" data-key="${app.key}"><svg class="w-6 h-6 transition-colors duration-200 ${favClass}" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg></button><p class="text-sm font-semibold text-gray-600 mb-3 pr-8">${app.plataforma || 'Sin plataforma'}</p><h3 class="text-xl font-bold text-gray-900 mb-2">${app.titulo_app}</h3><p class="text-sm text-gray-500 mb-3">por <span class="font-medium">${createFilterLink(app.nombre_autor, 'nombre_autor')}</span></p>${descriptionHtml}<div class="text-xs text-gray-500 space-y-1 mt-auto">${app.nivel_educativo ? `<p><strong>Nivel:</strong> ${createFilterLink(app.nivel_educativo, 'nivel_educativo')}</p>` : ''}${app.area_conocimiento ? `<p><strong>Área:</strong> ${createFilterLink(app.area_conocimiento, 'area_conocimiento')}</p>` : ''}${app.licencia ? `<p><strong>Licencia:</strong> ${app.licencia}</p>` : ''}</div></div><div class="p-4 border-t border-gray-200 bg-gray-50"><div class="flex flex-wrap mb-3 min-h-[2rem]">${app.palabras_clave?.split(',').filter(k => k.trim()).map(k => `<span class="keyword-tag ${activeFilters.palabras_clave.has(k.trim()) ? 'active' : ''} bg-sky-100 text-sky-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full" data-keyword="${k.trim()}">${k.trim()}</span>`).join('') || ''}</div><a href="${app.url_app}" target="_blank" class="block w-full text-center bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors">Visitar Aplicación</a></div>`; return card; }
    const paramMapping = { subject: 'area_conocimiento', level: 'nivel_educativo', type: 'tipo_recurso', platform: 'plataforma', author: 'nombre_autor', keyword: 'palabras_clave', search: 'search', fav_category: 'fav_category' }; function generateShareableURL(type = 'filters', value = '') { const params = new URLSearchParams(); if (type === 'category' && value && favorites[value]) { params.set('fav_category', value); params.set('ids', favorites[value].join(',')); } else { const reverseMapping = Object.fromEntries(Object.entries(paramMapping).map(a => a.reverse())); if (elements.searchInput.value) params.set('search', elements.searchInput.value); for (const category in activeFilters) { if (activeFilters[category].size > 0) { const paramName = reverseMapping[category]; if (paramName) params.set(paramName, [...activeFilters[category]].join(',')); } } } return `${window.location.origin}${window.location.pathname}?${params.toString()}`; }
    function applyUrlParams() { const params = new URLSearchParams(window.location.search); const ids = params.get('ids'); const favCategory = params.get('fav_category'); if (ids) { isCustomView = true; const sharedKeys = new Set(ids.split(',')); const sharedApps = allApps.filter(app => sharedKeys.has(app.key)); elements.searchInput.disabled = true; elements.toggleFiltersBtn.disabled = true; elements.toggleFavoritesBtn.disabled = true; elements.filterPanel.classList.add('hidden'); elements.itemsPerPageSelector.disabled = true; const message = favCategory ? `Estás viendo la categoría de favoritos "<strong>${favCategory}</strong>".` : `Estás viendo una colección personalizada de <strong>${sharedApps.length}</strong> aplicaciones.`; elements.customViewMsg.innerHTML = `${message} <button id="exit-custom-view" class="font-bold underline ml-2 hover:text-blue-600">Ver todas</button>`; elements.customViewMsg.classList.remove('hidden'); document.getElementById('exit-custom-view').addEventListener('click', () => { window.location.href = window.location.pathname; }); elements.appsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'; renderAppGrid(sharedApps); elements.resultsCounter.textContent = `Mostrando una colección de ${sharedApps.length} aplicaciones.`; } else { isCustomView = false; applyFiltersFromURL(); applyAndDisplay(); } }
    function applyAndDisplay() { const searchText = normalizeString(elements.searchInput.value); let appsToFilter = allApps; if (showingFavoritesOnly) { const favoriteKeys = new Set(Object.values(favorites).flat()); appsToFilter = allApps.filter(app => favoriteKeys.has(app.key)); } const filteredApps = appsToFilter.filter(app => { if (searchText && !normalizeString(Object.values(app).join(' ')).includes(searchText)) { return false; } for (const category in activeFilters) { const selectedFilters = activeFilters[category]; if (selectedFilters.size === 0) continue; const appValuesRaw = app[category] || ''; if (!appValuesRaw) return false; const appValues = appValuesRaw.split(',').map(v => v.trim()); const hasMatch = appValues.some(appVal => [...selectedFilters].some(filterVal => normalizeString(appVal) === normalizeString(filterVal)) ); if (!hasMatch) return false; } return true; }); displayApps(filteredApps); updateControls(); }
    
    // El código restante, ya sea modificado o no, se pega aquí para asegurar que todo funcione
    // ...
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
});
