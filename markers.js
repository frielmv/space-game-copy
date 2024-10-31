var Markers = {
	MARKER_SIZE: 12.5,
	RING_SIZE: 2, // diameter of ring in meters
	get ringSize() { // display size of ring
		return this.RING_SIZE * Math.max(this.MIN_SCALE, Viewport.scale);
	},
	MIN_SCALE: 32, // smallest the marker ring will clamp to
	SPACING: 32, // pixels spacing between ring and markers
	list: {
		'radial-out': {
			angled: false,
			direction() {
				return Ship.pos.angle;
			}
		},
		'radial-in': {
			angled: false,
			direction() {
				return rotate(Ship.pos.angle, 180);
			}
		},
		'prograde': {
			angled: false,
			direction() {
				this.html.style({
					opacity: !Collisions.colliding ? '1' : '0'
				});
				return Ship.vel.angle;
			}
		},
		'retrograde': {
			angled: false,
			direction() {
				this.html.style({
					opacity: !Collisions.colliding ? '1' : '0'
				});
				return rotate(Ship.vel.angle, 180);
			}
		},
		'target': {
			angled: true,
			direction() {
				return Ship.targetAngle;
			}
		},
		'rotation-open': {
			angled: true,
			direction() {
				return Ship.angle;
			}
		},
		'rotation-closed': {
			angled: true,
			direction() {
				this.html.style({
					opacity: Ship.engineFiring ? '1' : '0'
				});
				return Ship.angle;
			}
		}
	},
	init() {
		this.html = new html('div')
			.attr({
				id: 'markers'
			})
			.create();

		this.mapHTML = new html('div')
			.attr({
				id: 'mapMarkers'
			})
			.create();
		
		// markers and dashes
		for(const [k, v] of Object.entries(this.list)) {
			v.html = (new html('div'))
				.class('marker')
				.appendTo(this.html);

			v.imageHTML = (new html('img'))
				.attr({
					src: `assets/markers/${k}.svg`
				})
				.style({
					scale: '4'
				})
				.appendTo(v.html);
			v.dashHTML = (new html('div'))
				.class('dash')
				.style({
					borderLeft: 'var(--line) solid',
					height: (this.SPACING / 2)+'px',
					width: '0'
				})
				.appendTo(v.html);
		}
		
		// opacity transition for engine firing indicator
		this.list['rotation-closed'].html.class('closedArrow');
		
		// velocity counter
		this.velCounter = (new html('div'))
			.style({
				width: 'max-content',
				transition: 'opacity var(--uiFade)'
			})
			.appendTo(this.html);
		
		// ring
		this.ringHTML = (new html('div'))
			.attr({
				id: 'ring'
			})
			.style({
				cursor: 'grab',
				aspectRatio: '1 / 1',
				translate: '-50% -50%',
				outline: 'var(--line) solid',
				borderRadius: '50%'
			})
			.appendTo(this.html);
		
		// map target rotation indicator
		this.mapTargetAngle = (new html('div'))
			.class('marker')
			.attr({
				id: 'mapTargetAngle'
			})
			.style({
				pointerEvents: 'none',
				borderTop: '6px solid',
				translate: '-50% -50%',
				width: 'var(--line)'
			})
			.appendTo(this.mapHTML);

		// map icon for ship
		this.mapAngle = (new html('img'))
			.class('marker')
			.attr({
				src: 'assets/markers/ship-map.svg'
			})
			.style({
				pointerEvents: 'none',
				width: '12px'
			})
			.appendTo(this.mapHTML);
	},
	tick() {
		this.mapHTML.style({
			opacity: Viewport.showMap ? '1' : '0'
		});
		this.mapAngle.style({
			rotate: Ship.angle+'deg'
		});
		this.mapTargetAngle.style({
			rotate: Ship.targetAngle+'deg',
			height: Ship.engineFiring ? '32px' : '24px'
		});
		this.html.style({
			opacity: Viewport.showMap ? '0' : '1'
		});

		this.ringHTML.style({
			width: Markers.ringSize+'px'
		});
		this.velCounter
			.style({
				opacity: Viewport.scale > Markers.MIN_SCALE ? '1' : '0',
				translate: `-50% calc(${-(Markers.RING_SIZE / 2) * Math.max(Markers.MIN_SCALE, Viewport.scale)}px + 50%)`,
				color: Ship.landingMode && Collisions.impactVel > Collisions.CRASH_VEL ? 'var(--red)' : 'var(--ui)'
			})
			.content(Ship.vel.magnitude.toFixed(1) + ' m/s');

		for(const [k, v] of Object.entries(this.list)) {
			v.imageHTML.style({
				width: Viewport.showMap ? '0' : (Markers.MARKER_SIZE + 'px'),
				translate: `-50% calc(-50% - ${(Markers.RING_SIZE / 2 * Math.max(Markers.MIN_SCALE, Viewport.scale) + Markers.MARKER_SIZE + Markers.SPACING)}px)`,
				transform: v.angled ? 'none' : `rotate(${-v.direction()}deg)`
			});
			v.dashHTML.style({
				translate: `-50% calc(${-((Markers.RING_SIZE / 2) * Math.max(Markers.MIN_SCALE, Viewport.scale))}px - 100% - 1px)`
			});

			v.html.style({
				rotate: v.direction()+'deg'
			});
		}

		Viewport.positionCenter(this.html);
		Viewport.positionCenter(this.mapHTML);
	}
};