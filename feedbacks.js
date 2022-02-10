module.exports = {
	getFeedbacks() {
    let self = this;
		let feedbacks = {};

		/*
		feedbacks['task_status'] = {
			label: 'Task status',
			description: 'Change background according to task status',
			options: [
				{
					type    : 'dropdown',
					label   : 'Aux Timeline',
					id      : 'auxTimeline',
					choices : self.auxTimelinesChoices,
					default : ''
				},
				{
					type: 'checkbox',
					label: 'Use icons instead of colors',
					id: 'icons',
					default: false
				},
				{
					type    : 'colorpicker',
					label   : 'Foreground color',
					id      : 'playfg',
					default : self.feedbacksSettings.colors.task.play.fg

				},
				{
					type    : 'colorpicker',
					label   : 'Background color',
					id      : 'playbg',
					default : self.feedbacksSettings.colors.task.play.bg
				},
				{
					type    : 'colorpicker',
					label   : 'Foreground color',
					id      : 'pausefg',
					default : self.feedbacksSettings.colors.task.pause.fg

				},
				{
					type    : 'colorpicker',
					label   : 'Background color',
					id      : 'pausebg',
					default : self.feedbacksSettings.colors.task.pause.bg
				},
				{
					type    : 'colorpicker',
					label   : 'Foreground color',
					id      : 'stopfg',
					default : self.feedbacksSettings.colors.task.stop.fg

				},
				{
					type    : 'colorpicker',
					label   : 'Background color',
					id      : 'stopbg',
					default : self.feedbacksSettings.colors.task.stop.bg
				}
			],
			callback: (feedback, bank) => {
				if (self.auxTimelinesStatus.hasOwnProperty(feedback.options.auxTimeline)) {
					var status = self.auxTimelinesStatus[feedback.options.auxTimeline].status;
					if(feedback.options.icons) {
	          if(status == 2) { // play
	            return {
								png64: self.feedbacksSettings.images.play,
								pngalignment: "center:bottom"
							};
	          } else if(status == 1) { //pause
	            return {
								png64: self.feedbacksSettings.images.pause,
								pngalignment: "center:bottom"
							};
	          } else if(status == 0) { //stop
	            return {
								png64: self.feedbacksSettings.images.stop,
								pngalignment: "center:bottom"
							};
	          }
					} else {
						if(status == 2) { //play
	            return {
	              color   : feedback.options.playfg,
	              bgcolor : feedback.options.playbg
	            };
	          } else if(status == 1) { //pause
							return {
								color   : feedback.options.pausefg,
								bgcolor : feedback.options.pausebg
							};
	          } else if(status == 0) { // stop
							return {
								color   : feedback.options.stopfg,
								bgcolor : feedback.options.stopbg
							};
	          }
					}
        }
			}
		};
		*/

		feedbacks['task_playing'] = {
			label: 'Task playing',
			description: 'Change background when task is playing',
			options: [
				{
					type    : 'dropdown',
					label   : 'Aux Timeline',
					id      : 'auxTimeline',
					choices : self.auxTimelinesChoices,
					default : ''
				},
				{
					type: 'checkbox',
					label: 'Use icon instead of colors',
					id: 'icons',
					default: false
				},
				{
					type    : 'colorpicker',
					label   : 'Foreground color',
					id      : 'playfg',
					default : self.feedbacksSettings.colors.task.play.fg

				},
				{
					type    : 'colorpicker',
					label   : 'Background color',
					id      : 'playbg',
					default : self.feedbacksSettings.colors.task.play.bg
				}
			],
			callback: (feedback, bank) => {
				if (self.auxTimelinesStatus.hasOwnProperty(feedback.options.auxTimeline)) {
					var status = self.auxTimelinesStatus[feedback.options.auxTimeline].status;
					if(feedback.options.icons) {
	          if(status == 2) { // play
	            return {
								png64: self.feedbacksSettings.images.play,
								pngalignment: "center:bottom"
							}
						}
					} else {
						if(status == 2) { //play
	            return {
	              color   : feedback.options.playfg,
	              bgcolor : feedback.options.playbg
	            };
	          }
					}
        }
			}
		};

		feedbacks['task_paused'] = {
			label: 'Task paused',
			description: 'Change background when task is paused',
			options: [
				{
					type    : 'dropdown',
					label   : 'Aux Timeline',
					id      : 'auxTimeline',
					choices : self.auxTimelinesChoices,
					default : ''
				},
				{
					type: 'checkbox',
					label: 'Use icon instead of colors',
					id: 'icons',
					default: false
				},
				{
					type    : 'colorpicker',
					label   : 'Foreground color',
					id      : 'pausefg',
					default : self.feedbacksSettings.colors.task.pause.fg

				},
				{
					type    : 'colorpicker',
					label   : 'Background color',
					id      : 'pausebg',
					default : self.feedbacksSettings.colors.task.pause.bg
				}
			],
			callback: (feedback, bank) => {
				if (self.auxTimelinesStatus.hasOwnProperty(feedback.options.auxTimeline)) {
					var status = self.auxTimelinesStatus[feedback.options.auxTimeline].status;
					if(feedback.options.icons) {
	          if(status == 1) { //pause
	            return {
								png64: self.feedbacksSettings.images.pause,
								pngalignment: "center:bottom"
							 }
	          }
					} else {
						if(status == 1) { //pause
							return {
								color   : feedback.options.pausefg,
								bgcolor : feedback.options.pausebg
							};
	          }
					}
        }
			}
		};

		feedbacks['task_stopped'] = {
			label: 'Task stopped',
			description: 'Change background when task is stopped',
			options: [
				{
					type    : 'dropdown',
					label   : 'Aux Timeline',
					id      : 'auxTimeline',
					choices : self.auxTimelinesChoices,
					default : ''
				},
				{
					type: 'checkbox',
					label: 'Use icons instead of colors',
					id: 'icons',
					default: false
				},
				{
					type    : 'colorpicker',
					label   : 'Foreground color',
					id      : 'stopfg',
					default : self.feedbacksSettings.colors.task.stop.fg

				},
				{
					type    : 'colorpicker',
					label   : 'Background color',
					id      : 'stopbg',
					default : self.feedbacksSettings.colors.task.stop.bg
				}
			],
			callback: (feedback, bank) => {
				if (self.auxTimelinesStatus.hasOwnProperty(feedback.options.auxTimeline)) {
					var status = self.auxTimelinesStatus[feedback.options.auxTimeline].status;
					if(feedback.options.icons) {
	          if(status == 0) { //stop
	            return {
								png64: self.feedbacksSettings.images.stop,
								pngalignment: "center:bottom"
							}
	          }
					} else {
						if(status == 0) { // stop
							return {
								color   : feedback.options.stopfg,
								bgcolor : feedback.options.stopbg
							};
	          }
					}
        }
			}
		};

		return feedbacks;
	}
}
