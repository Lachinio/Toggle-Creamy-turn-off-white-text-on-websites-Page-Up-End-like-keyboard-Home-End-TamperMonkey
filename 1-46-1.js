// ==UserScript==
// @name         Page: Up, End + Toggle Creamy Text Color
// @namespace    http://tampermonkey.net/
// @version      1.46.1
// @description  Buttons to scroll page or container (for AI sites) up/down, change text color
// @match        *://*/*
// @icon         https://img.icons8.com/?size=100&id=EP1tNpVkUlA3&format=png&color=000000
// @author       Lachinio
// ==/UserScript==

(function () {
    'use strict';
  
    // Global Variables | Глобальные переменные
    const containerId = 'myTampermonkeyButtonContainer';
    const creamyColor = '#bbbca6'; // The color used for creamy text | Цвет для кремового текста
    const lightColor = '#fff'; // The color for the button when active | Цвет кнопки, когда она активна
    const darkColor = '#bbbca6'; // The color for the button when inactive | Цвет кнопки, когда она неактивна
    let mainScrollContainer = null;
    let isColored = false;
    let observer = null;
  
    // List of excluded tags and classes to prevent coloring of specific elements | Список исключаемых тегов и классов, чтобы избежать раскрашивания определенных элементов
    const EXCLUDED_TAGS = ['PRE', 'CODE', 'BUTTON', 'INPUT', 'TEXTAREA'];
    const EXCLUDED_CLASSES = ['hljs', 'cm-content', 'ace_editor', 'ql-editor'];
  
    // Make the button container draggable | Делаем контейнер с кнопками перетаскиваемым
    function makeDraggable(el) {
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
  
    // Find the main scrollable container on the page | Поиск основного прокручиваемого контейнера на странице
    function findScrollableElements() {
      const allElements = [...document.body.querySelectorAll('*')];
      const scrollableElements = allElements.filter(el => {
        const style = getComputedStyle(el);
        const overflowY = style.overflowY;
        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && el.scrollHeight > el.clientHeight;
        const isNotMenuOrSidebar = !el.classList.contains('vector-dropdown-content') &&
                                   !el.classList.contains('sidebar') &&
                                   !el.classList.contains('HeaderMainDMenu');
        const hasSignificantHeight = el.scrollHeight > 100 && el.clientHeight > 50;
        return isScrollable && isNotMenuOrSidebar && hasSignificantHeight;
      });
      return scrollableElements;
    }
  
    function getMainScrollableContainer() {
      if (mainScrollContainer) {
        return mainScrollContainer;
      }
  
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
            mainScrollContainer = container;
            return container;
          }
          break;
        }
      }
  
      const scrollableElements = findScrollableElements();
      let maxScrollHeight = 0;
      let selectedContainer = null;
      scrollableElements.forEach(el => {
        if (el.scrollHeight > maxScrollHeight) {
          maxScrollHeight = el.scrollHeight;
          selectedContainer = el;
        }
      });
  
      if (selectedContainer) {
        mainScrollContainer = selectedContainer;
        return selectedContainer;
      }
  
      mainScrollContainer = window;
      return window;
    }
  
    // Scroll to the top of the container or page | Прокрутка к началу контейнера или страницы
    function scrollToTop() {
      const target = getMainScrollableContainer();
      if (target === window) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        target.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  
    // Scroll to the bottom of the container or page | Прокрутка к концу контейнера или страницы
    function scrollToBottom() {
      const target = getMainScrollableContainer();
      if (target === window) {
        const scrollHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
        window.scrollTo({ top: scrollHeight, behavior: "smooth" });
      } else {
        target.scrollTo({ top: target.scrollHeight, behavior: "smooth" });
      }
    }
  
    // Create a scroll button | Создание кнопки прокрутки
    function createScrollButton(textContent, onClick) {
      const button = document.createElement('button');
      button.textContent = textContent;
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
      button.addEventListener("mouseenter", () => {
        button.style.backgroundColor = "#45a049";
      });
      button.addEventListener("mouseleave", () => {
        button.style.backgroundColor = "#4CAF50";
      });
      button.onclick = onClick;
      return button;
    }
  
    // Check if a node or any of its parents should be excluded from coloring | Проверка, следует ли исключить узел или его родителей из раскрашивания
    function isExcluded(node) {
      if (!node || node.tagName === 'HTML' || node.tagName === 'BODY') return false;
  
      // Log the current node being checked | Логируем текущий проверяемый узел
      console.log(`[isExcluded] Checking node: ${node.tagName}, classList: ${node.classList}`);
  
      // Check for excluded tags and classes | Проверяем на исключаемые теги и классы
      if (EXCLUDED_TAGS.includes(node.tagName)) {
        console.log(`[isExcluded] Node excluded by tag: ${node.tagName}`);
        return true;
      }
      for (const cls of EXCLUDED_CLASSES) {
        if (node.classList && node.classList.contains(cls)) {
          console.log(`[isExcluded] Node excluded by class: ${cls}`);
          return true;
        }
      }
  
      // Check if any parent node is excluded | Проверяем, исключен ли какой-либо из родительских узлов
      let parent = node.parentNode;
      while (parent && parent !== document.body) {
        if (EXCLUDED_TAGS.includes(parent.tagName)) {
          console.log(`[isExcluded] Parent node excluded by tag: ${parent.tagName}`);
          return true;
        }
        for (const cls of EXCLUDED_CLASSES) {
          if (parent.classList && parent.classList.contains(cls)) {
            console.log(`[isExcluded] Parent node excluded by class: ${cls}`);
            return true;
          }
        }
        parent = parent.parentNode;
      }
  
      console.log(`[isExcluded] Node passed all checks.`);
      return false;
    }
  
    // Apply or remove creamy text color to a specific root node | Применить или убрать кремовый цвет текста для конкретного корневого узла
    function applyCreamyText(rootNode = document.body) {
      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (isExcluded(node.parentNode)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
  
      let node;
      while (node = walker.nextNode()) {
        if (isColored) {
          node.parentNode.style.setProperty('color', creamyColor, 'important');
        } else {
          node.parentNode.style.removeProperty('color');
        }
      }
    }
  
    // Handle coloring for the input area specifically | Обработка раскраски для поля ввода
    function handleInputArea() {
        const inputElement = document.querySelector('.ql-editor');
        if (inputElement) {
            // Find the <p> tag inside the .ql-editor and apply the color to it | Находим тег <p> внутри .ql-editor и применяем к нему цвет
            const textParagraph = inputElement.querySelector('p');
            if (textParagraph) {
                if (isColored) {
                    textParagraph.style.setProperty('color', creamyColor, 'important');
                } else {
                    textParagraph.style.removeProperty('color');
                }
            }
        }
    }
  
    // Toggle creamy text coloring for the entire document | Переключение кремовой раскраски текста для всего документа
    function toggleCreamyText() {
      isColored = !isColored;
      if (isColored) {
        applyCreamyText();
        handleInputArea(); // Apply color to input area
      } else {
        const allElements = document.body.querySelectorAll('*');
        allElements.forEach(el => {
          if (el.style.getPropertyValue('color') === 'rgb(187, 188, 166)') {
            el.style.removeProperty('color');
          }
        });
        handleInputArea(); // Remove color from input area
      }
  
      // Update color button appearance | Обновляем внешний вид кнопки цвета
      const btnColor = document.querySelector(`#${containerId} button:first-child`);
      if (btnColor) {
        btnColor.style.color = isColored ? lightColor : darkColor;
      }
    }
  
    // Create the button container and buttons | Создание контейнера и кнопок
    function createButtons() {
      if (!document.body || document.getElementById(containerId)) {
        return;
      }
  
      const container = document.createElement('div');
      container.id = containerId;
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '5px',
        right: '5px',
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        userSelect: 'none',
        opacity: '0.1',
        transition: 'opacity 0.5s ease',
        cursor: 'grab'
      });
  
      container.addEventListener('mouseenter', () => {
        container.style.opacity = '1';
      });
      container.addEventListener('mouseleave', () => {
        container.style.opacity = '0.1';
      });
  
      makeDraggable(container);
  
      const scrollButtonsContainer = document.createElement('div');
      Object.assign(scrollButtonsContainer.style, {
        display: 'flex',
        flexDirection: 'row',
        gap: '4px'
      });
  
      const btnTop = createScrollButton("⏫", scrollToTop);
      const btnEnd = createScrollButton("⏬", scrollToBottom);
  
      const btnColor = document.createElement('button');
      btnColor.textContent = "🎨 CreamyTXT";
      Object.assign(btnColor.style, {
        padding: '6px 9px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: darkColor,
        border: '1px solid #bbbca6',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        transition: 'background-color 0.3s, color 0.3s',
        outline: 'none'
      });
  
      btnColor.addEventListener("mouseenter", () => {
        btnColor.style.backgroundColor = "rgba(0,0,0,0.8)";
      });
      btnColor.addEventListener("mouseleave", () => {
        btnColor.style.backgroundColor = "rgba(0,0,0,0.5)";
        btnColor.style.color = isColored ? lightColor : darkColor;
      });
  
      btnColor.onclick = () => {
        toggleCreamyText();
      };
  
      const style = document.createElement('style');
      style.textContent = `#${containerId} button:focus { outline: none; }`;
      document.head.appendChild(style);
  
      scrollButtonsContainer.appendChild(btnTop);
      scrollButtonsContainer.appendChild(btnEnd);
      container.appendChild(btnColor);
      container.appendChild(scrollButtonsContainer);
      document.body.appendChild(container);
    }
  
    // Initialize the MutationObserver to handle dynamically added content | Инициализация MutationObserver для обработки динамически добавляемого контента
    function initializeObserver() {
      if (observer) return;
      observer = new MutationObserver((mutations) => {
        if (isColored) {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              for (const addedNode of mutation.addedNodes) {
                if (addedNode.nodeType === 1) { // Element node | Узел-элемент
                  applyCreamyText(addedNode);
                  handleInputArea();
                }
              }
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  
    // Initial setup | Начальная настройка
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => {
        createButtons();
        initializeObserver();
      });
    } else {
      createButtons();
      initializeObserver();
    }
  })();

/*
Частично устранена проблема покраски кода. 
Некоторые элементы кода добавлены в игнор лист, но пропускаются белые комментарии и белые кнопки на ютубе
Потенциальные минусы (не игнорируя твои аргументы): Ты прав, селективность приводит к нагромождению и пропускам. Но истина — компромисс: вместо чистого *, используй body *:not(button):not(input):not(code):not(pre) { color: #bbbca6 !important; } — это глобально, но исключает критичные (кнопки, формы, код). Не нагромоздит код (одна строка), но сохранит robustness. Или добавь toggle для "строгого" режима (только текст-элементы: p, span, div, li). Пробуй: в toggleTextColor замени на это — протестируй на AI, не сломает ли.
Идея из источников: Tutorials советуют начинать с body { color: !important; }, но добавлять исключения для !breaking.

*/
