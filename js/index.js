"use strict";
function qs(selector, scope) {
    return (scope || document).querySelector(selector);
}
var eventList = [];
var html = qs('html');
var prev = {
    x: -1,
    y: -1,
    angle: 0,
    distance: 0
};
var current = {
    scale: 1,
    x: 0,
    y: 0,
    opacity: 1,
    angle: 0,
    distance: 0
};
var maxScrollX, maxScrollY;
function calculateMaxScroll(value, scale) {
    return ((value * scale) - value) / (scale * 2);
}
function addPointerEvent(event) {
    eventList.push(event);
}
function indexOfEvent(_a) {
    var pointerId = _a.pointerId;
    for (var i = 0; i < eventList.length; i++) {
        if (eventList[i].pointerId == pointerId) {
            return i;
        }
    }
    return -1;
}
function updatePointerEvent(event) {
    eventList[indexOfEvent(event)] = event;
}
function removePointerEvent(event) {
    eventList.splice(indexOfEvent(event), 1);
}
function setStyle(element, _a) {
    var scale = _a.scale, x = _a.x, y = _a.y, opacity = _a.opacity;
    element.style.transform = "scale(" + scale + ") translateX(" + x + "px) translateY(" + y + "px)";
    element.style.opacity = "" + opacity;
}
function displayCurrent(zoom, bright) {
    if (bright)
        bright.innerHTML = (current.opacity * 100).toFixed(0) + "%";
    if (zoom)
        zoom.innerHTML = (current.scale * 100).toFixed(0) + "%";
}
function controlScrollbar(picture, scrollbar) {
    var pix = (+picture.offsetWidth - 40) / current.scale;
    var percent = (pix * 100) / (+picture.offsetWidth - 40);
    if (percent == 100) {
        scrollbar.style.visibility = 'hidden';
    }
    else
        scrollbar.style.visibility = 'visible';
    if (html)
        html.style.cssText = "--thumb-width: " + percent + "%";
    var scroll = current.x + maxScrollX;
    console.log(scroll);
    scrollbar.value = "" + (100 - (scroll * 100) / (maxScrollX * 2));
}
function doScroll(event) {
    var diffX = (prev.x - event.clientX) / current.scale;
    var diffY = (prev.y - event.clientY) / current.scale;
    var isFastScroll = Math.abs(diffX) < 13 && Math.abs(diffY) < 13;
    var canScroll = {
        left: current.x - diffX < maxScrollX,
        right: current.x - diffX > -maxScrollX,
        top: current.y - diffY < maxScrollY,
        bottom: current.y - diffY > -maxScrollY
    };
    if (canScroll.left && canScroll.right && isFastScroll)
        current.x -= diffX;
    if (canScroll.top && canScroll.bottom && isFastScroll)
        current.y -= diffY;
    prev.x = event.clientX;
    prev.y = event.clientY;
}
function doRotate() {
    if (prev.angle - current.angle > 0) {
        current.opacity += 0.05;
        if (current.opacity > 1)
            current.opacity = 1;
    }
    else {
        current.opacity -= 0.05;
        if (current.opacity < 0)
            current.opacity = 0;
    }
}
function doZoom() {
    if (current.distance < prev.distance) {
        current.scale -= 0.05;
        if (current.scale < 1)
            current.scale = 1;
    }
    if (current.distance > prev.distance) {
        current.scale += 0.05;
        if (current.scale > 5)
            current.scale = 5;
    }
    if (current.x > maxScrollX) {
        current.x -= (current.x - maxScrollX);
    }
    if (current.y > maxScrollY + 3) {
        current.y -= (current.y - maxScrollY);
    }
    if (current.x < -maxScrollX + 3) {
        current.x -= (maxScrollX + current.x);
    }
    if (current.y < -maxScrollY + 3) {
        current.y -= (maxScrollY + current.y);
    }
}
function detectGesture(angle) {
    if (Math.abs(prev.angle - angle) > 0.03)
        return 'rotate';
    else
        return 'zoom';
}
function calculateAngle(x, y) {
    return Math.atan2(x, y);
}
function calculateDistance(x, y) {
    return Math.sqrt(x * x + y * y);
}
function initVolume() {
    var inputVolume = qs('.music__volume > input');
    var displayVolume = qs('.music__value');
    if (inputVolume && displayVolume) {
        inputVolume.addEventListener('input', function (e) {
            displayVolume.innerHTML = inputVolume.value + "%";
        });
    }
}
function initPicture() {
    var picture = qs('.active__picture');
    var zoom = qs('#zoom');
    var bright = qs('#bright');
    var scrollbar = qs('#scrollbar');
    if (picture) {
        setStyle(picture, current);
        picture.addEventListener('pointerdown', function (event) {
            prev.x = event.clientX;
            prev.y = event.clientY;
            picture.setPointerCapture(event.pointerId);
            addPointerEvent(event);
        });
        picture.addEventListener('pointerup', function (event) {
            picture.setPointerCapture(event.pointerId);
            removePointerEvent(event);
        });
        picture.addEventListener('pointercancel', function (event) {
            picture.setPointerCapture(event.pointerId);
            removePointerEvent(event);
        });
        picture.addEventListener('pointermove', function (event) {
            picture.setPointerCapture(event.pointerId);
            updatePointerEvent(event);
            maxScrollX = calculateMaxScroll(picture.offsetWidth, current.scale);
            maxScrollY = calculateMaxScroll(picture.offsetHeight, current.scale);
            if (eventList.length == 1) {
                doScroll(event);
            }
            if (eventList.length == 2) {
                var diffX = eventList[0].clientX - eventList[1].clientX;
                var diffY = eventList[0].clientY - eventList[1].clientY;
                current.angle = calculateAngle(diffX, diffY);
                current.distance = calculateDistance(diffX, diffY);
                var gesture = detectGesture(current.angle);
                switch (gesture) {
                    case 'rotate':
                        doRotate();
                        break;
                    case 'zoom':
                        doZoom();
                        break;
                }
            }
            setStyle(picture, current);
            displayCurrent(zoom, bright);
            if (scrollbar)
                controlScrollbar(picture, scrollbar);
            prev.angle = current.angle;
            prev.distance = current.distance;
            var scroll = current.x + maxScrollX;
            if (scrollbar)
                scrollbar.value = "" + (100 - (scroll * 100) / (maxScrollX * 2));
        });
    }
}
window.onload = function () {
    initVolume();
    initPicture();
};
