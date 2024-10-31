var Aero = {
	EFFECT_INSTANCES: 20,
	init() {
		this.instances = [];
		this.html = new html('div').create();
		for(let i = 0; i < this.EFFECT_INSTANCES; i++) {
			this.instances[i] = (new html('img'))
				.attr({
					src: 'assets/aero/effect.svg'
				})
				.appendTo(this.html);
		}
	},
	tick() {
		this.inAtmosphere = Bodies.soi.atmoAlt !== undefined && Ship.alt < Bodies.soi.atmoAlt;
		if(this.inAtmosphere) {
			this.density = Bodies.soi.atmoDensity * (Bodies.soi.atmoAlt - Ship.alt) / Bodies.soi.atmoAlt; // linear falloff because whatever
		} else {
			this.density = 0;
		}

		/*for(let i = 0; i < this.EFFECT_INSTANCES; i++) {
			this.instances[i].style.opacity = this.density;
			this.instances[i].style.rotate = Ship.angle + 'deg';
			this.instances[i].style.width = (Ship.IMAGE_SIZE * Ship.BASE_SCALE * Viewport.scale) + 'px';
			//this.instances[i].style.left = (Ship.velX / Ship.velY) + 'px';
			//this.instances[i].style.top = (Ship.velY / Ship.velX) + 'px';
		}*/
		Viewport.positionCenter(this.html);
	}
};