module.exports = {
	getPresets() {
    var self = this;
    let presets = [];

    presets.push({
      category: 'General Commands',
      label: 'Update timeline list',
      bank: {
        style: 'text',
        text: 'Update timeline list',
        color: self.rgb(255,255,255),
        bgcolor: self.rgb(0,0,0)
      },
      actions: [{
        action: 'getAuxTimelines'
      }]
    });

		return presets;
	}
}
