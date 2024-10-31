// Sun
	// Mercury
	// Venus
	// Earth
		// Moon
	// Mars
		// Deimos
		// Phobos
	// Asteroid Belt
		// Ceres
		// Vesta
		// Pallas
		// Hygiea
	// Jupiter + Rings
		// Io
		// Ganymede
		// Callisto
		// Europa
	// Saturn + Rings
		// Titan
		// Mimas
		// Enceladus
		// Tethys
		// Dione
		// Rhea
		// Iapetus
	// Uranus + Rings
		// Ariel
		// Miranda
		// Titania
		// Oberon
		// Umbriel
	// Neptune + Rings
		// Triton
	// Pluto
		// Charon
	// Eris

class Body {
	static BODY_SCALE = 1/600000
	static DISTANCE_SCALE = 1/1600000
	static GRAV_SCALE = 1/300000
	static ATMO_SCALE = 10
	static ATMO_GRADIENT = [ // specific gradient math
		['FF', 0],
		['FC', 0.8],
		['F3', 2.9],
		['E4', 6.4],
		['D2', 11],
		['BD', 16.6],
		['A5', 23.1],
		['8C', 30.4],
		['73', 38.3],
		['5A', 46.7],
		['42', 55.4],
		['2D', 64.4],
		['1B', 73.5],
		['0C', 82.5],
		['03', 91.4],
		['00', 100] // [alpha value, percent position]
	]
	static orbitalVel(coreGrav, orbit) { // orbital velocity in m/s
		return Math.sqrt(coreGrav / orbit) * Body.GRAV_SCALE;
	}
	static orbitalPeriod(coreGrav, orbit) { // orbital period in seconds
		return 2 * Math.PI * Math.sqrt(orbit ** 3 / coreGrav) / Body.GRAV_SCALE;
	}
	constructor(data) {
		/*
		 * name
		 * radius
		 * surface gravity
		 * orbit radius
		 * resources?
	 	 * marker color
		 * atmosphere altitude?
		 * atmosphere density?
		 * atmosphere color?
		 */
		this.name = data.name;
		this.radius = data.radius * Body.BODY_SCALE;
		this.surfGrav = data.surfGrav;
		this.coreGrav = this.surfGrav * ((this.radius / Body.GRAV_SCALE) ** 2);
		this.mass = this.coreGrav / G;
		this.orbit = data.orbit * Body.DISTANCE_SCALE;
		this.resources = data.resources;
		if(this.resources !== undefined) {
			this.resourceMap = [0, 360];
			// alternates true, false, true, false, etc.
			for(let i = 0; i < 4; i++) {
				this.resourceMap.push(randAngle());
			}
			this.resourceMap.sort((a, b) => a - b);
		}
		this.markerColor = data.markerColor;
		this.atmoAlt = data.atmoAlt;
		this.atmoDensity = data.atmoDensity;
		this.atmoColor = data.atmoColor;
		this.children = [];
	}
	init() {
		if(this.parent !== undefined) {
			this.period = Body.orbitalPeriod(this.parent.coreGrav, this.orbit);
			this.soiRadius = this.orbit * ((this.coreGrav / this.parent.coreGrav) ** (2/5));
		}

		// generating html
		const maskGradient = 'radial-gradient(closest-side, transparent calc(100% - var(--spacing)), black calc(100% - var(--spacing)))';
		this.resourceHTML = (new html('div'))
			.style({
				aspectRatio: '1 / 1',
				translate: '-50% -50%',
				borderRadius: '50%',
				maskImage: maskGradient,
				webkitMaskImage: maskGradient
			})
			.class('resourceOverlay');

		this.bodyHTML = (new html('div'))
			.style({
				width: '100%',
				aspectRatio: '1 / 1',
				translate: '-50% -50%',
				background: `url("assets/bodies/${this.name}.svg")`
			})
			.class('body');

		if(this.atmoAlt !== undefined) { // atmosphere gradient
			this.atmoAlt = this.atmoAlt * Body.BODY_SCALE * Body.ATMO_SCALE;
			this.atmoDensity = this.atmoDensity;
			this.bodyHTML.element.style.background += `, radial-gradient(closest-side, ${Body.ATMO_GRADIENT.map(el => `${this.atmoColor}${el[0]} ${el[1] / 2 * this.atmoAlt / this.radius + 50}%`).join(', ')})`;
		} else { // brightness glow gradient
			this.bodyHTML.element.style.background += `, radial-gradient(closest-side, ${Body.ATMO_GRADIENT.map(el => `#FFFFFF${el[0]} ${el[1] * 1.75 - 75}%`).join(', ')})`;
		}

		this.markerHTML = (new html('div')) // marker html
			.style({
				width: '4px',
				aspectRatio: '1 / 1',
				backgroundColor: this.markerColor,
				borderRadius: '50%',
				left: '0',
				top: '0',
				translate: '-50% -50%'
			})
			.class('marker');

		this.html = (new html('div'))
			.append(this.markerHTML, this.bodyHTML, this.resourceHTML)
			.appendTo(Bodies.html);

		if(this.parent !== undefined) { // not the sun
			this.soiHTML = (new html('div')) // soi html
				.style({
					width: (2 * this.soiRadius / (this.radius * 4) * 100)+'%',
					aspectRatio: '1 / 1',
					borderRadius: '50%',
					border: `var(--line) solid ${this.markerColor}64`,
					translate: '-50% -50%'
				})
				.class('marker')
				.appendTo(this.html);

			this.trajectoryHTML = html.clone(this.markerHTML) // trajectory circle
				.style({
					background: 'none',
					outline: 'var(--line) solid #cc9900'
				})
				.classBool(false, 'marker') // removing the marker class for no transition
				.prependTo(Bodies.html);

			this.trajectoryStartHTML = html.clone(this.trajectoryHTML)
				.style({
					filter: 'opacity(0.4)'
				})
				.prependTo(Bodies.html);
		}

		Bodies.flatList[this.name] = this;
	}
	child(body) {
		this.children.push(body);
		body.parent = this;
		body.initialAngle = randAngle();
		body.init();
		return this;
	}
	orbitAngle(atTime) {
		if(atTime === undefined) atTime = Engine.gameTime;
		return rotate(this.initialAngle, -(360 / this.period * atTime / 1000));
	}
	pos(atTime) { // position of body relative to parent
		if(this.parent === undefined) { // sun
			return new Point();
		} else { // all other Bodies
			return Point.fromVector(this.orbitAngle(atTime), this.orbit);
		}
	}
	absolutePos(atTime) { // position of body relative to sun
		if(this.parent === undefined) { // sun
			return new Point();
		} else { // all other Bodies
			return Point.fromVector(this.orbitAngle(atTime), this.orbit).addedTo(this.parent.absolutePos(atTime));
		}
	}
	gravAt(orbit) { // point relative to parent
		return this.coreGrav / ((orbit / Body.GRAV_SCALE) ** 2); // 1/r^2 equation modified for correct scale
	}
	vel(atTime) {
		if(this.parent !== undefined) {
			return Point.fromVector(rotate(this.orbitAngle(atTime), -90), Body.orbitalVel(this.parent.coreGrav, this.orbit));
		}
	}
	periodOf(orbit) {
		return Body.orbitalPeriod(this.coreGrav, orbit);
	}
	tick() {
		Viewport.position( // positioning the body
			this.html, // element
			this.absolutePos(), // position
			this.radius * 4 // size
		);

		if(this.parent !== undefined) {
			this.soiHTML.style({
				opacity: Viewport.showMap ? '1' : '0',
			});
		}
		this.bodyHTML.style({
			filter: `brightness(${StarField.show ? StarField.OVERBRIGHTNESS : 1})`
		});

		this.resourceHTML.style({
			opacity: Resources.showOverlay ? '1' : '0',
			width: Resources.showOverlay ? 'calc(50% - (var(--spacing) * 2))' : '0',
			background:
				this.resources !== undefined
				? `conic-gradient(${this.resourceMap.map((el, i, arr) => `${i % 2 == 0 ? (Resources.lastMinedBody === this ? valueToColor(Resources.remaining) : valueToColor(this.resources)) : 'var(--background)'} ${el}deg ${arr[(i+1) % arr.length]}deg`).join(', ')})`
				: 'var(--background)'
		});

		for(const child of this.children) {
			child.tick();
		}
	}
}

var Bodies = {
	init() {
		this.html = (new html('div')).create();
		this.flatList = {};
		this.obj = (new Body({
			name: 'Sun',
			radius: 696340000,
			surfGrav: 274,
			atmoAlt: 20000000,
			atmoDensity: 0.1,
			atmoColor: '#ffc800',
			markerColor: '#fffadc'
		}))
			.child(new Body({
				name: 'Mercury',
				radius: 2439700,
				surfGrav: 3.7,
				markerColor: '#ffffff',
				orbit: 57909050000,
				resources: 0.3
			}))
			.child(new Body({
				name: 'Venus',
				radius: 6051800,
				surfGrav: 8.87,
				atmoAlt: 120000,
				atmoDensity: 65,
				atmoColor: '#fc7b03',
				markerColor: '#ffffff',
				orbit: 108210000000,
				resources: 0.1
			}))
			.child((new Body({
				name: 'Earth',
				radius: 6371000, // actual radius of the planet (irl) in meters
				surfGrav: 9.81, // surface gravity of planet in m/s^2
				atmoAlt: 100000, // actual altitude of atmosphere
				atmoDensity: 1.225, // density at sea level in kg/m^3
				atmoColor: '#4da0ff', // color of atmosphere
				markerColor: '#344598', // color of marker
				orbit: 149598023000, // semi-major axis in meters
				resources: 1
			}))
				.child(new Body({
					name: 'Moon',
					radius: 1737400,
					surfGrav: 1.62,
					markerColor: '#a7a9ac',
					orbit: 384400000,
					resources: 0.4
				})),
			randAngle())
			.child(new Body({
				name: 'Mars',
				radius: 3389500,
				surfGrav: 3.721,
				atmoAlt: 50000,
				atmoDensity: 0.02,
				atmoColor: '#ffb04f',
				markerColor: '#dd8e60',
				orbit: 227956000000,
				resources: 0.5
			}))
			.child(new Body({
				name: 'Jupiter',
				radius: 69911000,
				surfGrav: 24.79,
				markerColor: '#ab7f59',
				orbit: 778479000000
			}))
			.child(new Body({
				name: 'Saturn',
				radius: 58232000,
				surfGrav: 10.44,
				markerColor: '#ffffff',
				orbit: 1432041000000
			}))
			.child(new Body({
				name: 'Uranus',
				radius: 25362000,
				surfGrav: 8.87,
				markerColor: '#98dbed',
				orbit: 2867043000000
			}))
			.child(new Body({
				name: 'Neptune',
				radius: 24622000,
				surfGrav: 11.15,
				markerColor: '#ffffff',
				orbit: 4514953000000
			}))
			.child(new Body({
				name: 'Pluto',
				radius: 1188300,
				surfGrav: 0.62,
				markerColor: '#ffffff',
				orbit: 5906380000000,
				resources: 0.3
			}));

		this.obj.init();
		this.soi = this.flatList['Earth'];
	},
	save() {
		let bodySaveData = {};
		for(const [k, v] of Object.entries(this.flatList)) {
			if(v.initialAngle !== undefined) {
					bodySaveData[k] = { initialAngle: v.initialAngle };

				if(v.resourceMap !== undefined)
						bodySaveData[k].resourceMap = v.resourceMap.slice(1, -1);
			}
		}
		let saveData = {
			bodies: bodySaveData,
			soi: this.soi.name
		}
		return saveData;
	},
	loadSave(data) {
		this.soi = this.flatList[data.soi];
		for(const [k, v] of Object.entries(data.bodies)) {
			if((v.initialAngle || v.resourceMap) !== undefined) {
				this.flatList[k].initialAngle = v.initialAngle;
				if(v.resourceMap !== undefined)
					this.flatList[k].resourceMap = [0, ...v.resourceMap, 360];
			}
		}
	},
	tick() {
		this.obj.tick();

		this.bodyVisible = !Viewport.showMap && Object.values(this.flatList).some(body => {
			const pos = body.absolutePos();
			let radius = body.radius;
			if(body.atmoAlt)
				radius += body.atmoAlt;

			return Viewport.isVisible(pos, radius);
		});

		if(!Collisions.colliding) {
			// changing ship velocity and position based on planet gravity
			let physTmp = this.physics(Ship.pos, this.soi, TimeWarp.multiplier / Viewport.fps);
			this.soi = physTmp.soi;
			Ship.pos.add(physTmp.posChange);
			Ship.vel.add(physTmp.velChange);
		}
	},
	physics(pos, soiBody, rate, atTime) {
		// getting the velocity change at a point for a one second timestep
		// position only changes if the soi changes
		// rate is how many seconds per second to run the sim (for trajectory calculations or timewarp)
		let velChange = Point.fromVector(pos.angle, -soiBody.gravAt(pos.magnitude) * rate);
		let posChange = new Point();
		if(soiBody.soiRadius !== undefined && pos.magnitude > soiBody.soiRadius) { // leaving soi (go to parent soi)
			velChange.add(soiBody.vel(atTime));
			posChange.add(soiBody.pos(atTime));
			soiBody = soiBody.parent;
		} else {
			for(const [i, body] of soiBody.children.entries()) {
				if(pos.addedTo(body.pos(atTime), -1).magnitude < body.soiRadius) { // entering soi of child
					soiBody = soiBody.children[i];
					velChange.add(soiBody.vel(atTime), -1);
					posChange.add(soiBody.pos(atTime), -1);
				}
			}
			// getting here means no change
		}
		return {
			posChange: posChange,
			velChange: velChange,
			soi: soiBody
		}
	}
};