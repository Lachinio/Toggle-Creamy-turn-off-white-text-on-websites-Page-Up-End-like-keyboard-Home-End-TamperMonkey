// ==UserScript==
// @name         Page: Up, End + Toggle Creamy Text Color
// @namespace    http://tampermonkey.net/
// @version      1.35.4(demo)
// @description  Buttons to scroll page or container (for AI sites) up/down with instant scroll, change white color for text to creamy
// @match        *://*/*
// @icon         https://img.icons8.com/?size=100&id=EP1tNpVkUlA3&format=png&color=000000
// @author       Lachinio
// ==/UserScript==

(function () {
  // Define container ID for the button panel | Определяем ID контейнера для панели кнопок
  const containerId = 'myTampermonkeyButtonContainer';
  const colorStyleId = 'tampermonkey-color-style';
  // Cache for the main scrollable container to prevent expensive lookups | Кэш для основного прокручиваемого контейнера
  let mainScrollContainer = null;
  let isColored = false;

  // eng comm | ru comm
  // Preferred container detected from user interaction (used only after validation). | Предпочитаемый контейнер, определённый взаимодействием пользователя (используется только после валидации).
  let userInteractedContainer = null;
  let userInteractionTimestamp = 0;

  // Function to make the button container draggable | Функция для перетаскивания контейнера с кнопками
  function makeDraggable(el) {
    // Initialize dragging state and offsets | Инициализируем состояние перетаскивания и смещения
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMouseMove = (e) => {
      if (!isDragging) return;
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    };

    const onMouseUp = () => {
      isDragging = false;
      el.style.transition = 'opacity 0.5s ease';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    el.addEventListener('mousedown', (e) => {
      if (e.target.tagName.toLowerCase() === 'button') return;
      isDragging = true;
      offsetX = e.clientX - el.getBoundingClientRect().left;
      offsetY = e.clientY - el.getBoundingClientRect().top;
      el.style.transition = 'none';
      e.preventDefault();
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  // eng comm | ru comm
  // Find nearest scrollable ancestor for an element. Walks up DOM and returns first ancestor with overflow-y and scrollable content. | Находит ближайшего прокручиваемого предка для элемента. Поднимается по DOM и возвращает первый предок с overflow-y и прокручиваемым содержимым.
  function findScrollableAncestor(el) {
    while (el && el !== document && el !== document.documentElement) {
      try {
        const style = getComputedStyle(el);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && el.scrollHeight > el.clientHeight) {
          const rect = el.getBoundingClientRect();
          if (rect.height > 50 && rect.width > 50 && rect.bottom > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight)) {
            const idcls = (el.id || '') + ' ' + (el.className || '');
            // Exclude common analytics/overlay elements that often capture events but are useless for scrolling
            if (!/mc-|clmap|yandex|ym-|overlay|cookie|consent/i.test(idcls)) {
              return el;
            }
          }
        }
      } catch (err) {
        // ignore cross-origin or computed style errors
      }
      el = el.parentElement;
    }
    return null;
  }

  // eng comm | ru comm
  // Validate a container is still a good candidate: in document, visible, sizable and has scrollable content. | Проверяет контейнер: в документе, видим, достаточный размер и есть прокручиваемое содержимое.
  function isValidContainer(el) {
    if (!el) return false;
    // **Do not accept body/html as a scroll-container** — treat them as window-level scroll. | **Не принимаем body/html как контейнер** — считаем их скроллом окна.
    try {
      if (el.tagName && (el.tagName.toLowerCase() === 'body' || el.tagName.toLowerCase() === 'html')) return false;
    } catch (err) {
      // ignore
    }
    if (el === window || el === document) return false;
    if (!document.contains(el)) return false;
    try {
      if (el.scrollHeight - el.clientHeight < 50) return false;
      const style = getComputedStyle(el);
      if (!/(auto|scroll|overlay)/.test(style.overflowY)) return false;
      const rect = el.getBoundingClientRect();
      if (rect.height < 50 || rect.width < 50) return false;
      if (rect.bottom <= 0 || rect.top >= (window.innerHeight || document.documentElement.clientHeight)) return false;
      const idcls = (el.id || '') + ' ' + (el.className || '');
      if (/mc-|clmap|yandex|ym-|overlay/i.test(idcls)) return false;
    } catch (err) {
      return false;
    }
    return true;
  }

  // Function to find scrollable elements on the page | Функция для поиска прокручиваемых элементов на странице
  function findScrollableElements() {
    const start = performance.now();
    // Get all elements in the DOM | Получаем все элементы в DOM
    const allElements = [...document.body.querySelectorAll('*')];
    // Filter elements that are scrollable and meet criteria | Фильтруем элементы, которые прокручиваются и соответствуют критериям
    const scrollableElements = allElements.filter(el => {
      const style = getComputedStyle(el);
      const overflowY = style.overflowY;
      // Check if element is scrollable (has overflow-y: auto/scroll/overlay and content exceeds height) | Проверяем, прокручивается ли элемент (overflow-y: auto/scroll/overlay и контент превышает высоту)
      const isScrollable = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && el.scrollHeight > el.clientHeight;
      // Exclude menus, sidebars, or irrelevant elements | Исключаем меню, боковые панели или неподходящие элементы
      const isNotMenuOrSidebar = !el.classList.contains('vector-dropdown-content') &&
                                 !el.classList.contains('sidebar') &&
                                 !el.classList.contains('HeaderMainDMenu');
      // Ensure element has significant size to avoid small containers | Убедимся, что элемент имеет значительный размер, чтобы избежать мелких контейнеров
      const hasSignificantHeight = el.scrollHeight > 100 && el.clientHeight > 50;
      return isScrollable && isNotMenuOrSidebar && hasSignificantHeight;
    });
    const end = performance.now();
    console.log(`[Tampermonkey] findScrollableElements took ${end - start} ms. Found ${scrollableElements.length} candidates.`);
    return scrollableElements;
  }

  // eng comm | ru comm
  // Track user scrolls/clicks to detect the actively used scroll container. Kept as lightweight as possible. | Отслеживает прокрутки/клики пользователя для определения активно используемого контейнера. Стараемся быть лёгкими.
  function initUserInteractionTracker() {
    // capture phase to catch events before site handlers
    document.addEventListener('scroll', (e) => {
      const candidate = findScrollableAncestor(e.target) || (document.scrollingElement || document.documentElement);
      if (candidate && candidate !== document.body && candidate !== document.documentElement && candidate !== document) {
        if (isValidContainer(candidate)) {
          userInteractedContainer = candidate;
          userInteractionTimestamp = Date.now();
          console.log('[Tampermonkey] user-interacted container set (scroll):', userInteractedContainer);
        }
      } else {
        // If top-level/document scroll, clear candidate to prefer window
        if (e.target === document || e.target === document.documentElement || e.target === document.body) {
          userInteractedContainer = null;
        }
      }
    }, true);

    document.addEventListener('click', (e) => {
      const candidate = findScrollableAncestor(e.target);
      // **Don't accept body/html as candidate on click** — require a real scrollable ancestor element. | **Не принимаем body/html на click** — требуется реальный прокручиваемый предок.
      if (candidate && candidate !== document.body && candidate !== document.documentElement && isValidContainer(candidate)) {
        userInteractedContainer = candidate;
        userInteractionTimestamp = Date.now();
        console.log('[Tampermonkey] user-interacted container set (click):', userInteractedContainer);
      }
    }, true);
  }

  // Function to select the main scrollable container or window | Функция для выбора основного прокручиваемого контейнера или окна
  function getMainScrollableContainer() {
    // Use user-interacted container if it's valid and recent (fallback to brute-force if not) | Используем контейнер из взаимодействия пользователя, если он валиден и недавний (в противном случае fallback)
    if (userInteractedContainer && isValidContainer(userInteractedContainer) && (Date.now() - userInteractionTimestamp) < 20000) {
      console.log("[Tampermonkey] Using user-interacted container.");
      mainScrollContainer = userInteractedContainer;
      return mainScrollContainer;
    }

    // Use cached container if available | Используем закэшированный контейнер, если он есть
    if (mainScrollContainer) {
      console.log("[Tampermonkey] Using cached scroll container.");
      return mainScrollContainer;
    }

    console.log("[Tampermonkey] Searching for main scroll container...");
    // Get current hostname for site detection | Получаем текущий hostname для определения сайта
    const hostname = window.location.hostname;

    // Define specific selectors for AI sites based on logs | Определяем специфичные селекторы для ИИ-сайтов на базе логов
    const aiSites = {
      'grok.com': 'div.w-full.h-full.overflow-y-auto.overflow-x-hidden',
      'chat.openai.com': 'div.overflow-y-auto',
      'chatgpt.com': 'div.flex.h-full.flex-col.overflow-y-auto',
      'gemini.google.com': 'div.overflow-y-auto'
    };

    // Check if the site is an AI site | Проверяем, является ли сайт ИИ-сайтом
    for (const [domain, selector] of Object.entries(aiSites)) {
      if (hostname.includes(domain)) {
        // Verify if container exists and is scrollable | Проверяем, существует ли контейнер и прокручивается ли он
        const container = document.querySelector(selector);
        if (container && container.scrollHeight > container.clientHeight && container.clientHeight > 50) {
          console.log(`[Tampermonkey] Found AI site container for ${domain}:`, container);
          mainScrollContainer = container;
          return container;
        }
        // If specific container not found, try universal search | Если специфичный контейнер не найден, пробуем универсальный поиск
        console.log(`[Tampermonkey] Specific container for ${domain} not found, falling back to universal search.`);
        break;
      }
    }

    const scrollableElements = findScrollableElements();
    let maxScrollHeight = 0;
    let selectedContainer = null;
    // Select the container with the largest scrollable height | Выбираем контейнер с наибольшей высотой прокрутки
    scrollableElements.forEach(el => {
      if (el.scrollHeight > maxScrollHeight) {
        maxScrollHeight = el.scrollHeight;
        selectedContainer = el;
      }
    });
    if (selectedContainer) {
      console.log("[Tampermonkey] Found container via universal search:", selectedContainer);
      mainScrollContainer = selectedContainer;
      return selectedContainer;
    }
    // If no container found, fall back to window | Если контейнер не найден, возвращаемся к окну
    console.log("[Tampermonkey] No specific container found, using window.");
    mainScrollContainer = window;
    return window;
  }

  // Function to scroll to the top of the page or container | Функция для прокрутки к верху страницы или контейнера
  function scrollToTop() {
    const target = getMainScrollableContainer();
    if (target === window) {
      // Scroll window to top for non-AI sites | Прокручиваем окно к верху для не-ИИ сайтов
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Scroll container to top for AI sites | Прокручиваем контейнер к верху для ИИ-сайтов
      target.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Function to scroll to the bottom of the page or container | Функция для прокрутки к низу страницы или контейнера
  function scrollToBottom() {
    const target = getMainScrollableContainer();
    if (target === window) {
      // Scroll window to bottom for non-AI sites | Прокручиваем окно к низу для не-ИИ сайтов
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      window.scrollTo({ top: scrollHeight, behavior: "smooth" });
    } else {
      // Scroll container to bottom for AI sites | Прокручиваем контейнер к низу для ИИ-сайтов
      target.scrollTo({ top: target.scrollHeight, behavior: "smooth" });
    }
  }

  // Function to create a scroll button with common styles and behavior | Функция для создания кнопки прокрутки с общими стилями и поведением
  function createScrollButton(textContent, onClick) {
    // Create button element | Создаем элемент кнопки
    const button = document.createElement('button');
    button.textContent = textContent;
    // Apply common styles to scroll button | Применяем общие стили к кнопке прокрутки
    Object.assign(button.style, {
      padding: '6px 4px',
      backgroundColor: '#4CAF50',
      color: 'black',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      transition: 'background-color 0.3s',
      width: '50%',
      outline: 'none'
    });
    button.style.setProperty('color', 'black', 'important');
    // Add hover effects for scroll button | Добавляем эффекты наведения для кнопки прокрутки
    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "#45a049";
    });
    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "#4CAF50";
    });
    // Set click handler for scroll action | Устанавливаем обработчик клика для действия прокрутки
    button.onclick = onClick;
    return button;
  }

  // Function to create buttons and container | Функция для создания кнопок и контейнера
  function createButtons() {
    console.log("[Tampermonkey] Attempting to create buttons.");
    if (!document.body) {
      console.error("[Tampermonkey] document.body not found, cannot create buttons.");
      return;
    }

    // Check if container already exists to avoid duplicates | Проверяем, существует ли контейнер, чтобы избежать дублирования
    if (document.getElementById(containerId)) {
      console.log("[Tampermonkey] Buttons container already exists, skipping creation.");
      return;
    }

    // Create main container | Создаем главный контейнер
    const container = document.createElement('div');
    container.id = containerId;
    // Style the container (position, opacity, etc.) | Стилизуем контейнер (позиция, прозрачность и т.д.)
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '5px',
      right: '5px',
      zIndex: 2147483647, // Use max zIndex for guaranteed visibility | Используем максимальный zIndex для гарантированной видимости
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      userSelect: 'none',
      opacity: '0.1',
      transition: 'opacity 0.5s ease',
      cursor: 'grab'
    });

    // Add hover effects for container visibility | Добавляем эффекты наведения для видимости контейнера
    container.addEventListener('mouseenter', () => {
      container.style.opacity = '1';
    });
    container.addEventListener('mouseleave', () => {
      container.style.opacity = '0.1';
    });

    // Make container draggable | Делаем контейнер перетаскиваемым
    makeDraggable(container);

    // Create container for scroll buttons (horizontal layout) | Создаем контейнер для кнопок прокрутки (горизонтальная компоновка)
    const scrollButtonsContainer = document.createElement('div');
    Object.assign(scrollButtonsContainer.style, {
      display: 'flex',
      flexDirection: 'row',
      gap: '4px'
    });

    // Create scroll buttons using reusable function | Создаем кнопки прокрутки с помощью повторно используемой функции
    const btnTop = createScrollButton("⏫", scrollToTop);
    const btnEnd = createScrollButton("⏬", scrollToBottom);

    // Create "Toggle Text Color" button | Создаем кнопку для переключения цвета текста
    const colorStyleElement = document.createElement('style');
    colorStyleElement.id = colorStyleId;
    if (document.head) document.head.appendChild(colorStyleElement);

    const btnColor = document.createElement('button');
    btnColor.textContent = "🎨 CreamyTXT";
    Object.assign(btnColor.style, {
      padding: '6px 9px',
      backgroundColor: 'rgba(0,0,0,0.5)',
      color: '#bbbca6',
      border: '1px solid #bbbca6',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      transition: 'background-color 0.3s, color 0.3s',
      outline: 'none'
    });
    // Add hover effects for color button | Добавляем эффекты наведения для кнопки цвета
    btnColor.addEventListener("mouseenter", () => {
      btnColor.style.backgroundColor = "rgba(0,0,0,0.8)";
      btnColor.style.color = "#bbbca6"; // color text on button | цвет надписи кнопки
    });
    btnColor.addEventListener("mouseleave", () => {
      btnColor.style.backgroundColor = "rgba(0,0,0,0.5)";
      btnColor.style.color = isColored ? "#fff" : "#bbbca6";
    });
    // Toggle creamy text color on click | Переключаем кремовый цвет текста при клике
    btnColor.onclick = () => {
      if (!isColored) {
        colorStyleElement.textContent = `* { color: #bbbca6 !important; }`;
        btnColor.style.color = "#fff";
        btnColor.style.backgroundColor = "rgba(0,0,0,0.8)";
      } else {
        colorStyleElement.textContent = '';
        btnColor.style.color = "#bbbca6"; // Set color for white text on website | установка цвета для переключения с белого текста на сайтах
        btnColor.style.backgroundColor = "rgba(0,0,0,0.5)";
      }
      isColored = !isColored;
    };

    // Add style to remove focus outline from buttons | Добавляем стиль для удаления контура фокуса с кнопок
    const style = document.createElement('style');
    style.textContent = `#${containerId} button:focus { outline: none; }`;
    if (document.head) document.head.appendChild(style);

    // Append buttons to containers and to DOM | Добавляем кнопки в контейнеры и в DOM
    scrollButtonsContainer.appendChild(btnTop);
    scrollButtonsContainer.appendChild(btnEnd);
    container.appendChild(btnColor);
    container.appendChild(scrollButtonsContainer);
    document.body.appendChild(container);
  }

  // "Smart" MutationObserver | "Умный" MutationObserver
  // Instead of recreating buttons, it resets the container cache if buttons disappear | Вместо пересоздания кнопок, он сбрасывает кэш контейнера, если кнопки исчезают
  let observer = null;
  function initializeObserver() {
    if (!document.body || observer) return;
    console.log("[Tampermonkey] Initializing MutationObserver.");
    observer = new MutationObserver((mutationsList, observer) => {
      // Check if our container exists | Проверяем, существует ли наш контейнер
      if (!document.getElementById(containerId)) {
        console.warn("[Tampermonkey] Buttons container was removed from DOM. Recreating...");
        // Reset cache and recreate buttons to handle SPA navigations | Сбрасываем кэш и пересоздаем кнопки для работы в SPA
        mainScrollContainer = null;
        createButtons();
      }
    });
    // The observer will now watch for changes in the entire document body | Наблюдатель будет следить за изменениями во всем теле документа
    observer.observe(document.body, { childList: true, subtree: true });
  }
  // Initial setup | Начальная настройка
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      createButtons();
      initUserInteractionTracker();
      initializeObserver();
    });
  } else {
    createButtons();
    initUserInteractionTracker();
    initializeObserver();
  }
})();

/*
Изменения в этой версии против 1.34
– Реализован метод скрола по клику по области. Кликовая логика. В следующей версии нужно распределить приоритеты:
для всех сайтов старый способ, для ai новый
*/