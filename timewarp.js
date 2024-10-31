var TimeWarp = {
	STAGES: [0, 50, 100, 1000, 10000, 100000, 500000, 1000000],
	ACCELERATION_INDEX: 2, // max timewarp index while accelerating
	index: 0,
	get multiplier() {
		return 4 ** this.index;
	},
	init() {
		this.html = (new html('div'))
			.class('background')
			.style({
				left: '50%',
				bottom: '0',
				translate: '-50%',
				width: 'max-content',
			})
			.create();

		this.multiplierHTML = (new html('p')).appendTo(this.html);

		this.arrows = []; // [open, closed]
		const open = (new html('div'))
			.style({
				width: 'max-content',
				lineHeight: '0'
			})
			.appendTo(this.html);
		const closed = html.clone(open)
			.style({
				position: 'relative'
			})
			.appendTo(this.html);
		
		for(let i = 0; i < this.STAGES.length; i++) {
			const frame = (new html('img'))
				.class('uiControl', 'timeWarpArrow')
				.style({
					width: '18px',
					position: 'relative',
					translate: 'none',
					margin: 'calc(var(--spacing) / 2)',
				})
				.attr({
					src: 'assets/timewarp/arrow-open.svg'
				})
				.appendTo(open);
		
			const arrow = html.clone(frame)
				.attr({
					src: 'assets/timewarp/arrow-closed.svg',
				})
				.event('onclick', function() {
					TimeWarp.index = Math.min(i, TimeWarp.maxIndex);
				})
				.appendTo(closed);
		
			this.arrows.push([frame, arrow]);
		}
	},
	reset() {
		this.index = 0;
	},
	tick() {
		if(Collisions.stopped) {
			this.maxIndex = this.STAGES.length - 1;
		} else {
			for(let i = 0; i < this.STAGES.length; i++) {
				if(Object.values(Bodies.flatList).every(body => Ship.absolutePos.addedTo(body.absolutePos(), -1).magnitude - body.radius > this.STAGES[i]))
					this.maxIndex = i;
			}
		}

		// resetting time warp if attempting to rotate
		if(Ship.rotating) {
			this.maxIndex = 0;
		}

		// reducing timewarp while accelerating
		if(Ship.engineFiring) {
			this.maxIndex = Math.min(this.maxIndex, this.ACCELERATION_INDEX);
		}

		// reducing timewarp near bodies
		if(this.index > this.maxIndex) {
			this.index = this.maxIndex;
		}

		for(const [i, [open, closed]] of this.arrows.entries()) {
			open.style({
				opacity: (i <= TimeWarp.maxIndex && TimeWarp.maxIndex > 0) ? '1' : '0.25'
			});
			closed.style({
				opacity: (i <= TimeWarp.index && TimeWarp.maxIndex > 0) ? '1' : '0'
			});
		}

		this.multiplierHTML.content('Time Warp: ' + (TimeWarp.maxIndex > 0 ? TimeWarp.multiplier + 'x' : 'N/A'));
	}
};