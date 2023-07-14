module.exports = function () {
	return [layerCondFix, feedbackConfigDefaults]
}

// (version 1.2.3 => 1.2.4) Fix layerCond implementation bug
// If "Force to conditions set in GUI" option/checkbox in "layerCond" action is not present, set a value for it.
// This will not break old instance configurations that may rely on the old buggy implementation.
// Previously if no conditions were checked, the value "0" would be sent causing Watchout to revert to the ones set in the GUI.
// Starting from v1.2.4 we send the value 2^30 to disable all conditions or the value 0 to revert to GUI conditions if "Force to conditions set in GUI" is selected
function layerCondFix(context, { config, actions, feedbacks }) {
	let updatedActions = []
	if (actions.length === 0) return {}
	for (const action of actions) {
		if ((action.actionId = 'layerCond')) {
			if (action.options[30] === undefined) {
				let somethingIsSelected = false
				for (let i = 0; i < 30; i++) {
					if (action.options[i] == true) {
						somethingIsSelected = true
						break
					}
				}
				// If no condition is set, we activate the checkbox "Force to conditions set in GUI" to keep sending 0 as the old, bugged, implementation did
				somethingIsSelected ? (action.options[30] = false) : (action.options[30] = true)
				updatedActions.push(action)
			}
		}
	}
	return { updatedActions }
}

function feedbackConfigDefaults(context, { config, actions, feedbacks }) {
	if (config.feedback == undefined) {
		config.feedback = 'none'
		config.pollingInterval = 30
		return { updatedConfig: config }
	}
	return {}
}
