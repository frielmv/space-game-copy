var Save = {
	FILE_EXTENSION: '.sgsave',
	MAX_DISPLAYED_SAVES: 3,
	saves: [], // downloaded, so no junk properties!!!
	saveTimestamps: [],
	shortenedList: true,
	create() {
		Save.saves.push({
			Display: {
				timestamp: parseInt(Engine.elapsed / 1000),
				soi: Bodies.soi.name,
				colliding: Collisions.colliding
			},
			Engine: Engine.save(),
			Bodies: Bodies.save(),
			Collectibles: Collectibles.save(),
			Resources: Resources.save(),
			Ship: Ship.save(),
			Viewport: Viewport.save()
		});
		Save.updateDisplay();
	},
	download() {
		Viewport.pause();
		Save.create();
	  const el = (new html('a')).attr({
			href: URL.createObjectURL(new Blob([JSON.stringify(Save.saves)])),
			download: (new Date()).toJSON().slice(0, 19).replace(/:/g, '') + Save.FILE_EXTENSION
		});
	  el.element.click();
	},
	load(index) { // index can be negative
		Viewport.pause();
		Engine.resetAll();

		Engine.loadSave(this.saves.at(index).Engine)
		Bodies.loadSave(this.saves.at(index).Bodies);
		Collectibles.loadSave(this.saves.at(index).Collectibles);
		Resources.loadSave(this.saves.at(index).Resources);
		Ship.loadSave(this.saves.at(index).Ship);
		Viewport.loadSave(this.saves.at(index).Viewport);
	},
	upload(el) {
		Viewport.pause();
		let reader = new FileReader();
		reader.onload = event => {
			Save.saves = JSON.parse(event.target.result);
			Save.load(-1);
			Save.updateDisplay();
		};
		reader.readAsText(el.files[0]);
		el.value = null;
	},
	updateDisplay() {
		this.saveTimestamps = [];
		if(this.saves.length > 0) {
			let saveDisplay = this.saves;
			if(Save.shortenedList) {
				saveDisplay = saveDisplay.slice(-this.MAX_DISPLAYED_SAVES);
			}
			saveDisplay = saveDisplay.map((data, i) => {
				const situation = data.Display.colliding ? 'Landed' : 'Orbiting';
				let timestamp = (new html('span')).class('saveTimestamp');
				this.saveTimestamps.push(timestamp);

				return (new html('div')) // html for save instance
					.class('uiControl', 'button')
					.event('onclick', function() {
						Save.load(i);
					})
					.content(data.Display.soi + ' / ' + situation + ' / ')
					.append(timestamp);
			}).reverse();

			this.listHTML.empty().style({
				clipPath: 'inset(0 100% 0 0)',
				transition: 'none',
				overflow: 'hidden'
			});
			this.listHTML.append(...saveDisplay);
			if(this.saves.length > this.MAX_DISPLAYED_SAVES) { // adding 'show more' button
				this.showMoreButton = (new html('div'))
					.content('Show All')
					.class('uiControl', 'button')
					.event('onclick', function() {
							Save.shortenedList = !Save.shortenedList;
							Save.updateDisplay();
					})
					.appendTo(this.listHTML);
			}
			window.setTimeout(function() {
				Save.listHTML.style({
					transition: 'clip-path var(--uiFade) ease-out',
					clipPath: 'inset(0 0 0 0)'
				});
			});
		} else {
			this.listHTML.content('No saves created');
		}
	},
	init() {
		const containerHTML = (new html('div'))
			.style({
				bottom: '0',
				left: '0',
			})
			.create();
		
		const buttonContainer = (new html('div'))
			.class('background')
			.style({
				position: 'relative',
				width: 'max-content',
			})
			.appendTo(containerHTML)
			.append(new html('hr'));

		this.saveButton = (new html('div'))
			.style({
				display: 'inline-block'
			})
			.content('Save Game')
			.event('onclick', Save.create)
			.class('uiControl', 'button')
			.appendTo(buttonContainer);

		this.uploadButton = (new html('label'))
			.style({
				display: 'inline-block'
			})
			.content('Upload')
			.class('uiControl', 'button')
			.append(
				(new html('input'))
				.attr({
					type: 'file',
					accept: this.FILE_EXTENSION,
					hidden: true,
					onchange() {
						Save.upload(this);
					}
				})
			)
			.appendTo(buttonContainer)

		this.downloadButton = (new html('div'))
		.style({
			display: 'inline-block'
		})
		.content('Download')
		.event('onclick', Save.download)
		.class('uiControl', 'button')
		.appendTo(buttonContainer);

		this.listHTML = new html('div')
			.style({
				position: 'relative',
				textAlign: 'left'
			})
			.prependTo(buttonContainer);

		Save.updateDisplay();
	},
	tick() {
		if(this.showMoreButton) {
			this.showMoreButton.buttonStyle(!Save.shortenedList);
		}

		for(let [i, el] of Save.saveTimestamps.entries()) {
			const saveIndex = i + (Save.saves.length - Save.saveTimestamps.length);
			el.content(msToTimestamp((Engine.elapsed / 1000 - Save.saves[saveIndex].Display.timestamp) * 1000));
		}
	}
};