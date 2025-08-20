**Description for users | ENG**

This script changes toxic white text into a soft, beautiful creamy color — especially useful on sites with dark themes.
The script also has Up/Down or Home/End buttons or Top/Bottom — you can call them whatever you want, the point is they work like real keyboard keys with Home/End functionality.

– The panel has a Drag'n'Drop feature for freely moving it around.
– The panel has the highest display priority over other website elements.
– The CreamyTXT button switches all toxic white text to a beautiful creamy color.
– The Up/Down buttons correspond to the Home/End keys on a keyboard — they move the view in the browser window to the very top or bottom of the page.

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

– The script is intended for PC versions only and has not been tested on touch devices.
***
**Описание для пользователей | RUS**

Скрипт отключает ядовитый белый на прекрасный кремовый. Особенно полезно на сайтах с тёмной темой. В скрипте так же есть кнопки Up/down или Home/End или Top/Bottom можете называть это как угодно, суть в том, что это аналог живых клавиш на клавиатуре с функцией Home/End.

– Панель имеет Drag'N'Drop функцию свободного перемещения.
– Панель имеет высший приоритет отображения над другими элементами сайтов.
– Кнопка CreamyTXT переключает весь ядовитый белый цвет текста на прекрасный кремовый.
– Кнопки Up/Down соответствуют клавишам Home/End на клавиатуре - что перемещает vision в окне браузера в самый верх, либо самый низ страницы.

– Если по какой-то причине вы хотите отключить скрипт на конкретном сайте, можно добавить его в список исключений на строчке 33
– Чтобы изменить прекрасный кремовый цвет на любой другой, который вы захотите, измените '#bbbca6' на строчке 65 с комментарием "// Change beautiful creamy color here | Поменять прекрасный кремовый цвет"
– Чтобы изменить цвет надписи кнопки "CreamyTXT" на любой другой, который вы захотите, измените строчки 306, 307, 314 с комментарием "// Button text color и т.д….”
– Задать параметры прозрачности панели (opacity: 0.1) можно в строчках 112, 137, 251, 252, 254, 255
– Изменить размеры кнопок можно в 6 разых строчках, с комментарием “// Button size и т.д….”
– Изменить базовое расположение панели в окне браузера можно в строчках 249, 250 с комментарием "// Position container at ..."

– Скрипт исключительно для ПК версий, не тестировался на сенсорных устройствах

## License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.
