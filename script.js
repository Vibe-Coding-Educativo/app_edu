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
        tipo_recurso: new Set(),
        idiomas_app: new Set(),
        nombre_autor: new Set(), palabras_clave: new Set(),
    };
    let currentAppKeyForModal = null;
    let activeFavoriteTab = 'General';
    let categoryToDelete = null;
    let allAppKeys = new Set();

    const REQUIRED_FIELDS = ['correo_autor', 'nombre_autor', 'titulo_app', 'url_app'];

    // --- i18n ---
    const SUPPORTED_LANGS = ['es','ca','gl','eu','en'];
    const translations = { /* filled below */ };
    Object.assign(translations, {
        es: {
            app_title: 'Repositorio de aplicaciones educativas',
            header_subtitle_html: "Una colección de aplicaciones y recursos educativos creados por la comunidad <a href='https://vibe-coding-educativo.github.io' target='_blank' class='text-blue-600 hover:underline font-semibold dark:text-blue-400 dark:hover:text-blue-300'>Vibe Coding Educativo</a>.",
            search_label: 'Búsqueda libre',
            search_placeholder: 'Buscar por todos los campos...',
            clear_search_title: 'Limpiar búsqueda',
            btn_favorites: 'Favoritos',
            btn_favorites_title: 'Mostrar solo favoritos',
            btn_filters: 'Filtros',
            btn_filters_title: 'Mostrar/ocultar filtros',
            btn_help_title: 'Ayuda',
            reset_filters: 'Limpiar Filtros',
            apply_filters: 'Aplicar filtros',
            items_per_page_label: 'Mostrar:',
            items_per_page_all: 'Todas',
            loading_text: 'Cargando aplicaciones...',
            error_text: 'No se pudieron cargar los datos.',
            no_results: 'No se encontraron aplicaciones.',
            no_favorites_html: "No tienes aplicaciones favoritas.<br><span class='text-sm'>Haz clic en el corazón de una aplicación para añadirla.</span>",
            category_manage_title: 'Gestionar Favorito',
            category_modal_manage: 'Gestionar "{title}"',
            label_category_select: 'Elige una categoría',
            label_new_category: 'O crea una nueva',
            new_category_placeholder: 'Ej: Matemáticas, Biología...',
            remove_favorite: 'Quitar de Favoritos',
            cancel: 'Cancelar',
            save: 'Guardar',
            delete_category_title: '¿Eliminar categoría?',
            delete_category_confirm_html: 'Se borrará la categoría "<strong>{category}</strong>" y todas sus aplicaciones. Esta acción no se puede deshacer.',
            confirm_delete_category: 'Sí, eliminar',
            results_counter: 'Mostrando {n} de {total} aplicaciones.',
            custom_view_fav_category: 'Estás viendo la categoría de favoritos "<strong>{fav}</strong>".',
            custom_view_collection: 'Estás viendo una colección personalizada de <strong>{count}</strong> aplicaciones.',
            view_all: 'Ver todas',
            read_more: 'más',
            read_less: 'menos',
            no_description: 'No hay descripción.',
            manage_favorite_title: 'Gestionar favorito',
            no_platform: 'Sin plataforma',
            by: 'por',
            level_label: 'Nivel:',
            area_label: 'Área:',
            visit_app: 'Visitar Aplicación',
            pagination_prev: 'Anterior',
            pagination_next: 'Siguiente',
            pagination_page: 'Página {current} de {total}',
            share_filters: 'Compartir Filtros',
            share_category: 'Compartir esta categoría',
            clear_favorites: 'Limpiar Favoritos',
            clear_all: 'Limpiar todo',
            copy_confirm: '¡URL copiada al portapapeles!',
            visits_since: '{count} visitas desde el 1 de julio de 2025',
            help_title: 'Ayuda',
            stats_panel_title: 'Panel de Estadísticas',
            filters_area: 'Área de Conocimiento',
            filters_level: 'Nivel Educativo',
            filters_type: 'Tipo de Recurso',
            filters_platform: 'Plataforma',
            filters_language: 'Idioma de la app',
            filters_author: 'Autor/a',
            language_label: 'Idioma(s):'
        },
        ca: {
            app_title: "Repositori d'aplicacions educatives",
            header_subtitle_html: "Una col·lecció d'aplicacions i recursos educatius creats per la comunitat <a href='https://vibe-coding-educativo.github.io' target='_blank' class='text-blue-600 hover:underline font-semibold dark:text-blue-400 dark:hover:text-blue-300'>Vibe Coding Educativo</a>.",
            search_label: 'Cerca lliure',
            search_placeholder: 'Cerca a tots els camps...',
            clear_search_title: 'Neteja la cerca',
            btn_favorites: 'Preferits',
            btn_favorites_title: 'Mostra només preferits',
            btn_filters: 'Filtres',
            btn_filters_title: 'Mostra/amaga filtres',
            btn_help_title: 'Ajuda',
            reset_filters: 'Neteja filtres',
            apply_filters: 'Aplica filtres',
            items_per_page_label: 'Mostra:',
            items_per_page_all: 'Totes',
            loading_text: 'Carregant aplicacions...',
            error_text: "No s'han pogut carregar les dades.",
            no_results: "No s'han trobat aplicacions.",
            no_favorites_html: "No tens aplicacions preferides.<br><span class='text-sm'>Fes clic al cor d'una aplicació per afegir-la.</span>",
            category_manage_title: 'Gestiona Preferit',
            category_modal_manage: 'Gestionar "{title}"',
            label_category_select: 'Tria una categoria',
            label_new_category: 'O crea una de nova',
            new_category_placeholder: 'Ex: Matemàtiques, Biologia...',
            remove_favorite: 'Treu dels preferits',
            cancel: 'Cancel·la',
            save: 'Desa',
            delete_category_title: 'Eliminar categoria?',
            delete_category_confirm_html: 'S\'esborrarà la categoria "<strong>{category}</strong>" i totes les seves aplicacions. Aquesta acció no es pot desfer.',
            confirm_delete_category: 'Sí, eliminar',
            results_counter: 'Mostrant {n} de {total} aplicacions.',
            custom_view_fav_category: 'Estàs veient la categoria de preferits "<strong>{fav}</strong>".',
            custom_view_collection: 'Estàs veient una col·lecció personalitzada de <strong>{count}</strong> aplicacions.',
            view_all: 'Veure-ho tot',
            read_more: 'més',
            read_less: 'menys',
            no_description: 'Sense descripció.',
            manage_favorite_title: 'Gestiona preferit',
            no_platform: 'Sense plataforma',
            by: 'per',
            level_label: 'Nivell:',
            area_label: 'Àrea:',
            visit_app: 'Visitar aplicació',
            pagination_prev: 'Anterior',
            pagination_next: 'Següent',
            pagination_page: 'Pàgina {current} de {total}',
            share_filters: 'Compartir filtres',
            share_category: 'Comparteix aquesta categoria',
            clear_favorites: 'Netejar preferits',
            clear_all: 'Netejar tot',
            copy_confirm: 'URL copiada al porta-retalls!',
            visits_since: '{count} visites des del 1 de juliol de 2025',
            help_title: 'Ajuda',
            stats_panel_title: 'Panell d\'estadístiques',
            filters_area: 'Àrea de Coneixement',
            filters_level: 'Nivell educatiu',
            filters_type: 'Tipus de recurs',
            filters_platform: 'Plataforma',
            filters_language: "Idioma de l’app",
            filters_author: 'Autor/a',
            language_label: 'Idioma(es):'
        },
        gl: {
            app_title: 'Repositorio de aplicacións educativas',
            header_subtitle_html: "Unha colección de aplicacións e recursos educativos creados pola comunidade <a href='https://vibe-coding-educativo.github.io' target='_blank' class='text-blue-600 hover:underline font-semibold dark:text-blue-400 dark:hover:text-blue-300'>Vibe Coding Educativo</a>.",
            search_label: 'Busca libre',
            search_placeholder: 'Buscar en todos os campos...',
            clear_search_title: 'Limpar busca',
            btn_favorites: 'Favoritas',
            btn_favorites_title: 'Amosar só favoritas',
            btn_filters: 'Filtros',
            btn_filters_title: 'Amosar/agochar filtros',
            btn_help_title: 'Axuda',
            reset_filters: 'Limpar filtros',
            apply_filters: 'Aplicar filtros',
            items_per_page_label: 'Amosar:',
            items_per_page_all: 'Todas',
            loading_text: 'Cargando aplicacións...',
            error_text: 'Non se puideron cargar os datos.',
            no_results: 'Non se atoparon aplicacións.',
            no_favorites_html: "Non tes aplicacións favoritas.<br><span class='text-sm'>Fai clic no corazón dunha aplicación para engadila.</span>",
            category_manage_title: 'Xestionar favorito',
            category_modal_manage: 'Xestionar "{title}"',
            label_category_select: 'Escolle unha categoría',
            label_new_category: 'Ou crea unha nova',
            new_category_placeholder: 'Ex: Matemáticas, Bioloxía...',
            remove_favorite: 'Quitar de favoritos',
            cancel: 'Cancelar',
            save: 'Gardar',
            delete_category_title: 'Eliminar categoría?',
            delete_category_confirm_html: 'Eliminarase a categoría "<strong>{category}</strong>" e todas as súas aplicacións. Esta acción non se pode desfacer.',
            confirm_delete_category: 'Si, eliminar',
            results_counter: 'Amosando {n} de {total} aplicacións.',
            custom_view_fav_category: 'Estás vendo a categoría de favoritos "<strong>{fav}</strong>".',
            custom_view_collection: 'Estás vendo unha colección personalizada de <strong>{count}</strong> aplicacións.',
            view_all: 'Ver todo',
            read_more: 'máis',
            read_less: 'menos',
            no_description: 'Sen descrición.',
            manage_favorite_title: 'Xestionar favorito',
            no_platform: 'Sen plataforma',
            by: 'por',
            level_label: 'Nivel:',
            area_label: 'Área:',
            visit_app: 'Visitar aplicación',
            pagination_prev: 'Anterior',
            pagination_next: 'Seguinte',
            pagination_page: 'Páxina {current} de {total}',
            share_filters: 'Compartir filtros',
            share_category: 'Compartir esta categoría',
            clear_favorites: 'Limpar favoritos',
            clear_all: 'Limpar todo',
            copy_confirm: 'URL copiada ao portapapeis!',
            visits_since: '{count} visitas dende o 1 de xullo de 2025',
            help_title: 'Axuda',
            stats_panel_title: 'Panel de estatísticas',
            filters_area: 'Área de Coñecemento',
            filters_level: 'Nivel educativo',
            filters_type: 'Tipo de recurso',
            filters_platform: 'Plataforma',
            filters_language: 'Idioma da app',
            filters_author: 'Autor/a',
            language_label: 'Idioma(s):'
        },
        eu: {
            app_title: 'Hezkuntza aplikazioen biltegia',
            header_subtitle_html: "Komunitateak sortutako hezkuntza aplikazio eta baliabideen bilduma <a href='https://vibe-coding-educativo.github.io' target='_blank' class='text-blue-600 hover:underline font-semibold dark:text-blue-400 dark:hover:text-blue-300'>Vibe Coding Educativo</a>.",
            search_label: 'Bilaketa askea',
            search_placeholder: 'Eremu guztietan bilatu...',
            clear_search_title: 'Bilaketa garbitu',
            btn_favorites: 'Gogokoak',
            btn_favorites_title: 'Gogokoak bakarrik erakutsi',
            btn_filters: 'Iragazkiak',
            btn_filters_title: 'Iragazkiak erakutsi/ezkutatu',
            btn_help_title: 'Laguntza',
            reset_filters: 'Iragazkiak garbitu',
            apply_filters: 'Iragazkiak aplikatu',
            items_per_page_label: 'Erakutsi:',
            items_per_page_all: 'Guztiak',
            loading_text: 'Aplikazioak kargatzen...',
            error_text: 'Datuak ezin izan dira kargatu.',
            no_results: 'Ez da aplikaziorik aurkitu.',
            no_favorites_html: "Ez dituzu gogoko aplikazioak.<br><span class='text-sm'>Egin klik bihotzean aplikazioa gehitzeko.</span>",
            category_manage_title: 'Gogokoa kudeatu',
            category_modal_manage: '"{title}" kudeatu',
            label_category_select: 'Kategoria aukeratu',
            label_new_category: 'Edo sortu berri bat',
            new_category_placeholder: 'Adib.: Matematika, Biologia...',
            remove_favorite: 'Gogokoetatik kendu',
            cancel: 'Utzi',
            save: 'Gorde',
            delete_category_title: 'Kategoria ezabatu?',
            delete_category_confirm_html: '"<strong>{category}</strong>" kategoria eta bere aplikazio guztiak ezabatuko dira. Ekintza hau ezin da desegin.',
            confirm_delete_category: 'Bai, ezabatu',
            results_counter: '{n} / {total} aplikazio erakusten.',
            custom_view_fav_category: 'Gogokoen kategoria ikusten ari zara: "<strong>{fav}</strong>".',
            custom_view_collection: 'Pertsonalizatutako bilduma bat ikusten ari zara: <strong>{count}</strong> aplikazio.',
            view_all: 'Guztiak ikusi',
            read_more: 'gehiago',
            read_less: 'gutxiago',
            no_description: 'Azalpenik ez.',
            manage_favorite_title: 'Gogokoa kudeatu',
            no_platform: 'Plataformarik gabe',
            by: 'egilea',
            level_label: 'Maila:',
            area_label: 'Arloa:',
            visit_app: 'Aplikazioa bisitatu',
            pagination_prev: 'Aurrekoa',
            pagination_next: 'Hurrengoa',
            pagination_page: '{current}/{total} orrialdea',
            share_filters: 'Iragazkiak partekatu',
            share_category: 'Kategoria hau partekatu',
            clear_favorites: 'Gogokoak garbitu',
            clear_all: 'Dena garbitu',
            copy_confirm: 'URLa arbelera kopiatu da!',
            visits_since: '{count} bisita 2025eko uztailaren 1etik',
            help_title: 'Laguntza',
            stats_panel_title: 'Estatistika-panela',
            filters_area: 'Ezagutzaren Arloa',
            filters_level: 'Maila hezitzailea',
            filters_type: 'Baliabide mota',
            filters_platform: 'Plataforma',
            filters_language: 'Aplikazioaren hizkuntza',
            filters_author: 'Egilea',
            language_label: 'Hizkuntza(k):'
        },
        en: {
            app_title: 'Repository of educational apps',
            header_subtitle_html: "A collection of educational apps and resources created by the <a href='https://vibe-coding-educativo.github.io' target='_blank' class='text-blue-600 hover:underline font-semibold dark:text-blue-400 dark:hover:text-blue-300'>Vibe Coding Educativo</a> community.",
            search_label: 'Free search',
            search_placeholder: 'Search across all fields...',
            clear_search_title: 'Clear search',
            btn_favorites: 'Favorites',
            btn_favorites_title: 'Show only favorites',
            btn_filters: 'Filters',
            btn_filters_title: 'Show/hide filters',
            btn_help_title: 'Help',
            reset_filters: 'Clear Filters',
            apply_filters: 'Apply Filters',
            items_per_page_label: 'Show:',
            items_per_page_all: 'All',
            loading_text: 'Loading apps...',
            error_text: 'Could not load data.',
            no_results: 'No applications found.',
            no_favorites_html: "You have no favorite apps.<br><span class='text-sm'>Click the heart on an app to add it.</span>",
            category_manage_title: 'Manage Favorite',
            category_modal_manage: 'Manage "{title}"',
            label_category_select: 'Choose a category',
            label_new_category: 'Or create a new one',
            new_category_placeholder: 'E.g., Math, Biology...',
            remove_favorite: 'Remove from Favorites',
            cancel: 'Cancel',
            save: 'Save',
            delete_category_title: 'Delete category?',
            delete_category_confirm_html: 'The category "<strong>{category}</strong>" and all its apps will be deleted. This action cannot be undone.',
            confirm_delete_category: 'Yes, delete',
            results_counter: 'Showing {n} of {total} applications.',
            custom_view_fav_category: 'You are viewing the favorites category "<strong>{fav}</strong>".',
            custom_view_collection: 'You are viewing a custom collection of <strong>{count}</strong> applications.',
            view_all: 'View all',
            read_more: 'more',
            read_less: 'less',
            no_description: 'No description.',
            manage_favorite_title: 'Manage favorite',
            no_platform: 'No platform',
            by: 'by',
            level_label: 'Level:',
            area_label: 'Area:',
            visit_app: 'Visit App',
            pagination_prev: 'Previous',
            pagination_next: 'Next',
            pagination_page: 'Page {current} of {total}',
            share_filters: 'Share Filters',
            share_category: 'Share this category',
            clear_favorites: 'Clear Favorites',
            clear_all: 'Clear All',
            copy_confirm: 'URL copied to clipboard!',
            visits_since: '{count} visits since July 1, 2025',
            help_title: 'Help',
            stats_panel_title: 'Statistics Panel',
            filters_area: 'Area of Knowledge',
            filters_level: 'Educational Level',
            filters_type: 'Resource Type',
            filters_platform: 'Platform',
            filters_language: 'App language',
            filters_author: 'Author',
            language_label: 'Language(s):'
        }
    });

    let currentLang = (localStorage.getItem('lang') || (navigator.language || 'es')).split('-')[0];
    if (!SUPPORTED_LANGS.includes(currentLang)) currentLang = 'es';

    function t(key, vars = {}) {
        const table = translations[currentLang] || translations.es;
        let s = (table && table[key]) || translations.es[key] || key;
        if (typeof s !== 'string') return String(s);
        return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
    }

    function applyTranslationsStatic() {
        document.documentElement.lang = currentLang;
        const docTitle = document.getElementById('doc-title'); if (docTitle) docTitle.textContent = t('app_title');
        const appTitle = document.getElementById('app-title'); if (appTitle) appTitle.textContent = t('app_title');
        const subtitle = document.getElementById('app-subtitle'); if (subtitle) subtitle.innerHTML = t('header_subtitle_html');
        const searchLabel = document.getElementById('search-label'); if (searchLabel) searchLabel.textContent = t('search_label');
        if (elements.searchInput) elements.searchInput.placeholder = t('search_placeholder');
        if (elements.clearSearchBtn) elements.clearSearchBtn.title = t('clear_search_title');
        const btnFavText = document.getElementById('btn-favorites-text'); if (btnFavText) btnFavText.textContent = t('btn_favorites');
        if (elements.toggleFavoritesBtn) elements.toggleFavoritesBtn.title = t('btn_favorites_title');
        const btnFiltersText = document.getElementById('btn-filters-text'); if (btnFiltersText) btnFiltersText.textContent = t('btn_filters');
        if (elements.toggleFiltersBtn) elements.toggleFiltersBtn.title = t('btn_filters_title');
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            const helpLabel = t('btn_help_title');
            helpBtn.title = helpLabel;
            helpBtn.setAttribute('aria-label', helpLabel);
            const helpBtnLabel = document.getElementById('help-btn-label');
            if (helpBtnLabel) helpBtnLabel.textContent = helpLabel;
        }
        const resetFiltersBtn = document.getElementById('reset-filters-btn'); if (resetFiltersBtn) resetFiltersBtn.textContent = t('reset_filters');
        const closeFiltersBtn = document.getElementById('close-filters-btn'); if (closeFiltersBtn) closeFiltersBtn.textContent = t('apply_filters');
        const ippLabel = document.getElementById('items-per-page-label'); if (ippLabel) ippLabel.textContent = t('items_per_page_label');
        const ippAll = document.getElementById('items-per-page-all'); if (ippAll) ippAll.textContent = t('items_per_page_all');
        const loadingText = document.getElementById('loading-text'); if (loadingText) loadingText.textContent = t('loading_text');
        const errorText = document.getElementById('error-text'); if (errorText) errorText.textContent = t('error_text');
        const noResultsText = document.getElementById('no-results-text'); if (noResultsText) noResultsText.textContent = t('no_results');
        const noFavText = document.getElementById('no-favorites-text'); if (noFavText) noFavText.innerHTML = t('no_favorites_html');
        const shareFiltersText = document.getElementById('share-filters-text'); if (shareFiltersText) shareFiltersText.textContent = t('share_filters');
        const clearFavoritesText = document.getElementById('clear-favorites-text'); if (clearFavoritesText) clearFavoritesText.textContent = t('clear_favorites');
        const clearAllText = document.getElementById('clear-all-text'); if (clearAllText) clearAllText.textContent = t('clear_all');
        const catTitle = elements.categoryModalTitle; if (catTitle) catTitle.textContent = t('category_manage_title');
        const labelCatSel = document.getElementById('label-category-select'); if (labelCatSel) labelCatSel.textContent = t('label_category_select');
        const labelNewCat = document.getElementById('label-new-category'); if (labelNewCat) labelNewCat.textContent = t('label_new_category');
        if (elements.newCategoryInput) elements.newCategoryInput.placeholder = t('new_category_placeholder');
        if (elements.removeFavoriteBtn) elements.removeFavoriteBtn.textContent = t('remove_favorite');
        if (elements.cancelCategoryBtn) elements.cancelCategoryBtn.textContent = t('cancel');
        if (elements.saveCategoryBtn) elements.saveCategoryBtn.textContent = t('save');
        const delTitle = document.getElementById('delete-category-title'); if (delTitle) delTitle.textContent = t('delete_category_title');
        if (elements.cancelDeleteCategoryBtn) elements.cancelDeleteCategoryBtn.textContent = t('cancel');
        if (elements.confirmDeleteCategoryBtn) elements.confirmDeleteCategoryBtn.textContent = t('confirm_delete_category');
        const helpTitle = document.getElementById('help-title'); if (helpTitle) helpTitle.textContent = t('help_title');
        const copyMsg = document.getElementById('copy-confirm-msg'); if (copyMsg) copyMsg.textContent = t('copy_confirm');
        const statsIframe = document.getElementById('modal-iframe'); if (statsIframe) statsIframe.title = t('stats_panel_title');
        const langSelect = document.getElementById('lang-select'); if (langSelect) langSelect.value = currentLang;
    }

    function setupLanguageManager() {
        const langSelect = document.getElementById('lang-select');
        if (langSelect) {
            langSelect.value = currentLang;
            langSelect.addEventListener('change', () => {
                const val = langSelect.value;
                currentLang = SUPPORTED_LANGS.includes(val) ? val : 'es';
                localStorage.setItem('lang', currentLang);
                applyTranslationsStatic();
                if (allApps.length > 0) {
                    elements.filtersContainer.innerHTML = '';
                    setupFiltersI18n(allApps);
                    applyAndDisplay();
                }
            });
        }
        applyTranslationsStatic();
    }

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
        closeFiltersBtn: document.getElementById('close-filters-btn'),
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
    function getFavoriteCountForCategory(category) {
        if (!category || !favorites[category]) return 0;
        let count = 0;
        favorites[category].forEach(key => { if (allAppKeys.has(key)) count++; });
        return count;
    }

    function getTotalFavoritesCount() {
        return Object.keys(favorites).reduce((sum, category) => sum + getFavoriteCountForCategory(category), 0);
    }

    function displayApps(apps) {
        document.body.classList.toggle('favorites-mode', showingFavoritesOnly);
        const totalFavorites = getTotalFavoritesCount();
        elements.noResultsMsg.classList.toggle('hidden', apps.length > 0 || (showingFavoritesOnly && totalFavorites === 0) || isCustomView);
        elements.noFavoritesMsg.classList.toggle('hidden', !showingFavoritesOnly || apps.length > 0 || totalFavorites > 0 || isCustomView);
        if (showingFavoritesOnly) {
            elements.favoritesTabsContainer.classList.remove('hidden');
            renderFavoriteTabsAndContent(apps);
        } else {
            elements.favoritesTabsContainer.classList.add('hidden');
            elements.appsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
            renderAppGrid(apps);
        }
        if (!isCustomView) {
            elements.resultsCounter.textContent = t('results_counter', { n: apps.length, total: allApps.length });
        }
    }
    function renderAppGrid(appsToRender, container = elements.appsContainer) { container.innerHTML = ''; const effectiveItemsPerPage = itemsPerPage === 'all' ? appsToRender.length : parseInt(itemsPerPage); const startIndex = (currentPage - 1) * effectiveItemsPerPage; const endIndex = startIndex + effectiveItemsPerPage; const paginatedApps = appsToRender.slice(startIndex, endIndex); paginatedApps.forEach(app => { const card = createAppCard(app); container.appendChild(card); }); if (container === elements.appsContainer) { setupPagination(appsToRender.length); } }
    
    function renderFavoriteTabsAndContent(allFavoriteApps) {
        elements.favoritesTabsContainer.innerHTML = '';
        elements.appsContainer.innerHTML = '';
        setupPagination(0);

        const sortedCategories = Object.keys(favorites).sort((a, b) => a.localeCompare(b));
        const tabsList = document.createElement('div');
        tabsList.className = 'flex flex-wrap items-center gap-2';

        sortedCategories.forEach(category => {
            const availableCount = getFavoriteCountForCategory(category);
            if (availableCount === 0 && category !== 'General') return;

            const tabButton = document.createElement('button');
            tabButton.className = 'fav-tab-btn';
            tabButton.dataset.category = category;
            if (category === activeFavoriteTab) { tabButton.classList.add('active'); }

            let tabContent = `
                <span class="fav-chip">
                    <span class="fav-chip-icon" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4a3.6 3.6 0 0 1 3.1 1.69h0.8A3.6 3.6 0 0 1 13.5 4C16 4 18 6 18 8.5c0 3.78-3.4 6.86-8.55 11.54z"/>
                        </svg>
                    </span>
                    <span class="fav-chip-text">${category}</span>
                    <span class="fav-chip-count">(${availableCount})</span>
                </span>
            `;

            if (category !== 'General') {
                tabContent += `<span class="delete-category-btn"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></span>`;
            }

            tabButton.innerHTML = tabContent;
            tabButton.addEventListener('click', (e) => {
                if (e.target.closest('.delete-category-btn')) return;
                activeFavoriteTab = category;
                renderFavoriteTabsAndContent(allFavoriteApps);
            });

            const deleteBtn = tabButton.querySelector('.delete-category-btn');
            if (deleteBtn) {
                const deleteMessage = `${t('delete_category_title')} ${category}`;
                deleteBtn.setAttribute('title', deleteMessage);
                deleteBtn.setAttribute('aria-label', deleteMessage);
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openDeleteCategoryModal(category);
                });
            }

            tabsList.appendChild(tabButton);
        });

        elements.favoritesTabsContainer.appendChild(tabsList);

        const activeCategoryHeader = document.createElement('div');
        activeCategoryHeader.className = 'flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-4 mb-4';
        activeCategoryHeader.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">${activeFavoriteTab}</h2>
            <button class="share-category-btn inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                ${t('share_category')}
            </button>
        `;
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

    function createAppCard(app) { const card = document.createElement('div'); card.className = `card bg-white rounded-lg shadow-sm overflow-hidden flex flex-col dark:bg-gray-800 ${getLevelStyle(app.nivel_educativo)}`; const isFav = isFavorite(app.key); const favClass = isFav ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'; const fullDescription = app.descripcion_app || t('no_description'); let descriptionHtml; if (fullDescription.length > 350) { const shortDescription = fullDescription.substring(0, 350).trim(); descriptionHtml = `<div class="description-container text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow"><p class="short-desc">${shortDescription}... <a href="#" class="read-more font-semibold text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">${t('read_more')}</a></p><p class="long-desc hidden">${fullDescription} <a href="#" class="read-less font-semibold text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">${t('read_less')}</a></p></div>`; } else { descriptionHtml = `<p class="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow">${fullDescription}</p>`; } card.innerHTML = `<div class="p-5 flex-grow flex flex-col relative"><button class="favorite-btn absolute top-3 right-3 p-1 rounded-full bg-white/50 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-700/50 dark:hover:bg-gray-700/90" title=\"${t('manage_favorite_title')}\" data-key="${app.key}"><svg class="w-6 h-6 transition-colors duration-200 ${favClass}" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg></button><h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${app.titulo_app}</h3><p class="text-sm text-gray-500 dark:text-gray-400 mb-3">${t('by')} <span class="font-medium">${createFilterLink(app.nombre_autor, 'nombre_autor')}</span></p>${descriptionHtml}<div class="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-auto"><p><strong>${t('level_label')}</strong> ${app.nivel_educativo ? createFilterLink(app.nivel_educativo, 'nivel_educativo') : ''}</p><p><strong>${t('area_label')}</strong> ${app.area_conocimiento ? createFilterLink(app.area_conocimiento, 'area_conocimiento') : ''}</p>${app.idiomas_app ? `<p><strong>${t('language_label')}</strong> ${createFilterLink(app.idiomas_app, 'idiomas_app')}</p>` : ''}</div></div><div class="p-4 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex flex-wrap mb-3 min-h-[2rem]">${app.palabras_clave?.split(',').filter(k => k.trim()).map(k => `<span class="keyword-tag ${activeFilters.palabras_clave.has(k.trim()) ? 'active' : ''} bg-sky-100 text-sky-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full dark:bg-sky-900 dark:text-sky-300" data-keyword="${k.trim()}">${k.trim()}</span>`).join('') || ''}</div><a href="${app.url_app}" target="_blank" class="block w-full text-center bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors">${t('visit_app')}</a></div>`; return card; }
    
    function openDeleteCategoryModal(categoryName) { categoryToDelete = categoryName; elements.deleteCategoryConfirmText.innerHTML = t('delete_category_confirm_html', { category: categoryName }); elements.deleteCategoryModal.classList.remove('hidden'); }
    function closeDeleteCategoryModal() { elements.deleteCategoryModal.classList.add('hidden'); categoryToDelete = null; }
    function confirmDeleteCategory() { if (categoryToDelete && categoryToDelete !== 'General') { delete favorites[categoryToDelete]; if (activeFavoriteTab === categoryToDelete) { activeFavoriteTab = 'General'; } finishFavoriteUpdate(); } closeDeleteCategoryModal(); }
    function finishFavoriteUpdate() { saveFavorites(); applyAndDisplay(); closeCategoryModal(); }
    
    function processData(data) {
        const HEADER_MAPPING = {
            timestamp: ['marca temporal'],
            correo_autor: ['direccion de correo electronico', 'dirección de correo electrónico'],
            nombre_autor: ['tu nombre'],
            titulo_app: ['titulo de la aplicacion', 'título de la aplicación'],
            url_app: ['enlace (url) a la aplicacion', 'enlace (url) a la aplicación', 'enlace (url)'],
            descripcion_app: ['descripcion breve', 'descripción breve'],
            plataforma: ['plataforma de creacion', 'plataforma de creación'],
            tipo_recurso: ['tipo de recurso'],
            nivel_educativo: ['nivel o niveles educativos'],
            area_conocimiento: ['area o areas de conocimiento', 'área o áreas de conocimiento'],
            palabras_clave: ['palabras clave'],
            licencia: ['licencia de uso'],
            idiomas_app: ['idiomas', 'idioma'],
            eliminar_registro: ['quieres eliminar un registro', '¿quieres eliminar un registro?']
        };

        const headers = data?.[0] || [];
        const normalizedHeaders = headers.map(h => normalizeString(h));

        const findColumn = (candidates) => {
            for (const cand of candidates) {
                const needle = normalizeString(cand);
                const idx = normalizedHeaders.findIndex(h => h.startsWith(needle));
                if (idx !== -1) return idx;
            }
            return -1;
        };

        const colIdx = Object.fromEntries(
            Object.entries(HEADER_MAPPING).map(([key, candidates]) => [key, findColumn(candidates)])
        );

        const fallbackToFixedOrder = (idiomasIdx = -1) => {
            const FULL_COLUMN_KEYS = [
                'timestamp', 'correo_autor', 'nombre_autor', 'titulo_app', 'url_app',
                'descripcion_app', 'plataforma', 'tipo_recurso', 'nivel_educativo',
                'area_conocimiento', 'palabras_clave', 'licencia', 'eliminar_registro'
            ];

            return (data || []).slice(1).map(rowArray => {
                const newRow = {};
                FULL_COLUMN_KEYS.forEach((key, index) => {
                    newRow[key] = rowArray?.[index] ? String(rowArray[index]).trim() : '';
                });
                newRow.idiomas_app = idiomasIdx >= 0 && rowArray?.[idiomasIdx] ? String(rowArray[idiomasIdx]).trim() : '';
                return newRow;
            });
        };

        const hasRequiredHeaderMapping =
            colIdx.correo_autor !== -1 &&
            colIdx.nombre_autor !== -1 &&
            colIdx.titulo_app !== -1 &&
            colIdx.url_app !== -1;

        const mappedData = hasRequiredHeaderMapping
            ? (data || []).slice(1).map(rowArray => {
                const newRow = {};
                Object.keys(HEADER_MAPPING).forEach(key => {
                    const idx = colIdx[key];
                    newRow[key] = idx >= 0 && rowArray?.[idx] ? String(rowArray[idx]).trim() : '';
                });
                return newRow;
            })
            : fallbackToFixedOrder(colIdx.idiomas_app);

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

    function setupFilters(apps) { const filterCategories = [ { id: 'area_conocimiento', name: 'Área de Conocimiento', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>' }, { id: 'nivel_educativo', name: 'Nivel Educativo', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.7.9 3.2 2.3 4.1"/><path d="M16 17a3 3 0 0 0-3-3 3 3 0 0 0-3 3v2h6v-2Z"/></svg>' }, { id: 'tipo_recurso', name: 'Tipo de Recurso', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.28 2.22a2.22 2.22 0 0 0-3.14 0l-12 12a2.22 2.22 0 0 0 0 3.14l3.14 3.14a2.22 2.22 0 0 0 3.14 0l12-12a2.22 2.22 0 0 0 0-3.14Z"/><path d="m14 7 3 3"/><path d="M5.5 16.5 10 12"/></svg>' }, { id: 'nombre_autor', name: 'Autor/a', multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}, ]; filterCategories.forEach(cat => { const values = new Set(apps.flatMap(app => app[cat.id]?.split(',') || []).map(v => v.trim()).filter(Boolean)); if (values.size === 0) return; const sortedValues = Array.from(values).sort((a,b) => a.localeCompare(b, 'es', { sensitivity: 'base' })); const details = document.createElement('details'); details.className = 'border-b border-gray-200 last:border-b-0 pb-4 dark:border-gray-700'; details.innerHTML = `<summary class="flex justify-between items-center cursor-pointer py-2"><div class="flex items-center gap-3"><span class="text-gray-500 dark:text-gray-400">${cat.icon}</span><span class="font-semibold text-gray-800 dark:text-gray-200">${cat.name}</span></div><span class="arrow transition-transform text-gray-500 dark:text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></span></summary><div class="pt-3 flex flex-wrap gap-2" data-category="${cat.id}">${sortedValues.map(value => `<button class="filter-btn text-sm font-medium py-1.5 px-3 rounded-full" data-filter="${value}">${value}</button>`).join('')}</div>`; elements.filtersContainer.appendChild(details); }); }
    
    // Versión con i18n para los nombres de categorías de filtros
    function setupFiltersI18n(apps) {
        const filterCategories = [
            { id: 'area_conocimiento', name: t('filters_area'), multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>' },
            { id: 'nivel_educativo', name: t('filters_level'), multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.7.9 3.2 2.3 4.1"/><path d="M16 17a3 3 0 0 0-3-3 3 3 0 0 0-3 3v2h6v-2Z"/></svg>' },
            { id: 'tipo_recurso', name: t('filters_type'), multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.28 2.22a2.22 2.22 0 0 0-3.14 0l-12 12a2.22 2.22 0 0 0 0 3.14l3.14 3.14a2.22 2.22 0 0 0 3.14 0l12-12a2.22 2.22 0 0 0 0-3.14Z"/><path d="m14 7 3 3"/><path d="M5.5 16.5 10 12"/></svg>' },
            { id: 'idiomas_app', name: t('filters_language'), multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg>'},
            { id: 'nombre_autor', name: t('filters_author'), multi: true, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'},
        ];

        filterCategories.forEach(cat => {
            const values = new Set(
                apps.flatMap(app => app[cat.id]?.split(',') || [])
                    .map(v => v.trim())
                    .filter(Boolean)
            );
            if (values.size === 0) return;

            const sortedValues = Array.from(values).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

            const details = document.createElement('details');
            details.className = 'border-b border-gray-200 last:border-b-0 pb-4 dark:border-gray-700';
            details.innerHTML = `
                <summary class="flex justify-between items-center cursor-pointer py-2">
                    <div class="flex items-center gap-3">
                        <span class="text-gray-500 dark:text-gray-400">${cat.icon}</span>
                        <span class="font-semibold text-gray-800 dark:text-gray-200">${cat.name}</span>
                    </div>
                    <span class="arrow transition-transform text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                </summary>
                <div class="pt-3 flex flex-wrap gap-2" data-category="${cat.id}">
                    ${Array.from(sortedValues).map(value => `<button class="filter-btn text-sm font-medium py-1.5 px-3 rounded-full" data-filter="${value}">${value}</button>`).join('')}
                </div>`;
            elements.filtersContainer.appendChild(details);
        });
    }

    // --- FUNCIÓN MEJORADA ---
    function getLevelStyle(levels) {
        const DEFAULT_STYLE = 'border-gray-400 dark:border-gray-500';
        if (!levels) return DEFAULT_STYLE;

        const sanitizedLevels = Array.isArray(levels) ? levels.join(',') : `${levels}`;
        const normalizedLevels = sanitizedLevels.replace(/[\/;|]/g, ',').split(',')
            .map(level => level.trim())
            .filter(Boolean)
            .map(level => level.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

        const matches = (...keywords) => normalizedLevels.some(level =>
            keywords.some(keyword => level.includes(keyword))
        );

        if (matches('infantil')) return 'border-pink-400 dark:border-pink-300';
        if (matches('primaria')) return 'border-green-500 dark:border-green-400';
        if (matches('eso', 'secundaria')) return 'border-blue-500 dark:border-blue-400';
        if (matches('bachillerato')) return 'border-purple-500 dark:border-purple-400';
        if (matches('fp', 'formacion profesional', 'ciclo formativo', 'ciclos formativos')) return 'border-orange-500 dark:border-orange-400';
        if (matches('universidad', 'adulto', 'adultos', 'superior')) return 'border-red-500 dark:border-red-400';
        if (matches('docente', 'profesorado')) return 'border-slate-500 dark:border-slate-400';
        if (matches('multinivel', 'multi etapa', 'multietapa', 'varios niveles', 'todos los niveles')) return 'border-teal-500 dark:border-teal-400';

        return DEFAULT_STYLE;
    }

    function setupPagination(totalItems) { elements.paginationContainer.innerHTML = ''; const effectiveItemsPerPage = itemsPerPage === 'all' ? totalItems : parseInt(itemsPerPage); if (totalItems <= effectiveItemsPerPage) return; const totalPages = Math.ceil(totalItems / effectiveItemsPerPage); const prevButton = document.createElement('button'); prevButton.textContent = t('pagination_prev'); prevButton.className = 'pagination-btn'; prevButton.disabled = currentPage === 1; prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; applyAndDisplay(); window.scrollTo(0, 0); } }); elements.paginationContainer.appendChild(prevButton); const pageInfo = document.createElement('span'); pageInfo.textContent = t('pagination_page', { current: currentPage, total: totalPages }); pageInfo.className = 'dark:text-gray-400'; elements.paginationContainer.appendChild(pageInfo); const nextButton = document.createElement('button'); nextButton.textContent = t('pagination_next'); nextButton.className = 'pagination-btn'; nextButton.disabled = currentPage === totalPages; nextButton.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; applyAndDisplay(); window.scrollTo(0, 0); } }); elements.paginationContainer.appendChild(nextButton); }
    function createFilterLink(text, category) { return text.split(',').map(v => v.trim()).filter(Boolean).map(val => `<a href="#" class="filter-link" data-category="${category}" data-filter="${val}">${val}</a>`).join(', '); }
    function hasAnyActiveFilters() { return Object.values(activeFilters).some(set => set.size > 0); }
    function updateFiltersButtonHighlight(hasActiveFilter = hasAnyActiveFilters()) { const panelVisible = !elements.filterPanel.classList.contains('hidden'); const shouldHighlight = panelVisible || hasActiveFilter; elements.toggleFiltersBtn.classList.toggle('active', shouldHighlight); }
    function updateControls() {
        elements.activeFiltersDisplay.innerHTML = '';
        let hasActiveFilter = false;

        Object.entries(activeFilters).forEach(([category, filterSet]) => {
            if (filterSet.size === 0) return;
            hasActiveFilter = true;
            const catName = document.querySelector(`[data-category="${category}"]`)?.closest('details')?.querySelector('.font-semibold')?.textContent || 'Palabra Clave';
            filterSet.forEach(filterValue => {
                const tag = document.createElement('div');
                tag.className = 'flex items-center bg-blue-100 text-blue-900 text-sm font-medium pl-3 pr-2 py-1 rounded-full shadow-sm dark:bg-blue-900/60 dark:text-blue-200';
                tag.innerHTML = `<span>${catName}: ${filterValue}</span><button class="ml-2 text-blue-500 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100" data-category="${category}" data-filter="${filterValue}" title="Eliminar filtro">&times;</button>`;
                elements.activeFiltersDisplay.appendChild(tag);
            });
        });

        const totalFavorites = getTotalFavoritesCount();
        const hasSearchText = elements.searchInput.value.length > 0;
        const showFilterActions = hasActiveFilter || hasSearchText;
        const showFavoriteActions = showingFavoritesOnly && totalFavorites > 0;
        const showActionsBar = showFilterActions || showFavoriteActions;

        elements.actionsBar.classList.toggle('hidden', !showActionsBar);
        elements.actionsBar.parentElement.classList.toggle('justify-between', showActionsBar);
        elements.actionsBar.parentElement.classList.toggle('justify-end', !showActionsBar);

        if (showActionsBar) {
            elements.shareUrlBtn.classList.toggle('hidden', !showFilterActions);
            elements.clearAllBtn.classList.toggle('hidden', !showFilterActions);
            elements.clearFavoritesBtn.classList.toggle('hidden', !showFavoriteActions);
        }

        document.body.classList.toggle('filters-active', hasActiveFilter);
        updateFiltersButtonHighlight(hasActiveFilter);
    }
    function resetAllFilters(options = {}) { currentPage = 1; if (!options.preserveSearch) { elements.searchInput.value = ''; elements.clearSearchBtn.classList.add('hidden'); } for (const category in activeFilters) activeFilters[category].clear(); document.querySelectorAll('.filter-btn.active').forEach(btn => btn.classList.remove('active')); elements.filtersContainer.querySelectorAll('details').forEach(d => { d.open = false; }); showingFavoritesOnly = false; elements.toggleFavoritesBtn.classList.remove('active'); elements.filterPanel.classList.add('hidden'); updateFiltersButtonHighlight(); applyAndDisplay(); }
    
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

    const paramMapping = { subject: 'area_conocimiento', level: 'nivel_educativo', type: 'tipo_recurso', app_lang: 'idiomas_app', author: 'nombre_autor', keyword: 'palabras_clave', search: 'search', fav_category: 'fav_category' }; function generateShareableURL(type = 'filters', value = '') { const params = new URLSearchParams(); if (type === 'category' && value && favorites[value]) { params.set('fav_category', value); params.set('ids', favorites[value].join(',')); } else { const reverseMapping = Object.fromEntries(Object.entries(paramMapping).map(a => a.reverse())); if (elements.searchInput.value) params.set('search', elements.searchInput.value); for (const category in activeFilters) { if (activeFilters[category].size > 0) { const paramName = reverseMapping[category]; if (paramName) params.set(paramName, [...activeFilters[category]].join(',')); } } } return `${window.location.origin}${window.location.pathname}?${params.toString()}`; }
    function copyToClipboard(text) { if (!text) return; navigator.clipboard.writeText(text).then(() => { const msg = document.getElementById('copy-confirm-msg'); if (msg) msg.textContent = t('copy_confirm'); msg.classList.remove('opacity-0', '-translate-y-5'); setTimeout(() => msg.classList.add('opacity-0', '-translate-y-5'), 2000); }); }
    function applyUrlParams() { const params = new URLSearchParams(window.location.search); const ids = params.get('ids'); const favCategory = params.get('fav_category'); if (ids) { isCustomView = true; const sharedKeys = new Set(ids.split(',')); const sharedApps = allApps.filter(app => sharedKeys.has(app.key)); elements.searchInput.disabled = true; elements.toggleFiltersBtn.disabled = true; elements.toggleFavoritesBtn.disabled = true; elements.filterPanel.classList.add('hidden'); updateFiltersButtonHighlight(); elements.itemsPerPageSelector.disabled = true; const message = favCategory ? `Estás viendo la categoría de favoritos "<strong>${favCategory}</strong>".` : `Estás viendo una colección personalizada de <strong>${sharedApps.length}</strong> aplicaciones.`; elements.customViewMsg.innerHTML = `${message} <button id="exit-custom-view" class="font-bold underline ml-2 hover:text-blue-600 dark:hover:text-blue-400">Ver todas</button>`; elements.customViewMsg.classList.remove('hidden'); document.getElementById('exit-custom-view').addEventListener('click', () => { window.location.href = window.location.pathname; }); elements.appsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'; renderAppGrid(sharedApps); elements.resultsCounter.textContent = `Mostrando una colección de ${sharedApps.length} aplicaciones.`; } else { isCustomView = false; applyFiltersFromURL(); applyAndDisplay(); } }
    function applyFiltersFromURL() { const params = new URLSearchParams(window.location.search); params.forEach((value, key) => { const category = paramMapping[key.toLowerCase()]; if (!category) return; const valuesFromUrl = value.split(','); if (category === 'search') { elements.searchInput.value = value; elements.clearSearchBtn.classList.toggle('hidden', !elements.searchInput.value); } else if (activeFilters[category]) { valuesFromUrl.forEach(urlVal => { activeFilters[category].add(urlVal); const normalized = normalizeString(urlVal); document.querySelectorAll(`[data-category="${category}"] .filter-btn`).forEach(btn => { if (normalizeString(btn.dataset.filter).includes(normalized)) btn.classList.add('active'); }); }); } }); }
    function applyAndDisplay() { const searchText = normalizeString(elements.searchInput.value); let appsToFilter = allApps; if (showingFavoritesOnly) { const favoriteKeys = new Set(Object.values(favorites).flat()); appsToFilter = allApps.filter(app => favoriteKeys.has(app.key)); } const filteredApps = appsToFilter.filter(app => { if (searchText && !normalizeString(Object.values(app).join(' ')).includes(searchText)) { return false; } for (const category in activeFilters) { const selectedFilters = activeFilters[category]; if (selectedFilters.size === 0) continue; const appValuesRaw = app[category] || ''; if (!appValuesRaw) return false; const appValues = appValuesRaw.split(',').map(v => v.trim()); const hasMatch = appValues.some(appVal => [...selectedFilters].some(filterVal => normalizeString(appVal) === normalizeString(filterVal)) ); if (!hasMatch) return false; } return true; }); displayApps(filteredApps); updateControls(); }
    function openCategoryModal(appKey) { currentAppKeyForModal = appKey; const app = allApps.find(a => a.key === appKey); if (!app) return; elements.categoryModalTitle.textContent = `Gestionar "${app.titulo_app}"`; elements.newCategoryInput.value = ''; elements.categoryModalError.classList.add('hidden'); elements.categorySelect.innerHTML = ''; const sortedCategories = Object.keys(favorites).sort((a,b) => a.localeCompare(b)); sortedCategories.forEach(cat => { const option = document.createElement('option'); option.value = cat; option.textContent = cat; elements.categorySelect.appendChild(option); }); const currentCategory = findCategoryForApp(appKey); if (currentCategory) { elements.categorySelect.value = currentCategory; elements.removeFavoriteBtn.classList.remove('hidden'); } else { elements.categorySelect.value = "General"; elements.removeFavoriteBtn.classList.add('hidden'); } elements.categoryModal.classList.remove('hidden'); }
    function closeCategoryModal() { elements.categoryModal.classList.add('hidden'); currentAppKeyForModal = null; }
    function saveFavoriteToCategory() { const newCategoryName = elements.newCategoryInput.value.trim(); let targetCategory = elements.categorySelect.value; if (newCategoryName) { const existingCategory = Object.keys(favorites).find(cat => cat.toLowerCase() === newCategoryName.toLowerCase()); if(existingCategory && existingCategory !== newCategoryName) { elements.categoryModalError.textContent = `La categoría "${existingCategory}" ya existe.`; elements.categoryModalError.classList.remove('hidden'); return; } targetCategory = newCategoryName; } if (!targetCategory) { elements.categoryModalError.textContent = 'Por favor, elige o crea un nombre de categoría válido.'; elements.categoryModalError.classList.remove('hidden'); return; } removeFavorite(currentAppKeyForModal, false); if (!favorites[targetCategory]) { favorites[targetCategory] = []; } if (!favorites[targetCategory].includes(currentAppKeyForModal)) { favorites[targetCategory].push(currentAppKeyForModal); } finishFavoriteUpdate(); }
    function removeFavorite(appKey, shouldUpdateUI = true) { const category = findCategoryForApp(appKey); if (category) { favorites[category] = favorites[category].filter(key => key !== appKey); if (shouldUpdateUI) { finishFavoriteUpdate(); } } }

    function setupEventListeners() {
        elements.toggleFiltersBtn.addEventListener('click', () => {
            elements.filterPanel.classList.toggle('hidden');
            updateFiltersButtonHighlight();
        });
        if (elements.closeFiltersBtn) {
            elements.closeFiltersBtn.addEventListener('click', () => {
                elements.filterPanel.classList.add('hidden');
                updateFiltersButtonHighlight();
            });
        }
        elements.toggleFavoritesBtn.addEventListener('click', () => { showingFavoritesOnly = !showingFavoritesOnly; elements.toggleFavoritesBtn.classList.toggle('active'); currentPage = 1; if (showingFavoritesOnly) { const favCats = Object.keys(favorites); activeFavoriteTab = favCats.includes(activeFavoriteTab) ? activeFavoriteTab : 'General'; elements.filterPanel.classList.add('hidden'); updateFiltersButtonHighlight(); } applyAndDisplay(); });
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
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        const closeHelpBtn = document.getElementById('close-help-btn');
        const helpFrame = document.getElementById('help-frame');
        let helpFrameLoadedLang = null;

        function syncHelpFrameLanguage(force = false) {
            const helpMap = { es: 'ayuda.html', ca: 'ayuda.ca.html', en: 'ayuda.en.html', gl: 'ayuda.gl.html', eu: 'ayuda.eu.html' };
            const helpSrc = helpMap[currentLang] || helpMap.es;
            const expectedHref = new URL(helpSrc, window.location.href).href;
            if (force || helpFrameLoadedLang !== currentLang || helpFrame.src !== expectedHref) {
                helpFrame.src = helpSrc;
                helpFrameLoadedLang = currentLang;
            }
        }

        helpBtn.addEventListener('click', () => {
            helpModal.classList.remove('hidden');
            syncHelpFrameLanguage();
        });
        closeHelpBtn.addEventListener('click', () => { helpModal.classList.add('hidden'); });
        helpModal.addEventListener('click', e => { if (e.target.id === 'help-modal') { helpModal.classList.add('hidden'); } });
        elements.confirmDeleteCategoryBtn.addEventListener('click', confirmDeleteCategory);
        elements.cancelDeleteCategoryBtn.addEventListener('click', closeDeleteCategoryModal);
    }
    
    // Versión i18n (usando t()) para URL params compartidos
    function applyUrlParamsI18n() {
        const params = new URLSearchParams(window.location.search);
        const ids = params.get('ids');
        const favCategory = params.get('fav_category');
        if (ids) {
            isCustomView = true;
            const sharedKeys = new Set(ids.split(','));
            const sharedApps = allApps.filter(app => sharedKeys.has(app.key));

            elements.searchInput.disabled = true;
            elements.toggleFiltersBtn.disabled = true;
            elements.toggleFavoritesBtn.disabled = true;
            elements.filterPanel.classList.add('hidden');
            updateFiltersButtonHighlight();
            elements.itemsPerPageSelector.disabled = true;

            const message = favCategory
                ? t('custom_view_fav_category', { fav: favCategory })
                : t('custom_view_collection', { count: sharedApps.length });
            elements.customViewMsg.innerHTML = `${message} <button id="exit-custom-view" class="font-bold underline ml-2 hover:text-blue-600 dark:hover:text-blue-400">${t('view_all')}</button>`;
            elements.customViewMsg.classList.remove('hidden');
            document.getElementById('exit-custom-view').addEventListener('click', () => {
                window.location.href = window.location.pathname;
            });

            elements.appsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
            renderAppGrid(sharedApps);
            elements.resultsCounter.textContent = t('results_counter', { n: sharedApps.length, total: allApps.length });
        } else {
            isCustomView = false;
            applyFiltersFromURL();
            applyAndDisplay();
        }
    }

    // --- Inicialización ---
    
    setupThemeManager();
    loadFavorites();
    // Aplicar idioma a elementos estáticos y enlazar selector
    setupLanguageManager();

    Papa.parse(CSV_URL, {
        download: true, header: false, skipEmptyLines: true,
        complete: (results) => {
            elements.loadingMsg.style.display = 'none';
            allApps = processData(results.data);
            allAppKeys = new Set(allApps.map(app => app.key));
            if(allApps.length > 0) {
                const savedItemsPerPage = localStorage.getItem('itemsPerPagePref') || '25';
                itemsPerPage = savedItemsPerPage === 'all' ? 'all' : parseInt(savedItemsPerPage, 10);
                elements.itemsPerPageSelector.value = savedItemsPerPage;
                setupFiltersI18n(allApps);
                setupEventListeners();
                applyUrlParamsI18n();
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

    const INTERVAL_MIN = 15; const lastPing = Number(localStorage.getItem('visit_ping') || 0); const now = Date.now(); if (now - lastPing > INTERVAL_MIN * 60 * 1000) { const img = new Image(); img.src = 'https://bilateria.org/vce/stats/contador.php?' + now; img.style.display = 'none'; document.body.appendChild(img); localStorage.setItem('visit_ping', now.toString()); } fetch('https://bilateria.org/vce/stats/total.php?' + now) .then(response => response.text()) .then(totalVisitas => { const visitBox = document.getElementById('visit-box'); if (!visitBox) return; const modal = document.getElementById('stats-modal'); const closeModalBtn = document.getElementById('modal-close-btn'); const modalIframe = document.getElementById('modal-iframe'); if (!modal || !closeModalBtn || !modalIframe) return; visitBox.innerHTML = ''; const statsLink = document.createElement('a'); statsLink.href = '#'; statsLink.textContent = t('visits_since', { count: totalVisitas.trim() }); visitBox.appendChild(statsLink); statsLink.addEventListener('click', (event) => { event.preventDefault(); modalIframe.src = 'https://bilateria.org/vce/stats/stats.html'; modal.style.display = 'flex'; }); const closeModal = () => { modal.style.display = 'none'; modalIframe.src = 'about:blank'; }; closeModalBtn.addEventListener('click', closeModal); modal.addEventListener('click', (event) => { if (event.target === modal) { closeModal(); } }); }) .catch(() => { const visitBox = document.getElementById('visit-box'); if (visitBox) { visitBox.innerHTML = '–'; } });
});
