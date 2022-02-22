var tcp 					= require('../../tcp');
var instance_skel = require('../../instance_skel');
let feedbacks 		= require('./feedbacks');
let presets 			= require('./presets');
let variables			= require('./variables');
var debug;
var log;



function instance(system, id, config) {
	var self = this;
	self.refreshSubscriptions = false;
	self.maxConditions = 30;
	self.taskData = {'': {name: "Main timeline"}};
	self.choicesConditions = [];
	self.auxTimelinesChoices = [];

	// Some regex to parse messages from Watchout
	self.regex = {
		/* Response messages splitter
			this is used to split the received string from Watchout into multiple messages (they can come in a single burst)
		*/
		watchoutReply: /(?<=\r\n|^)(Ready|Busy|Reply|Error|Status) (.*?)(?=(\r\nReady|\r\nBusy|\r\nReply|\r\nError|\r\nStatus)|$)/sg,

		/* Tasks status, capture groups:
			[1] task name (string)
			[2] status (int) => 0: stop, 1: pause, 2: play
			[3] playhead position (int)
			[4] message time (int)
		*/
		taskStatus: /"TaskList:mItemList:mItems:TimelineTask \\"([^\"]*)\\"" (0|1|2) (\d+) (\d+)/g,

		/* General status, capture groups:
			[1] (string)
			[2] show name (string)
			[3] busy (bool)
			[4] cluster health (int) => 0: OK, 1: Suboptimal, 2: Problems, 3: Dead
			[5] fullscreen (bool)
			[6] show active/ready to run (bool)
			[7] programmer is online (bool)
			[8] Playhead position (int)
			[9] playing (bool)
			[10] timeline rate (float)
			[11] standby (bool)
			[12] message time (int)
		*/
		generalStatus: /"([^"]*)" "([^"]*)" (true|false) (0|1|2|3) (true|false) (true|false) (true|false) (\d+) (true|false) ([0-9]*\.?[0-9]+) (true|false) (\d+)/g
	}
	// Store feedback colors in one place to be retrieved later for dynamic preset creation
	self.feedbacksSettings = {
		colors: {
			task: {
				play: {
					fg: this.rgb(0, 0, 0),
					bg: this.rgb(0, 204, 0)
				},
				pause: {
					fg: this.rgb(0, 0, 0),
					bg: this.rgb(255, 255, 0)
				},
				stop: {
					fg: this.rgb(0, 0, 0),
					bg: this.rgb(255, 0, 0)
				}
			}
		},
		// Icons for feedbacks are similar to the ones used in Watchout
		images: {
			play: "iVBORw0KGgoAAAANSUhEUgAAACgAAAARCAYAAACvi+4IAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA7ElEQVRIic3WP05CQRDH8Q8EKxo5AKcwsZbQaGdJD7UVpScwyg3o1cQLaGIojIQCW4+hjZUFFu8Zecqf9x7I7jfZbHZnZveX2UlmK5iJmBp8HByVPqA+Ha13+k7BEL1i59cK6tmMLl4xwVO+kIzAXNlIKZ31y3Tu4Ga9e7XcLVvgGm84XO0WTiDsY4xH9Be77LYGF1FFKx1NybM/Z83xcIZztH+24hIIJ7jHZ7KMT+ADTrGXLMPX4DwD3MnUYHiBM7zgFhd/zWEFvuNY0lmWEK4GO2hYKY5fGdzk05CbvvK9+N8Z4qpYSEXk/8EvpY4lbjcQqfcAAAAASUVORK5CYII=",
			pause: "iVBORw0KGgoAAAANSUhEUgAAACgAAAARCAYAAACvi+4IAAAACXBIWXMAAAsTAAALEwEAmpwYAAABJElEQVRIic3Wv0oDQRAG8F8kVjZpLO30CQQbG8VGO0sbFdQ6WKT0CURtrNNoo4IvoBAsRLHQ1kJbKwXTCIJFLHaPGPyTywXv8sGyw+03ex+zM8yU0DLAKMPb5EzmC0ZuL7qTkhDUsdHb/eUe9fSHddzjBpfpXDoEpopGROao78R9Ccfd6UPZ/pIRJTxG+wivmPrbJV+BMIEVnKCCazRQ+5mebw4mOMQT3gWxs3GNCc9+1abmH8EEDayiipf4rYotzLVpxQlMsI9RoWiaWMAZPsJx8QI38SwUTQXnWMRwOC4mB2Eaa3El2MOpjhwsRuAyDqLdwp1Q1dvfqfkLfMB4tJuYFzrLL8hX4NexJGUn6RDYz9CQGjXZe/G/o47d3lxKBnwe/AQw2jSbUiV2YwAAAABJRU5ErkJggg==",
			stop: "iVBORw0KGgoAAAANSUhEUgAAACgAAAARCAYAAACvi+4IAAAACXBIWXMAAAsTAAALEwEAmpwYAAABGElEQVRIic3WPy+DURTH8U+lJksXo41XILFYiIXNpgsSzI2hY1+BYDF3YUHiDZA0EkIMrAZWE4kuEomhhvs8KVHah7hPf8lNTu79nZtvTs79U0BLH6sIL+NTv95g6Pq0uyktQR1r2fYvZuT5m1Zxiyuc95Yy8I84nbWJMyz0Zo8LWMB9Eu/jGRM/p8Sv4BiWcIgSLtFAtbM9bg+m2sMDXgXY6WSM4AAXbWv8CqZqYBkVPCVzFdQw07blB5hqB8Moo4k5HOMtLOcPuI5H4dCUcIJ5DIblfHoQJrGSjFTbOPKpB/MBXMRuErdwI5zqja/W+IB3GE3iJmaFl+UbxQX8+C0pC1dKF8WvYFWmtzguYB1b2VIK+vw/+A5dITBKiBmzmAAAAABJRU5ErkJggg=="
		}
	}
	for (var i=1; i<= this.maxConditions; i++) {
		self.choicesConditions[i-1] = {
			type: 'checkbox',
			label: 'Condition '+i,
			id: i-1,
			default: false
		}
	}
	// super-constructor
	instance_skel.apply(this, arguments);



	Object.assign(self, {
		...feedbacks,
		...presets,
		...variables
	});

	return self;
}

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.refreshSubscriptions = true;
	self.actions(); // export actions
	self.initFeedbacks();
	self.initPresets();
	self.initVariables();
	self.init_tcp();
};

instance.prototype.updateConfig = function(config) {
	var self = this;
	self.config = config;
	self.refreshSubscriptions = true;
	self.actions();
	self.initFeedbacks();
	self.initPresets();
	self.initVariables();
	self.init_tcp();
};

// Force re-subscription only to required tasks updates
instance.prototype.checkSubscriptions = function() {
	let self = this;
	// Unsubscribe all task update
	for (const [task, properties] of Object.entries(self.taskData)) {
		if(properties.subscriptions > 0) {
			self.manageSubscription(task, false);
		}
		// Reset all the counters
		properties.subscriptions = 0;
	}
	// Fire subscribe function for actions that have one in their definition
	self.subscribeActions();
	// Fire subscribe function for feedbacks that have one in their definition
	self.subscribeFeedbacks();
}

// Recursive function to create a structured object that keeps track of task data.
// This function also builds the command strings to be used to subscribe tasks update.
// We need this command because to subscribe the updates it is mandatory to specify the folder structure (if there is any)
// "prefix" parameter is only used during recursion
// Examples of subscription strings (getStatus 1 or 0 + the following):
// "TaskList:mItemList:mItems:TimelineTask \"TASK NAME\""\r
// "TaskList:mItemList:mItems:TaskFolder \\"FOLDER\\" :mItemList:mItems:TimelineTask \\"TASK NAME\\""\r
// "TaskList:mItemList:mItems:TaskFolder \\"MAIN FOLDER\\" :mItemList:mItems:TaskFolder \\"SUB FOLDER\\" :mItemList:mItems:TimelineTask \\"TASK NAME\\""\r
instance.prototype.buildTaskObj = function(timelinesItemListObj, prefix = "") {
	let self = this;
	if(timelinesItemListObj.hasOwnProperty("Duration")) {		// Exit condition, we are parsing a timeline
		// The string for subscribing/unsubscribing to the updates
		let subscribeCmd = prefix + ':mItemList:mItems:TimelineTask \\"' + timelinesItemListObj.Name + '\\""\r';
		// The name of the task
    let name = timelinesItemListObj.Name;
		// Return a structured object which will contain all useful data about the timeline
    return {
			[name]: {												// The key is the name of the task or an empty string for the main timeline
				name: name,										// We need this to manage main timeline
        subscribeCmd: subscribeCmd,		// The string for subscribing/unsubscribing to the updates
        subscriptions: 0,			// How many feedbacks are listening to this task updates
				status: undefined,						// 0, 1 or 2 for Stop/Halt/Run
				position: undefined,					// Playhead position
				updated: undefined						// Last update (milliseconds from Watchout project loading)
      }
    };
	}
  if(timelinesItemListObj.hasOwnProperty("ItemList")) { 						// We are parsing an ItemList (main tree or folder)
    if(timelinesItemListObj.hasOwnProperty("Name")) {
			// If an timelinesItemListObj hasn't a Duration but has both ItemList and Name properties, it's a folder
    	prefix+= ':mItemList:mItems:TaskFolder \\"' + timelinesItemListObj.Name + '\\" ';
    } else {
			// Otherwise we are beginning our recursion
    	prefix = '"TaskList';
    }
		let items = {};
		// Iterate on the timelinesItemListObj and go into deeper levels with recursion
    timelinesItemListObj.ItemList.forEach(itemListObj => {
      let parsed = self.buildTaskObj(itemListObj, prefix);
      Object.assign(items, parsed);
    });
    return items;
	}
}

// Manage subscriptions/unsubscriptions to task updates
instance.prototype.manageSubscription = function(task, subscribe) {
	var self = this;
	// Check we have the data for the required task and if that task isn't the main timeline
	if(self.taskData.hasOwnProperty(task) && task != '') {
		if(subscribe === true) { // Some feedback/actions needs the updates about this task
			if(self.taskData[task].subscriptions == 0) {
				// This is the first time we need the subscription, we need to request the updates from watchout
				self.socket.send('getStatus 1 ' + self.taskData[task].subscribeCmd);
			}
			// Another feedback/action is listening to the status update of this task
			self.taskData[task].subscriptions++;
		} else {
			// One feedback/action has been removed and we no longer need the updates for it
			self.taskData[task].subscriptions--;
			if(self.taskData[task].subscriptions == 0) {
				// No one is still listening to the status updates, let's cancel our subscription to the updates from watchout
				self.socket.send('getStatus 0 ' + self.taskData[task].subscribeCmd);
			}
		}
	}
}

instance.prototype.init_tcp = function() {
	var self = this;
	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	if (self.config.host) {
		var port = 3040;
		if (self.config.type === 'disp') {
			port = 3039;
		}

		self.socket = new tcp(self.config.host, port);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug("Network error", err);
			self.log('error',"Network error: " + err.message);
		});

		self.socket.on('connect', function () {
			debug("Connected");
			if (self.config.type === 'disp') {
				self.socket.send('authenticate 1\r\n');
			}
			if (self.config.feedback === true) {
				// TODO: wait to be authenticated, if necessary
				self.socket.send('getStatus 1\r\n'); // Subscribe main timeline updates
				self.socket.send('getAuxTimelines tree\r\n'); // Get a list of timelines and folders
			}
		});

		self.socket.on('data', function (data) {
			// TODO: check authentication response
			var reply = data.toString();

			// Multiple messages can come combined in just one burst, split them
			var messages = reply.matchAll(self.regex.watchoutReply);

			for (const message of messages) {
				var type = message[1];
				var content = message[2];
				if(type == "Reply") {
					// TODO: add some checks on the reply we are getting
					try { // Try to parse a reply to: GetAuxTimelines tree
						// Reply content is in JSON format
						var content_obj = JSON.parse(content);
						// Convert the object given from Watchout into a more useful one
						// The first object of taskData/newTaskData is always the main timeline, we need to copy
						// its values manually because the main timeline isn't included in "getAuxTimelines tree" reply
						var newTaskData = Object.assign({['']: self.taskData['']}, self.buildTaskObj(content_obj));

						// Remove deleted tasks
						for (const [key, value] of Object.entries(self.taskData)) {
						  if(newTaskData[key] === undefined) {
						  	delete(self.taskData[key]);
						  }
						}

						// Create a list of task choices to be used in dropdown menus
						// The main timeline is always present
						let newChoices = [];

						// New tasks (if a task is moved inside a folder it is considered a new/different one)
						// We copy old status data into newTaskData to make sure that task order is the same as in Watchout task list
						for (const [task, properties] of Object.entries(newTaskData)) {
						  if(self.taskData[task] === undefined || self.taskData[task].subscribeCmd != properties.subscribeCmd) {	// New task
						  	tasksChanged = true;
						  } else {	// Task is already known, copy status data
						  	properties.subscriptions = self.taskData[task].subscriptions;
						    properties.status = self.taskData[task].status;
						    properties.position = self.taskData[task].position;
						    properties.updated = self.taskData[task].updated;
						  }
							newChoices.push({id: task, label: properties.name});
						}

						self.auxTimelinesChoices = newChoices.reverse();
						self.taskData = newTaskData;

						self.actions(); // Update actions (refresh all dropdown menus)
						self.initFeedbacks(); // Update feedbacks (refresh all dropdown menus)
						// Rebuild the presets from scratch
						let newPresets = self.getPresets();
						for (const timeline of self.auxTimelinesChoices) {
							newPresets.push(...self.buildPresets(timeline));
						}
						self.setPresetDefinitions(newPresets);

						if(self.refreshSubscriptions == true) {
							self.checkSubscriptions();
							self.refreshSubscriptions = false;
						}
					} catch(e) {
						if(e == "SyntaxError: Unexpected end of JSON input") {
							// TODO: send the same command again?
						}
					}
				} else if(type == "Status") {
					// Maybe it's a task status update message
					var taskStatusMatches = [...content.matchAll(self.regex.taskStatus)]; // We should get only one match but let's keep it safe
					if(taskStatusMatches.length > 0) {
						// Should be a single line/match
						for(const match of taskStatusMatches) {
							self.taskData[match[1]].status = match[2];
							self.taskData[match[1]].position = match[3];
							self.taskData[match[1]].updated = match[4];
						}
						self.checkFeedbacks();
						//continue;
					}
					// Maybe it's a general status update message
					var generalStatusMatches = [...content.matchAll(self.regex.generalStatus)]; // We should get only one match but let's keep it safe
					if(generalStatusMatches.length > 0) {
						// Should be a single line/match
						for(const match of generalStatusMatches) {
							self.taskData[""].status = (match[9] == "true") ? 2 : 1;
							self.taskData[""].position = match[8];
							self.taskData[""].updated = match[13];
								// TODO: store other status data in the istance?


							// Update variables
							let clusterHealth = '';
							switch (match[4]) {
								case '0':
									clusterHealth = 'Ok';
									break;
								case '1':
									clusterHealth = 'Suboptimal';
									break;
								case '2':
									clusterHealth = 'Problems';
									break;
								case '3':
									clusterHealth = 'Dead';
									break;
								default:
									clusterHealth = 'Unknown value'
							}
							self.setVariable('showName', match[2]);
							self.setVariable('busy', match[3]);
							self.setVariable('clusterHealth', clusterHealth);
							self.setVariable('fullscreen', match[5]);
							self.setVariable('ready', match[6]);
							self.setVariable('programmerOnline', match[7]);
							self.setVariable('playheadMain', match[8]);
							self.setVariable('playingMain', match[9]);
							self.setVariable('standby', match[11]);
						}
						self.checkFeedbacks();
						//continue;
					}
				} else {
					// TODO: handle Ready|Busy|Error messages
					debug(type + ": " + content);
					self.log('warning', "Unhandled message. " + type + ": " + content);
				}
			}
		});
	}
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Watchout Computer IP',
			width: 6,
			regex: self.REGEX_IP
		},{
			type: 'dropdown',
			label: 'Type',
			id: 'type',
			default: 'prod',
			choices: [
				{ id: 'prod', label: 'Production Computer' },
				{ id: 'disp', label: 'Display Cluster' }
			]
		},{
		  type: 'checkbox',
		  label: 'Use feedback',
		  id: 'feedback',
		  default: false
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		self.socket = undefined;
	}

	debug("destroy", self.id);
};

instance.prototype.actions = function(system) {
	var self = this;
	let timelineOption = {
		type: 'textinput',
		label: 'timeline (optional)',
		id: 'timeline',
		default: ''
	}
	if(self.config.feedback === true) {
		timelineOption = {
			type: 'dropdown',
			label: 'Timeline',
			id: 'timeline',
			default: '',
			choices: self.auxTimelinesChoices
		}
	}
	let actions = {
		'run': {
			label: 'Run',
			options: [timelineOption]},
		'halt': {
			 label: 'Pause',
			 options: [timelineOption]},
		'kill': {
			label: 'Kill',
			options: [timelineOption]},
		'reset': {
			label: 'Reset'
			},
		'gototime': {
			label: 'Jump to time',
			options: [{
				type: 'textinput',
				label: 'time position',
				id: 'time',
				default: '"00:00:00.000"',
				regex: '/^(\\d{1,12}|"\\d{1,2}:\\d{1,2}:\\d{1,2}\\.\\d{1,3}")$/'
				},
				timelineOption
			]},
		'gotocue': {
			label: 'Jump to cue',
			options: [{
				type: 'textinput',
				label: 'Cue name',
				id: 'cuename',
				default: ''
			},
			timelineOption
		]},
		'online': { label: 'Go online',
			options: [{
				type: 'dropdown',
				label: 'go online',
				id: 'online',
				default: 'true',
				choices: self.CHOICES_YESNO_BOOLEAN
			}]},
		'standby': { label: 'Enter Standby',
			options: [{
				type: 'dropdown',
				label: 'Enter Standby',
				id: 'standby',
				default: 'true',
				choices: self.CHOICES_YESNO_BOOLEAN
			},{
				type: 'number',
				label: 'Fade time in ms',
				id: 'fadetime',
				min: 0,
				max: 60000,
				default: 1000,
				required: true
			}]},
		'setinput': {
			label: 'Set Input',
				options: [{
				type: 'textinput',
				label: 'Input Name',
				id: 'inputname',
				default: ''
			},{
				type: 'textinput',
				label: 'Value',
				id: 'inputvalue',
				default: '1.0',
				regex: self.REGEX_SIGNED_FLOAT
			},{
				type: 'textinput',
				label: 'Fadetime (ms)',
				id: 'inputfade',
				default: '0',
				regex: self.REGEX_NUMBER
				}]},
		'load': {
			label: 'Load Show',
			options: [{
				type: 'textinput',
				label: 'Showfile or Showname',
				id: 'show',
				default: '',
				regex: '/[a-zA-Z0-9\\\/:\.-_ ]+/'
			}]},
		'layerCond': {
			label: 'Set Layer Conditions',
			options: this.choicesConditions
		}
	};

	// Add feedback-related actions only if needed
	if(self.config.feedback === true) {
		actions = Object.assign(actions, {
			'getAuxTimelines': {
				label: 'Get Aux Timelines Names'
			},
			'toggleRun': {
				label: 'Toggle run',
				options: [timelineOption],
				subscribe: function(action) {
					self.manageSubscription(action.options.timeline, true);
		    },
		    unsubscribe: function(action) {
					self.manageSubscription(action.options.timeline, false);
		    }
			}
		});
	}

	self.setActions(actions);
};

instance.prototype.action = function(action) {
	var self = this;
	debug('run watchout action:', action);
	var cmd;

	switch (action.action) {
		case 'run':
			if (action.options.timeline != '')
				cmd = 'run "' + action.options.timeline + '"\r\n';
			else
				cmd = 'run\r\n';
			break;

		case 'halt':
			if (action.options.timeline != '')
				cmd = 'halt "' + action.options.timeline + '"\r\n';
			else
				cmd = 'halt\r\n';
			break;

		case 'kill':
			if (action.options.timeline != '')
				cmd = 'kill "' + action.options.timeline + '"\r\n';
			else {
				debug('Error: Kill command for Watchout production triggered without timeline name');
				self.log('error', 'Error: Kill command for Watchout production triggered without timeline name');
			}
			break;

		case 'reset':
				cmd = 'reset\r\n';
			break;

		case 'gototime':
			if (action.options.time != '') {
				cmd = 'gotoTime ' + action.options.time;
				if (action.options.timeline != '') cmd += ' "'+ action.options.timeline + '"';
				cmd += '\r\n';
			} else {
				debug('Error: Gototime command for Watchout production triggered without entering time');
				self.log('error', 'Error: Gototime command for Watchout production triggered without entering time');
			}
			break;

		case 'gotocue':
			if (action.options.cuename != '') {
				cmd = 'gotoControlCue "' + action.options.cuename +'" false';
				if (action.options.timeline != '') cmd += ' "'+ action.options.timeline +'"';
				cmd += '\r\n';
			} else {
				debug('Error: GotoControlCue command for Watchout production triggered without entering cue');
				self.log('error', 'Error: GotoControlCue command for Watchout production triggered without entering cue');
			}
			break;

		case 'online':
			if (action.options.online != 'false' && action.options.online != 'FALSE' && action.options.online != '0' )
				cmd = 'online true\r\n';
			else
				cmd = 'online false\r\n';
			break;

		case 'standby':
			if (action.options.fadetime === undefined || action.options.fadetime <0 || action.options.fadetime > 60000) {
				action.options.fadetime = 1000;
			}
			if (action.options.standby != 'false' && action.options.standby != 'FALSE' && action.options.standby != '0' )
				cmd = 'standBy true '+ action.options.fadetime.toString() +'\r\n';
			else
				cmd = 'standBy false '+ action.options.fadetime.toString() +'\r\n';
			break;

		case 'setinput':
			if (action.options.inputname != '' && action.options.inputvalue != '') {
				cmd = 'setInput "' + action.options.inputname +'" ';
				if (action.options.inputvalue.startsWith("+")) {
					cmd+= "+";
				}
				cmd+= parseFloat(action.options.inputvalue);
				if (action.options.inputfade != '') cmd += ' '+ parseInt(action.options.inputfade);
				cmd += '\r\n';
			} else {
				debug('Error: setInput command for Watchout production triggered without entering input name or input value');
				self.log('error', 'Error: setInput command for Watchout production triggered without entering input name or input value');
			}
			break;

		case 'load':
			if (action.options.show != '') {
				cmd = 'load "' + action.options.show +'"\r\n';
			}
			break;

		case 'layerCond':
			var cond = 0;
			for (var i=0; i< this.maxConditions; i++) {
				if (action.options[i] === true) {
					cond += 2**i;
				}
			}
			cmd = 'enableLayerCond ' + cond +'\r\n';
			break;

		case 'getAuxTimelines':
			cmd = 'getAuxTimelines tree\r\n';
			break;

		case 'toggleRun':
			if(self.taskData[action.options.timeline].status == 2) {
				cmd = 'halt "' + action.options.timeline + '"\r\n';
			} else {
				cmd = 'run "' + action.options.timeline + '"\r\n';
			}
			break;
	}

	if (cmd !== undefined) {

		if (self.socket === undefined) {
			self.init_tcp();
		}

		debug('sending tcp',cmd,"to",self.config.host);

		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(cmd);
		} else {
			debug('Socket not connected :(');
		}

	}
};

instance.prototype.initFeedbacks = function() {
	var self = this;
	if(self.config.feedback === true) {
		self.setFeedbackDefinitions(self.getFeedbacks());
	} else {
		// TODO: delete feedbacks if self.config.feedback is toggled from true to false
		//self.setFeedbackDefinitions([]);
	}
}

instance.prototype.initPresets = function() {
	var self = this;
	if(self.config.feedback === true) {
		self.setPresetDefinitions(self.getPresets());
	} else {
		// TODO: delete presets if self.config.feedback is toggled from true to false
		//self.setPresetDefinitions([]);
	}
}

instance.prototype.initVariables = function() {
	var self = this;
	if(self.config.feedback === true) {
		self.setVariableDefinitions(self.getVariables());
	} else {
		// TODO: delete varaibles if self.config.feedback is toggled from true to false
		//self.setVariableDefinitions([]);
	}
}

// Utility function to dynamically build presets based on a timeline object passed to it
// We expect to receive a timeline object containing timeline.id and timeline.label
instance.prototype.buildPresets = function(timeline) {
	var self = this;
	let presets = [];
	presets.push({
		category: 'Run',
		label: timeline.label,
		bank: {
			style: 'text',
			text: "Run\\n" + timeline.label,
			color: self.rgb(255,255,255),
			bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'run',
			options: {
				timeline: timeline.id
			}
		}]
	});

	presets.push({
		category: 'Halt',
		label: timeline.label,
		bank: {
			style: 'text',
			text: "Halt\\n" + timeline.label,
			color: self.rgb(255,255,255),
			bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'halt',
			options: {
				timeline: timeline.id
			}
		}]
	});

	if(timeline.id != "") {	// You can't kill the main timeline
		presets.push({
			category: 'Kill',
			label: timeline.label,
			bank: {
				style: 'text',
				text: "Kill\\n" + timeline.label,
				color: self.rgb(255,255,255),
				bgcolor: self.rgb(0,0,0)
			},
			actions: [{
				action: 'kill',
				options: {
					timeline: timeline.id
				}
			}]
		});
	}

	presets.push({
		category: 'Feedbacks with icons',
		label: timeline.label + "\\n",
		bank: {
			style: 'text',
			text: timeline.label + "\\n",
			color: self.rgb(255,255,255),
			bgcolor: self.rgb(0,0,0)
		},
		feedbacks: [
			{
				type: 'task_playing',
				options: {
					icons: true,
					timeline: timeline.id
				}
			},{
				type: 'task_paused',
				options: {
					icons: true,
					timeline: timeline.id
				}
			},{
				type: 'task_stopped',
				options: {
					icons: true,
					timeline: timeline.id
				}
			}
		]
	});

	presets.push({
		category: 'Feedbacks with colors',
		label: timeline.label,
		bank: {
			style: 'text',
			text: timeline.label,
			color: self.rgb(255,255,255),
			bgcolor: self.rgb(0,0,0)
		},
		feedbacks: [
			{
				type: 'task_playing',
				options: {
					icons: false,
					timeline: timeline.id
				}
			},{
				type: 'task_paused',
				options: {
					icons: false,
					timeline: timeline.id
				}
			},{
				type: 'task_stopped',
				options: {
					icons: false,
					timeline: timeline.id
				}
			}
		]
	});

	presets.push({
		category: 'Toggle run',
		label: timeline.label,
		bank: {
			style: 'text',
			text: timeline.label + "\\n",
			color: self.rgb(255,255,255),
			bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'toggleRun',
			options: {
				timeline: timeline.id
			}
		}],
		feedbacks: [
			{
				type: 'task_playing',
				options: {
					icons: true,
					timeline: timeline.id
				}
			},{
				type: 'task_paused',
				options: {
					icons: true,
					timeline: timeline.id
				}
			},{
				type: 'task_stopped',
				options: {
					icons: true,
					timeline: timeline.id
				}
			}
		]
	});

	return presets;
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
