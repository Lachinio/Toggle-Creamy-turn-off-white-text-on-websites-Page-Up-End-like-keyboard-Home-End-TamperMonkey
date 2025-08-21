// ==UserScript==
// @name         Page: Up, End + Toggle Creamy Text Color
// @namespace    http://tampermonkey.net/
// @version      1.47.2(click logical)
// @description  Buttons to scroll page or container (for AI sites and others) up/down with instant scroll, change white color for text to creamy
// @match        *://*/*
// @icon         https://img.icons8.com/?size=100&id=EP1tNpVkUlA3&format=png&color=000000
// @author       Lachinio
// @grant        GM_addStyle
// ==/UserScript==

/*
User Manual | Руководство пользователя:
- To change the creamy text color, replace '#bbbca6' in the line marked 'Change creamy color here | Изменить кремовый цвет здесь'.
  Example: Replace '#bbbca6' with '#yourColorCode' to use a different color.
- To update button text color, replace '#bbbca6' in the three lines marked 'Button text color | Цвет текста кнопки' in the Shadow DOM styles.
  Example: Replace '#bbbca6' with '#yourColorCode' for consistency.
- To change button panel opacity, adjust 'opacity: 0.1' in container.style in createButtons.
  Example: Change to 'opacity: 0.5' for 50% transparency.
- To change button sizes, adjust 'padding' and 'font-size' in lines marked 'Button size | Размер кнопки' in the Shadow DOM styles.
  Example: Change 'padding: 5px 3px' to 'padding: 6px 4px' or 'font-size: 13px' to 'font-size: 14px'.
- Note: Text color changes may not work on sites with strict CSP unless using a userscript manager like Tampermonkey.
- Debug logs: Check console (F12 → Console) for '[Tampermonkey]' logs to diagnose scroll issues.
*/

// === UI Functions === | Функции интерфейса
(function () {
    const containerId = 'myTampermonkeyButtonContainer';
    const state = {
        isColored: false,
        creamyClickCount: 0,
        lastStyleUpdateTime: 0,
        colorStyleElement: null // Store color style element for updates | Храним элемент стиля для обновлений
    };
    let userInteractedContainer = null; // Preferred container from user interaction | Предпочитаемый контейнер из взаимодействия пользователя
    let userInteractionTimestamp = 0; // Timestamp of last user interaction | Временная метка последнего взаимодействия
    let mainScrollContainer = null; // Cache for main scrollable container | Кэш основного прокручиваемого контейнера

    // Function to toggle text color | Функция для переключения цвета текста
    function toggleTextColor(btnColor) {
        try {
            const applyColor = !state.isColored;
            if (!state.colorStyleElement || !(state.colorStyleElement instanceof HTMLStyleElement)) {
                state.colorStyleElement = GM_addStyle(''); // Create style once (empty) | Создаём стиль один раз (пустой)
            }
            if (applyColor) {
                state.colorStyleElement.textContent = '* { color: #bbbca6 !important; }'; // Change creamy color here | Изменить кремовый цвет здесь
            } else {
                state.colorStyleElement.textContent = '';
            }
            btnColor.classList.toggle('active', applyColor);
            state.isColored = applyColor;
            state.creamyClickCount++;
            state.lastStyleUpdateTime = Date.now();
            btnColor.disabled = false; // Ensure button is enabled after successful toggle | Убедимся, что кнопка активна после успешного переключения
        } catch (e) {
            console.warn('Failed to update text color due to Content Security Policy (CSP) restrictions on this site. Ensure Tampermonkey is enabled or try a different browser/site. The CreamyTXT button will be disabled:', e);
            btnColor.disabled = true; // Disable button to indicate feature is unavailable | Отключаем кнопку, чтобы показать, что функция недоступна
        }
    }

    // Function to create a button with common styles | Функция для создания кнопки с общими стилями
    function createButton({ textContent, onClick, className }) {
        const button = document.createElement('button');
        button.textContent = textContent;
        button.className = className || '';
        button.onclick = (e) => {
            e.stopPropagation(); // Prevent click from bubbling to container | Предотвращаем всплытие клика к контейнеру
            onClick(e);
        };
        button.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Prevent mousedown from bubbling to container to avoid drag | Предотвращаем всплытие mousedown для исключения перетаскивания
            e.preventDefault(); // Prevent default to ensure no drag starts | Предотвращаем действие по умолчанию
        });
        return button;
    }

    // === Drag and Drop Functions === | Функции перетаскивания
    function makeDraggable(el) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        const onMouseMove = (e) => {
            if (!isDragging) return; // Check if dragging is active | Проверяем, идет ли перетаскивание
            el.style.left = `${e.clientX - offsetX}px`;
            el.style.top = `${e.clientY - offsetY}px`;
            el.style.right = 'auto';
            el.style.bottom = 'auto';
        };

        const onMouseUp = () => {
            isDragging = false;
            el.style.transition = 'opacity 0.5s ease'; // Restore smooth transition | Возвращаем плавный переход
            el.style.cursor = 'grab'; // Restore grab cursor after dragging | Восстанавливаем курсор grab после перетаскивания
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        el.addEventListener('mousedown', (e) => {
            if (e.target.tagName.toLowerCase() === 'button') return; // Ignore clicks on buttons | Игнорируем нажатия на кнопки
            isDragging = true;
            offsetX = e.clientX - el.getBoundingClientRect().left;
            offsetY = e.clientY - el.getBoundingClientRect().top;
            el.style.transition = 'none'; // Disable transitions for smooth dragging | Отключаем переходы для плавного перетаскивания
            el.style.cursor = 'grabbing'; // Change cursor to grabbing during drag | Меняем курсор на grabbing во время перетаскивания
            e.preventDefault();
            document.removeEventListener('mousemove', onMouseMove); // Remove existing listener to prevent duplicates | Удаляем существующий слушатель
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
        });

        // Prevent leaks if tab is hidden during drag | Предотвращаем утечки при скрытии вкладки во время перетаскивания
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && isDragging) {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                el.style.transition = 'opacity 0.5s ease';
                el.style.cursor = 'grab';
            }
        });
    }

    // === Scroll Functions === | Функции прокрутки
    function findScrollableAncestor(el) {
        while (el && el !== document) {
            try {
                const style = getComputedStyle(el);
                if ((style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') && el.scrollHeight > el.clientHeight) {
                    const rect = el.getBoundingClientRect();
                    if (rect.height > 10 && rect.width > 10 && rect.bottom > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight)) {
                        const idcls = (el.id || '') + ' ' + (el.className || '');
                        if (!/cookie|consent/i.test(idcls)) { // Remove overlay filter | Убрали фильтр overlay
                            console.debug('[Tampermonkey] Found scrollable ancestor:', el, 'tag:', el.tagName, 'id:', el.id, 'class:', el.className, 'scrollHeight:', el.scrollHeight);
                            return el;
                        }
                    }
                }
                // Check Shadow DOM | Проверяем Shadow DOM
                if (el.shadowRoot) {
                    const shadowElements = [...el.shadowRoot.querySelectorAll('*')];
                    for (const shadowEl of shadowElements) {
                        const shadowContainer = findScrollableAncestor(shadowEl);
                        if (shadowContainer) {
                            console.debug('[Tampermonkey] Found scrollable ancestor in Shadow DOM:', shadowContainer);
                            return shadowContainer;
                        }
                    }
                }
            } catch (err) {
                console.debug('[Tampermonkey] Error in findScrollableAncestor:', err);
            }
            el = el.parentElement;
        }
        return document.body && isValidContainer(document.body) ? document.body : null; // Allow body if valid | Разрешаем body, если валидно
    }

    function isValidContainer(el) {
        if (!el || el === window || el === document) return false;
        if (!document.contains(el)) return false;
        try {
            if (el.scrollHeight - el.clientHeight < 10) return false; // Lower threshold | Уменьшен порог
            const style = getComputedStyle(el);
            if (!/(auto|scroll|overlay)/.test(style.overflowY)) return false;
            const rect = el.getBoundingClientRect();
            if (rect.height < 10 || rect.width < 10) return false; // Lower threshold | Уменьшен порог
            if (rect.bottom <= 0 || rect.top >= (window.innerHeight || document.documentElement.clientHeight)) return false;
            const idcls = (el.id || '') + ' ' + (el.className || '');
            if (/cookie|consent/i.test(idcls)) return false; // Remove overlay filter | Убрали фильтр overlay
            console.debug('[Tampermonkey] Valid container:', el, 'tag:', el.tagName, 'id:', el.id, 'class:', el.className, 'scrollHeight:', el.scrollHeight);
            return true;
        } catch (err) {
            console.debug('[Tampermonkey] Error in isValidContainer:', err);
            return false;
        }
    }

    function findScrollableElements() {
        const start = performance.now();
        const maxDepth = 3; // Limit DOM traversal depth | Ограничиваем глубину обхода DOM
        const allElements = [];
        function collectElements(node, depth) {
            if (depth > maxDepth) return;
            allElements.push(node);
            node.querySelectorAll(':scope > *').forEach(child => collectElements(child, depth + 1));
        }
        if (document.body) collectElements(document.body, 0);

        const scrollableElements = allElements.filter(el => {
            try {
                const style = getComputedStyle(el);
                const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') && el.scrollHeight > el.clientHeight;
                const hasSignificantHeight = el.scrollHeight > 50 && el.clientHeight > 10; // Lower threshold | Уменьшен порог
                const isVisible = el.offsetParent !== null;
                const idcls = (el.id || '') + ' ' + (el.className || '');
                const isNotOverlay = !/cookie|consent/i.test(idcls); // Remove overlay filter | Убрали фильтр overlay
                if (isScrollable && hasSignificantHeight && isVisible && isNotOverlay) {
                    console.debug('[Tampermonkey] Found scrollable element:', el, 'tag:', el.tagName, 'id:', el.id, 'class:', el.className, 'scrollHeight:', el.scrollHeight);
                    return true;
                }
                return false;
            } catch (err) {
                console.debug('[Tampermonkey] Error in findScrollableElements:', err);
                return false;
            }
        });

        // Check Shadow DOM | Проверяем Shadow DOM
        const shadowElements = [];
        allElements.forEach(el => {
            if (el.shadowRoot) {
                shadowElements.push(...el.shadowRoot.querySelectorAll('*'));
            }
        });
        const shadowScrollable = shadowElements.filter(el => {
            try {
                const style = getComputedStyle(el);
                const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') && el.scrollHeight > el.clientHeight;
                const hasSignificantHeight = el.scrollHeight > 50 && el.clientHeight > 10;
                const isVisible = el.offsetParent !== null;
                if (isScrollable && hasSignificantHeight && isVisible) {
                    console.debug('[Tampermonkey] Found scrollable Shadow DOM element:', el, 'tag:', el.tagName, 'id:', el.id, 'class:', el.className, 'scrollHeight:', el.scrollHeight);
                    return true;
                }
                return false;
            } catch (err) {
                console.debug('[Tampermonkey] Error in Shadow DOM check:', err);
                return false;
            }
        });
        scrollableElements.push(...shadowScrollable);

        // Check iframes | Проверяем iframes
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const iframeElements = [...iframeDoc.querySelectorAll('*')].filter(el => {
                    try {
                        const style = getComputedStyle(el);
                        const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') && el.scrollHeight > el.clientHeight;
                        const hasSignificantHeight = el.scrollHeight > 50 && el.clientHeight > 10;
                        const isVisible = el.offsetParent !== null;
                        if (isScrollable && hasSignificantHeight && isVisible) {
                            console.debug('[Tampermonkey] Found scrollable iframe element:', el, 'tag:', el.tagName, 'id:', el.id, 'class:', el.className, 'scrollHeight:', el.scrollHeight);
                            return true;
                        }
                        return false;
                    } catch (err) {
                        console.debug('[Tampermonkey] Error in iframe check:', err);
                        return false;
                    }
                });
                scrollableElements.push(...iframeElements);
            } catch (err) {
                console.debug('[Tampermonkey] Cannot access iframe content due to CORS:', err);
            }
        });

        const end = performance.now();
        console.debug(`[Tampermonkey] findScrollableElements took ${end - start} ms. Found ${scrollableElements.length} candidates.`);
        return scrollableElements;
    }

    function initUserInteractionTracker() {
        document.addEventListener('scroll', (e) => {
            const candidate = findScrollableAncestor(e.target);
            if (candidate && isValidContainer(candidate)) {
                userInteractedContainer = candidate;
                userInteractionTimestamp = Date.now();
                console.debug('[Tampermonkey] user-interacted container set (scroll):', candidate, 'tag:', candidate.tagName, 'id:', candidate.id, 'class:', candidate.className, 'scrollHeight:', candidate.scrollHeight);
            }
        }, { capture: true, passive: true });

        document.addEventListener('click', (e) => {
            const candidate = findScrollableAncestor(e.target);
            if (candidate && isValidContainer(candidate)) {
                userInteractedContainer = candidate;
                userInteractionTimestamp = Date.now();
                console.debug('[Tampermonkey] user-interacted container set (click):', candidate, 'tag:', candidate.tagName, 'id:', candidate.id, 'class:', candidate.className, 'scrollHeight:', candidate.scrollHeight);
            }
        }, { capture: true, passive: true });

        // Monitor DOM changes for SPA | Следим за изменениями DOM для SPA
        let lastCheck = 0;
        const observer = new MutationObserver(() => {
            const now = Date.now();
            if (now - lastCheck < 500) return; // Debounce to reduce checks | Ограничиваем частоту проверок
            lastCheck = now;
            if (userInteractedContainer && !document.contains(userInteractedContainer)) {
                userInteractedContainer = null; // Reset only if removed from DOM | Сбрасываем, только если удалён из DOM
                console.debug('[Tampermonkey] user-interacted container invalidated due to DOM removal');
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function getMainScrollableContainer() {
        console.debug('[Tampermonkey] Searching for main scroll container...');
        if (userInteractedContainer && isValidContainer(userInteractedContainer)) {
            console.debug('[Tampermonkey] Using user-interacted container:', userInteractedContainer, 'tag:', userInteractedContainer.tagName, 'id:', userInteractedContainer.id, 'class:', userInteractedContainer.className);
            mainScrollContainer = userInteractedContainer;
            return mainScrollContainer;
        }

        if (mainScrollContainer && isValidContainer(mainScrollContainer)) {
            console.debug('[Tampermonkey] Using cached scroll container:', mainScrollContainer, 'tag:', mainScrollContainer.tagName, 'id:', mainScrollContainer.id, 'class:', mainScrollContainer.className);
            return mainScrollContainer;
        }

        const hostname = window.location.hostname;
        const aiSites = {
            'grok.com': 'div.w-full.h-full.overflow-y-auto.overflow-x-hidden',
            'chat.openai.com': 'div.overflow-y-auto',
            'chatgpt.com': 'div.flex.h-full.flex-col.overflow-y-auto',
            'gemini.google.com': 'div.overflow-y-auto',
            'wikipedia.org': 'div#content', // Added for Wikipedia | Добавлено для Википедии
            'youtube.com': 'ytd-comments, div#contents' // Added for YouTube | Добавлено для YouTube
        };

        for (const [domain, selector] of Object.entries(aiSites)) {
            if (hostname.includes(domain)) {
                const container = document.querySelector(selector);
                if (container && isValidContainer(container)) {
                    console.debug(`[Tampermonkey] Found site-specific container for ${domain}:`, container, 'tag:', container.tagName, 'id:', container.id, 'class:', container.className);
                    mainScrollContainer = container;
                    return container;
                }
                console.debug(`[Tampermonkey] Specific container for ${domain} not found, falling back to universal search.`);
                break;
            }
        }

        // Async search to reduce lag | Асинхронный поиск для уменьшения задержки
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                const scrollableElements = findScrollableElements();
                let maxScrollHeight = 0;
                let selectedContainer = null;
                scrollableElements.forEach(el => {
                    if (el.scrollHeight > maxScrollHeight && isValidContainer(el)) {
                        maxScrollHeight = el.scrollHeight;
                        selectedContainer = el;
                    }
                });
                if (selectedContainer) {
                    console.debug('[Tampermonkey] Found container via universal search:', selectedContainer, 'tag:', selectedContainer.tagName, 'id:', selectedContainer.id, 'class:', selectedContainer.className, 'scrollHeight:', selectedContainer.scrollHeight);
                    mainScrollContainer = selectedContainer;
                    resolve(selectedContainer);
                } else if (isValidContainer(document.body)) {
                    console.debug('[Tampermonkey] Using document.body as scroll container:', document.body, 'scrollHeight:', document.body.scrollHeight);
                    mainScrollContainer = document.body;
                    resolve(document.body);
                } else {
                    console.debug('[Tampermonkey] No specific container found, using window.');
                    mainScrollContainer = window;
                    resolve(window);
                }
            });
        });
    }

    async function scrollToTop() {
        const target = await getMainScrollableContainer();
        console.debug('[Tampermonkey] Scrolling to top, target:', target, 'tag:', target.tagName || 'window', 'id:', target.id || '', 'class:', target.className || '');
        if (target === window) {
            window.scrollTo({ top: 0, behavior: 'auto' });
        } else {
            target.scrollTo({ top: 0, behavior: 'auto' });
        }
    }

    async function scrollToBottom() {
        const target = await getMainScrollableContainer();
        console.debug('[Tampermonkey] Scrolling to bottom, target:', target, 'tag:', target.tagName || 'window', 'id:', target.id || '', 'class:', target.className || '');
        if (target === window) {
            const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            window.scrollTo({ top: scrollHeight, behavior: 'auto' });
        } else {
            target.scrollTo({ top: target.scrollHeight, behavior: 'auto' });
        }
    }

    // === Initialization Functions === | Функции инициализации
    function createButtons() {
        if (!document.body || document.getElementById(containerId)) return; // Check if body exists to avoid errors | Проверка наличия body

        const container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'fixed'; // Set fixed position for container | Устанавливаем фиксированное положение контейнера
        container.style.zIndex = '2147483647'; // Ensure container is on top | Обеспечиваем нахождение контейнера поверх других элементов
        container.style.bottom = '5px'; // Position container at bottom | Позиционируем контейнер внизу
        container.style.right = '5px'; // Position container at right | Позиционируем контейнер справа
        container.style.opacity = '0.1'; // Panel opacity | Прозрачность панели
        container.style.transition = 'opacity 0.5s ease'; // Smooth opacity transition | Плавный переход прозрачности
        container.style.cursor = 'grab'; // Set grab cursor for container | Устанавливаем курсор grab для контейнера
        container.addEventListener('mouseenter', () => { container.style.opacity = '1'; }); // Set opacity to 1 on hover | Устанавливаем прозрачность 1 при наведении
        container.addEventListener('mouseleave', () => { container.style.opacity = '0.1'; }); // Restore opacity on mouse leave | Восстанавливаем прозрачность при уходе мыши

        makeDraggable(container);

        const shadow = container.attachShadow({ mode: 'open' });

        const buttonStyle = document.createElement('style');
        buttonStyle.textContent = `
            :host {
                all: initial;
                font-family: sans-serif;
                user-select: none;
            }
            .all-buttons-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .scroll-buttons-container {
                display: flex;
                flex-direction: row;
                gap: 4px;
            }
            .tampermonkey-button {
                all: initial;
                box-sizing: border-box;
                padding: 5px 3px; /* Button size | Размер кнопки */
                border-radius: 6px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                transition: background-color 0.3s, color 0.3s;
                outline: none;
                border: none;
                font-family: sans-serif;
                font-size: 13px; /* Button size | Размер кнопки */
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
            }
            .scroll-button {
                padding: 5px 3px; /* Button size | Размер кнопки */
                background-color: #4CAF50;
                color: black;
                width: 56px; /* Added width to restore button size | Добавлена ширина для восстановления размера кнопки */
            }
            .scroll-button:hover {
                background-color: #45a049; /* Hover style for scroll buttons | Стиль наведения для кнопок прокрутки */
            }
            .creamy-button {
                padding: 5px 8px; /* Button size | Размер кнопки */
                background-color: rgba(0,0,0,0.5);
                color: #bbbca6; /* Button text color | Цвет текста кнопки */
                border: 1px solid #bbbca6; /* Button text color | Цвет текста кнопки */
                width: 116px; /* Added width to restore button size | Добавлена ширина для восстановления размера кнопки */
            }
            .creamy-button:hover {
                background-color: rgba(0,0,0,0.8); /* Hover style for CreamyTXT | Стиль наведения для CreamyTXT */
            }
            .creamy-button.active {
                color: #bbbca6; /* Button text color | Цвет текста кнопки */
                background-color: rgba(0,0,0,0.8);
            }
        `.replace(/\s+/g, ' ').trim();
        shadow.appendChild(buttonStyle);

        const allButtonsContainer = document.createElement('div');
        allButtonsContainer.className = 'all-buttons-container';

        const btnColor = createButton({
            textContent: '🎨 CreamyTXT',
            onClick: (e) => toggleTextColor(e.target),
            className: 'tampermonkey-button creamy-button'
        });

        const scrollButtonsContainer = document.createElement('div');
        scrollButtonsContainer.className = 'scroll-buttons-container';
        const btnTop = createButton({ textContent: '⏫', onClick: scrollToTop, className: 'tampermonkey-button scroll-button' });
        const btnEnd = createButton({ textContent: '⏬', onClick: scrollToBottom, className: 'tampermonkey-button scroll-button' });
        scrollButtonsContainer.appendChild(btnTop);
        scrollButtonsContainer.appendChild(btnEnd);

        allButtonsContainer.appendChild(btnColor);
        allButtonsContainer.appendChild(scrollButtonsContainer);
        shadow.appendChild(allButtonsContainer);
        document.body.appendChild(container);
    }

    let observer = null;
    function initializeObserver() {
        if (!document.body || observer) return; // Check for body and unique observer | Проверяем наличие body и уникальность observer
        observer = new MutationObserver(() => {
            if (!document.getElementById(containerId)) {
                mainScrollContainer = null; // Reset cache | Сбрасываем кэш
                createButtons();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function initializeScript() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createButtons();
                initUserInteractionTracker();
                initializeObserver();
            });
        } else {
            createButtons();
            initUserInteractionTracker();
            initializeObserver();
        }
    }

    initializeScript();
})();