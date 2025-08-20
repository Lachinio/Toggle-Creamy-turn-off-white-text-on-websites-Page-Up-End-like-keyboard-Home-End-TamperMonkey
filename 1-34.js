// ==UserScript==
// @name         Page: Up, End + Toggle Creamy Text Color
// @namespace    http://tampermonkey.net/
// @version      1.34
// @description  Buttons to scroll page or container (for AI sites) up/down with instant scroll, change white color for text to creamy
// @match        *://*/*
// @icon         https://img.icons8.com/?size=100&id=EP1tNpVkUlA3&format=png&color=000000
// @author       Lachinio
// ==/UserScript==

(function () {
    // Define container ID for the button panel | Определяем ID контейнера для панели кнопок
    const containerId = 'myTampermonkeyButtonContainer';
  
    // Function to make the button container draggable | Функция для перетаскивания контейнера с кнопками
    function makeDraggable(el) {
      // Initialize dragging state and offsets | Инициализируем состояние перетаскивания и смещения
      let isDragging = false;
      let offsetX = 0;
      let offsetY = 0;
  
      // Start dragging on mousedown, ignore if target is a button | Начинаем перетаскивание при нажатии мыши, игнорируем, если цель - кнопка
      el.addEventListener('mousedown', (e) => {
        if (e.target.tagName.toLowerCase() === 'button') return;
        isDragging = true;
        offsetX = e.clientX - el.getBoundingClientRect().left;
        offsetY = e.clientY - el.getBoundingClientRect().top;
        el.style.transition = 'none';
        e.preventDefault();
      });
  
      // Update position during mouse move if dragging | Обновляем позицию при движении мыши, если перетаскивание активно
      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        el.style.left = `${e.clientX - offsetX}px`;
        el.style.top = `${e.clientY - offsetY}px`;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
      });
  
      // Stop dragging on mouseup | Прекращаем перетаскивание при отпускании мыши
      document.addEventListener('mouseup', () => {
        isDragging = false;
        el.style.transition = 'opacity 0.5s ease';
      });
    }
  
    // Function to find scrollable elements on the page | Функция для поиска прокручиваемых элементов на странице
    function findScrollableElements() {
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
      return scrollableElements;
    }
  
    // Function to select the main scrollable container or window | Функция для выбора основного прокручиваемого контейнера или окна
    function getMainScrollableContainer() {
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
            return container;
          }
          // If specific container not found, try universal search | Если специфичный контейнер не найден, пробуем универсальный поиск
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
            return selectedContainer;
          }
          // If no container found, fall back to window | Если контейнер не найден, возвращаемся к окну
          break;
        }
      }
  
      // Default to window scroll for non-AI sites | По умолчанию используем прокрутку окна для не-ИИ сайтов
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
      // Check if container already exists to avoid duplicates | Проверяем, существует ли контейнер, чтобы избежать дублирования
      if (document.getElementById(containerId)) return;
  
      // Create main container | Создаем главный контейнер
      const container = document.createElement('div');
      container.id = containerId;
      // Style the container (position, opacity, etc.) | Стилизуем контейнер (позиция, прозрачность и т.д.)
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '5px',
        right: '5px',
        zIndex: 99999,
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
      let isColored = false;
      const colorStyleElement = document.createElement('style');
      colorStyleElement.id = 'tampermonkey-color-style';
      document.head.appendChild(colorStyleElement);
  
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
      document.head.appendChild(style);
  
      // Append buttons to containers and to DOM | Добавляем кнопки в контейнеры и в DOM
      scrollButtonsContainer.appendChild(btnTop);
      scrollButtonsContainer.appendChild(btnEnd);
      container.appendChild(btnColor);
      container.appendChild(scrollButtonsContainer);
      document.body.appendChild(container);
    }
  
    // Initialize buttons when DOM is fully loaded | Инициализируем кнопки после полной загрузки DOM
    window.addEventListener('load', () => {
      createButtons();
    });
  
    // Observe DOM changes to recreate buttons if removed | Отслеживаем изменения DOM для повторного создания кнопок, если они удалены
    const observer = new MutationObserver(() => {
      if (!document.getElementById(containerId)) {
        createButtons();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  })();