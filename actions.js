const { Regex } = require('@companion-module/base')
const { choicesConditions, CHOICES_YESNO_BOOLEAN } = require('./choices')

const sendCommand = (cmd, self) => {
	if (cmd !== undefined) {
		if (self.socket === undefined) {
			self.init_tcp()
		}

		self.log('debug', 'sending tcp ' + cmd + ' to ' + self.config.host)

		if (self.socket !== undefined && self.socket.isConnected) {
			self.socket.send(cmd)
		} else {
			self.log('debug', `Can't send send command, socket not connected :(`)
		}
	}
}

const ActionDefinitions = (self) => {
	let timelineOption = {
		type: 'textinput',
		label: 'timeline (optional)',
		id: 'timeline',
		default: '',
	}
	if (self.config.feedback == 'simple' || self.config.feedback == 'advanced') {
		timelineOption = {
			type: 'dropdown',
			label: 'Timeline',
			id: 'timeline',
			allowCustom: true,
			default: '',
			choices: self.auxTimelinesChoices,
		}
	}
	let actions = {
		run: {
			name: 'Run',
			options: [timelineOption],
			callback: (action) => {
				let cmd = ''
				if (action.options.timeline != '') cmd = 'run "' + action.options.timeline + '"\r\n'
				else cmd = 'run\r\n'
				sendCommand(cmd, self)
			},
		},
		halt: {
			name: 'Pause',
			options: [timelineOption],
			callback: (action) => {
				let cmd = ''
				if (action.options.timeline != '') cmd = 'halt "' + action.options.timeline + '"\r\n'
				else cmd = 'halt\r\n'
				sendCommand(cmd, self)
			},
		},
		kill: {
			name: 'Kill',
			options: [timelineOption],
			callback: (action) => {
				let cmd = ''
				if (action.options.timeline != '') cmd = 'kill "' + action.options.timeline + '"\r\n'
				else {
					self.log('error', 'Error: Kill command for Watchout production triggered without timeline name')
				}
				sendCommand(cmd, self)
			},
		},
		reset: {
			name: 'Reset',
			options: [],
			callback: (action) => {
				let cmd = 'reset\r\n'
				sendCommand(cmd, self)
			},
		},
		gototime: {
			name: 'Jump to time',
			options: [
				{
					type: 'textinput',
					label: 'time position',
					id: 'time',
					default: '"00:00:00.000"',
					regex: '/^(\\d{1,12}|"\\d{1,2}:\\d{1,2}:\\d{1,2}\\.\\d{1,3}")$/',
				},
				timelineOption,
			],
			callback: (action) => {
				let cmd = ''
				if (action.options.time != '') {
					cmd = 'gotoTime ' + action.options.time
					if (action.options.timeline != '') cmd += ` "${action.options.timeline}"`
					cmd += '\r\n'
					sendCommand(cmd, self)
				} else {
					self.log('error', 'Error: Gototime command for Watchout production triggered without entering time')
				}
			},
		},
		gotocue: {
			name: 'Jump to cue',
			options: [
				{
					type: 'textinput',
					label: 'Cue name',
					id: 'cuename',
					useVariables: true,
					default: '',
				},
				timelineOption,
			],
			callback: async (action) => {
				let cmd = ''
				const cuename = await self.parseVariablesInString(action.options.cuename)
				if (cuename != '') {
					cmd = 'gotoControlCue "' + cuename + '" false'
					if (action.options.timeline != '') cmd += ` "${action.options.timeline}"`
					cmd += '\r\n'
					sendCommand(cmd, self)
				} else {
					self.log('error', 'Error: GotoControlCue command for Watchout production triggered without entering cue')
				}
			},
		},
		online: {
			name: 'Go online',
			options: [
				{
					type: 'dropdown',
					label: 'go online',
					id: 'online',
					default: 'true',
					choices: CHOICES_YESNO_BOOLEAN,
				},
			],
			callback: (action) => {
				let cmd = ''
				if (action.options.online != 'false' && action.options.online != 'FALSE' && action.options.online != '0')
					cmd = 'online true\r\n'
				else cmd = 'online false\r\n'
				sendCommand(cmd, self)
			},
		},
		standby: {
			name: 'Enter Standby',
			options: [
				{
					type: 'dropdown',
					label: 'Enter Standby',
					id: 'standby',
					default: 'true',
					choices: CHOICES_YESNO_BOOLEAN,
				},
				{
					type: 'number',
					label: 'Fade time in ms',
					id: 'fadetime',
					min: 0,
					max: 60000,
					default: 1000,
					required: true,
				},
			],
			callback: (action) => {
				let cmd = ''
				if (action.options.fadetime === undefined || action.options.fadetime < 0 || action.options.fadetime > 60000) {
					action.options.fadetime = 1000
				}
				if (action.options.standby != 'false' && action.options.standby != 'FALSE' && action.options.standby != '0')
					cmd = 'standBy true ' + action.options.fadetime.toString() + '\r\n'
				else cmd = 'standBy false ' + action.options.fadetime.toString() + '\r\n'
				sendCommand(cmd, self)
			},
		},
		setinput: {
			name: 'Set Input',
			options: [
				{
					type: 'textinput',
					label: 'Input Name',
					id: 'inputname',
					default: '',
				},
				{
					type: 'textinput',
					label: 'Value',
					id: 'inputvalue',
					default: '1.0',
					useVariables: true,
				},
				{
					type: 'textinput',
					label: 'Fadetime (ms)',
					id: 'inputfade',
					default: '0',
					regex: Regex.NUMBER,
				},
			],
			callback: async (action) => {
				let cmd = ''
				let value = await self
					.parseVariablesInString(action.options.inputvalue)
					.catch((e) => self.log('error', 'parsing variable for setInput failed ' + e))

				if (action.options.inputname != '' && value != '') {
					cmd = 'setInput "' + action.options.inputname + '" '
					if (value.startsWith('+')) {
						cmd += '+'
					}
					const float = parseFloat(value)
					if (isNaN(float)) {
						self.log('error', 'Entered input value is not a number: ' + value + ' => ' + float)
						return
					}
					cmd += float.toString()
					const fade = parseInt(action.options.inputfade)
					if (action.options.inputfade != '') cmd += isNaN(fade) ? '' : ' ' + fade
					cmd += '\r\n'
					sendCommand(cmd, self)
				} else {
					self.log(
						'error',
						'Error: setInput command for Watchout production triggered without entering input name or input value'
					)
				}
			},
		},
		load: {
			name: 'Load Show',
			options: [
				{
					type: 'textinput',
					label: 'Showfile or Showname',
					id: 'show',
					default: '',
					useVariables: true,
					regex: '/^[a-zA-Z0-9\\/:.-_ ]+$/',
				},
			],
			callback: async (action) => {
				let cmd = ''
				const show = await self.parseVariablesInString(action.options.show)
				if (show != '') {
					cmd = 'load "' + show + '"\r\n'
					sendCommand(cmd, self)
				}
			},
		},
		layerCond: {
			name: 'Set Layer Conditions',
			options: choicesConditions(30),
			callback: (action) => {
				let cmd = ''
				let cond = 0
				for (let i = 0; i < 30; i++) {
					if (action.options[i] === true) {
						cond += 2 ** i
					}
				}
				// To disable all conditions (no conditions are checked) the correct value to be sent is 2^30
				if (cond == 0) {
					cond = 2 ** 30
				}
				// A value equal to 0 tells Watchout to apply default conditions (the ones set in the producer GUI, before TCP commands)
				if (action.options[`${30}`] === true) {
					cond = 0
				}
				cmd = 'enableLayerCond ' + cond + '\r\n'
				sendCommand(cmd, self)
			},
		},
	}

	// Add feedback-related actions only if needed
	if (self.config.feedback == 'simple' || self.config.feedback == 'advanced') {
		actions['getAuxTimelines'] = {
			name: 'Update timeline list',
			options: [],
			callback: (action) => {
				let cmd = 'getAuxTimelines tree\r\n'
				sendCommand(cmd, self)
			},
		}
		actions['toggleRun'] = {
			name: 'Toggle run',
			options: [timelineOption],
			subscribe: function (action) {
				self.manageSubscription(action.options.timeline, true)
			},
			unsubscribe: function (action) {
				self.manageSubscription(action.options.timeline, false)
			},
			callback: (action) => {
				let cmd = ''
				if (self.config.feedback == 'simple' || self.config.feedback == 'advanced') {
					if (self.taskData[action.options.timeline].status == 2) {
						cmd = 'halt "' + action.options.timeline + '"\r\n'
					} else {
						cmd = 'run "' + action.options.timeline + '"\r\n'
					}
				}
				sendCommand(cmd, self)
			},
		}
	}

	return actions
}

module.exports = ActionDefinitions
