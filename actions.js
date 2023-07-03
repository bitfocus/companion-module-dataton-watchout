const { Regex } = require('@companion-module/base')
const { choicesConditions, CHOICES_YESNO_BOOLEAN } = require('./choices')

const sendCommand = (cmd, self) => {
	if (cmd !== undefined) {
		if (self.socket === undefined) {
			self.init_tcp()
		}

		self.log('debug', 'sending tcp ' + cmd + ' to ' + self.config.host)

		if (self.socket !== undefined && self.socket.connected) {
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
					default: '',
				},
				timelineOption,
			],
			callback: (action) => {
				let cmd = ''
				if (action.options.cuename != '') {
					cmd = 'gotoControlCue "' + action.options.cuename + '" false'
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
					regex: Regex.SIGNED_FLOAT,
				},
				{
					type: 'textinput',
					label: 'Fadetime (ms)',
					id: 'inputfade',
					default: '0',
					regex: Regex.NUMBER,
				},
			],
			callback: (action) => {
				let cmd = ''
				if (action.options.inputname != '' && action.options.inputvalue != '') {
					cmd = 'setInput "' + action.options.inputname + '" '
					if (action.options.inputvalue.startsWith('+')) {
						cmd += '+'
					}
					cmd += parseFloat(action.options.inputvalue)
					if (action.options.inputfade != '') cmd += ' ' + parseInt(action.options.inputfade)
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
					regex: '/^[a-zA-Z0-9\\/:.-_ ]+$/',
				},
			],
			callback: (action) => {
				let cmd = ''
				if (action.options.show != '') {
					cmd = 'load "' + action.options.show + '"\r\n'
					sendCommand(cmd, self)
				}
			},
		},
		layerCond: {
			name: 'Set Layer Conditions',
			options: choicesConditions(this.maxConditions),
			callback: (action) => {
				let cmd = ''
				let cond = 0
				for (let i = 0; i < this.maxConditions; i++) {
					if (action.options[i] === true) {
						cond += 2 ** i
					}
				}
				// To disable all conditions (no conditions are checked) the correct value to be sent is 2^30
				if (cond == 0) {
					cond = 2 ** 30
				}
				// A value equal to 0 tells Watchout to apply default conditions (the ones set in the producer GUI, before TCP commands)
				if (action.options[`${this.maxConditions}`] === true) {
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
