const { feedbacksSettings } = require('./constants')

const getFeedbacks = (self) => {
	let feedbacks = {}

	feedbacks['task_status'] = {
		type: 'advanced',
		name: 'Task status',
		description: 'Change background according to task status',
		options: [
			{
				type: 'dropdown',
				label: 'Timeline',
				id: 'timeline',
				allowCustom: true,
				choices: self.auxTimelinesChoices,
				default: '',
			},
			{
				type: 'checkbox',
				label: 'Use icon instead of colors',
				id: 'icons',
				default: true,
			},
			{
				// Play FG
				type: 'colorpicker',
				label: 'Play foreground color',
				id: 'playfg',
				default: feedbacksSettings.colors.task.play.fg,
			},
			{
				// Play BG
				type: 'colorpicker',
				label: 'Play background color',
				id: 'playbg',
				default: feedbacksSettings.colors.task.play.bg,
			},
			{
				// Pause FG
				type: 'colorpicker',
				label: 'Pause foreground color',
				id: 'pausefg',
				default: feedbacksSettings.colors.task.pause.fg,
			},
			{
				// Pause BG
				type: 'colorpicker',
				label: 'Pause background color',
				id: 'pausebg',
				default: feedbacksSettings.colors.task.pause.bg,
			},
			{
				// Stop FG
				type: 'colorpicker',
				label: 'Stop foreground color',
				id: 'stopfg',
				default: feedbacksSettings.colors.task.stop.fg,
			},
			{
				// Stop BG
				type: 'colorpicker',
				label: 'Stop background color',
				id: 'stopbg',
				default: feedbacksSettings.colors.task.stop.bg,
			},
		],
		callback: (feedback) => {
			if (self.taskData.hasOwnProperty(feedback.options.timeline)) {
				if (feedback.options.icons) {
					if (self.taskData[feedback.options.timeline].status == 2) {
						// play
						return {
							png64: feedbacksSettings.images.play,
							pngalignment: 'center:bottom',
						}
					} else if (self.taskData[feedback.options.timeline].status == 1) {
						//pause
						return {
							png64: feedbacksSettings.images.pause,
							pngalignment: 'center:bottom',
						}
					} else if (self.taskData[feedback.options.timeline].status == 0) {
						//stop
						return {
							png64: feedbacksSettings.images.stop,
							pngalignment: 'center:bottom',
						}
					}
				} else {
					if (self.taskData[feedback.options.timeline].status == 2) {
						//play
						return {
							color: feedback.options.playfg,
							bgcolor: feedback.options.playbg,
						}
					} else if (self.taskData[feedback.options.timeline].status == 1) {
						//pause
						return {
							color: feedback.options.pausefg,
							bgcolor: feedback.options.pausebg,
						}
					} else if (self.taskData[feedback.options.timeline].status == 0) {
						// stop
						return {
							color: feedback.options.stopfg,
							bgcolor: feedback.options.stopbg,
						}
					}
				}
			}
		},
		subscribe: function (feedback) {
			self.manageSubscription(feedback.options.timeline, true)
		},
		unsubscribe: function (feedback) {
			self.manageSubscription(feedback.options.timeline, false)
		},
	}

	feedbacks['task_playing'] = {
		type: 'advanced',
		name: 'Task playing',
		description: 'Change background when task is playing',
		options: [
			{
				type: 'dropdown',
				label: 'Timeline',
				id: 'timeline',
				allowCustom: true,
				choices: self.auxTimelinesChoices,
				default: '',
			},
			{
				type: 'checkbox',
				label: 'Use icon instead of colors',
				id: 'icons',
				default: false,
			},
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'playfg',
				default: feedbacksSettings.colors.task.play.fg,
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'playbg',
				default: feedbacksSettings.colors.task.play.bg,
			},
		],
		callback: (feedback) => {
			if (self.taskData.hasOwnProperty(feedback.options.timeline)) {
				if (feedback.options.icons) {
					if (self.taskData[feedback.options.timeline].status == 2) {
						// play
						return {
							png64: feedbacksSettings.images.play,
							pngalignment: 'center:bottom',
						}
					}
				} else {
					if (self.taskData[feedback.options.timeline].status == 2) {
						//play
						return {
							color: feedback.options.playfg,
							bgcolor: feedback.options.playbg,
						}
					}
				}
			}
		},
		subscribe: function (feedback) {
			self.manageSubscription(feedback.options.timeline, true)
		},
		unsubscribe: function (feedback) {
			self.manageSubscription(feedback.options.timeline, false)
		},
	}

	feedbacks['task_paused'] = {
		type: 'advanced',
		name: 'Task paused',
		description: 'Change background when task is paused',
		options: [
			{
				type: 'dropdown',
				label: 'Timeline',
				id: 'timeline',
				allowCustom: true,
				choices: self.auxTimelinesChoices,
				default: '',
			},
			{
				type: 'checkbox',
				label: 'Use icon instead of colors',
				id: 'icons',
				default: false,
			},
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'pausefg',
				default: feedbacksSettings.colors.task.pause.fg,
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'pausebg',
				default: feedbacksSettings.colors.task.pause.bg,
			},
		],
		callback: (feedback) => {
			if (self.taskData.hasOwnProperty(feedback.options.timeline)) {
				if (feedback.options.icons) {
					if (self.taskData[feedback.options.timeline].status == 1) {
						//pause
						return {
							png64: feedbacksSettings.images.pause,
							pngalignment: 'center:bottom',
						}
					}
				} else {
					if (self.taskData[feedback.options.timeline].status == 1) {
						//pause
						return {
							color: feedback.options.pausefg,
							bgcolor: feedback.options.pausebg,
						}
					}
				}
			}
		},
		subscribe: function (feedback) {
			self.manageSubscription(feedback.options.timeline, true)
		},
		unsubscribe: function (feedback) {
			self.manageSubscription(feedback.options.timeline, false)
		},
	}

	feedbacks['task_stopped'] = {
		type: 'advanced',
		name: 'Task stopped',
		description: 'Change background when task is stopped',
		options: [
			{
				type: 'dropdown',
				label: 'Timeline',
				id: 'timeline',
				allowCustom: true,
				choices: self.auxTimelinesChoices,
				default: '',
			},
			{
				type: 'checkbox',
				label: 'Use icons instead of colors',
				id: 'icons',
				default: false,
			},
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'stopfg',
				default: feedbacksSettings.colors.task.stop.fg,
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'stopbg',
				default: feedbacksSettings.colors.task.stop.bg,
			},
		],
		callback: (feedback) => {
			if (self.taskData.hasOwnProperty(feedback.options.timeline)) {
				if (feedback.options.icons) {
					if (self.taskData[feedback.options.timeline].status == 0) {
						//stop
						return {
							png64: feedbacksSettings.images.stop,
							pngalignment: 'center:bottom',
						}
					}
				} else {
					if (self.taskData[feedback.options.timeline].status == 0) {
						// stop
						return {
							color: feedback.options.stopfg,
							bgcolor: feedback.options.stopbg,
						}
					}
				}
			}
		},
		subscribe: function (feedback) {
			self.manageSubscription(feedback.options.timeline, true)
		},
		unsubscribe: function (feedback) {
			self.manageSubscription(feedback.options.timeline, false)
		},
	}

	return feedbacks
}

module.exports = getFeedbacks
