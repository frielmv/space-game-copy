var Resources = {
	FUEL_DRAIN_RATE: 0.02, // how much fuel (out of 1) drains every second
	RCS_FUEL_DRAIN_RATE: 0.02,
	MINING_ANGLE_TOLERANCE: 8, // how many degrees from straight up to continue mining
	MINING_RATE: 0.1, // resources per second to mine
	toggleMining() {
		if(this.mining) {
			this.mining = false;
		} else {
			if(this.miningPossible)
				this.mining = true;
		}
	},
	toggleOverlays() {
		if(Bodies.bodyVisible) {
			Resources.showOverlay = !Resources.showOverlay;
		}
	},
	init() {
		// fuel bars
		this.fuelHTML = (new html('div'))
			.style({
				position: 'relative',
				height: 'calc(var(--spacing) * 2)',
				borderTopRightRadius: 'var(--spacing)',
				borderBottomRightRadius: 'var(--spacing)',
				margin: 'calc(var(--spacing) / 2)',
				marginLeft: '0'
			});

		this.rcsFuelHTML = html.clone(this.fuelHTML).style({
			marginTop: 'var(--spacing)'
		});

		(new html('div'))
			.class('background')
			.style({
				left: '50%',
				top: '0',
				translate: '-50%',
				width: '400px',
				borderLeft: 'var(--line) solid',
				borderTopLeftRadius: '0',
				borderBottomLeftRadius: '0',
				padding: 'calc(var(--spacing) / 2)',
				paddingLeft: '0'
			})
			.append(this.fuelHTML, this.rcsFuelHTML)
			.create();

		// buttons
		const buttonContainer = (new html('div'))
			.class('background')
			.style({
				bottom: '0',
				right: '0'
			})
			.create();

		this.overlayButton = (new html('div'))
			.event('onclick', Resources.toggleOverlays)
			.style({
				textAlign: 'left'
			})
			.content('Resource Overlay')
			.class('uiControl', 'button')
			.appendTo(buttonContainer);

		this.miningButton = html.clone(this.overlayButton)
			.event('onclick', function() {
				Resources.toggleMining();
			})
			.content('Resource Mining')
			.appendTo(buttonContainer);
	},
	reset() {
		this.fuel = 1;
		this.rcsFuel = 1;
		this.mining = false;

		this.lastMinedBody = null;
		this.remaining = 1;

		this.showOverlay = false;
	},
	save() {
		return {
			fuel: this.fuel,
			rcsFuel: this.rcsFuel,
			mining: this.mining,
			lastMinedBody: this.lastMinedBody.name,
			remaining: this.remaining,
			showOverlay: this.showOverlay
		};
	},
	loadSave(data) {
		this.fuel = data.fuel;
		this.rcsFuel = data.rcsFuel;
		this.mining = data.mining;
		this.lastMinedBody = Bodies.flatList[data.lastMinedBody];
		this.remaining = data.remaining;
		this.showOverlay = data.showOverlay;
	},
	tick() {
		function barHTML(value) {
			return `linear-gradient(to right, ${valueToColor(value)} ${value * 100}%, var(--filledBackground) ${value * 100}%)`;
		}

		this.overlayButton.buttonStyle(this.showOverlay, Bodies.bodyVisible);
		this.miningButton.buttonStyle(this.mining, this.miningPossible);

		this.fuelHTML.style({
			background: barHTML(this.fuel)
		});
		this.rcsFuelHTML.style({
			background: barHTML(this.rcsFuel)
		});

		// whether you've landed in the correct zone to gather resources
		let inZone = false;
		if(Bodies.soi.resources !== undefined) {
			for(const [i, val] of Bodies.soi.resourceMap.entries()) {
				if(Collisions.collisionAngle < val) {
					inZone = i % 2 == 1;
					break;
				}
			}
		}

		// checking if mining is possible
		this.miningPossible =
			inZone &&
			this.remaining > 0 && // resources left to mine
			(this.fuel < 1 || this.rcsFuel < 1) && // fuel is not already at max
			Collisions.stopped &&
			Math.abs(angleDiff(Ship.angle, Collisions.collisionAngle)) < this.MINING_ANGLE_TOLERANCE; // pointed straight up and down

		if(Collisions.colliding) {
			if(this.lastMinedBody !== Bodies.soi) {
			this.remaining = Bodies.soi.resources;
			}
			this.lastMinedBody = Bodies.soi;
		}

		if(!this.miningPossible) {
			this.mining = false;
		} else if(this.mining) {
			if(this.fuel < 1) {
				this.fuel += this.MINING_RATE / Viewport.fps;
				this.remaining -= this.MINING_RATE / Viewport.fps;
			}
			if(this.rcsFuel < 1) {
				this.rcsFuel += this.MINING_RATE / Viewport.fps;
				this.remaining -= this.MINING_RATE / Viewport.fps;
			}
		}

		this.fuel = clamp(this.fuel);
		this.rcsFuel = clamp(this.rcsFuel);
	}
};