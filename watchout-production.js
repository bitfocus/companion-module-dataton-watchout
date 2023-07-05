const { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const ActionDefinitions = require('./actions')
const FeedbackDefinitions = require('./feedbacks')
const VariableDefinitions = require('./variables')
const { PresetDefinitions, buildPresets } = require('./presets')

class WatchoutProductionInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.instanceOptions.disableVariableValidation = true
	}

	async init(config) {
		this.config = config
		this.server

		this.refreshSubscriptions = false
		this.maxConditions = 30
		this.taskData = { '': { name: 'Main timeline' } }
		this.choicesConditions = []
		this.auxTimelinesChoices = []
		this.pollingTimer = null
		this.messageBuffer = ''

		this.regex = Regex

		this.updateStatus(InstanceStatus.Ok)

		this.refreshSubscriptions = true
		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.initVariables()
		this.init_tcp()
	}

	async configUpdated(config) {
		this.config = config

		this.refreshSubscriptions = true
		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.initVariables()
		this.taskData = { '': { name: 'Main timeline' } }
		this.auxTimelinesChoices = []
		this.init_tcp()
	}

	// Force re-subscription only to required tasks updates
	resetSubscriptions() {
		// Unsubscribe all task update
		for (const [task, properties] of Object.entries(this.taskData)) {
			if (properties.subscriptions > 0) {
				this.manageSubscription(task, false)
			}
			// Reset all the counters
			properties.subscriptions = 0
		}
		// Fire subscribe function for actions that have one in their definition
		this.subscribeActions()
		// Fire subscribe function for feedbacks that have one in their definition
		this.subscribeFeedbacks()
	}

	/** Recursive function to create a structured object that keeps track of task data.
	 * This function also builds the command strings to be used to subscribe tasks update.
	 * We need this command because to subscribe the updates it is mandatory to specify the folder structure (if there is any)
	 * "prefix" parameter is only used during recursion.
	 * Examples of subscription strings (getStatus 1 or 0 + the following):
	 * "TaskList:mItemList:mItems:TimelineTask \"TASK NAME\""\r
	 * "TaskList:mItemList:mItems:TaskFolder \\"FOLDER\\" :mItemList:mItems:TimelineTask \\"TASK NAME\\""\r
	 * "TaskList:mItemList:mItems:TaskFolder \\"MAIN FOLDER\\" :mItemList:mItems:TaskFolder \\"SUB FOLDER\\" :mItemList:mItems:TimelineTask \\"TASK NAME\\""\r
	 */
	buildTaskObj(timelinesItemListObj, prefix = '') {
		if (timelinesItemListObj.hasOwnProperty('Duration')) {
			// Exit condition, we are parsing a timeline
			// The string for subscribing/unsubscribing to the updates
			let subscribeCmd = prefix + ':mItemList:mItems:TimelineTask \\"' + timelinesItemListObj.Name + '\\""\r'
			// The name of the task
			let name = timelinesItemListObj.Name
			// Return a structured object which will contain all useful data about the timeline
			return {
				[name]: {
					// The key is the name of the task or an empty string for the main timeline
					name: name, // We need this to manage main timeline
					subscribeCmd: subscribeCmd, // The string for subscribing/unsubscribing to the updates
					subscriptions: 0, // How many feedbacks are listening to this task updates
					status: undefined, // 0, 1 or 2 for Stop/Halt/Run
					position: undefined, // Playhead position
					updated: undefined, // Last update (milliseconds from Watchout project loading)
				},
			}
		}
		if (timelinesItemListObj.hasOwnProperty('ItemList')) {
			// We are parsing an ItemList (main tree or folder)
			if (timelinesItemListObj.hasOwnProperty('Name')) {
				// If an timelinesItemListObj hasn't a Duration but has both ItemList and Name properties, it's a folder
				prefix += ':mItemList:mItems:TaskFolder \\"' + timelinesItemListObj.Name + '\\" '
			} else {
				// Otherwise we are beginning our recursion
				prefix = '"TaskList'
			}
			let items = {}
			// Iterate on the timelinesItemListObj and go into deeper levels with recursion
			timelinesItemListObj.ItemList.forEach((itemListObj) => {
				let parsed = this.buildTaskObj(itemListObj, prefix)
				Object.assign(items, parsed)
			})
			return items
		}
	}

	/** Manage subscriptions/unsubscriptions to task updates
	 */
	manageSubscription(task, subscribe) {
		// Check we have the data for the required task and if that task isn't the main timeline
		if (this.taskData.hasOwnProperty(task) && task != '') {
			if (subscribe === true) {
				// Some feedback/actions needs the updates about this task
				if (this.taskData[task].subscriptions == 0) {
					// This is the first time we need the subscription, we need to request the updates from watchout
					this.socket.send('getStatus 1 ' + this.taskData[task].subscribeCmd)
				}
				// Another feedback/action is listening to the status update of this task
				this.taskData[task].subscriptions++
			} else {
				// One feedback/action has been removed and we no longer need the updates for it
				this.taskData[task].subscriptions--
				if (this.taskData[task].subscriptions == 0) {
					// No one is still listening to the status updates, let's cancel our subscription to the updates from watchout
					this.socket.send('getStatus 0 ' + this.taskData[task].subscribeCmd)
				}
			}
		}
	}

	poll() {
		if (this.socket !== undefined) {
			if (this.config.pollingInterval > 0) {
				this.refreshTaskList()
			} else {
				this.stopPolling()
			}
		}
	}

	stopPolling() {
		if (this.pollingTimer !== null) {
			clearInterval(this.pollingTimer)
			this.pollingTimer = null
		}
	}

	refreshTaskList() {
		if (this.socket !== undefined) {
			this.socket.send('getAuxTimelines tree\r\n')
		}
	}

	init_tcp() {
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		this.stopPolling()

		if (this.config.host) {
			let port = 3040
			if (this.config.type === 'disp') {
				port = 3039
			}

			this.socket = new TCPHelper(this.config.host, port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				this.log('debug', 'Network error: ' + err)
				this.log('error', 'Network error: ' + err.message)
			})

			this.socket.on('connect', () => {
				this.log('debug', 'Connected')
				if (this.config.type === 'disp') {
					this.socket.send('authenticate 1\r\n')
				}
				if (this.config.feedback == 'simple' || this.config.feedback == 'advanced') {
					// TODO: wait to be authenticated, if necessary
					this.socket.send('getStatus 1\r\n') // Subscribe main timeline updates
					this.refreshTaskList()
					if (this.config.pollingInterval > 0) {
						this.stopPolling()
						this.pollingTimer = setInterval(this.poll.bind(this), Math.ceil(this.config.pollingInterval * 1000))
					}
				}
			})

			this.socket.on('data', (data) => {
				// TODO: check authentication response
				let reply = data.toString()

				if (this.messageBuffer.length === 0) {
					// we are waiting for a message keyword
					let replyPos = reply.search(/(?<=\r\n|^)(Ready|Busy|Reply|Error|Status) /)
					if (replyPos != -1) {
						reply = reply.slice(replyPos) // Everything in front of first keyword is likely a fragment of another message, remove it.
					} else {
						reply = '' // the whole message is a fragment or not valid, drop it
					}
				}

				this.messageBuffer += reply

				if (this.messageBuffer.length > 16000) {
					this.messageBuffer = ''
					this.log('error', 'Incoming messagebuffer overflow, flushing')
				}

				while (this.messageBuffer.length > 0) {
					// try to get messages from the buffer
					let message = this.messageBuffer.match(
						/(?<=\r\n|^)(Ready|Busy|Reply|Error|Status) (.*?)(?=(\r\nReady|\r\nBusy|\r\nReply|\r\nError|\r\nStatus)|$)/s
					)
					if (!Array.isArray(message) || message.length < 3) return
					let type = message[1]
					let content = message[2]
					if (type === 'Reply') {
						let contentObj
						try {
							contentObj = JSON.parse(content)
							// it is valid, so chop it off the messagebuffer
							this.messageBuffer = this.messageBuffer.slice(type.length + content.length + 1)
							this.handleMessage(type, contentObj)
						} catch (e) {
							// not a valid json, just stop parsing and wait for more data
							return
						}
					} else {
						this.messageBuffer = this.messageBuffer.slice(type.length + content.length + 1)
						this.handleMessage(type, content)
					}
				}
			})
		}
	}

	// handle incoming message
	handleMessage(type, data) {
		if (type === 'Reply') {
			// Convert the object given from Watchout into a more useful one
			// The first object of taskData/newTaskData is always the main timeline, we need to copy
			// its values manually because the main timeline isn't included in "getAuxTimelines tree" reply
			let newTaskData = Object.assign({ ['']: this.taskData[''] }, this.buildTaskObj(data))

			// Create a list of task choices to be used in dropdown menus
			// The main timeline is always present
			let newChoices = []

			// New tasks (if a task is moved inside a folder it is considered a new/different one)
			// We copy old status data into newTaskData to make sure that task order is the same as in Watchout task list
			for (const [task, properties] of Object.entries(newTaskData)) {
				if (this.taskData[task] === undefined || this.taskData[task].subscribeCmd != properties.subscribeCmd) {
					// New task
					// Initialize properties of new task
					properties.subscriptions = 0
					properties.status = 'unknown'
					properties.position = 'unknown'
					properties.updated = 'unknown'
					// Set flags to refresh presets, feedbacks, variables and dropdown menus
					this.refreshSubscriptions = true
				} else {
					// Task is already known, copy status data
					properties.subscriptions = this.taskData[task].subscriptions
					properties.status = this.taskData[task].status
					properties.position = this.taskData[task].position
					properties.updated = this.taskData[task].updated
				}
				newChoices.push({ id: task, label: properties.name })
			}
			newChoices.reverse()

			if (JSON.stringify(newChoices) != JSON.stringify(this.auxTimelinesChoices)) {
				// Something changed in the task list (maybe just the order or new/deleted tasks)
				this.auxTimelinesChoices = newChoices
			}
			if (JSON.stringify(newTaskData) != JSON.stringify(this.taskData)) {
				// The received data is different from the stored one
				this.taskData = newTaskData

				this.initActions() // Update actions (refresh all dropdown menus)
				this.initFeedbacks() // Update feedbacks (refresh all dropdown menus)
				// Rebuild the presets from scratch
				let newPresets = PresetDefinitions(this)
				if (this.config.feedback == 'advanced') {
					this.initVariables()
					for (const [task, properties] of Object.entries(this.taskData)) {
						if (task != '' && properties.subscriptions == 0) {
							this.manageSubscription(task, true)
						}
					}
				}
				for (const timeline of this.auxTimelinesChoices) {
					newPresets.push(...buildPresets(timeline))
				}
				this.setPresetDefinitions(newPresets)
			}

			if (this.refreshSubscriptions == true) {
				this.resetSubscriptions()
				this.refreshSubscriptions = false
				if (this.config.feedback === 'advanced') {
					for (const timeline of this.auxTimelinesChoices) {
						if (timeline.id != '') {
							this.manageSubscription(timeline.id, true)
						}
					}
				}
			}
		} else if (type === 'Status') {
			// Maybe it's a task status update message
			//let taskStatusMatches = [...data.matchAll(this.regex.taskStatus)] // We should get only one match but let's keep it safe
			let match = data.match(/"TaskList:mItemList:mItems:TimelineTask \\"([^\"]*)\\"" (0|1|2) (\d+) (\d+)/)
			if (Array.isArray(match)) {
				if (this.taskData.hasOwnProperty(match[1])) {
					this.taskData[match[1]].status = match[2]
					this.taskData[match[1]].position = match[3]
					this.taskData[match[1]].updated = match[4]

					if (this.config.feedback == 'advanced') {
						let status = 'stop'
						if (match[2] == 1) {
							status = 'pause'
						} else if (match[2] == 2) {
							status = 'play'
						}
						let variablename = `status_${match[1].replaceAll(/[^a-zA-Z0-9_-]/g, '_')}`
						this.setVariableValues({ [variablename]: status })
					}
				}
				this.checkFeedbacks()
				//continue;
			}
			// Maybe it's a general status update message
			let generalStatusMatches = [...data.matchAll(this.regex.generalStatus)] // We should get only one match but let's keep it safe
			if (generalStatusMatches.length > 0) {
				// Should be a single line/match
				for (const match of generalStatusMatches) {
					this.taskData[''].status = match[9] == 'true' ? 2 : 1
					this.taskData[''].position = match[8]
					this.taskData[''].updated = match[13]
					// TODO: store other status data in the instance?

					// Update variables
					let clusterHealth = ''
					switch (match[4]) {
						case '0':
							clusterHealth = 'Ok'
							break
						case '1':
							clusterHealth = 'Suboptimal'
							break
						case '2':
							clusterHealth = 'Problems'
							break
						case '3':
							clusterHealth = 'Dead'
							break
						default:
							clusterHealth = 'Unknown value'
					}
					this.setVariableValues({
						showName: match[2],
						busy: match[3],
						clusterHealth: clusterHealth,
						fullscreen: match[5],
						ready: match[6],
						programmerOnline: match[7],
						playheadMain: match[8],
						playingMain: match[9],
						standby: match[11],
					})
				}
				this.checkFeedbacks()
				//continue;
			}
		} else {
			// TODO: handle Ready|Busy|Error messages
			this.log('debug', type + ': ' + data)
			this.log('warning', 'Unhandled message. ' + type + ': ' + data)
		}
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Watchout Computer IP',
				width: 6,
				regex: Regex.IP,
			},
			{
				type: 'dropdown',
				label: 'Type',
				id: 'type',
				default: 'prod',
				choices: [
					{ id: 'prod', label: 'Production Computer' },
					{ id: 'disp', label: 'Display Cluster' },
				],
			},
			{
				type: 'dropdown',
				label: 'Feedback',
				id: 'feedback',
				default: 'none',
				width: 12,
				choices: [
					{ id: 'none', label: 'None' },
					{ id: 'simple', label: 'Simple (feedbacks only)' },
					{ id: 'advanced', label: 'Advanced (feedbacks and variables)' },
				],
			},
			{
				type: 'number',
				id: 'pollingInterval',
				label: 'Auto update timeline list and presets interval in seconds (0 = disabled)',
				width: 12,
				default: 30,
				min: 0,
				required: true,
				stepSize: 0.1,
			},
			{
				type: 'static-text',
				id: 'pollMessage',
				width: 12,
				label: 'If auto update is disabled, use the action "Update timeline list" to refresh manually.',
				value:
					'This interval is just for updating the timeline list used in dropdown menus, presets, variables and feedbacks, not for feedbacks.',
			},
		]
	}

	// When module gets deleted
	destroy() {
		this.stopPolling()

		if (this.socket !== undefined) {
			this.socket.destroy()
			this.socket = undefined
		}

		this.log('debug', 'destroy ' + this.id)
	}

	initActions() {
		this.setActionDefinitions(ActionDefinitions(this))
	}

	initFeedbacks() {
		if (this.config.feedback === 'simple' || this.config.feedback === 'advanced') {
			this.setFeedbackDefinitions(FeedbackDefinitions(this))
		} else {
			// TODO: delete feedbacks if this.config.feedback is toggled from true to false
			//this.setFeedbackDefinitions([]);
		}
	}

	initPresets() {
		if (this.config.feedback === 'simple' || this.config.feedback === 'advanced') {
			this.setPresetDefinitions(PresetDefinitions(this))
			this.refreshTaskList()
		} else {
			// TODO: delete presets if this.config.feedback is toggled from true to false
			this.setPresetDefinitions([]) // This only unsets presets but does not remove them entirely from the instance
		}
	}

	initVariables() {
		if (this.config.feedback === 'none') {
			this.setVariableDefinitions([])
		} else {
			this.setVariableDefinitions(VariableDefinitions(this))
		}
	}
}

runEntrypoint(WatchoutProductionInstance, UpgradeScripts)
