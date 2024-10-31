// keyboard controls
var Controls = {
	TRAJECTORY_KEY: ' ', // spacebar
	KEYS: { // controls for holding down buttons
		a: false,
		d: false,
		w: false,
		' ': false
	},
	ALIASES: {
		arrowleft: 'a',
		arrowright: 'd',
		arrowup: 'w'
	},
	afterLoad() {
		function setKey(key, isDown) {
			if(Controls.KEYS[key.toLowerCase()] !== undefined)
				Controls.KEYS[key.toLowerCase()] = isDown;
			else if(Controls.ALIASES[key.toLowerCase()] !== undefined)
				Controls.KEYS[Controls.ALIASES[key.toLowerCase()]] = isDown;
		}
		
		window.onkeyup = event => {
			if(event.key == 'Escape') {
				if(TimeWarp.index > 0)
					TimeWarp.index = 0;
				else if(Viewport.paused)
					Viewport.unpause();
				else
					Viewport.pause();
			} else if(!Viewport.paused) {
				switch(event.key.toLowerCase()) {
					// trajectory stopping
					case ' ':
						Trajectory.stopSim();
						break;
					// mining stuff
					case 'o':
						Resources.toggleOverlays();
						break;
					case 'm':
						Resources.toggleMining();
						break;
					// timewarp controls
					case '.':
						if(TimeWarp.index < TimeWarp.maxIndex)
							TimeWarp.index++;
						break;
					case ',':
						if(TimeWarp.index > 0)
							TimeWarp.index--;
						break;
					case '/':
						TimeWarp.index = 0;
						break;
					// fps controls
					case '[':
						Viewport.changeFPS(-1);
						break;
					case ']':
						Viewport.changeFPS(1);
						break;
				}
			}
			setKey(event.key, false);
		};

		window.onkeydown = event => { // notice, fires repeatedly while key is pressed
			if(event.key == ' ' && !Controls.KEYS[' ']) {
				Trajectory.startSim();
			}
			setKey(event.key, true);
		};
	}
};