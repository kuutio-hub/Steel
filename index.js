

import { calculateCrossSection, calculateSurfaceAreaPerMeter } from './calculator.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Globális változók és állapot ---
    let APP_DATA = {};
    const APP_VERSION = '2.1.0';

    let state = {
        lang: 'hu', theme: 'dark', eurHufRate: 400.0, eurHufRateDate: null, priceCurrency: 'HUF',
        customMaterials: {}, favorites: [], productFavorites: [],
        crossSectionUnit: 'mm2', lengthUnit: 'mm', selectedMaterial: null, selectedProduct: null, selectedStandardSize: null,
        priceHufKg: 0,
        pipeDimUnits: { outerDiameter: 'mm', wallThickness: 'mm' },
    };

    // --- DOM Elemek Gyűjtése ---
    const DOMElements = {};
    const domIds = [
        'main-container', 'resizer', 'lang-selector', 'theme-toggle', 'theme-icon-sun', 'theme-icon-moon', 'reset-btn',
        'material-select-custom', 'favorite-toggle-btn', 'product-type-select-custom', 'product-favorite-toggle-btn', 
        'standard-size-container', 'standard-size-select-custom', 'dimension-fields', 'length-input', 'length-unit-toggle',
        'per-meter-results-section', 'results-total-wrapper', 'result-cross-section', 'cross-section-unit-toggle', 'result-weight-meter', 'result-surface-area', 
        'result-total-weight', 'result-total-surface', 'result-total-price', 'total-price-unit-toggle', 
        'eur-huf-rate', 'exchange-rate-reset-btn', 'exchange-rate-date', 'price-per-kg', 'price-per-meter', 'price-unit-toggle-kg', 
        'price-unit-toggle-m', 'manage-materials-btn', 'materials-modal', 
        'new-material-name', 'new-material-density', 'add-material-btn', 'all-materials-list', 
        'editing-material-name', 'copyright-year', 'app-version',
        'selection-modal', 'input-card-body'
    ];
    domIds.forEach(id => {
        const camelCaseId = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
        DOMElements[camelCaseId] = document.getElementById(id);
    });
    
    // Display elements for modals
    DOMElements.materialSelectDisplay = document.querySelector('#material-select-custom .custom-select-display');
    DOMElements.productTypeSelectDisplay = document.querySelector('#product-type-select-custom .custom-select-display');
    DOMElements.standardSizeSelectDisplay = document.querySelector('#standard-size-select-custom .custom-select-display');


    // --- Adatkezelés és API ---
    const storage = {
        saveState: () => {
            const stateToSave = { ...state };
            localStorage.setItem('steelCalcState', JSON.stringify(stateToSave));
        },
        loadState: () => {
            const saved = localStorage.getItem('steelCalcState');
            if (saved) {
                try {
                    const loadedState = JSON.parse(saved);
                    // Selectively apply saved state, keeping calculation-related state null
                    const persistentState = {
                        lang: loadedState.lang || 'hu',
                        theme: loadedState.theme || 'dark',
                        eurHufRate: loadedState.eurHufRate || 400.0,
                        eurHufRateDate: loadedState.eurHufRateDate || null,
                        customMaterials: loadedState.customMaterials || {},
                        favorites: loadedState.favorites || [],
                        productFavorites: loadedState.productFavorites || [],
                        pipeDimUnits: loadedState.pipeDimUnits || { outerDiameter: 'mm', wallThickness: 'mm' }
                    };
                    Object.assign(state, persistentState);

                } catch (e) {
                    console.error("Could not load state, starting fresh.", e);
                    localStorage.removeItem('steelCalcState');
                }
            }
        }
    };
    
    async function fetchAppData() {
        try {
            // Using a relative path which is more robust across different environments.
            const response = await fetch('./data.json', { cache: 'no-store' });
            if (!response.ok) throw new Error('Network response not ok');
            APP_DATA = await response.json();
            return true;
        } catch(error) {
            console.error("Failed to load application data. App cannot start.", error);
            document.body.innerHTML = "Error loading application data. Please try again later.";
            return false;
        }
    }

    async function fetchExchangeRate() {
        try {
            const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=HUF');
            if (!response.ok) throw new Error('Network response not ok');
            const data = await response.json();
            if (data.rates && data.rates.HUF) {
                state.eurHufRate = data.rates.HUF;
                state.eurHufRateDate = data.date;
                DOMElements.eurHufRate.value = state.eurHufRate.toFixed(2);
                updateExchangeRateDateDisplay();
                storage.saveState();
                calculate();
            }
        } catch (error) {
            console.error('Could not fetch exchange rate.', error);
        }
    }

    // --- UI Kezelés (Modals, Theme, Language) ---
    function openModal(modal) { modal.classList.add('active'); }
    function closeModal(modal) {
        modal.classList.remove('active'); 
    }

    function setLanguage(lang) {
        const { LANG } = APP_DATA;
        if (!LANG[lang]) lang = 'hu';
        state.lang = lang;
        DOMElements.langSelector.value = lang;
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (LANG[lang][key]) el.innerText = LANG[lang][key];
        });
        document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
            const key = el.getAttribute('data-lang-placeholder');
            if (LANG[lang][key]) el.placeholder = LANG[lang][key];
        });
        document.querySelectorAll('[data-lang-title]').forEach(el => {
            const key = el.getAttribute('data-lang-title');
                if (LANG[lang][key]) el.title = LANG[lang][key];
        });
        // Refresh display texts
        updateProductTypeDisplay();
        updateMaterialDisplay();
        updateStandardSizeDisplay();
        updateDimensionFields();
        updateExchangeRateDateDisplay();
        storage.saveState();
    }

    function applyTheme(theme) {
        state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        DOMElements.themeIconSun.style.display = theme === 'dark' ? 'none' : 'block';
        DOMElements.themeIconMoon.style.display = theme === 'dark' ? 'block' : 'none';
        storage.saveState();
    }
    
    function updateExchangeRateDateDisplay() {
        if (!DOMElements.exchangeRateDate) return;
        if (state.eurHufRateDate === 'manual') {
            DOMElements.exchangeRateDate.textContent = `(${APP_DATA.LANG[state.lang].manualEntry})`;
        } else if (state.eurHufRateDate) {
            DOMElements.exchangeRateDate.textContent = `(${state.eurHufRateDate})`;
        } else {
            DOMElements.exchangeRateDate.textContent = '';
        }
    }

    // --- Új Modális Választó Rendszer ---
    function openSelectionModal(type) {
        const { LANG } = APP_DATA;
        const modal = DOMElements.selectionModal;
        const modalTitle = modal.querySelector('#selection-modal-title');
        const modalBody = modal.querySelector('#selection-modal-body');
        
        modalBody.innerHTML = ''; // Clear previous content

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'selection-modal-search';
        searchInput.className = 'input';
        searchInput.placeholder = LANG[state.lang].search;
        modalBody.appendChild(searchInput);
        
        const listContainer = document.createElement('div');
        listContainer.className = 'selection-list-container';
        modalBody.appendChild(listContainer);

        let listElement;
        let titleKey;

        switch (type) {
            case 'material':
                titleKey = 'material';
                listElement = createMaterialList();
                break;
            case 'product':
                titleKey = 'productType';
                listElement = createProductList();
                break;
            case 'standardSize':
                titleKey = 'standardSize';
                listElement = createStandardSizeList();
                break;
        }
        
        modalTitle.textContent = LANG[state.lang][titleKey] || 'Select';
        
        if (listElement && listElement.hasChildNodes()) {
            listContainer.appendChild(listElement);
            modal.dataset.type = type;
            searchInput.addEventListener('input', handleModalSearch);
            openModal(modal);
        }
    }
    
    function handleModalSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const modal = DOMElements.selectionModal;
        const groups = modal.querySelectorAll('li > .group-header');

        groups.forEach(header => {
            const list = header.nextElementSibling;
            let hasVisibleChild = false;
            if (list && list.classList.contains('option-list')) {
                const options = list.querySelectorAll('.option');
                options.forEach(option => {
                    const text = option.textContent.toLowerCase();
                    const match = text.includes(searchTerm);
                    option.style.display = match ? '' : 'none';
                    if (match) hasVisibleChild = true;
                });
            }
            
            const groupLi = header.parentElement;
            groupLi.style.display = hasVisibleChild ? '' : 'none';

            if (searchTerm) {
                if (hasVisibleChild) {
                    header.classList.remove('collapsed');
                    list.classList.remove('collapsed');
                }
            } else { // search is empty, restore default
                const isExpandedDefault = header.dataset.expandedDefault === 'true';
                header.classList.toggle('collapsed', !isExpandedDefault);
                list.classList.toggle('collapsed', !isExpandedDefault);
            }
        });
    }

    // --- Lista Generátor Funkciók ---
    function createMaterialList() {
        const { MATERIAL_DENSITIES, MATERIAL_GROUPS, LANG } = APP_DATA;
        const allMaterials = { ...MATERIAL_DENSITIES, ...state.customMaterials };
        const listRoot = document.createElement('ul');

        const createOption = (key) => {
            const li = document.createElement('li');
            li.className = 'option';
            li.dataset.value = key;
            li.textContent = key;
            return li;
        };

        const createGroup = (labelKey, keys, isExpanded = false) => {
            if (!keys || keys.length === 0) return;
            const groupLi = document.createElement('li');
            const header = document.createElement('div');
            header.className = 'group-header';
            header.dataset.expandedDefault = isExpanded;
            if (!isExpanded) header.classList.add('collapsed');
            header.textContent = LANG[state.lang][labelKey] || labelKey;
            
            const optionList = document.createElement('ul');
            optionList.className = 'option-list';
            if (!isExpanded) optionList.classList.add('collapsed');
            
            keys.sort((a,b) => a.localeCompare(b)).forEach(key => {
                if (allMaterials[key]) optionList.appendChild(createOption(key));
            });
            
            if (optionList.childElementCount > 0) {
                groupLi.appendChild(header);
                groupLi.appendChild(optionList);
                listRoot.appendChild(groupLi);
            }
        };
        
        createGroup('favorites', state.favorites, true);
        const customKeys = Object.keys(state.customMaterials).filter(k => !state.favorites.includes(k));
        createGroup('customMaterials', customKeys, true);

        Object.keys(MATERIAL_GROUPS).forEach(groupKey => {
            const members = MATERIAL_GROUPS[groupKey].filter(k => !state.favorites.includes(k) && !customKeys.includes(k) && MATERIAL_DENSITIES[k]);
            if(members.length > 0) createGroup(groupKey, members, false);
        });
        return listRoot;
    }

    function createProductList() {
        const { PRODUCT_TYPES, LANG } = APP_DATA;
        const listRoot = document.createElement('ul');
        const specialProfiles = ['angleProfile', 'iBeam', 'uChannel'];

        const createOption = (key) => {
            const li = document.createElement('li');
            li.className = 'option';
            li.dataset.value = key;
            li.textContent = LANG[state.lang][key] || key;
            return li;
        };
        
        const createGroup = (labelKey, keys, isExpanded = false) => {
            if (!keys || keys.length === 0) return;
            const groupLi = document.createElement('li');
            const header = document.createElement('div');
            header.className = 'group-header';
            header.dataset.expandedDefault = isExpanded;
            if (!isExpanded) header.classList.add('collapsed');
            header.textContent = LANG[state.lang][labelKey] || labelKey;
            
            const optionList = document.createElement('ul');
            optionList.className = 'option-list';
            if (!isExpanded) optionList.classList.add('collapsed');
            
            keys.sort((a,b) => (LANG[state.lang][a] || a).localeCompare(LANG[state.lang][b] || b))
                .forEach(key => optionList.appendChild(createOption(key)));
            
            if (optionList.childElementCount > 0) {
                groupLi.appendChild(header);
                groupLi.appendChild(optionList);
                listRoot.appendChild(groupLi);
            }
        };
        
        createGroup('favorites', state.productFavorites, true);
        createGroup('productType', Object.keys(PRODUCT_TYPES).filter(p => !specialProfiles.includes(p) && !state.productFavorites.includes(p)), false);
        createGroup('specialProfiles', specialProfiles.filter(p => !state.productFavorites.includes(p)), false);
        return listRoot;
    }

    function createStandardSizeList() {
        const { STANDARD_PROFILES, LANG } = APP_DATA;
        const listRoot = document.createElement('ul');
        const profileData = state.selectedProduct ? STANDARD_PROFILES[state.selectedProduct] : null;

        if (!profileData) return listRoot;

        const createOption = (key, value) => {
            const li = document.createElement('li');
            li.className = 'option';
            li.dataset.value = value;
            li.textContent = key;
            return li;
        };

        Object.entries(profileData).forEach(([series, sizes]) => {
            const groupLi = document.createElement('li');
            const header = document.createElement('div');
            header.className = 'group-header';
            header.textContent = LANG[state.lang][series] || series;
            const optionList = document.createElement('ul');
            optionList.className = 'option-list';

            Object.keys(sizes).sort((a,b) => {
                const numA = a.match(/\d+/g) ? parseInt(a.match(/\d+/g)[0]) : 0;
                const numB = b.match(/\d+/g) ? parseInt(b.match(/\d+/g)[0]) : 0;
                return numA - numB;
            }).forEach(sizeKey => {
                optionList.appendChild(createOption(sizeKey, `${series}-${sizeKey}`));
            });

            if(optionList.hasChildNodes()) {
                groupLi.appendChild(header);
                groupLi.appendChild(optionList);
                listRoot.appendChild(groupLi);
            }
        });
        return listRoot;
    }


    // --- Kijelző frissítő és kiválasztó funkciók ---
    function updateMaterialDisplay() {
        const { LANG, MATERIAL_DENSITIES } = APP_DATA;
        const allMaterials = { ...MATERIAL_DENSITIES, ...state.customMaterials };
        if (state.selectedMaterial && allMaterials[state.selectedMaterial]) {
            const density = allMaterials[state.selectedMaterial];
            DOMElements.materialSelectDisplay.textContent = `${state.selectedMaterial} (${density} kg/m³)`;
        } else {
            DOMElements.materialSelectDisplay.textContent = LANG[state.lang].selectMaterial;
        }
        updateFavoriteButtonState();
    }
    
    function selectMaterial(materialName) {
        if (!materialName) return;
        state.selectedMaterial = materialName;
        updateMaterialDisplay();
        calculate();
        storage.saveState();
    }
    
    function updateProductTypeDisplay() {
        const { LANG } = APP_DATA;
        if (state.selectedProduct) {
            DOMElements.productTypeSelectDisplay.textContent = LANG[state.lang][state.selectedProduct] || state.selectedProduct;
        } else {
            DOMElements.productTypeSelectDisplay.textContent = LANG[state.lang].selectProduct;
        }
        updateProductFavoriteButtonState();
    }
    
    function selectProductType(productType) {
        if (productType === state.selectedProduct) return;
        state.selectedProduct = productType;
        state.selectedMaterial = null; // Anyagot is töröljük, ha új termék van
        resetDimensionInputs();
        updateMaterialDisplay();
        updateProductTypeDisplay();
        updateDimensionFields(); 
        storage.saveState();
    }

    function updateStandardSizeDisplay() {
        const { LANG } = APP_DATA;
        if(state.selectedStandardSize) {
             const [_, size] = state.selectedStandardSize.split('-');
             DOMElements.standardSizeSelectDisplay.textContent = size;
        } else {
             DOMElements.standardSizeSelectDisplay.textContent = LANG[state.lang].selectSize;
        }
    }
    
    function selectStandardSize(value, fillDims = true) {
        if (!value) return;
        state.selectedStandardSize = value;
        updateStandardSizeDisplay();
        
        if(fillDims) {
            const [series, size] = value.split('-');
            const dims = APP_DATA.STANDARD_PROFILES[state.selectedProduct]?.[series]?.[size];
            if(dims) fillDimensionsFromStandardSize(dims);
        }
        storage.saveState();
    }

    function updateFavoriteButtonState() {
        DOMElements.favoriteToggleBtn.classList.toggle('is-favorite', state.favorites.includes(state.selectedMaterial));
    }

    function updateProductFavoriteButtonState() {
        DOMElements.productFavoriteToggleBtn.classList.toggle('is-favorite', state.productFavorites.includes(state.selectedProduct));
    }

    function updateDimensionFields() {
        const { PRODUCT_TYPES, LANG } = APP_DATA;
        const productType = state.selectedProduct;
        const config = PRODUCT_TYPES[productType];

        DOMElements.dimensionFields.innerHTML = '';
        if (!config) {
            DOMElements.standardSizeContainer.style.display = 'none';
            calculate();
            return;
        }
        
        config.dims.forEach(({ id, unit, key }) => {
            const isRadius = key && (key.startsWith('r') || key === 'v');
            if (isRadius && key !=='v') return;

            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            let unitDisplay = productType === 'pipe'
                ? `<button class="pipe-unit-toggle" data-dim-id="${id}">${state.pipeDimUnits[id]}</button>`
                : `<span>${unit}</span>`;

            const symbol = key ? `(${key})` : '';
            const labelText = `${LANG[state.lang][id] || id} ${symbol}`;

            formGroup.innerHTML = `
                <label for="dim-${id}">${labelText}</label>
                <div class="dimension-input-group">
                    <input type="number" id="dim-${id}" class="input dimension-input" min="0" step="0.1">
                    ${unitDisplay}
                </div>`;
            DOMElements.dimensionFields.appendChild(formGroup);
        });
        
        const hasStandardProfile = !!APP_DATA.STANDARD_PROFILES[productType];
        DOMElements.standardSizeContainer.style.display = hasStandardProfile ? 'block' : 'none';
        if(!hasStandardProfile) state.selectedStandardSize = null;
        updateStandardSizeDisplay();

        calculate();
    }
            
    function fillDimensionsFromStandardSize(dims) {
        const { PRODUCT_TYPES } = APP_DATA;
        PRODUCT_TYPES[state.selectedProduct].dims.forEach((dimConfig) => {
            if (dimConfig.key.startsWith('r')) return;
            const input = document.getElementById(`dim-${dimConfig.id}`);
            if(input && dims[dimConfig.key] !== undefined) {
                input.value = dims[dimConfig.key];
            }
        });
        calculate();
    }
            
    // --- Fő Számítási Logika ---
    function getDimensions() {
        const { PRODUCT_TYPES, STANDARD_PROFILES } = APP_DATA;
        const values = {};
        const productType = state.selectedProduct;
        if(!productType) return {};

        const sizeValue = state.selectedStandardSize;
        const isStandardSize = sizeValue && DOMElements.standardSizeContainer.style.display !== 'none';
        let standardDims = {};
        if (isStandardSize) {
             const [series, size] = sizeValue.split('-');
             standardDims = STANDARD_PROFILES[productType]?.[series]?.[size] || {};
        }

        PRODUCT_TYPES[productType].dims.forEach(dimConfig => {
            const input = document.getElementById(`dim-${dimConfig.id}`);
            let value;
            if(input) {
                value = parseFloat(input.value) || 0;
                if (productType === 'pipe' && state.pipeDimUnits[dimConfig.id] === 'inch') {
                    value *= 25.4;
                }
            } else {
                value = standardDims[dimConfig.key] || 0;
            }
            values[dimConfig.id] = value;
        });

        if (!isStandardSize) {
            const t = values.wallThickness || 0;
            if (values.cornerRadius === 0 && (productType === 'squareProfile' || productType === 'flatProfile')) {
                values.cornerRadius = t > 0 ? t * 1.5 : (values.sideA || values.width || 0) * 0.1;
            }
            if (values.outerCornerRadius === 0 && productType === 'tube') {
                values.outerCornerRadius = t > 0 ? t * 2 : (values.width || 0) * 0.1;
            }
            if (values.filletRadius === 0 && (productType === 'iBeam' || productType === 'uChannel' || productType === 'angleProfile')) {
                 values.filletRadius = (values.webThickness || t) * 1.5;
            }
        }
        return values;
    }
            
    function calculate() {
        const { MATERIAL_DENSITIES, STANDARD_PROFILES, LANG } = APP_DATA;
        const productType = state.selectedProduct;
        const materialName = state.selectedMaterial;
        const allMaterials = { ...MATERIAL_DENSITIES, ...state.customMaterials };
        const density = allMaterials[materialName] || 0;
        const dims = getDimensions();
        
        let crossSectionMm2 = 0;
        let weightPerMeter = 0;
        let isTableWeight = false;

        if (state.selectedStandardSize && density > 0) {
            const [series, size] = state.selectedStandardSize.split('-');
            const standardProfile = STANDARD_PROFILES[productType]?.[series]?.[size];
            if (standardProfile && standardProfile.weight) {
                weightPerMeter = standardProfile.weight;
                crossSectionMm2 = (weightPerMeter / density) * 1000000;
                isTableWeight = true;
            }
        }

        if (!isTableWeight) {
            crossSectionMm2 = calculateCrossSection(productType, dims);
            weightPerMeter = crossSectionMm2 / 1000000 * density;
        }

        const surfaceAreaPerMeter = calculateSurfaceAreaPerMeter(productType, dims);
        const lengthValue = parseFloat(DOMElements.lengthInput.value) || 0;
        const lengthM = state.lengthUnit === 'm' ? lengthValue : lengthValue / 1000;
        
        const weightResultItem = DOMElements.resultWeightMeter.closest('.result-item');
        if (isTableWeight) {
            weightResultItem.classList.add('table-value');
            weightResultItem.title = LANG[state.lang].tableWeightTooltip;
        } else {
            weightResultItem.classList.remove('table-value');
            weightResultItem.title = '';
        }
        
        DOMElements.lengthUnitToggle.innerText = state.lengthUnit;
        DOMElements.crossSectionUnitToggle.innerText = (state.crossSectionUnit === 'm2') ? 'm²' : 'mm²';

        if (weightPerMeter > 0 && density > 0) {
            DOMElements.perMeterResultsSection.classList.remove('results-disabled');
            DOMElements.resultCrossSection.innerText = (state.crossSectionUnit === 'm2') ? (crossSectionMm2 / 1000000).toExponential(3) : crossSectionMm2.toFixed(2);
            DOMElements.resultWeightMeter.innerText = weightPerMeter.toFixed(3);
            DOMElements.resultSurfaceArea.innerText = surfaceAreaPerMeter.toFixed(4);
            
            DOMElements.lengthInput.disabled = false;

            if (lengthM > 0) {
                DOMElements.resultsTotalWrapper.classList.remove('results-disabled');
                const endCapAreaM2 = 2 * (crossSectionMm2 / 1000000);
                DOMElements.resultTotalWeight.innerText = (weightPerMeter * lengthM).toFixed(3);
                DOMElements.resultTotalSurface.innerText = (surfaceAreaPerMeter * lengthM + endCapAreaM2).toFixed(4);
            } else {
                DOMElements.resultsTotalWrapper.classList.add('results-disabled');
                [DOMElements.resultTotalWeight, DOMElements.resultTotalSurface, DOMElements.resultTotalPrice].forEach(field => field.innerText = '');
            }
        } else {
            DOMElements.perMeterResultsSection.classList.add('results-disabled');
            [DOMElements.resultCrossSection, DOMElements.resultWeightMeter, DOMElements.resultSurfaceArea].forEach(field => field.innerText = '');

            DOMElements.lengthInput.disabled = true;
            if(document.activeElement !== DOMElements.lengthInput) DOMElements.lengthInput.value = '';

            DOMElements.resultsTotalWrapper.classList.add('results-disabled');
            [DOMElements.resultTotalWeight, DOMElements.resultTotalSurface, DOMElements.resultTotalPrice].forEach(field => field.innerText = '');
        }
        updatePrices();
    }

    function updatePrices(sourceEvent = null) {
        const weightPerMeter = parseFloat(DOMElements.resultWeightMeter.innerText) || 0;
        
        if (sourceEvent) {
            const inputEl = sourceEvent.target;
            const value = parseFloat(inputEl.value) || 0;
            const unit = inputEl.dataset.unit;
            const rate = state.eurHufRate;
            
            if (unit === 'kg') {
                state.priceHufKg = state.priceCurrency === 'HUF' ? value : value * rate;
            } else if (unit === 'm') {
                const valuePerMeter = state.priceCurrency === 'HUF' ? value : value * rate;
                state.priceHufKg = weightPerMeter > 0 ? valuePerMeter / weightPerMeter : 0;
            }
            storage.saveState();
        }

        const lengthValue = parseFloat(DOMElements.lengthInput.value) || 0;
        const lengthM = state.lengthUnit === 'm' ? lengthValue : lengthValue / 1000;
        const rate = state.eurHufRate;

        const valuePerKgCurrentCurrency = state.priceCurrency === 'HUF' ? state.priceHufKg : (rate > 0 ? state.priceHufKg / rate : 0);
        const valuePerMeterCurrentCurrency = valuePerKgCurrentCurrency * weightPerMeter;

        if (document.activeElement !== DOMElements.pricePerKg) {
            DOMElements.pricePerKg.value = valuePerKgCurrentCurrency > 0 ? valuePerKgCurrentCurrency.toFixed(2) : '';
        }
        if (document.activeElement !== DOMElements.pricePerMeter) {
            DOMElements.pricePerMeter.value = valuePerMeterCurrentCurrency > 0 ? valuePerMeterCurrentCurrency.toFixed(2) : '';
        }

        if (weightPerMeter > 0 && lengthM > 0) {
            const totalPriceHuf = state.priceHufKg * weightPerMeter * lengthM;
            const totalPriceCurrentCurrency = state.priceCurrency === 'HUF' ? totalPriceHuf : (rate > 0 ? totalPriceHuf / rate : 0);
            DOMElements.resultTotalPrice.innerText = totalPriceCurrentCurrency.toFixed(2);
        } else {
             DOMElements.resultTotalPrice.innerText = '';
        }
        [DOMElements.priceUnitToggleKg, DOMElements.priceUnitToggleM, DOMElements.totalPriceUnitToggle].forEach(el => el.innerText = state.priceCurrency);
    }
            
    function resetDimensionInputs() {
        document.querySelectorAll('.dimension-input').forEach(input => input.value = '');
        DOMElements.lengthInput.value = '';
        state.selectedStandardSize = null;
        updateStandardSizeDisplay();
    }

    function resetAllInputs() {
        state.selectedProduct = null;
        state.selectedMaterial = null;

        updateProductTypeDisplay();
        updateMaterialDisplay();

        resetDimensionInputs();
        
        DOMElements.pricePerKg.value = '';
        DOMElements.pricePerMeter.value = '';
        state.priceHufKg = 0;
        
        updateDimensionFields();
        storage.saveState();
        calculate();
    }

    // --- Anyagkezelő Logika ---
    function handleAddOrUpdateMaterial() {
        const name = DOMElements.newMaterialName.value.trim();
        const density = parseFloat(DOMElements.newMaterialDensity.value);
        const editingName = DOMElements.editingMaterialName.value;
        const { LANG } = APP_DATA;

        if (!name || !density || density <= 0) return;
        
        if (editingName && editingName !== name) {
            delete state.customMaterials[editingName];
            const favIndex = state.favorites.indexOf(editingName);
            if (favIndex > -1) state.favorites[favIndex] = name;
        }

        state.customMaterials[name] = density;
        storage.saveState();
        renderAllMaterialsList();
        updateMaterialDisplay();
        DOMElements.newMaterialName.value = DOMElements.newMaterialDensity.value = DOMElements.editingMaterialName.value = '';
        DOMElements.addMaterialBtn.innerText = LANG[state.lang].add;
    }

    function renderAllMaterialsList() {
        const { MATERIAL_DENSITIES, LANG } = APP_DATA;
        DOMElements.allMaterialsList.innerHTML = '';
        const lang = state.lang;
        const allMaterials = { ...state.customMaterials, ...MATERIAL_DENSITIES };
        Object.keys(allMaterials).sort((a,b) => a.localeCompare(b)).forEach(name => {
            const isCustom = !!state.customMaterials[name];
            const isFavorite = state.favorites.includes(name);
            const li = document.createElement('li');
            li.className = 'material-list-item';
            li.innerHTML = `
                <div class="material-info">
                    <button class="favorite-btn ${isFavorite ? 'is-favorite' : ''}" data-name="${name}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                    <span><strong>${name}</strong> (${allMaterials[name]} kg/m³)</span>
                </div>
                <div class="material-actions">
                    ${isCustom ? `
                    <button class="edit-material-btn" data-name="${name}" title="${LANG[lang].edit}"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button class="delete-material-btn" data-name="${name}" title="${LANG[lang].delete}"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1 -2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    ` : ''}
                </div>`;
            DOMElements.allMaterialsList.appendChild(li);
        });
    }

    // --- Layout Kezelés ---
    function initResizer() {
        const resizer = DOMElements.resizer;
        const main = DOMElements.mainContainer;
        resizer.addEventListener('mousedown', function(e) {
            e.preventDefault();
            resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
            const mouseMoveHandler = (e) => {
                const containerRect = main.getBoundingClientRect(); const minWidth = 350;
                let newLeftWidth = e.clientX - containerRect.left;
                if (newLeftWidth < minWidth) newLeftWidth = minWidth;
                const maxLeftWidth = containerRect.width - minWidth - resizer.offsetWidth;
                if (newLeftWidth > maxLeftWidth) newLeftWidth = maxLeftWidth;
                main.style.gridTemplateColumns = `${newLeftWidth}px 10px 1fr`;
            };
            const mouseUpHandler = () => {
                resizer.classList.remove('resizing');
                document.body.style.cursor = ''; document.body.style.userSelect = '';
                window.removeEventListener('mousemove', mouseMoveHandler);
                window.removeEventListener('mouseup', mouseUpHandler);
            };
            window.addEventListener('mousemove', mouseMoveHandler); window.addEventListener('mouseup', mouseUpHandler);
        });
    }

    // --- Eseménykezelők Beállítása ---
    function setupEventListeners() {
        DOMElements.langSelector.addEventListener('change', (e) => setLanguage(e.target.value));
        DOMElements.themeToggle.addEventListener('click', () => applyTheme(state.theme === 'light' ? 'dark' : 'light'));
        DOMElements.resetBtn.addEventListener('click', resetAllInputs);
        
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('.collapsible-header');
            if (target) {
                const body = target.nextElementSibling;
                const icon = target.querySelector('.collapse-icon');
                if (body && body.classList.contains('card-body')) {
                    body.classList.toggle('collapsed');
                    icon.classList.toggle('collapsed');
                }
            }
        });

        DOMElements.crossSectionUnitToggle.addEventListener('click', () => {
            state.crossSectionUnit = state.crossSectionUnit === 'mm2' ? 'm2' : 'mm2';
            storage.saveState(); calculate();
        });
        
        DOMElements.lengthUnitToggle.addEventListener('click', () => {
            const currentVal = parseFloat(DOMElements.lengthInput.value) || 0;
            if (state.lengthUnit === 'mm') {
                state.lengthUnit = 'm';
                if (currentVal > 0) DOMElements.lengthInput.value = (currentVal / 1000).toPrecision(4);
            } else {
                state.lengthUnit = 'mm';
                if (currentVal > 0) DOMElements.lengthInput.value = String(Math.round(currentVal * 1000));
            }
            storage.saveState();
            calculate();
        });

        // Modal Openers
        DOMElements.materialSelectDisplay.addEventListener('click', () => openSelectionModal('material'));
        DOMElements.productTypeSelectDisplay.addEventListener('click', () => openSelectionModal('product'));
        DOMElements.standardSizeSelectDisplay.addEventListener('click', () => openSelectionModal('standardSize'));

        DOMElements.selectionModal.addEventListener('click', (e) => {
            if (e.target === DOMElements.selectionModal || e.target.closest('.modal-close-btn')) {
                closeModal(DOMElements.selectionModal);
                return;
            }

            const header = e.target.closest('.group-header');
            if (header) {
                header.classList.toggle('collapsed');
                const list = header.nextElementSibling;
                if (list && list.classList.contains('option-list')) {
                    list.classList.toggle('collapsed');
                }
                return;
            }

            const option = e.target.closest('.option');
            if (option) {
                const type = DOMElements.selectionModal.dataset.type;
                const value = option.dataset.value;
                
                if (type === 'material') selectMaterial(value);
                else if (type === 'product') selectProductType(value);
                else if (type === 'standardSize') selectStandardSize(value);
                
                closeModal(DOMElements.selectionModal);
            }
        });
        
        DOMElements.favoriteToggleBtn.addEventListener('click', () => {
            const name = state.selectedMaterial; if (!name) return;
            const index = state.favorites.indexOf(name);
            if (index > -1) state.favorites.splice(index, 1); else state.favorites.push(name);
            storage.saveState(); updateFavoriteButtonState();
        });
        
        DOMElements.productFavoriteToggleBtn.addEventListener('click', () => {
            const name = state.selectedProduct; if(!name) return;
            const index = state.productFavorites.indexOf(name);
            if (index > -1) state.productFavorites.splice(index, 1); else state.productFavorites.push(name);
            storage.saveState(); updateProductFavoriteButtonState();
        });

        DOMElements.dimensionFields.addEventListener('input', (e) => {
            if (e.target.matches('.dimension-input')) {
                state.selectedStandardSize = null;
                updateStandardSizeDisplay();
                calculate();
            }
        });

        DOMElements.dimensionFields.addEventListener('click', (e) => {
            const target = e.target;
            if (!target.matches('.pipe-unit-toggle')) return;
            
            const dimId = target.dataset.dimId;
            const input = document.getElementById(`dim-${dimId}`);
            const currentVal = parseFloat(input.value) || 0;

            if (state.pipeDimUnits[dimId] === 'mm') {
                state.pipeDimUnits[dimId] = 'inch';
                if (currentVal > 0) input.value = (currentVal / 25.4).toPrecision(4);
            } else {
                state.pipeDimUnits[dimId] = 'mm';
                if (currentVal > 0) input.value = (currentVal * 25.4).toFixed(2);
            }
            target.innerText = state.pipeDimUnits[dimId];
            storage.saveState(); calculate();
        });

        DOMElements.lengthInput.addEventListener('input', calculate);

        // Price input listeners for real-time calculation
        DOMElements.pricePerKg.addEventListener('input', updatePrices);
        DOMElements.pricePerMeter.addEventListener('input', updatePrices);

        DOMElements.eurHufRate.addEventListener('input', (e) => {
            state.eurHufRate = parseFloat(e.target.value) || 0;
            state.eurHufRateDate = 'manual';
            updateExchangeRateDateDisplay();
            storage.saveState();
            updatePrices();
        });
        DOMElements.exchangeRateResetBtn.addEventListener('click', fetchExchangeRate);
        [DOMElements.priceUnitToggleKg, DOMElements.priceUnitToggleM, DOMElements.totalPriceUnitToggle].forEach(el => el.addEventListener('click', () => {
            state.priceCurrency = state.priceCurrency === 'HUF' ? 'EUR' : 'HUF';
            
            if (state.priceCurrency === 'EUR') {
                const body = document.getElementById('exchange-rate-body');
                const icon = document.querySelector('#exchange-rate-header .collapse-icon');
                if (body.classList.contains('collapsed')) {
                    body.classList.remove('collapsed');
                    icon.classList.remove('collapsed');
                }
            }

            storage.saveState();
            updatePrices();
        }));

        DOMElements.manageMaterialsBtn.addEventListener('click', () => { renderAllMaterialsList(); openModal(DOMElements.materialsModal); });
        DOMElements.addMaterialBtn.addEventListener('click', handleAddOrUpdateMaterial);
        DOMElements.materialsModal.querySelector('.modal-close-btn').addEventListener('click', () => closeModal(DOMElements.materialsModal));


        DOMElements.allMaterialsList.addEventListener('click', (e) => {
            const { LANG } = APP_DATA; const target = e.target.closest('button'); if (!target) return;
            const name = target.dataset.name;
            if (target.classList.contains('favorite-btn')) {
                const index = state.favorites.indexOf(name);
                if (index > -1) state.favorites.splice(index, 1); else state.favorites.push(name);
                storage.saveState(); renderAllMaterialsList(); updateFavoriteButtonState();
            } else if (target.classList.contains('edit-material-btn')) {
                DOMElements.newMaterialName.value = name; DOMElements.newMaterialDensity.value = state.customMaterials[name];
                DOMElements.editingMaterialName.value = name; DOMElements.addMaterialBtn.innerText = LANG[state.lang].save;
            } else if (target.classList.contains('delete-material-btn')) {
                if (confirm(`Biztosan törli a(z) "${name}" anyagot?`)) {
                    delete state.customMaterials[name];
                    state.favorites = state.favorites.filter(fav => fav !== name);
                    if (state.selectedMaterial === name) {
                         state.selectedMaterial = null;
                         updateMaterialDisplay();
                    }
                    storage.saveState(); renderAllMaterialsList();
                }
            }
        });
    }

    // --- Alkalmazás Indítása ---
    async function init() {
        storage.loadState(); // Loads persistent settings
        
        // Ensure calculation state is fresh on every load
        state.selectedMaterial = null;
        state.selectedProduct = null;
        state.selectedStandardSize = null;
        state.priceHufKg = 0;
        state.priceCurrency = 'HUF';
        state.crossSectionUnit = 'mm2';
        state.lengthUnit = 'mm';

        if (!await fetchAppData()) return;
        
        const { LANG } = APP_DATA;
        Object.keys(LANG).forEach(lang => {
            const option = document.createElement('option');
            option.value = lang; option.innerText = lang.toUpperCase();
            DOMElements.langSelector.appendChild(option);
        });
        
        const browserLang = navigator.language.split('-')[0];
        setLanguage(state.lang || (LANG[browserLang] ? browserLang : 'hu'));
        applyTheme(state.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

        DOMElements.appVersion.textContent = APP_VERSION;
        DOMElements.eurHufRate.value = state.eurHufRate.toFixed(2);
        updateExchangeRateDateDisplay();
        DOMElements.copyrightYear.textContent = new Date().getFullYear().toString();
        
        resetAllInputs(); // This will clear displays and fields

        if (state.eurHufRateDate !== 'manual') {
            fetchExchangeRate();
        }
        
        initResizer();
        setupEventListeners();
    }

    init();
});
