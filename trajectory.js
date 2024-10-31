var Trajectory = {
	RATE: 3, // how fast the simulation moves
	stepping: false, // is the simulation running?
	local: false, // local is relative to soi, non-local is relative to soi's parent
	get trueLocal() {
		return Bodies.soi.parent === undefined ? true : this.local;
	},
	startSim() {
		if(!this.simNotAllowed()) {
			this.sim = { // initial state of sim
				ship: {
					initialPos: Ship.pos.copy(),
					pos: Ship.pos.copy(),
					vel: Ship.vel.copy(),
					get absolutePos() {
						return Trajectory.sim.ship.pos.addedTo(Trajectory.sim.soi.absolutePos(Trajectory.sim.startTime + Trajectory.sim.msElapsed));
					}
				},
				initialSOI: Bodies.soi, // if local, equal to relativeTo, otherwise its parent
				soi: Bodies.soi,
				startTime: Engine.gameTime,
				msElapsed: 0
			};
			this.sim.ship.absoluteInitialPos = this.sim.ship.initialPos.addedTo(this.sim.initialSOI.absolutePos(this.sim.startTime));

			this.stepping = true;
			this.tick(); // one tick to remove flicker when starting simulation
			this.shipMarker.style({
				rotate: Ship.angle+'deg',
				opacity: '1'
			});
			this.shipStartMarker.style({
				rotate: Ship.angle+'deg',
				opacity: '1'
			});
		}
	},
	stopSim() {
		this.shipMarker.style({
			opacity: '0'
		});
		this.shipStartMarker.style({
			opacity: '0'
		});

		for(let body of Object.values(Bodies.flatList)) { // body markers
			if(body.parent !== undefined) { // not the sun
				body.trajectoryHTML.style({ opacity: '0'});
				body.trajectoryStartHTML.style({ opacity: '0'});
			}
		}

		this.stepping = false;
	},
	simStep() {
		const instantRate = this.RATE / Viewport.scale / Viewport.fps; // adjusted sim time speed
		this.sim.msElapsed += instantRate * 1000;

		let physTmp = Bodies.physics(this.sim.ship.pos, this.sim.soi, instantRate, this.sim.startTime + this.sim.msElapsed);
		this.sim.soi = physTmp.soi;
		this.sim.ship.pos.add(physTmp.posChange); // soi change
		this.sim.ship.vel.add(physTmp.velChange);
		this.sim.ship.pos.add(this.sim.ship.vel, instantRate); // pos change from vel

		/*function localPos(pos) {
			if(this.local) {
				return pos.addedTo(this.sim.initialSOI.absolutePos(this.sim.startTime), -1);
			} else {
				return pos.addedTo();
			}
		}*/

		Viewport.position(this.shipMarker, this.sim.ship.absolutePos); // ship pos marker
		Viewport.position(this.shipStartMarker, this.sim.ship.absoluteInitialPos); // ship initial pos marker

		for(let body of Object.values(Bodies.flatList)) { // body markers
			if(body.parent !== undefined) { // not the sun
				Viewport.position(body.trajectoryStartHTML, body.absolutePos(this.sim.startTime));
				Viewport.position(body.trajectoryHTML, body.absolutePos(this.sim.startTime + this.sim.msElapsed));
				body.trajectoryHTML.style({ opacity: '1'});
				body.trajectoryStartHTML.style({ opacity: '1'});
			}
		}

		if(
			!Viewport.isVisible(this.sim.ship.absolutePos) // point no longer visible
			||
			this.sim.ship.pos.magnitude < this.sim.soi.radius // point is colliding with body
		) { // stopping sim if marker is out of view
			this.stopSim();
		}

		if(Bodies.soi != this.sim.initialSOI) { // real ship is moving between soi
			this.stopSim();
		}
	},
	simNotAllowed() { // conditions for stopping/not allowing the simulation
		return Viewport.paused || !Viewport.showMap || Ship.landingMode;
	},
	init() {
		this.shipMarker = (new html('img')) // ship marker
			.attr({
				src: 'assets/trajectory/ship-marker.svg'
			})
			.style({
				pointerEvents: 'none',
				width: '12px'
			})
			.create();

		this.shipStartMarker = html.clone(this.shipMarker)
			.style({
				filter: 'opacity(0.4)'
			})
			.create();

		this.window = (new html('div')) // window for buttons and stuff
			.class('background', 'marker')
			.style({
				right: '0',
				top: '50%'
			})
			.create();

		this.simButton = (new html('div'))
			.event('onmousedown', function() { Trajectory.startSim(); })
			.event('onclick', function() { Trajectory.stopSim(); })
			.event('onmouseout', function() { Trajectory.stopSim(); })
			.style({
				textAlign: 'left'
			})
			.content('Simulate Trajectory')
			.class('uiControl', 'button')
			.appendTo(this.window);

		this.window.append(new html('hr'));

		this.localButton = (new html('div'))
		.event('onclick', function() { Trajectory.local = !Trajectory.local; })
		.style({
			textAlign: 'left'
		})
		.content('Local')
		.class('uiControl', 'button')
		.appendTo(this.window);

		this.relativeHTML = (new html('p')).appendTo(this.window);
		this.soiHTML = (new html('p')).appendTo(this.window);
		this.elapsedHTML = (new html('p')).appendTo(this.window);

		this.stopSim();
	},
	tick() {
		this.window.style({
			opacity: Viewport.showMap ? '1' : '0'
		});

		this.simButton.buttonStyle(this.stepping, !this.simNotAllowed());
		this.localButton.buttonStyle(this.local);

		if(this.stepping) {
			this.relativeHTML.content('Relative to: '+(this.trueLocal ? this.sim.initialSOI : this.sim.initialSOI.parent).name);
			this.soiHTML.content('SOI: '+this.sim.soi.name);
			this.elapsedHTML.content('Elapsed: '+msToTimestamp(this.sim.msElapsed));

			this.simStep();
			if(this.simNotAllowed()) {
				this.stopSim();
			}
		} else {
			this.relativeHTML.content('Relative to: N/A');
			this.soiHTML.content('SOI: N/A');
			this.elapsedHTML.content('Elapsed: N/A');
		}
	}
};