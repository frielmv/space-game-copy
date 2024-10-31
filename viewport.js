var Viewport = {
	fps: 120, // frames per second
	MIN_FPS: 10,
	FPS_INCREMENT: 10,
	scale: 80, // px per meter
	MAX_SCALE: 250,
	MAP_SCALE: 2,
	MIN_SCALE: 1/20000,
	SCALE_MULTIPLIER: 1.2, // how much to scale per scroll
	clickTarget: null,
	mousePos: new Point(),
	get width() {
		return window.innerWidth;
	},
	get height() {
		return window.innerHeight;
	},
	get showMap() {
		return this.scale < this.MAP_SCALE;
	},
	changeFPS(amount) {
		if(!Ship.rotating && (amount > 0 || this.fps - this.FPS_INCREMENT >= this.MIN_FPS)) {
			this.fps += this.FPS_INCREMENT * amount;
		}
	},
	// pausing the game
	paused: false,
	pause() {
		document.body.style.filter = 'blur(4px)';
		this.paused = true;
	},
	unpause() {
		document.body.style.filter = 'none';
		this.paused = false;
		Engine.tick();
	},
	// positioning elements such as planets or ui (size optional)
	position(el, pos, size) {
		// relativePos is position relative to the ship (ie center of the screen)
		const relativePos = pos.copy().addedTo(Ship.pos, -1).addedTo(Bodies.soi.absolutePos(), -1).multipliedBy(Viewport.scale);
		el.style({
			left: (relativePos.x + (Viewport.width / 2))+'px',
			top: (-relativePos.y + (Viewport.height / 2))+'px'
		});
		if(size !== undefined)
			el.style({
				width: (size * Viewport.scale)+'px'
			});
	},
	positionCenter(el) {
		el.style({
			left: (Viewport.width / 2)+'px',
			top: (Viewport.height / 2)+'px'
		});
	},
	isVisible(pos, radius = 0) {
		const relativePos = pos.copy().addedTo(Ship.pos, -1).addedTo(Bodies.soi.absolutePos(), -1).multipliedBy(Viewport.scale);
		return (Math.abs(relativePos.x) - (radius * this.scale)) < this.width / 2
		&&
		(Math.abs(relativePos.y) - (radius * this.scale)) < this.height / 2;
	},
	reset() {
		this.clickTarget = null;
	},
	afterLoad() {
		// mouse controls
		window.oncontextmenu = event => event.preventDefault();
		
		window.onmousemove = event => {
			Viewport.mousePos.set(event.clientX - (Viewport.width / 2), (Viewport.height / 2) - event.clientY);
		};
		window.onmousedown = event => {
			if(!Viewport.paused) {
				if(!TimeWarp.controlLocked) {
					Ship.mouseDownAngle = Ship.targetAngle;
					Viewport.mouseDownAngle = Viewport.mousePos.angle;
					if(!event.target.classList.contains('uiControl')) {
						Viewport.clickTarget = event.target;
					}
					Viewport.mouseButton = event.button;
				} else if(!event.target.classList.contains('uiControl'))
					TimeWarp.index = 0;
			} else
				Viewport.unpause();
		};
		window.onmouseup = () => {
			Viewport.clickTarget = null;
		};
		window.onwheel = event => {
			if(!Viewport.paused) {
				Viewport.scale *= Viewport.SCALE_MULTIPLIER ** (-event.deltaY / 50);
			
				if(Viewport.scale > Viewport.MAX_SCALE)
					Viewport.scale = Viewport.MAX_SCALE;
				else if(Viewport.scale < Viewport.MIN_SCALE)
					Viewport.scale = Viewport.MIN_SCALE;
			}
		};
		window.onblur = () => {
			Viewport.pause();
		};
	},
	save() {
		return {
			scale: this.scale
		};
	},
	loadSave(data) {
		this.scale = data.scale;
	}
};