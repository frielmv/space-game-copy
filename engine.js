// loading wheel
function valueToColor(value) { // between 0 and 1; also used by resources.js and bodies.js
	return `hsl(${value * 120}deg 100% 35%)`;
}
var loadingHTML = document.getElementById('loading');
const TO_LOAD = 17;
var loadIndex = 1;
function loaded(done = false) {
	loadIndex++;
	loadingHTML.style.background = `radial-gradient(circle, transparent 20px, black 20px), conic-gradient(${valueToColor(loadIndex / TO_LOAD)} ${loadIndex / TO_LOAD}turn, var(--filledBackground) 0), black`;
	if(done) {
		loadingHTML.style.background = 'black';
		loadingHTML.style.opacity = '0';
	}
}

// misc classes
class Point {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}
	// returns a copy of the point
	copy() {
		let result = new Point();
		result.add(this);
		return result;
	}
	// sets the point to a specific value
	set(x, y = undefined) {
		this.x = x;
		if(this.y === undefined) {
			this.y = x;
		} else {
			this.y = y;
		}
	}
	// adds another point to the current point
	add(point, multiplier = 1) {
		this.x += point.x * multiplier;
		this.y += point.y * multiplier;
		return this;
	}
	// returns the point with another point added
	addedTo(point, multiplier = 1) {
		let result = new Point();
		result.add(this);
		result.add(point, multiplier);
		return result;
	}
	// multiplies both directions of the point by the given value
	multiply(value) {
		this.x *= value;
		this.y *= value;
		return this;
	}
	// returns the point multiplied by the given value
	multipliedBy(value) {
		let result = new Point();
		result.add(this);
		result.multiply(value);
		return result;
	}
	// returns the angle of the point
	get angle() {
		return (-Math.atan2(this.y, this.x) * 180 / Math.PI + 450) % 360;
	}
	// returns the magnitude of the point
	get magnitude() {
		return Math.hypot(this.x, this.y);
	}
	// returns a point from a given vector
	static fromVector(direction, magnitude) {
		return new Point(
			Math.sin(direction * Math.PI / 180) * magnitude,
			Math.cos(direction * Math.PI / 180) * magnitude
		);
	}
}

class html {
	constructor(el, raw = false) {
		if(el instanceof HTMLElement) {
			this.element = el;
		} else if(raw) {
			const template = document.createElement('template');
			template.innerHTML = el;
			this.element = template.content.firstChild;
		} else {
			this.element = document.createElement(el);
		}
	}
	static clone(el, deep) {
		return new html(el.element.cloneNode(deep));
	}
	style(cssObj) {
		if(cssObj !== undefined) {
			for(const [k, v] of Object.entries(cssObj)) {
				this.element.style[k] = v;
			}
		}
		return this;
	}
	attr(obj) {
		for(const [k, v] of Object.entries(obj)) {
			this.element[k] = v;
		}
		return this;
	}
	content(str) {
		this.element.innerHTML = str;
		return this;
	}
	empty() {
		this.element.innerHTML = '';
		return this;
	}
	event(name, func) {
		this.element[name] = func;
		return this;
	}
	class(...classes) {
		this.element.classList.add(...classes);
		return this;
	}
	classBool(bool, trueClass) {
		if(bool) {
			this.element.classList.add(trueClass);
		} else {
			this.element.classList.remove(trueClass);
		}
		return this;
	}
	buttonStyle(active, enabled = true) { // style a button, run every tick
		this
			.classBool(!enabled, 'disabled')
			.classBool(active, 'active');
		return this;
	}
	append(...els) {
		for(const el of els) {
			this.element.append(el.element);
		}
		return this;
	}
	prepend(...els) {
		for(const el of els.reverse()) {
			this.element.prepend(el.element);
		}
		return this;
	}
	prependTo(el) {
		el.element.prepend(this.element);
		return this;
	}
	appendTo(el) {
		el.element.append(this.element);
		return this;
	}
	create() {
		document.body.append(this.element);
		return this;
	}
}

function rotate(original, amount) {
	return (original + 360 + (amount % 360)) % 360;
}
function angleDiff(angle1, angle2) {
	return (angle1 - angle2 + 540) % 360 - 180;
}
function acos(val) {
	return (-Math.acos(val) * 180 / Math.PI + 450) % 360;
}
const G = 6.6743e-11; // gravitational constant

function randAngle() {
	return parseInt(Math.random() * 360);
}

function clamp(value, min = 0, max = 1) {
	if(value < min)
		value = min;
	else if(value > max)
		value = max;
	return value;
}

function msToTimestamp(ms) {
	const sign = Math.sign(ms) > 0 ? '+' : '-';
	ms = Math.abs(ms);
	const sec = Math.floor(ms / 1000);
	const min = Math.floor(sec / 60);
	const hr = Math.floor(min / 60);
	return sign+(hr.toString().padStart(2, '0'))+':'+((min % 60).toString().padStart(2, '0'))+':'+((sec % 60).toString().padStart(2, '0'));
}

var Engine = {
	initialTick: 0, // not actually first tick
	elapsed: 0, // number of ms since the beginning of the game (aligned with performance.now)
	gameTime: 0, // elapsed, with timewarp applied
	downtime: 0,
	save() {
		return {
			elapsed: this.elapsed,
			gameTime: this.gameTime
		};
	},
	loadSave(data) {
		this.elapsed = data.elapsed;
		this.gameTime = data.gameTime;
	},
	tick() {
		TimeWarp.tick();
		Aero.tick();
		Bodies.tick();
		StarField.tick();
		Trajectory.tick();
		Ship.tick();
		Collectibles.tick();
		Collisions.tick();
		Markers.tick();
		Info.tick();
		Resources.tick();
		Save.tick();

		this.gameTime += 1000 / Viewport.fps * TimeWarp.multiplier;

		const now = performance.now();
		this.elapsed += 1000 / Viewport.fps;
		const nextTick = this.initialTick + this.elapsed;

		this.downtime = nextTick - now;

		if(this.downtime < 0) { // lagging, skip frames
			this.initialTick = now - this.elapsed;
		}

		if(!Viewport.paused) {
			setTimeout(function() { Engine.tick(); }, Math.max(0, this.downtime));
		}
	},
	resetAll() {
		Viewport.reset();
		Resources.reset();
		TimeWarp.reset();
		Ship.reset();
		Collectibles.reset();
	},
	gameInit() {
		// game elements
		StarField.init();
		Aero.init();
		Ship.init();
		Collectibles.init();
		Bodies.init();
		// ui elements
		Trajectory.init();
		Markers.init();
		Info.init();
		TimeWarp.init();
		Resources.init();
		Save.init();

		this.resetAll();
		loaded();
		this.tick();
	}
};

window.onload = function() {
	Controls.afterLoad();
	Viewport.afterLoad();
	loaded(true);
};