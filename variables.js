module.exports = {
	getVariables() {
    let self = this;
		let variables = [
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
    return variables;
  }
}
