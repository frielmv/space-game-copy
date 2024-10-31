// old trajectory system with dots, decided to get rid of it because it didn't play nicely with moving planets

var Trajectory = {
	MIN_VEL: 10, // minimum velocity to show the trajectory at (only applies in landing mode)
	CLOCKS_PER_DOT: 10, // resolution (FPS) of computations
	DOT_COUNT: 100,
	DOT_SPACING: 10, // pixels between dots
	increment: 0,
	show: true,
	init() {
		this.html = (new html('div')).create();
		this.dots = [];
		
		for(let i = 0; i < this.DOT_COUNT; i++) {
			this.dots.push(
				(new html('div'))
					.style({
						aspectRatio: '1 / 1',
						translate: '-50% -50%',
						borderRadius: '50%',
						opacity: (Trajectory.DOT_COUNT - i) / Trajectory.DOT_COUNT
					})
					.appendTo(this.html)
			);
		}
	},
	clock() {
		if(this.show && !Collisions.colliding && (!Ship.landingMode || Ship.vel.magnitude > this.MIN_VEL)) {
			this.increment = (this.increment + (Ship.vel.magnitude / Viewport.fps * this.CLOCKS_PER_DOT / this.DOT_SPACING * Viewport.scale * TimeWarp.multiplier)) % this.CLOCKS_PER_DOT;

			let posTmp = Ship.pos.copy();
			let velTmp = Ship.vel.copy();
			let soiTmp = Bodies.soi;
			let dotIndex =
				Markers.show && !Viewport.showMap
				? -Math.round(((Markers.ringSize / 2) + (Markers.SPACING * 2)) / this.DOT_SPACING) // dots to the outside of the ring, plus clearing the prograde marker
				: 0;
			let continuePath = true;

			let altitudes = [posTmp.magnitude];

			for(let i = 0; dotIndex < this.DOT_COUNT; i++) {
				const rateMultiplier = this.DOT_SPACING / velTmp.magnitude / this.CLOCKS_PER_DOT / Viewport.scale; // fraction that sets fps of prediction for correct dot distances

				const newSoi = Bodies.getSOI(posTmp, soiTmp);
				if(newSoi == -2) {
					velTmp.add(soiTmp.vel);
					posTmp.add(soiTmp.pos);
					soiTmp = soiTmp.parent;
				} else if(newSoi >= 0) {
					soiTmp = soiTmp.children[newSoi];
					velTmp.add(soiTmp.vel, -1);
					posTmp.add(soiTmp.pos, -1);
				}

				// computing body physics
				velTmp.add(Bodies.physics(posTmp), rateMultiplier);
	
				// changing position based on velocity
				posTmp.add(velTmp, rateMultiplier);

				// checking for path collisions
				if(posTmp.magnitude < soiTmp.radius)
					continuePath = false;

				// displaying a dot
				if(i > 0 && (i + parseInt(this.increment)) % this.CLOCKS_PER_DOT == 0) {
					if(dotIndex > 0) {
						// showing dot if the path is continued
						this.dots[dotIndex].style({
							display: continuePath ? 'block' : 'none',
							color: (posTmp.magnitude < soiTmp.atmoAlt + soiTmp.radius) ? 'var(--red)' : 'var(--ui)'
						});
	
						altitudes.push(posTmp.magnitude);

						// finding highest and lowest points
						const j = dotIndex - 1;
						if(
							j >= 1
							&&
							(altitudes[j] > Math.max(altitudes[j-1], altitudes[j+1]) // greater than both sides, apoapsis
							||
							altitudes[j] < Math.min(altitudes[j-1], altitudes[j+1])) // less than both sides, periapsis
						) {
							this.dots[j].style({
								width: '6px',
								background: 'none',
								border: 'var(--line) solid'
							});
						} else {
							this.dots[j].style({
								width: 'var(--line)',
								background: this.dots[j].element.style.color,
								border: 'none'
							});
						}
	
						Viewport.position(
							this.dots[dotIndex],
							posTmp.addedTo(soiTmp.absolutePos)
						);
					}
					dotIndex++;
				}
			}

			this.html.style({
				opacity: '1'
			});
		} else {
			this.html.style({
				opacity: '0'
			});
		}
	}
};