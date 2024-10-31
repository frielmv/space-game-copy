class ShipPart {
	constructor(data) {
		/*
		 * name
		 * translations?
		 * style function(mirrored boolean)?
		 * mirrored?
		 */
		this.styleFunction = data.styleFunction;
		this.html = (new html('div'))
			.class(data.name)
			.append(
				(new html('img'))
				.style({
					width: (Ship.IMAGE_SIZE * Ship.IMAGE_ROUNDING * Ship.BASE_SCALE)+'px'
				})
				.attr({
					src: `assets/ship/${data.name}.svg`,
					draggable: false
				})
				.class('shipAsset')
			);

		if(data.translations !== undefined) {
			if(data.translations.z !== undefined) {
				this.html.style({
					zIndex: data.translations.z
				});
			}
			if(data.translations.x !== undefined) {
				this.html.style({
					left: (data.translations.x * Ship.IMAGE_ROUNDING * Ship.BASE_SCALE)+'px'
				});
			}
			if(data.translations.y !== undefined) {
				this.html.style({
					top: (data.translations.y * Ship.IMAGE_ROUNDING * Ship.BASE_SCALE)+'px'
				});
			}
		}

		if(data.mirrored) {
			this.mirroredHTML = html.clone(this.html, true)
				.style({
					scale: '-1 1 1',
				})
				.class('mirrored');

			if(data.translations !== undefined && data.translations.x !== undefined) {
				this.mirroredHTML.style({
					left: (-data.translations.x * Ship.IMAGE_ROUNDING * Ship.BASE_SCALE)+'px'
				});
			}
		}

		this.children = [];
	}
	child(part) {
		this.html.append(part.html);
		if(part.mirroredHTML !== undefined) {
			if(this.mirroredHTML !== undefined) {
				part.mirroredHTML = html.clone(part.html, true).class('mirrored');
				this.mirroredHTML.append(part.mirroredHTML);
			} else {
				this.html.append(part.mirroredHTML);
			}
		}
		this.children.push(part);
		return this;
	}
	tick() {
		if(this.styleFunction !== undefined) {
			this.html.style(this.styleFunction(false));
			if(this.mirroredHTML !== undefined)
				this.mirroredHTML.style(this.styleFunction(true));
		}
		for(const child of this.children) {
			child.tick();
		}
	}
}

var Ship = {
	HEIGHT: 80, // ~80px high unscaled = 80m high
	BASE_SCALE: 1/80,
	IMAGE_SIZE: 100, // 100 px by 100 px
	IMAGE_ROUNDING: 10000, // used to fix browser rounding errors; all coordinates should be whole numbers when multiplied by this (0.3125 * 1000 = 3125)
	get engineFiring() {
		return Resources.fuel > 0 && (Controls.KEYS.w || (Viewport.clickTarget !== null && Viewport.mouseButton == 0 && Viewport.clickTarget.id != 'ring'));
	},
	LANDING_MODE_ALT: 20, // how many meters above the surface the landing legs should extend
	landingMode: true,
	COLLIDERS: [
		new Point(0.94, -42.75),
		new Point(-0.94, -42.75),
		new Point(3.03, -41.805),
		new Point(-3.03, -41.805),
		new Point(5.209, -38.888),
		new Point(-5.209, -38.888),
		new Point(14.0, -23.25),
		new Point(-14.0, -23.25),
		new Point(24.507, 21.375),
		new Point(-24.507, 21.375),
		new Point(24.606, 41.415),
		new Point(-24.606, 41.415)
	],
	ENGINE_GLOW_RAMP: 8, // time in seconds before engine glow hits max
	ACCEL: 15, // m/sec/sec
	ACCEL_ROT: 180, // deg/sec/sec
	KEYBIND_ROT_VEL: 120, // deg/sec
	ROT_DEADZONE: 4, // degrees of deadzone for rotation
	VECTOR_FREEDOM: 20, // degrees of freedom for thrust vectoring
	init() {
		for(let i = 0; i < Ship.COLLIDERS.length; i++) {
			this.COLLIDERS[i].multiply(this.BASE_SCALE);
		}

		this.parts = (new ShipPart({
			name: 'fuselage'
		}))
			.child((new ShipPart({
				name: 'engine',
				translations: {
					y: 16.75,
					z: -1
				},
				styleFunction() {
					return {
						rotate: (Ship.engineFiring ? (-Ship.VECTOR_FREEDOM / 2 * Ship.rotDir) : 0)+'deg'
					};
				}
			}))
				.child(new ShipPart({
					name: 'engine-glow',
					styleFunction() {
						if(Ship.engineFiring && Ship.engineGlowIndex < 1)
							Ship.engineGlowIndex += 1 / Ship.ENGINE_GLOW_RAMP / Viewport.fps * TimeWarp.multiplier;
						else if(!Ship.engineFiring && Ship.engineGlowIndex > 0)
							Ship.engineGlowIndex -= 1 / Ship.ENGINE_GLOW_RAMP / Viewport.fps * TimeWarp.multiplier;

						return {
							opacity: Ship.engineGlowIndex
						};
					}
				}))
				.child(new ShipPart({
					name: 'engine-plume',
					translations: {
						y: 9.0,
						z: -1
					},
					styleFunction() {
						return {
							opacity: Ship.engineFiring ? '1' : '0'
						};
					}
				}))
			)
			.child((new ShipPart({
				name: 'leg-inner',
				mirrored: true,
				translations: {
					x: 10.0,
					y: 13.0,
					z: -1
				},
				styleFunction() {
					return {
						transform: Ship.landingMode ? 'rotate(120deg)' : 'none'
					};
				}
			}))
				.child(new ShipPart({
					name: 'leg-outer',
					mirrored: true,
					translations: {
						x: 2.5,
						y: -16.0,
						z: -1
					},
					styleFunction() {
						return {
							transform: Ship.landingMode ? 'rotate(-120deg)' : 'none'
						};
					}
				}))
			)
			.child(new ShipPart({
				name: 'solar-panel',
				mirrored: true,
				translations: {
					z: -1
				},
				styleFunction() {
					if(Ship.landingMode) {
						return {
							transform: 'none'
						};
					}
				}
			}))
			.child(new ShipPart({
				name: 'solar-panel-cover',
				mirrored: true,
				translations: {
					x: 11.625,
					y: -5.75,
					z: -1
				},
				styleFunction() {
					if(!Ship.landingMode) {
						return {
							transform: 'rotate(85deg)'
						};
					}
				}
			}))
			.child(new ShipPart({
				name: 'rcs-plume-top',
				mirrored: true,
				styleFunction(mirrored) {
					if(mirrored) {
						return {
							opacity: Ship.rotDir > 0 && !Ship.engineFiring ? '1' : '0'
						};
					} else {
						return {
							opacity: Ship.rotDir < 0 && !Ship.engineFiring ? '1' : '0'
						};
					}
				}
			}))
			.child(new ShipPart({
				name: 'rcs-plume-bottom',
				mirrored: true,
				styleFunction(mirrored) {
					if(mirrored) {
						return {
							opacity: Ship.rotDir < 0 && !Ship.engineFiring && !Ship.landingMode ? '1' : '0'
						};
					} else {
						return {
							opacity: Ship.rotDir > 0 && !Ship.engineFiring && !Ship.landingMode ? '1' : '0'
						};
					}
				}
			}))
			.child((new ShipPart({
				name: 'drill-inner',
				styleFunction() {
					return {
						transform: Resources.mining ? `translateY(${15 * Ship.IMAGE_ROUNDING * Ship.BASE_SCALE}px)` : 'none'
					};
				}
			}))
				.child(new ShipPart({
					name: 'drill-outer',
					styleFunction() {
						return {
							transform: Resources.mining ? `translateY(${15 * Ship.IMAGE_ROUNDING * Ship.BASE_SCALE}px)` : 'none'
						};
					}
				}))
			)
			.child(new ShipPart({
				name: 'drill-fairing'
			}));

		this.html = (new html('div'))
			.attr({
				id: 'ship'
			})
			.append(this.parts.html)
			.create();

		document.querySelectorAll('.solar-panel').forEach(el =>
			el.ontransitionend = function() {
				document.querySelectorAll('.solar-panel-cover').forEach(el2 => el2.style.transform = 'none');
			}
		);
		document.querySelectorAll('.solar-panel-cover').forEach(el =>
			el.ontransitionend = function() {
				document.querySelectorAll('.solar-panel').forEach(el2 => el2.style.transform = `translateX(${22.3125 * Ship.IMAGE_ROUNDING * Ship.BASE_SCALE}px)`);
			}
		);
	},
	reset() {
		this.engineGlowIndex = 0;

		Bodies.soi = Bodies.flatList['Earth'];
		this.pos = new Point(); // meters
		this.pos.y += Bodies.soi.radius;
		this.vel = new Point();

		this.targetAngle = 0;
		this.angle = 0;
		this.velRot = 0;
	},
	get absolutePos() {
		return this.pos.addedTo(Bodies.soi.pos());
	},
	get alt() {
		return Ship.pos.addedTo(Collisions.colliderPos || new Point(), -1).magnitude - Bodies.soi.radius;
	},
	save() {
		return {
			posX: Ship.pos.x,
			posY: Ship.pos.y,
			velX: Ship.vel.x,
			velY: Ship.vel.y,
			targetAngle: Ship.targetAngle,
			angle: Ship.angle,
			velRot: Ship.velRot
		};
	},
	loadSave(data) {
		this.pos = new Point(data.posX, data.posY);
		this.vel = new Point(data.velX, data.velY);
		this.targetAngle = data.targetAngle;
		this.angle = data.angle;
		this.velRot = data.velRot;
	},
	tick() {
		this.parts.tick();

		// setting landing mode
		this.landingMode = Aero.inAtmosphere || this.pos.magnitude - Bodies.soi.radius < this.LANDING_MODE_ALT;

		// changing position values based on velocities
		this.pos.add(this.vel, TimeWarp.multiplier / Viewport.fps);
		this.angle = rotate(this.angle, this.velRot / Viewport.fps); // should never occur during time warp

		// changing velocity values based on acceleration
		if(this.engineFiring && TimeWarp.index <= TimeWarp.ACCELERATION_INDEX) {
			Resources.fuel -= Resources.FUEL_DRAIN_RATE / Viewport.fps * TimeWarp.multiplier;
			this.vel.add(Point.fromVector(this.angle, this.ACCEL / Viewport.fps * TimeWarp.multiplier));
		}

		// rotating and scaling ship image
		this.html.style({
			transform: `rotate(${Ship.angle}deg) scale(${Viewport.scale * 100 / Ship.IMAGE_ROUNDING}%)`
		});

		// changing target rotation based on user input
		if(Viewport.clickTarget !== null) {
			this.targetAngle = rotate(360, this.mouseDownAngle - Viewport.mouseDownAngle + Viewport.mousePos.angle);
		} else if(Controls.KEYS.a ^ Controls.KEYS.d) {
			this.targetAngle = rotate(this.targetAngle, (Controls.KEYS.d * 2 - 1) * this.KEYBIND_ROT_VEL / Viewport.fps);
		}

		// calculating auto-rotation acceleration
		const decelDist = Math.abs(this.velRot ** 2 / this.ACCEL_ROT / 2);

		// checking if the current rotation is in the deadzone
		const targeted = Math.abs(this.targetAngle - this.angle) < this.ROT_DEADZONE / 2;

		this.rotating = // whether the ship is currently rotating
			(!targeted // current direction is not within deadzone; rotation is required
			||
			this.velRot != 0); // velocity is greater than 0; decelerate or accelerate

		this.rotDir = 0; // whether to accelerate or decelerate rotation
		if(Resources.rcsFuel > 0) {
			if(
				(this.velRot != 0 && Math.sign(angleDiff(this.targetAngle, this.angle)) != Math.sign(this.velRot)) // overshot target position; accelerate the other way
				||
				(!targeted && Math.abs(angleDiff(this.targetAngle, this.angle)) > decelDist * 2) // distance from target position > distance required to decelerate + buffer; accelerate
			)
				this.rotDir = 1;
			else if(Math.abs(angleDiff(this.targetAngle, this.angle)) < decelDist)
				this.rotDir = -1;
		}

		this.rotDir *= Math.sign(angleDiff(this.targetAngle, this.angle));

		// rotating ship as needed
		if(this.rotating) {
			if(!this.engineFiring)
				Resources.rcsFuel -= Resources.RCS_FUEL_DRAIN_RATE / Viewport.fps * Math.abs(this.rotDir);
			this.velRot += this.ACCEL_ROT / Viewport.fps * this.rotDir;
		}

		// preventing rounding errors with rotation velocity
		if(targeted && Math.abs(this.velRot) < 0.01) {
			this.velRot = 0;
		}

		Viewport.positionCenter(this.html);
	}
};