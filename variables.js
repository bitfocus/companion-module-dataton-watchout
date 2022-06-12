module.exports = {
	getVariables() {
    let self = this;
		let variables = null;
		if(self.config.feedback == 'simple' || self.config.feedback == 'advanced') {
			variables = [
	      { name: 'showName',         label: 'Show Name' },
	      { name: 'busy',             label: 'Busy' },
	      { name: 'clusterHealth',    label: 'Cluster Health' },
	      { name: 'fullscreen',       label: 'fullscreen' },
	      { name: 'ready',            label: 'Ready' },
	      { name: 'programmerOnline', label: 'Programmer in online' },
	      { name: 'playheadMain',     label: 'Main timeline playhead position' },
	      { name: 'playingMain',      label: 'Main timeline is playing' },
	      { name: 'standby',          label: 'Standby' }
	    ];
		}

		if(self.config.feedback === 'advanced') {
			for (const timeline of self.auxTimelinesChoices) {
				if(timeline.id != '') {
					variables.push({name: 'status ' + timeline.id, label : timeline.id + " status"});
				}
			}
		}
		return variables;
  }
}
