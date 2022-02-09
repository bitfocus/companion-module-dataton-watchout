var tcp 					= require('../../tcp');
var instance_skel = require('../../instance_skel');
let feedbacks 		= require('./feedbacks');
let presets 			= require('./presets');
const _ 					= require('lodash');
var debug;
var log;



function instance(system, id, config) {
	var self = this;
	self.maxConditions = 30;
	self.choicesConditions = [];
	self.auxTimelinesChoices = [];// [{ id: '', label: 'Main' }];
	self.auxTimelinesTree = {};
	self.auxTimelinesSubscriptionStrings = [];
	self.auxTimelinesStatus = {};

	self.regex = {
		watchoutReply: /(?<=\r\n|^)(Ready|Busy|Reply|Error|Status) (.*?)(?=(\r\nReady|\r\nBusy|\r\nReply|\r\nError|\r\nStatus)|$)/sg,
		/*
		Reply { "ItemList" : [ { "Name" : "MAIN FOLDER", "ItemList" : [ { "Name" : "SUB FOLDER",
		"ItemList" : [ { "Name" : "TL1b", "Duration" : 600000 }, { "Name" : "TL1a",
		"Duration" : 600000 }, { "Name" : "TASK 5", "Duration" : 600000
		}
		]
		}
		, { "Name" : "TL2", "Duration" : 600000 }
		]
		}
		, { "Name" : "TL4", "Duration" : 600000 }, { "Name" : "TL3", "Duration" : 600000
		}
		]
		}
		Status "" "companion-watchout" false 0 true true false 0 false 0 false 263963

		*/

		/*
						Reply { "ItemList" : [ { "Name" : "MAIN FOLDER", "ItemList" : [ { "Name" : "SUB FOLDER",
						"ItemList" : [ { "Name" : "TL1b", "Duration" : 600000 }, { "Name" : "TL1a",
						"Duration" : 600000 }, { "Name" : "TASK 5", "Duration" : 600000
						}
						]
						}
						, { "Name" : "TL2", "Duration" : 600000 }
						]
						}
						, { "Name" : "TL4", "Duration" : 600000 }, { "Name" : "TL3", "Duration" : 600000
						}
						]
						}
						Status "" "companion-watchout" false 0 true true false 600000 false 0 false 26377945
						Status "" "companion-watchout" false 0 true true false 600000 false 0 false 26377945
		*/

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
					[11] DISCARD (partial match for the float value)
			[12] standby (bool)
			[13] message time (int)
		*/
		generalStatus: /"([^"]*)" "([^"]*)" (true|false) (0|1|2|3) (true|false) (true|false) (true|false) (\d+) (true|false) ([0-9]*[.])?[0-9]+ (true|false) (\d+)/g
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

	self.actions(); // export actions

	//TODO: fix this mess
	Object.assign(self, {
		...feedbacks,
		...presets
	});

	return self;
}

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;
	self.initFeedbacks();
	self.initPresets();
	self.init_tcp();
};

instance.prototype.updateConfig = function(config) {
	var self = this;
	self.config = config;
	self.initFeedbacks();
	self.initPresets();
	self.init_tcp();
};

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
			//debug("MESSAGES:\n"+messages);
			for (const message of messages) {

				var type = message[1];
				var content = message[2];
				//debug("MESSAGE #"+message.index+" CONTENT:\n"+type+"\n"+JSON.stringify(content));
				//debug("MESSAGE #"+message.index+" CONTENT:\n"+type+"\n"+content);

				if(type == "Reply") {
					try { // Reply to: GetAuxTimelines tree
						var content_JSON = JSON.parse(content); // Reply content
						// Get task list from task tree
						self.auxTimelinesChoices = parseAuxTimelines(content_JSON);
						self.auxTimelinesChoices.push({ id: '', label: 'Main' });
						// Build subscription strings and check if there are new tasks to subscribe
						var auxTimelinesSubscriptionStringsDiff = _.difference(buildSubscriptionStrings(content_JSON), self.auxTimelinesSubscriptionStrings);
						if(auxTimelinesSubscriptionStringsDiff.length !== 0) { // We have new tasks!
							//Subscribe to new tasks
							auxTimelinesSubscriptionStringsDiff.forEach(subscriptionString => {
								self.socket.send(subscriptionString);
							});
							// Remember which tasks we subscribed to
							self.auxTimelinesSubscriptionStrings.push(...auxTimelinesSubscriptionStringsDiff);
							self.actions(); // Update actions (refresh all dropdown menus)
							self.initFeedbacks(); // Update feedbacks (refresh all dropdown menus)
							let newPresets = self.getPresets();
							for (const timeline of self.auxTimelinesChoices) {
								newPresets.push({
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

								newPresets.push({
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
									newPresets.push({
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

								newPresets.push({
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
												auxTimeline: timeline.id
											}
										},{
											type: 'task_paused',
											options: {
												icons: true,
												auxTimeline: timeline.id
											}
										},{
											type: 'task_stopped',
											options: {
												icons: true,
												auxTimeline: timeline.id
											}
										}
									]
								});

								newPresets.push({
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
												auxTimeline: timeline.id
											}
										},{
											type: 'task_paused',
											options: {
												icons: false,
												auxTimeline: timeline.id
											}
										},{
											type: 'task_stopped',
											options: {
												icons: false,
												auxTimeline: timeline.id
											}
										}
									]
								});
							}
							debug(newPresets);
							self.setPresetDefinitions(newPresets);
						}
					} catch(e) {
						debug("ERROR: " + e);
						self.log('error', "ERROR: " + e);
						if(e == "SyntaxError: Unexpected end of JSON input") {
							// TODO: send the same command again?
						}
					}
				} else if(type == "Status") {
					// Maybe it's a task status update message
					var taskStatusMatches = [...content.matchAll(self.regex.taskStatus)]; // A single response could contain more than one aux timeline data, one per line
					if(taskStatusMatches.length > 0) {
						// Foreach match/task, update data stored in the instance
						for(const match of taskStatusMatches) {
							self.auxTimelinesStatus[match[1]] = {
								status: match[2],
								position: match[3],
								updated: match[4]
							}
						}
						self.checkFeedbacks();
						//continue;
					}
					// Maybe it's a general status update message
					var generalStatusMatches = [...content.matchAll(self.regex.generalStatus)]; // A single response could contain more than one aux timeline data, one per line
					if(generalStatusMatches.length > 0) {
						// Should be a single line, but maybe it's part of a multi-line response, let's
						for(const match of generalStatusMatches) {
							self.auxTimelinesStatus[""] = {
								status: (match[9] == "true") ? 2 : 1,
								position: match[8],
								updated: match[13]
							}
							// TODO: store other status data
						}
						self.checkFeedbacks();
						//continue;
					}
				} else {
					// TODO: handle Ready|Busy|Error messages
					debug(type + ": " + content);
					self.log('warning', type + ": " + content);
				}
			}
		});
	}
}

function parseAuxTimelines(timelinesItemListObj) {
	if(timelinesItemListObj.hasOwnProperty('Duration')) { 						// Exit condition, we are parsing a timeline
		return {
			id: timelinesItemListObj.Name,
			label: timelinesItemListObj.Name
		};
	}
  if(timelinesItemListObj.hasOwnProperty('ItemList')) { 						// We are parsing an ItemList (main tree or folder)
  	var items = [];
		_.eachRight(timelinesItemListObj.ItemList, itemListObj => {
      items.push(parseAuxTimelines(itemListObj));
    });
    return items.flat();
	}
}

function buildSubscriptionStrings(timelinesItemListObj, parentName = "") {
	if(timelinesItemListObj.hasOwnProperty("Duration")) { 						// Exit condition, we are parsing a timeline
		return parentName + ':mItemList:mItems:TimelineTask \\"' + timelinesItemListObj.Name + '\\""\r';
	}
  if(timelinesItemListObj.hasOwnProperty("ItemList")) { 						// We are parsing an ItemList (main tree or folder)
  	var items = [];
    if(timelinesItemListObj.hasOwnProperty("Name")) {
    	parentName+= ':mItemList:mItems:TaskFolder \\"' + timelinesItemListObj.Name + '\\" ';
    } else {
    	parentName = 'getStatus 1 "TaskList' + parentName;
    }
    timelinesItemListObj.ItemList.forEach(itemListObj => {
      items.push(buildSubscriptionStrings(itemListObj, parentName));
    });
    return items.flat();
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
	self.setActions({
		'run': {
			label: 'Run',
			options: [{
				type: 'textinput',
				label: 'timeline (optional)',
				id: 'timeline',
				default: ''
			}]},
		'halt': {
			 label: 'Pause',
			 options: [{
				 type: 'textinput',
				 label: 'timeline (optional)',
				 id: 'timeline',
				 default: ''
			}]},
		'kill': {
			label: 'Kill',
			options: [{
				type: 'textinput',
				label: 'Aux timeline',
				id: 'timeline',
				default: ''
			}]},
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
			},{
				type: 'textinput',
				label: 'timeline (optional)',
				id: 'timeline',
				default: ''
			}]},
		'gotocue': {
			label: 'Jump to cue',
			options: [{
				type: 'textinput',
				label: 'Cue name',
				id: 'cuename',
				default: ''
			},{
				type: 'textinput',
				label: 'timeline (optional)',
				id: 'timeline',
				default: ''
			}]},
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
		},
		'getAuxTimelines': {
			label: 'Get Aux Timelines Names'
		}

	});
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
	self.setFeedbackDefinitions(self.getFeedbacks());
}

instance.prototype.initPresets = function() {
	var self = this;
	self.setPresetDefinitions(self.getPresets());
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
