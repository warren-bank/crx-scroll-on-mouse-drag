// ==UserScript==
// @name         Scroll on Mouse Drag
// @description  Click and drag the mouse to scroll the page. Intended for mobile web browsers that don't automatically map from mouse events to touch events. (ex: Chrome 58+, WebView, WebMonkey)
// @version      1.0.0
// @match        *://*/*
// @icon         https://uxwing.com/wp-content/themes/uxwing/download/hand-gestures/touch-icon.png
// @run-at       document-start
// @unwrap
// @homepage     https://github.com/warren-bank/crx-scroll-on-mouse-drag/tree/userscript/es5
// @supportURL   https://github.com/warren-bank/crx-scroll-on-mouse-drag/issues
// @downloadURL  https://github.com/warren-bank/crx-scroll-on-mouse-drag/raw/userscript/es5/userscript/scroll-on-mouse-drag.user.js
// @updateURL    https://github.com/warren-bank/crx-scroll-on-mouse-drag/raw/userscript/es5/userscript/scroll-on-mouse-drag.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

(function(){
  var isMouseDown = false;
  var prevPoint = null;

  var onMouseDown = function() {
    isMouseDown = true;
  };

  var onMouseUp = function() {
    isMouseDown = false;
    prevPoint = null;
  };

  var onMouseMove = function(event) {
    if (!isMouseDown) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    var thisPoint = {
      x: event.clientX,
      y: event.clientY
    };

    var xCoord, yCoord;
    if (prevPoint) {
      xCoord = prevPoint.x - thisPoint.x;
      yCoord = prevPoint.y - thisPoint.y;

      window.scrollBy(xCoord, yCoord);
    }

    prevPoint = thisPoint;
  };

  var initDocument = function() {
    document.removeEventListener('mousedown', onMouseDown, true);
    document.removeEventListener('mouseup',   onMouseUp,   true);
    document.removeEventListener('mousemove', onMouseMove, true);

    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('mouseup',   onMouseUp,   true);
    document.addEventListener('mousemove', onMouseMove, true);
  };

  initDocument();

  var realDocumentOpen  = document.open;
  var realDocumentWrite = document.write;
  var realDocumentClose = document.close;
  document.open = function() {
    realDocumentOpen.apply(document, arguments)
    initDocument();
  };
  document.write = function() {
    realDocumentWrite.apply(document, arguments)
    initDocument();
  };
  document.close = function() {
    realDocumentClose.apply(document, arguments)
    initDocument();
  };
})();
