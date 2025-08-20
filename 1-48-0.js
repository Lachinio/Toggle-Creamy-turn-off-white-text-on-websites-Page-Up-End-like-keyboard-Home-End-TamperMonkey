// ==UserScript==
// @name         [Toggle Creamy] turn off white text on websites + Page Up/End (like keyboard Home/End)
// @namespace    http://tampermonkey.net/
// @version      1.48.0
// @description  Toggle to change toxic white color text into a beautiful creamy, and Buttons to scroll the page like your real keyboard’s Home/End keys with instant scroll.
// @match        *://*/*
// @icon         https://img.icons8.com/?size=100&id=EP1tNpVkUlA3&format=png&color=000000
// @author       Lachinio
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

/*
User Manual | Руководство пользователя:
- If you wish to disable the script on a specific site, add this site to the blacklist on line 33 below. There are examples listed there.
  Save the script settings (e.g., by pressing CMD+S / Ctrl+S), then open the site you want - you'll see the script won’t run there.
  Open the browser console, and you’ll see a message saying: "⏩🚫🚫🚫 Script is turned off for domain.".
- If you wish to use a different beautiful creamy text color, replace '#bbbca6' on line 65 marked "// Change beautiful creamy color here | Поменять прекрасный кремовый цвет".
  Example: Replace '#bbbca6' with '#yourColorCode' to use a different color.
- If you wish to update button text colors, replace '#bbbca6' on lines 306, 307, 314 marked "// Button text color etc. ... "
  Example: Replace '#bbbca6' with '#yourColorCode' to use a different color. There are two modes: active and turned off.
- If you wish to adjust the script’s panel transparency, edit opacity: 0.1 in container.style on lines 112, 137, 251, 252, 254, 255.
  Example: Change to 'opacity: 0.5' for 50% transparency.
- If you wish to adjust the buttons’ size, padding, or font-size in the script’s panel, change the values on the six different lines marked "// Button size | Размер кнопки' in the Shadow DOM styles.
  Example: Change 'padding: 5px 3px' to 'padding: 6px 4px' or 'font-size: 13px' to 'font-size: 14px'.
- If you wish to set a different default position for the buttons when the script’s panel loads, edit lines 249, 250 marked "// Position container at ..."
- Note: Text color changes may not work on sites with strict CSP unless using a userscript manager like Tampermonkey.
*/

// === Blacklist for domains where script is disabled | Черный список доменов, где скрипт отключен ===
const blacklistedDomains = [
    '3dnews.ru',
    'another-site.com',
    'example.org'
  ];

  const currentHostname = window.location.hostname;

  const isBlacklisted = blacklistedDomains.some(domain => currentHostname.endsWith('.' + domain) || currentHostname === domain);

  if (isBlacklisted) {
    console.log(`[Toggle Creamy] ⏩🚫🚫🚫 Script is turned off for domain: ${currentHostname} 🚫🚫🚫⏪ `);
    return; // Stop script execution for blacklisted domains | Завершаем выполнение скрипта для черного списка
  }

  // === UI Functions | Функции интерфейса ===
  (function () {
    const containerId = 'myTampermonkeyButtonContainer';
    const state = {
        isColored: false,
        creamyClickCount: 0,
        lastStyleUpdateTime: 0,
        colorStyleElement: null // Store color style element for updates | Храним элемент стиля для обновлений
    };

    // Function to toggle text color | Функция переключения цвета текста
    function toggleTextColor(btnColor) {
        try {
            const applyColor = !state.isColored;
            if (!state.colorStyleElement || !(state.colorStyleElement instanceof HTMLStyleElement)) {
                state.colorStyleElement = GM_addStyle(''); // Create style once (empty) | Создаём стиль один раз (пустой)
            }
            if (applyColor) {
                state.colorStyleElement.textContent = '* { color: #bbbca6 !important; }'; // Change beautiful creamy color here | Поменять прекрасный кремовый цвет
            } else {
                state.colorStyleElement.textContent = '';
            }
            btnColor.classList.toggle('active', applyColor);
            state.isColored = applyColor;
            state.creamyClickCount++;
            state.lastStyleUpdateTime = Date.now();
            btnColor.disabled = false; // Ensure button is enabled after successful toggle | Убедимся, что кнопка активна после успешного переключения
        } catch (e) {
            console.warn('[Toggle Creamy] ⏩🚫🚫🚫 Failed to update text color due to Content Security Policy (CSP) restrictions:', e);
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

    // === Drag and Drop Functions | Функции перетаскивания ===
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
        }, { once: true });
    }

    // === Scroll Functions | Функции прокрутки ===
    function findScrollableElements() {
        const allElements = [...document.body.querySelectorAll('*')];
        return allElements.filter(el => {
            const style = window.getComputedStyle(el, null);
            const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') && el.scrollHeight > el.clientHeight;
            const isNotMenu = !el.matches('.vector-dropdown-content, .sidebar, .HeaderMainDMenu');
            const hasSignificantHeight = el.scrollHeight > 100 && el.clientHeight > 50;
            return isScrollable && isNotMenu && hasSignificantHeight;
        });
    }

    // Find main scrollable container based on hostname or heuristic | Найти основной прокручиваемый контейнер на основе домена или эвристики
    function getMainScrollableContainer() {
        // Step 1: Check if window is scrollable | Шаг 1: Проверяем, прокручиваем ли window
        if (document.documentElement.scrollHeight > window.innerHeight) {
            return window;
        }

        // Step 2: Check aiSites for known domains | Шаг 2: Проверяем aiSites для известных доменов
        const hostname = window.location.hostname;
        const aiSites = {
            'grok.com': 'div.w-full.h-full.overflow-y-auto.overflow-x-hidden',
            'chat.openai.com': 'div.overflow-y-auto',
            'chatgpt.com': 'div.flex.h-full.flex-col.overflow-y-auto',
            'gemini.google.com': 'div.overflow-y-auto'
        };

        for (const [domain, selector] of Object.entries(aiSites)) {
            if (hostname.includes(domain)) {
                const container = document.querySelector(selector);
                if (container && container.scrollHeight > container.clientHeight && container.clientHeight > 50) {
                    return container;
                }
                break; // Exit loop to avoid unnecessary checks | Выходим из цикла, чтобы избежать лишних проверок
            }
        }

        // Step 3: Universal search with visible area heuristic | Шаг 3: Универсальный поиск с эвристикой видимой площади
        const scrollableElements = findScrollableElements();

        // 3.1: Prioritize by largest visible area | Приоритет по наибольшей видимой площади
        let bestEl = null;
        let maxVisibleArea = 0;

        scrollableElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
            const visibleArea = rect.width * visibleHeight;
            const isSemanticMain = el.matches('main, article');

            if (visibleArea > maxVisibleArea) {
                maxVisibleArea = visibleArea;
                bestEl = el;
            } else if (visibleArea === maxVisibleArea && isSemanticMain) {
                bestEl = el;
            }
        });

        if (bestEl) {
            return bestEl;
        }

        // 3.2: Fallback to largest scrollHeight | Fallback на наибольший scrollHeight
        let maxScrollHeight = 0;
        bestEl = null;
        scrollableElements.forEach(el => {
            if (el.scrollHeight > maxScrollHeight) {
                maxScrollHeight = el.scrollHeight;
                bestEl = el;
            }
        });

        if (bestEl) {
            return bestEl;
        }

        // Default to window if no container found | По умолчанию window, если контейнер не найден
        return window;
    }

    // Scroll to top of the page or container | Прокрутка к началу страницы или контейнера
    function scrollToTop() {
        const target = getMainScrollableContainer();
        target.scrollTo({ top: 0, behavior: 'auto' });
    }

    // Scroll to bottom of the page or container | Прокрутка к концу страницы или контейнера
    function scrollToBottom() {
        const target = getMainScrollableContainer();
        if (target === window) {
            const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            window.scrollTo({ top: scrollHeight, behavior: 'auto' });
        } else {
            target.scrollTo({ top: target.scrollHeight, behavior: 'auto' });
        }
    }

    // === Initialization Functions | Функции инициализации ===
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
                color: #bbbca6; /* Button text color for inactive button | Цвет текста неактивной кнопки */
                border: 1px solid #bbbca6; /* Border color for inactive button text color | Цвет рамки неактивной кнопки */
                width: 116px; /* Added width to restore button size | Добавлена ширина для восстановления размера кнопки */
            }
            .creamy-button:hover {
                background-color: rgba(0,0,0,0.8); /* Hover style for CreamyTXT | Стиль наведения для CreamyTXT */
            }
            .creamy-button.active {
                color: #bbbca6; /* Button text color for active button | Цвет текста активной кнопки */
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
        const btnHome = createButton({ textContent: '⏫', onClick: scrollToTop, className: 'tampermonkey-button scroll-button' });
        const btnEnd = createButton({ textContent: '⏬', onClick: scrollToBottom, className: 'tampermonkey-button scroll-button' });
        scrollButtonsContainer.appendChild(btnHome);
        scrollButtonsContainer.appendChild(btnEnd);

        allButtonsContainer.appendChild(btnColor);
        allButtonsContainer.appendChild(scrollButtonsContainer);
        shadow.appendChild(allButtonsContainer);
        document.body.appendChild(container);
    }

    // Initialize observer to recreate buttons if DOM changes | Инициализация наблюдателя для воссоздания кнопок при изменении DOM
    let observer = null;
    function initializeObserver() {
        if (!document.body || observer) return; // Check for body and unique observer | Проверяем наличие body и уникальность observer
        observer = new MutationObserver(() => {
            if (!document.getElementById(containerId)) createButtons();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Initialize script on page load | Инициализация скрипта при загрузке страницы
    function initializeScript() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createButtons();
                initializeObserver();
            }, { once: true });
        } else {
            createButtons();
            initializeObserver();
        }
    }

    initializeScript();
  })();
