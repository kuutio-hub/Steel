
import { calculateCrossSection, calculateSurfaceAreaPerMeter } from './calculator.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Globális változók és állapot ---
    let APP_DATA = {};
    let HISTORICAL_RATES = {};
    const APP_VERSION = '1.7.0';

    let state = {
        lang: 'hu', theme: 'dark', eurHufRate: 400.0, priceCurrency: 'HUF',
        customMaterials: {}, favorites: [], productFavorites: [],
        crossSectionUnit: 'mm2', lengthUnit: 'mm', selectedMaterial: null, selectedProduct: null, selectedStandardSize: null,
        priceHufKg: 0,
        pipeDimUnits: { outerDiameter: 'mm', wallThickness: 'mm' },
        charts: { current: null },
        materialFilterActive: true,
    };

    // --- DOM Elemek Gyűjtése ---
    const DOMElements = {};
    const domIds = [
        'main-container', 'resizer', 'lang-selector', 'theme-toggle', 'theme-icon-sun', 'theme-icon-moon', 'reset-btn',
        'material-select-custom', 'favorite-toggle-btn', 'product-type-select-custom', 'product-favorite-toggle-btn', 
        'standard-size-container', 'standard-size-select-custom', 'dimension-fields', 'length-input', 'length-unit-toggle',
        'per-meter-results-section', 'results-total-wrapper', 'result-cross-section', 'cross-section-unit-toggle', 'result-weight-meter', 'result-surface-area', 
        'result-total-weight', 'result-total-surface', 'result-total-price', 'total-price-unit-toggle', 
        'eur-huf-rate', 'exchange-rate-chart-btn', 'exchange-rate-reset-btn', 'price-per-kg', 'price-per-meter', 'price-unit-toggle-kg', 
        'price-unit-toggle-m', 'manage-materials-btn', 'materials-modal', 
        'chart-popup-overlay', 'chart-popup-content', 'chart-popup-title', 'chart-popup-body',
        'chart-start-date', 'chart-end-date', 'chart-range-1m', 'chart-range-1y',
        'new-material-name', 'new-material-density', 'add-material-btn', 'all-materials-list', 
        'editing-material-name', 'copyright-year', 'app-version'
    ];
    domIds.forEach(id => {
        const camelCaseId = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
        DOMElements[camelCaseId] = document.getElementById(id);
    });
    
    // Custom Selects
    DOMElements.materialSelectDisplay = document.querySelector('#material-select-custom .custom-select-display');
    DOMElements.materialSelectOptions = document.querySelector('#material-select-custom .custom-select-options');
    DOMElements.productTypeSelectDisplay = document.querySelector('#product-type-select-custom .custom-select-display');
    DOMElements.productTypeSelectOptions = document.querySelector('#product-type-select-custom .custom-select-options');
    DOMElements.standardSizeSelectDisplay = document.querySelector('#standard-size-select-custom .custom-select-display');
    DOMElements.standardSizeSelectOptions = document.querySelector('#standard-size-select-custom .custom-select-options');


    // --- Adatkezelés és API ---
    const storage = {
        saveState: () => {
            const stateToSave = { ...state };
            delete stateToSave.charts;
            localStorage.setItem('steelCalcState', JSON.stringify(stateToSave));
        },
        loadState: () => {
            const saved = localStorage.getItem('steelCalcState');
            if (saved) {
                try {
                    const loadedState = JSON.parse(saved);
                    if (!loadedState.pipeDimUnits) {
                        loadedState.pipeDimUnits = { outerDiameter: 'mm', wallThickness: 'mm' };
                    }
                    Object.assign(state, loadedState, { charts: { current: null } });
                } catch (e) {
                    console.error("Could not load state, starting fresh.", e);
                    localStorage.removeItem('steelCalcState');
                }
            }
        }
    };
    
    async function fetchAppData() {
        try {
            const response = await fetch('./data.json');
            if (!response.ok) throw new Error('Network response not ok');
            APP_DATA = await response.json();
            return true; // Siker
        } catch(error) {
            console.error("Failed to load application data. App cannot start.", error);
            document.body.innerHTML = "Error loading application data. Please try again later.";
            return false; // Hiba
        }
    }

    async function fetchHistoricalRates() {
        try {
            const response = await fetch('./exchange_rates.json');
            if (!response.ok) throw new Error('Network response not ok');
            HISTORICAL_RATES = await response.json();
        } catch(error) {
            console.error("Failed to load historical exchange rates.", error);
        }
    }

    async function fetchExchangeRate() {
        try {
            const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=HUF');
            if (!response.ok) throw new Error('Network response not ok');
            const data = await response.json();
            if (data.rates && data.rates.HUF) {
                state.eurHufRate = data.rates.HUF;
                DOMElements.eurHufRate.value = state.eurHufRate.toFixed(2);
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
        if(state.charts.current) {
            state.charts.current.destroy();
            state.charts.current = null;
        }
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
        populateProductTypeSelect();
        populateMaterialSelect();
        updateDimensionFields();
        storage.saveState();
    }

    function applyTheme(theme) {
        state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        DOMElements.themeIconSun.style.display = theme === 'dark' ? 'none' : 'block';
        DOMElements.themeIconMoon.style.display = theme === 'dark' ? 'block' : 'none';
        storage.saveState();
    }
            
    // --- Dinamikus UI Populáció ---
    function populateMaterialSelect() {
        const { MATERIAL_DENSITIES, MATERIAL_GROUPS, PRODUCT_MATERIAL_AVAILABILITY, LANG } = APP_DATA;
        DOMElements.materialSelectOptions.innerHTML = '';
        const allMaterials = { ...MATERIAL_DENSITIES, ...state.customMaterials };
        
        const createOption = (key, specialClass = '') => {
            const li = document.createElement('li');
            li.className = `option ${specialClass}`;
            li.dataset.value = key;
            li.textContent = key === 'show-all' ? LANG[state.lang].showAllMaterials : key;
            return li;
        };

        const productType = state.selectedProduct;
        const availableGroups = state.materialFilterActive && productType ? PRODUCT_MATERIAL_AVAILABILITY[productType] : Object.keys(MATERIAL_GROUPS);

        const createGroup = (labelKey, keys) => {
            if (!keys || keys.length === 0) return;
            const groupLi = document.createElement('li');
            const header = document.createElement('div');
            header.className = 'group-header';
            header.textContent = LANG[state.lang][labelKey] || labelKey;
            
            const optionList = document.createElement('ul');
            optionList.className = 'option-list';
            
            keys.sort((a,b) => a.localeCompare(b)).forEach(key => {
                if (allMaterials[key]) optionList.appendChild(createOption(key));
            });
            
            const isExpanded = ['favorites', 'customMaterials'].includes(labelKey);

            if (optionList.childElementCount > 0) {
                if (isExpanded) {
                    header.classList.add('expanded');
                    optionList.classList.add('expanded');
                }
                groupLi.appendChild(header);
                groupLi.appendChild(optionList);
                DOMElements.materialSelectOptions.appendChild(groupLi);
            }
        };
        
        createGroup('favorites', state.favorites);

        const customKeys = Object.keys(state.customMaterials).filter(k => !state.favorites.includes(k));
        createGroup('customMaterials', customKeys);
        
        Object.keys(MATERIAL_GROUPS).forEach(groupKey => {
            if(availableGroups.includes(groupKey)) {
                const members = MATERIAL_GROUPS[groupKey].filter(k => !state.favorites.includes(k) && !customKeys.includes(k) && MATERIAL_DENSITIES[k]);
                if(members.length > 0) createGroup(groupKey, members);
            }
        });

        if (state.materialFilterActive && productType) {
            DOMElements.materialSelectOptions.appendChild(createOption('show-all', 'show-all-option'));
        }
        
        if (state.selectedMaterial && allMaterials[state.selectedMaterial]) {
            selectMaterial(state.selectedMaterial, false);
        } else {
            DOMElements.materialSelectDisplay.textContent = LANG[state.lang].selectMaterial;
            updateFavoriteButtonState();
        }
    }

    function selectMaterial(materialName, clearInputs = true) {
        if (!materialName) return;
        if (materialName === 'show-all') {
            state.materialFilterActive = false;
            populateMaterialSelect();
            DOMElements.materialSelectOptions.classList.add('open');
            return;
        }

        if(clearInputs) resetDimensionInputs();

        const { MATERIAL_DENSITIES } = APP_DATA;
        state.selectedMaterial = materialName;
        
        const allMaterials = { ...MATERIAL_DENSITIES, ...state.customMaterials };
        const density = allMaterials[materialName];
        DOMElements.materialSelectDisplay.textContent = density ? `${materialName} (${density} kg/m³)` : materialName;
        
        DOMElements.materialSelectOptions.querySelectorAll('.option.selected').forEach(el => el.classList.remove('selected'));
        const optionEl = DOMElements.materialSelectOptions.querySelector(`.option[data-value="${materialName}"]`);
        if(optionEl) optionEl.classList.add('selected');

        updateFavoriteButtonState();
        calculate();
        storage.saveState();
    }

    function updateFavoriteButtonState() {
        DOMElements.favoriteToggleBtn.classList.toggle('is-favorite', state.favorites.includes(state.selectedMaterial));
    }
            
    function populateProductTypeSelect() {
        const { PRODUCT_TYPES, LANG } = APP_DATA;
        DOMElements.productTypeSelectOptions.innerHTML = '';
        const specialProfiles = ['angleProfile', 'iBeam', 'uChannel'];

        const createOption = (key) => {
            const li = document.createElement('li');
            li.className = 'option';
            li.dataset.value = key;
            li.textContent = LANG[state.lang][key] || key;
            return li;
        };
        
        const createGroup = (labelKey, keys) => {
            if (!keys || keys.length === 0) return;
            const groupLi = document.createElement('li');
            const header = document.createElement('div');
            header.className = 'group-header';
            header.textContent = LANG[state.lang][labelKey] || labelKey;
            
            const optionList = document.createElement('ul');
            optionList.className = 'option-list';

            keys.forEach(key => optionList.appendChild(createOption(key)));
            
            const isExpanded = ['favorites'].includes(labelKey);
            if (optionList.childElementCount > 0) {
                 if (isExpanded) {
                    header.classList.add('expanded');
                    optionList.classList.add('expanded');
                }
                groupLi.appendChild(header);
                groupLi.appendChild(optionList);
                DOMElements.productTypeSelectOptions.appendChild(groupLi);
            }
        };
        
        createGroup('favorites', state.productFavorites);
        createGroup('productType', Object.keys(PRODUCT_TYPES).filter(p => !specialProfiles.includes(p) && !state.productFavorites.includes(p)));
        createGroup('specialProfiles', specialProfiles.filter(p => !state.productFavorites.includes(p)));
        
        if (state.selectedProduct) {
            selectProductType(state.selectedProduct, false);
        } else {
            DOMElements.productTypeSelectDisplay.textContent = LANG[state.lang].selectProduct;
        }
        updateProductFavoriteButtonState();
    }
    
    function selectProductType(productType, clearInputs = true) {
        if (!productType) return;
        state.selectedProduct = productType;
        if(clearInputs) {
            resetDimensionInputs();
            state.materialFilterActive = true;
            state.selectedMaterial = null;
            populateMaterialSelect();
        }

        const { LANG } = APP_DATA;
        DOMElements.productTypeSelectDisplay.textContent = LANG[state.lang][productType] || productType;
        DOMElements.productTypeSelectOptions.querySelectorAll('.option.selected').forEach(el => el.classList.remove('selected'));
        const optionEl = DOMElements.productTypeSelectOptions.querySelector(`.option[data-value="${productType}"]`);
        if(optionEl) optionEl.classList.add('selected');
        
        updateDimensionFields(); 
        updateProductFavoriteButtonState();
        storage.saveState();
    }


    function updateProductFavoriteButtonState() {
        const currentProduct = state.selectedProduct;
        DOMElements.productFavoriteToggleBtn.classList.toggle('is-favorite', state.productFavorites.includes(currentProduct));
    }

    function updateDimensionFields() {
        const { PRODUCT_TYPES, LANG } = APP_DATA;
        const productType = state.selectedProduct;
        const config = PRODUCT_TYPES[productType];

        DOMElements.dimensionFields.innerHTML = '';
        if (!config) {
            updateStandardSizeSelector(null);
            calculate();
            return;
        }
        
        config.dims.forEach(({ id, unit, key }) => {
            const isRadius = key && (key.startsWith('r') || key === 'v');
            if (isRadius && key !=='v') return; // Don't create inputs for radii, but do for angle profile thickness 'v'

            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            let unitDisplay;
            if (productType === 'pipe') {
                 unitDisplay = `<button class="pipe-unit-toggle" data-dim-id="${id}">${state.pipeDimUnits[id]}</button>`;
            } else {
                 unitDisplay = `<span>${unit}</span>`;
            }

            const symbol = key ? `(${key})` : '';
            const labelText = `${LANG[state.lang][id] || id} ${symbol}`;

            formGroup.innerHTML = `
                <label for="dim-${id}">${labelText}</label>
                <div class="dimension-input-group">
                    <input type="number" id="dim-${id}" class="input dimension-input" min="0" step="0.1">
                    ${unitDisplay}
                </div>
            `;
            DOMElements.dimensionFields.appendChild(formGroup);
        });
        
        updateStandardSizeSelector(productType);
        calculate();
    }
    
    function updateStandardSizeSelector(productType) {
        const { STANDARD_PROFILES, LANG } = APP_DATA;
        const profileData = productType ? STANDARD_PROFILES[productType] : null;

        DOMElements.standardSizeSelectOptions.innerHTML = '';
        if(profileData) {
            DOMElements.standardSizeContainer.style.display = 'block';
            
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
                header.className = 'group-header expanded';
                header.textContent = LANG[state.lang][series] || series;

                const optionList = document.createElement('ul');
                optionList.className = 'option-list expanded';

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
                    DOMElements.standardSizeSelectOptions.appendChild(groupLi);
                }
            });

            if (state.selectedStandardSize) {
                selectStandardSize(state.selectedStandardSize, false);
            } else {
                 DOMElements.standardSizeSelectDisplay.textContent = LANG[state.lang].selectSize;
            }

        } else {
            DOMElements.standardSizeContainer.style.display = 'none';
            state.selectedStandardSize = null;
        }
    }
    
    function selectStandardSize(value, fillDims = true) {
        if (!value) return;
        state.selectedStandardSize = value;

        const { STANDARD_PROFILES, LANG } = APP_DATA;
        const [series, size] = value.split('-');
        const dims = STANDARD_PROFILES[state.selectedProduct]?.[series]?.[size];
        
        DOMElements.standardSizeSelectDisplay.textContent = size || LANG[state.lang].selectSize;
        DOMElements.standardSizeSelectOptions.querySelectorAll('.option.selected').forEach(el => el.classList.remove('selected'));
        const optionEl = DOMElements.standardSizeSelectOptions.querySelector(`.option[data-value="${value}"]`);
        if(optionEl) optionEl.classList.add('selected');

        if(fillDims && dims) {
            fillDimensionsFromStandardSize(dims);
        }
        storage.saveState();
    }
            
    function fillDimensionsFromStandardSize(dims) {
        const { PRODUCT_TYPES } = APP_DATA;
        
        PRODUCT_TYPES[state.selectedProduct].dims.forEach((dimConfig) => {
            const isRadius = dimConfig.key && dimConfig.key.startsWith('r');
            if(isRadius) return;
            
            const key = dimConfig.key || dimConfig.id.replace('dim-', '');
            const input = document.getElementById(`dim-${dimConfig.id}`);
            if(input && dims[key] !== undefined) {
                input.value = dims[key];
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
            if(input) { // It's a user-editable dimension
                value = parseFloat(input.value) || 0;
                if (productType === 'pipe' && state.pipeDimUnits[dimConfig.id] === 'inch') {
                    value *= 25.4;
                }
            } else { // It's a non-editable property like a radius
                value = standardDims[dimConfig.key] || 0;
            }
            values[dimConfig.id] = value;
        });

        // Fallbacks for custom-sized radii
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
        const { MATERIAL_DENSITIES } = APP_DATA;
        const productType = state.selectedProduct;
        const materialName = state.selectedMaterial;
        const allMaterials = { ...MATERIAL_DENSITIES, ...state.customMaterials };
        const density = allMaterials[materialName] || 0;
        const dims = getDimensions();
        
        const crossSectionMm2 = calculateCrossSection(productType, dims);
        const weightPerMeter = crossSectionMm2 / 1000000 * density;
        const surfaceAreaPerMeter = calculateSurfaceAreaPerMeter(productType, dims);
        
        const lengthValue = parseFloat(DOMElements.lengthInput.value) || 0;
        const lengthM = state.lengthUnit === 'm' ? lengthValue : lengthValue / 1000;
        
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
            if(document.activeElement !== DOMElements.lengthInput) {
                DOMElements.lengthInput.value = '';
            }

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
        if (DOMElements.standardSizeSelectDisplay) {
            DOMElements.standardSizeSelectDisplay.textContent = APP_DATA.LANG[state.lang].selectSize;
            DOMElements.standardSizeSelectOptions.querySelectorAll('.option.selected').forEach(el => el.classList.remove('selected'));
        }
    }

    function resetAllInputs() {
        resetDimensionInputs();
        DOMElements.pricePerKg.value = '';
        DOMElements.pricePerMeter.value = '';
        state.priceHufKg = 0;
        storage.saveState();
        calculate();
    }


    // --- Anyagkezelő Logika ---
    function handleAddOrUpdateMaterial() {
        const name = DOMElements.newMaterialName.value.trim();
        const density = parseFloat(DOMElements.newMaterialDensity.value);
        const editingName = DOMElements.editingMaterialName.value;
        const { LANG } = APP_DATA;

        if (!name || !density || density <= 0) {
            alert('Érvénytelen név vagy sűrűség!');
            return;
        }
        
        if (editingName && editingName !== name) {
            delete state.customMaterials[editingName];
            const favIndex = state.favorites.indexOf(editingName);
            if (favIndex > -1) state.favorites[favIndex] = name;
        }

        state.customMaterials[name] = density;
        storage.saveState();
        renderAllMaterialsList();
        populateMaterialSelect();
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
                    <button class="delete-material-btn" data-name="${name}" title="${LANG[lang].delete}"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    ` : ''}
                </div>`;
            DOMElements.allMaterialsList.appendChild(li);
        });
    }

    // --- Grafikon Kezelés ---
    function openChartPopup(title, contentGenerator) {
        DOMElements.chartPopupTitle.innerText = title;
        DOMElements.chartPopupBody.innerHTML = '';
        contentGenerator(DOMElements.chartPopupBody);
        openModal(DOMElements.chartPopupOverlay);
    }

    function updateChartData(startDate, endDate) {
        const chart = state.charts.current;
        if (!chart) return;
    
        const formatDate = (date) => date.toISOString().split('T')[0];
        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);
    
        const filteredLabels = Object.keys(HISTORICAL_RATES)
            .filter(date => date >= startStr && date <= endStr)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
        const filteredData = filteredLabels.map(date => HISTORICAL_RATES[date]);
    
        chart.data.labels = filteredLabels;
        chart.data.datasets[0].data = filteredData;
        chart.update();
    }
            
    function showExchangeRateChart(container) {
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        if (state.charts.current) state.charts.current.destroy();

        const formatDate = (date) => date.toISOString().split('T')[0];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);

        DOMElements.chartStartDate.value = formatDate(startDate);
        DOMElements.chartEndDate.value = formatDate(endDate);
        
        const initialLabels = Object.keys(HISTORICAL_RATES)
            .filter(date => date >= formatDate(startDate) && date <= formatDate(endDate))
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const initialData = initialLabels.map(date => HISTORICAL_RATES[date]);
        
        try {
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, `color-mix(in srgb, ${getComputedStyle(document.documentElement).getPropertyValue('--bg-accent').trim()} 40%, transparent)`);
            gradient.addColorStop(1, `color-mix(in srgb, ${getComputedStyle(document.documentElement).getPropertyValue('--bg-accent').trim()} 0%, transparent)`);

            state.charts.current = new Chart(ctx, {
                type: 'line',
                data: { 
                    labels: initialLabels, 
                    datasets: [{ 
                        label: 'EUR/HUF', 
                        data: initialData, 
                        borderColor: 'var(--bg-accent)', 
                        backgroundColor: gradient, 
                        tension: 0.2, 
                        fill: true, 
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 1.5 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    interaction: { mode: 'index', intersect: false }, 
                    plugins: { legend: { display: false } }, 
                    scales: { 
                        x: { grid: { display: false } }, 
                        y: { grid: { color: 'var(--border-color)' } } 
                    } 
                }
            });
        } catch (error) {
            container.innerText = 'Hiba a grafikon adatok feldolgozása közben.';
        }
    }

    // --- Layout Kezelés ---
    function initResizer() {
        const resizer = DOMElements.resizer;
        const main = DOMElements.mainContainer;

        resizer.addEventListener('mousedown', function(e) {
            e.preventDefault();
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const mouseMoveHandler = (e) => {
                const containerRect = main.getBoundingClientRect();
                const minWidth = 350;
                let newLeftWidth = e.clientX - containerRect.left;
                if (newLeftWidth < minWidth) newLeftWidth = minWidth;
                const maxLeftWidth = containerRect.width - minWidth - resizer.offsetWidth;
                if (newLeftWidth > maxLeftWidth) newLeftWidth = maxLeftWidth;
                main.style.gridTemplateColumns = `${newLeftWidth}px 10px 1fr`;
            };
            const mouseUpHandler = () => {
                document.body.style.cursor = ''; document.body.style.userSelect = '';
                window.removeEventListener('mousemove', mouseMoveHandler);
                window.removeEventListener('mouseup', mouseUpHandler);
            };
            window.addEventListener('mousemove', mouseMoveHandler);
            window.addEventListener('mouseup', mouseUpHandler);
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

        // --- Custom Select Event Listeners ---
        function setupCustomSelect(container) {
            const display = container.querySelector('.custom-select-display');
            const options = container.querySelector('.custom-select-options');
            
            display.addEventListener('click', () => options.classList.toggle('open'));
            
            options.addEventListener('click', (e) => {
                const target = e.target;
                 if (target.classList.contains('group-header')) {
                    target.classList.toggle('expanded'); 
                    target.nextElementSibling.classList.toggle('expanded');
                }
            });
        }
        
        setupCustomSelect(DOMElements.materialSelectCustom);
        setupCustomSelect(DOMElements.productTypeSelectCustom);
        setupCustomSelect(DOMElements.standardSizeSelectCustom);
        
        document.addEventListener('click', (e) => {
            if (!DOMElements.materialSelectCustom.contains(e.target)) DOMElements.materialSelectOptions.classList.remove('open');
            if (!DOMElements.productTypeSelectCustom.contains(e.target)) DOMElements.productTypeSelectOptions.classList.remove('open');
            if (!DOMElements.standardSizeSelectCustom.contains(e.target)) DOMElements.standardSizeSelectOptions.classList.remove('open');
        });

        // --- Option Click Handlers ---
        DOMElements.materialSelectOptions.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('option')) {
                selectMaterial(target.dataset.value); 
                DOMElements.materialSelectOptions.classList.remove('open');
            }
        });
        
        DOMElements.productTypeSelectOptions.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('option')) {
                selectProductType(target.dataset.value);
                DOMElements.productTypeSelectOptions.classList.remove('open');
            }
        });

        DOMElements.standardSizeSelectOptions.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('option')) {
                selectStandardSize(target.dataset.value);
                DOMElements.standardSizeSelectOptions.classList.remove('open');
            }
        });

        DOMElements.favoriteToggleBtn.addEventListener('click', () => {
            const name = state.selectedMaterial;
            if (!name) return;
            const index = state.favorites.indexOf(name);
            if (index > -1) state.favorites.splice(index, 1); else state.favorites.push(name);
            storage.saveState(); populateMaterialSelect(); updateFavoriteButtonState();
        });
        
        DOMElements.productFavoriteToggleBtn.addEventListener('click', () => {
            const name = state.selectedProduct;
            if(!name) return;
            const index = state.productFavorites.indexOf(name);
            if (index > -1) state.productFavorites.splice(index, 1); else state.productFavorites.push(name);
            storage.saveState(); populateProductTypeSelect();
        });

        DOMElements.dimensionFields.addEventListener('input', (e) => {
            if (e.target.matches('.dimension-input')) {
                state.selectedStandardSize = null;
                 if (DOMElements.standardSizeSelectDisplay) {
                    DOMElements.standardSizeSelectDisplay.textContent = APP_DATA.LANG[state.lang].selectSize;
                    DOMElements.standardSizeSelectOptions.querySelectorAll('.option.selected').forEach(el => el.classList.remove('selected'));
                }
                calculate();
            }
        });

        DOMElements.dimensionFields.addEventListener('click', (e) => {
            const target = e.target;
            if (!target.matches('.pipe-unit-toggle')) return;
            
            const dimId = target.dataset.dimId;
            const input = document.getElementById(`dim-${dimId}`);
            const currentVal = parseFloat(input.value) || 0;
            const currentUnit = state.pipeDimUnits[dimId];

            if (currentUnit === 'mm') {
                state.pipeDimUnits[dimId] = 'inch';
                if (currentVal > 0) input.value = (currentVal / 25.4).toPrecision(4);
            } else { // it's 'inch'
                state.pipeDimUnits[dimId] = 'mm';
                if (currentVal > 0) input.value = (currentVal * 25.4).toFixed(2);
            }
            target.innerText = state.pipeDimUnits[dimId];
            storage.saveState();
            calculate();
        });

        DOMElements.lengthInput.addEventListener('input', calculate);
        DOMElements.eurHufRate.addEventListener('input', (e) => {
            state.eurHufRate = parseFloat(e.target.value) || 0;
            storage.saveState(); updatePrices();
        });
        DOMElements.exchangeRateResetBtn.addEventListener('click', () => {
            fetchExchangeRate();
        });
        [DOMElements.pricePerKg, DOMElements.pricePerMeter].forEach(el => el.addEventListener('input', (e) => updatePrices(e)));

        [DOMElements.priceUnitToggleKg, DOMElements.priceUnitToggleM, DOMElements.totalPriceUnitToggle].forEach(el => el.addEventListener('click', () => {
            state.priceCurrency = state.priceCurrency === 'HUF' ? 'EUR' : 'HUF';
            storage.saveState(); updatePrices();
        }));

        DOMElements.manageMaterialsBtn.addEventListener('click', () => { renderAllMaterialsList(); openModal(DOMElements.materialsModal); });
        DOMElements.addMaterialBtn.addEventListener('click', handleAddOrUpdateMaterial);
        DOMElements.materialsModal.querySelector('.modal-close-btn').addEventListener('click', () => closeModal(DOMElements.materialsModal));

        DOMElements.allMaterialsList.addEventListener('click', (e) => {
            const { LANG } = APP_DATA;
            const target = e.target.closest('button');
            if (!target) return;
            const name = target.dataset.name;
            if (target.classList.contains('favorite-btn')) {
                const index = state.favorites.indexOf(name);
                if (index > -1) state.favorites.splice(index, 1); else state.favorites.push(name);
                storage.saveState(); renderAllMaterialsList(); populateMaterialSelect();
            } else if (target.classList.contains('edit-material-btn')) {
                DOMElements.newMaterialName.value = name;
                DOMElements.newMaterialDensity.value = state.customMaterials[name];
                DOMElements.editingMaterialName.value = name;
                DOMElements.addMaterialBtn.innerText = LANG[state.lang].save;
            } else if (target.classList.contains('delete-material-btn')) {
                if (confirm(`Biztosan törli a(z) "${name}" anyagot?`)) {
                    delete state.customMaterials[name];
                    state.favorites = state.favorites.filter(fav => fav !== name);
                    if (state.selectedMaterial === name) {
                        state.selectedMaterial = null;
                        resetAllInputs();
                    }
                    storage.saveState();
                    renderAllMaterialsList(); 
                    populateMaterialSelect();
                }
            }
        });
        
        DOMElements.exchangeRateChartBtn.addEventListener('click', () => {
            const { LANG } = APP_DATA;
            openChartPopup(LANG[state.lang].exchangeRateChart, showExchangeRateChart);
        });
        
        const chartDateChangeHandler = () => {
            const startDate = new Date(DOMElements.chartStartDate.value);
            const endDate = new Date(DOMElements.chartEndDate.value);
            if (startDate && endDate && startDate <= endDate) {
                updateChartData(startDate, endDate);
            }
        };

        DOMElements.chartStartDate.addEventListener('change', chartDateChangeHandler);
        DOMElements.chartEndDate.addEventListener('change', chartDateChangeHandler);
        DOMElements.chartRange1m.addEventListener('click', () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(endDate.getMonth() - 1);
            DOMElements.chartStartDate.value = startDate.toISOString().split('T')[0];
            DOMElements.chartEndDate.value = endDate.toISOString().split('T')[0];
            updateChartData(startDate, endDate);
        });
        DOMElements.chartRange1y.addEventListener('click', () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 1);
            DOMElements.chartStartDate.value = startDate.toISOString().split('T')[0];
            DOMElements.chartEndDate.value = endDate.toISOString().split('T')[0];
            updateChartData(startDate, endDate);
        });

        DOMElements.chartPopupOverlay.addEventListener('click', function(e) {
            if (e.target === this || e.target.classList.contains('modal-close-btn')) closeModal(this);
        });
    }

    // --- Alkalmazás Indítása ---
    async function init() {
        storage.loadState();
        const dataLoaded = await fetchAppData();
        if (!dataLoaded) return; // Leáll, ha az adatok betöltése sikertelen

        await fetchHistoricalRates();
        
        const { LANG } = APP_DATA;
        Object.keys(LANG).forEach(lang => {
            const option = document.createElement('option');
            option.value = lang; option.innerText = lang.toUpperCase();
            DOMElements.langSelector.appendChild(option);
        });

        const browserLang = navigator.language.split('-')[0];
        setLanguage(state.lang || (LANG[browserLang] ? browserLang : 'hu'));
        
        const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        applyTheme(state.theme || preferredTheme);

        DOMElements.appVersion.textContent = APP_VERSION;
        DOMElements.eurHufRate.value = state.eurHufRate.toFixed(2);
        DOMElements.copyrightYear.textContent = new Date().getFullYear().toString();
        
        resetDimensionInputs();
        if(!state.selectedProduct) updateDimensionFields();
        fetchExchangeRate();
        initResizer();
        setupEventListeners();
        calculate();
    }

    init();
});