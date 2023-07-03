// Utility function to dynamically build presets based on a timeline object passed to it
// We expect to receive a timeline object containing timeline.id and timeline.label
const buildPresets = (timeline) => {
	let self = this
	let presets = []
	presets.push({
		category: 'Run',
		type: 'button',
		label: 'Run ' + timeline.label,
		style: {
			text: 'Run\\n' + timeline.label + '\\n',
			size: '14',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'run',
						options: {
							timeline: timeline.id,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'task_status',
				options: {
					icons: true,
					timeline: timeline.id,
				},
			},
		],
	})

	presets.push({
		category: 'Pause',
		type: 'button',
		name: 'Pause ' + timeline.label,
		style: {
			text: 'Pause\\n' + timeline.label + '\\n',
			size: '14',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'halt',
						options: {
							timeline: timeline.id,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'task_status',
				options: {
					icons: true,
					timeline: timeline.id,
				},
			},
		],
	})

	if (timeline.id != '') {
		// You can't kill the main timeline
		presets.push({
			category: 'Kill',
			type: 'button',
			name: 'Kill ' + timeline.label,
			style: {
				text: 'Kill\\n' + timeline.label + '\\n',
				size: '14',
				color: 0xffffff,
				bgcolor: 0x000000,
			},
			steps: [
				{
					down: [
						{
							actionId: 'kill',
							options: {
								timeline: timeline.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'task_status',
					options: {
						icons: true,
						timeline: timeline.id,
					},
				},
			],
		})
	}

	presets.push({
		category: 'Toggle run',
		type: 'button',
		name: 'Toggle run ' + timeline.label,
		style: {
			text: 'Toggle\\n' + timeline.label + '\\n',
			size: '14',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'toggleRun',
						options: {
							timeline: timeline.id,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'task_status',
				options: {
					icons: true,
					timeline: timeline.id,
				},
			},
		],
	})

	return presets
}

const PresetDefinitions = (self) => {
	let presets = null

	if (self.config.feedback == 'simple' || self.config.feedback == 'advanced') {
		presets = []
		presets.push({
			category: 'General Commands',
			type: 'button',
			name: 'Update timeline list',
			style: {
				text: 'Update timeline list',
				size: '14',
				color: 0xffffff,
				bgcolor: 0x000000,
			},
			steps: [
				{
					down: [
						{
							actionId: 'getAuxTimelines',
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		})
	}

	return presets
}

module.exports = { buildPresets, PresetDefinitions }
