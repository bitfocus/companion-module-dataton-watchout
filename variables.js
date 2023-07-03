const VariableDefinitions = (self) => {
	let variables = null
	if (self.config.feedback == 'simple' || self.config.feedback == 'advanced') {
		variables = [
			{ variableId: 'showName', name: 'Show Name' },
			{ variableId: 'busy', name: 'Busy' },
			{ variableId: 'clusterHealth', name: 'Cluster Health' },
			{ variableId: 'fullscreen', name: 'fullscreen' },
			{ variableId: 'ready', name: 'Ready' },
			{ variableId: 'programmerOnline', name: 'Programmer in online' },
			{ variableId: 'playheadMain', name: 'Main timeline playhead position' },
			{ variableId: 'playingMain', name: 'Main timeline is playing' },
			{ variableId: 'standby', name: 'Standby' },
		]
	}

	if (self.config.feedback === 'advanced') {
		for (const timeline of self.auxTimelinesChoices) {
			if (timeline.id != '') {
				variables.push({ variableId: 'status ' + timeline.id, name: timeline.id + ' status' })
			}
		}
	}
	return variables
}

module.exports = VariableDefinitions
