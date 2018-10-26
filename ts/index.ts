function qs<T extends HTMLElement = HTMLElement>(selector: string, scope?: Element) {
	return (scope || document).querySelector<T>(selector);
}

const eventList: PointerEvent[] = [];
const html = qs('html');
const prev = {
	angle: 0,
	distance: 0,
	x: -1,
	y: -1,
};

const current = {
	angle: 0,
	distance: 0,
	opacity: 1,
	scale: 1,
	x: 0,
	y: 0,
};

let maxScrollX: number;
let maxScrollY: number;

function calculateMaxScroll(value: number, scale: number): number {
	return ( (value * scale) - value ) / (scale * 2);
}

function addPointerEvent(event: PointerEvent): void {
	eventList.push(event);
}

function indexOfEvent({pointerId}: PointerEvent): number {
	for (let i = 0; i < eventList.length; i++) {
		if (eventList[i].pointerId === pointerId) {
		  return i;
		}
	}
	return -1;
}

function updatePointerEvent(event: PointerEvent): void {
	eventList[indexOfEvent(event)] = event;
}

function removePointerEvent(event: PointerEvent): void {
	eventList.splice(indexOfEvent(event), 1);
}

interface ICurrent {
	scale: number;
	x: number;
	y: number;
	opacity: number;
}

function setStyle(element: HTMLElement, {scale, x, y, opacity}: ICurrent): void {
	element.style.transform = `scale(${scale}) translateX(${x}px) translateY(${y}px)`;
	element.style.opacity = `${opacity}`;
}

function displayCurrent(zoom: HTMLElement | null, bright: HTMLElement | null): void {
	if (bright) {
		bright.innerHTML = `${(current.opacity * 100).toFixed(0)}%`;
	}

	if (zoom) {
		zoom.innerHTML = `${(current.scale * 100).toFixed(0)}%`;
	}
}

function controlScrollbar(picture: HTMLElement, scrollbar: HTMLInputElement) {
	const pix = (+picture.offsetWidth - 40) / current.scale;
	const percent = (pix * 100) / (+picture.offsetWidth - 40);

	if (percent === 100) {
		scrollbar.style.visibility = 'hidden';
	} else { scrollbar.style.visibility = 'visible'; }

	if (html) {
		html.style.cssText = `--thumb-width: ${percent}%`;
	}

	const scroll = current.x + maxScrollX;
	console.log(scroll);

	scrollbar.value = `${100 - (scroll * 100) / (maxScrollX * 2)}`;
}

function doScroll(event: PointerEvent) {
	const diffX = (prev.x - event.clientX) / current.scale;
	const diffY = (prev.y - event.clientY) / current.scale;
	const isFastScroll = Math.abs(diffX) < 13 && Math.abs(diffY) < 13;

	const canScroll = {
		bottom: current.y - diffY > -maxScrollY,
		left: current.x - diffX < maxScrollX,
		right: current.x - diffX > -maxScrollX,
		top: current.y - diffY < maxScrollY,
	};

	if (canScroll.left && canScroll.right && isFastScroll) {
		current.x -= diffX;
	}

	if (canScroll.top && canScroll.bottom && isFastScroll) {
		current.y -= diffY;
	}

	prev.x = event.clientX;
	prev.y = event.clientY;

}

function doRotate() {
	if (prev.angle - current.angle > 0) {
		current.opacity += 0.05;

		if (current.opacity > 1) { current.opacity = 1; }
	} else {
		current.opacity -= 0.05;

		if (current.opacity < 0) { current.opacity = 0; }
	}
}

function doZoom() {

	if (current.distance < prev.distance) {
		current.scale -= 0.05;
		if (current.scale < 1) { current.scale = 1; }
	}

	if (current.distance > prev.distance) {
		current.scale += 0.05;
		if (current.scale > 5) { current.scale = 5; }
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

function detectGesture(angle: number): string {
	if (Math.abs(prev.angle - angle) > 0.03) { return 'rotate'; } else { return 'zoom'; }
}

function calculateAngle(x: number, y: number) {
	return Math.atan2(x, y);
}

function calculateDistance(x: number, y: number): number {
	return Math.sqrt( x * x + y * y );
}

function initVolume(): void {
	const inputVolume: HTMLInputElement | null = qs('.music__volume > input');
	const displayVolume = qs('.music__value');

	if (inputVolume && displayVolume) {
		inputVolume.addEventListener('input', (e: Event) => {
			displayVolume.innerHTML = `${inputVolume.value}%`;
		});
	}
}

function initPicture() {
	const picture = qs('.active__picture');
 const zoom = qs('#zoom');
 const bright = qs('#bright');
 const scrollbar: HTMLInputElement | null  = qs('#scrollbar');

	if (picture) {

		setStyle(picture, current);

		picture.addEventListener('pointerdown', (event) => {
			prev.x = event.clientX;
			prev.y = event.clientY;

			picture.setPointerCapture(event.pointerId);
			addPointerEvent(event);
		});

		picture.addEventListener('pointerup', (event) => {
			picture.setPointerCapture(event.pointerId);
			removePointerEvent(event);
		});

		picture.addEventListener('pointercancel', (event) => {
			picture.setPointerCapture(event.pointerId);
			removePointerEvent(event);
		});

		picture.addEventListener('pointermove', (event) => {
			picture.setPointerCapture(event.pointerId);

			updatePointerEvent(event);

			maxScrollX = calculateMaxScroll(picture.offsetWidth, current.scale);
			maxScrollY = calculateMaxScroll(picture.offsetHeight, current.scale);

			if (eventList.length === 1) {
				doScroll(event);
			}

			if (eventList.length === 2) {
				const diffX = eventList[0].clientX - eventList[1].clientX;
				const diffY = eventList[0].clientY - eventList[1].clientY;

				current.angle = calculateAngle(diffX, diffY);
				current.distance = calculateDistance(diffX, diffY);
				const gesture = detectGesture(current.angle);

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

			if (scrollbar) {
				controlScrollbar(picture, scrollbar);
			}

			prev.angle = current.angle;
			prev.distance = current.distance;

			const scroll = current.x + maxScrollX;

			if (scrollbar) {
				scrollbar.value = `${100 - (scroll * 100) / (maxScrollX * 2)}`;
			}
		});

	}

}

window.onload = () => {
	initVolume();
	initPicture();
};
