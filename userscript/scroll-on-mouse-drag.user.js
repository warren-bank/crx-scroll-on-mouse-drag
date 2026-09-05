// ==UserScript==
// @name         Scroll on Mouse Drag
// @description  Click and drag the mouse to scroll the page. Intended for mobile web browsers that don't automatically map from mouse events to touch events. (ex: Chrome 58+, WebView, WebMonkey)
// @version      2.1.0
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
  var flingState = {
    constants: {
      enabled: true,
      debug: false,
      duration: 500, // Fling duration in ms.
      easing: 'circ' // Ease-out curve. Any of: ['linear', 'sqrt', 'quad', 'cubic', 'circ']. Default: 'circ'.
    },
    isAnimating: false,
    mousemove: {
      points: [], // [{x,y,timestamp},{x,y,timestamp}]
    },
    mouseup: {
      scroll: {
        x: 0,
        y: 0
      }
    },
    delta: {
      x: 0,
      y: 0,
      timestamp: 0,
      velocity: {
        x: 0,
        y: 0
      }
    },
    interpolations: {
      totalDistance: {
        x: 0,
        y: 0
      }
    }
  };

  if (flingState.constants.duration <= 0) {
    flingState.constants.enabled = false;
  }

  var onMouseDown = function(event) {
    isMouseDown = true;
    prevPoint = {
      x: event.clientX,
      y: event.clientY
    };

    if (!flingState.constants.enabled) return;

    flingState.isAnimating = false;
    flingState.mousemove.points = [{
      x: event.clientX,
      y: event.clientY,
      timestamp: performance.now()
    }];
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

    if (!flingState.constants.enabled) return;

    flingState.mousemove.points = [
      flingState.mousemove.points.pop(),
      {
        x: event.clientX,
        y: event.clientY,
        timestamp: performance.now()
      }
    ];
  };

  var onMouseUp = function() {
    if (!isMouseDown) return;

    isMouseDown = false;
    prevPoint = null;

    if (!flingState.constants.enabled || (flingState.mousemove.points.length !== 2)) return;

    flingState.mouseup.scroll = {
      x: window.scrollX,
      y: window.scrollY
    };

    flingState.delta.x = flingState.mousemove.points[1].x - flingState.mousemove.points[0].x;
    flingState.delta.y = flingState.mousemove.points[1].y - flingState.mousemove.points[0].y;
    flingState.delta.timestamp = flingState.mousemove.points[1].timestamp - flingState.mousemove.points[0].timestamp;

    if (flingState.delta.timestamp === 0) return;
    flingState.delta.velocity.x = flingState.delta.x / flingState.delta.timestamp; // dx/dt
    flingState.delta.velocity.y = flingState.delta.y / flingState.delta.timestamp; // dy/dt

    flingState.interpolations.totalDistance = {
      x: flingState.delta.velocity.x * flingState.constants.duration,
      y: flingState.delta.velocity.y * flingState.constants.duration
    };

    if (flingState.constants.debug) console.log(flingState.mouseup.scroll);
    flingState.isAnimating = true;
    requestAnimationFrame(animateFlingFrame);
  };

  var animateFlingFrame = function(currentTime) {
    if (!flingState.isAnimating) return;

    var elapsed = currentTime - flingState.mousemove.points[1].timestamp;
    var remaining = flingState.constants.duration - elapsed;

    if (remaining < 0) {
      flingState.isAnimating = false;
      return;
    }

    // Exponential decay of velocity
    var percentDistance, flingX, flingY, xCoord, yCoord;

    if (elapsed > 0) {
      percentDistance = getPercentDistance(elapsed, remaining, flingState.constants.duration);

      flingX = Math.floor(flingState.interpolations.totalDistance.x * percentDistance);
      flingY = Math.floor(flingState.interpolations.totalDistance.y * percentDistance);

      xCoord = flingState.mouseup.scroll.x - flingX;
      yCoord = flingState.mouseup.scroll.y - flingY;

      if (flingState.constants.debug) console.log({x: xCoord, y: yCoord});
      window.scrollTo(xCoord, yCoord);
    }

    if (remaining > 0) {
      requestAnimationFrame(animateFlingFrame);
    }
  };

  var getPercentDistance_linear = function(elapsed, remaining, duration) {
    var percentElapsed = elapsed / duration; // value in range: 0..1
    return percentElapsed;                   // value in range: 0..1
  };

  var getPercentDistance_sqrt = function(elapsed, remaining, duration) {
    // https://www.wolframalpha.com/input?i=plot+Sqrt%5Bx%5D+for+x+in+%280%2C1%29
    var percentElapsed = elapsed / duration; // value in range: 0..1
    return Math.sqrt(percentElapsed);        // value in range: 0..1
  };

  var getPercentDistance_quad = function(elapsed, remaining, duration) {
    // https://easings.net/#easeOutQuad
    var percentRemaining = remaining / duration; // value in range: 0..1
    return 1 - Math.pow(percentRemaining, 2);    // value in range: 0..1
  };

  var getPercentDistance_cubic = function(elapsed, remaining, duration) {
    // https://easings.net/#easeOutCubic
    var percentRemaining = remaining / duration; // value in range: 0..1
    return 1 - Math.pow(percentRemaining, 3);    // value in range: 0..1
  };

  var getPercentDistance_circ = function(elapsed, remaining, duration) {
    // https://easings.net/#easeOutCirc
    var percentElapsed = elapsed / duration;               // value in range: 0..1
    return Math.sqrt(1 - Math.pow(percentElapsed - 1, 2)); // value in range: 0..1
  };

  var getPercentDistance = getPercentDistance_circ;
  switch(flingState.constants.easing) {
    case 'linear':
      getPercentDistance = getPercentDistance_linear;
      break;
    case 'sqrt':
      getPercentDistance = getPercentDistance_sqrt;
      break;
    case 'quad':
      getPercentDistance = getPercentDistance_quad;
      break;
    case 'cubic':
      getPercentDistance = getPercentDistance_cubic;
      break;
    case 'circ':
      getPercentDistance = getPercentDistance_circ;
      break;
  }

  var onMouseLeave = function() {
    if (!isMouseDown) return;

    onMouseUp();
    isMouseDown = true;
  }

  var onMouseEnter = function(event) {
    if (!isMouseDown) return;

    if ((event.buttons & 1) === 0) {
      // left button is no-longer down
      isMouseDown = false;
    }
    else {
      onMouseDown(event);
    }
  }

  var initDocument = function() {
    document.removeEventListener('mousedown',  onMouseDown,  true);
    document.removeEventListener('mousemove',  onMouseMove,  true);
    document.removeEventListener('mouseup',    onMouseUp,    true);
    document.removeEventListener('mouseleave', onMouseLeave, true);
    document.removeEventListener('mouseenter', onMouseEnter, true);

    document.addEventListener('mousedown',  onMouseDown,  true);
    document.addEventListener('mousemove',  onMouseMove,  true);
    document.addEventListener('mouseup',    onMouseUp,    true);
    document.addEventListener('mouseleave', onMouseLeave, true);
    document.addEventListener('mouseenter', onMouseEnter, true);
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
