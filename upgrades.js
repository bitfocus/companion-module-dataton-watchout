module.exports = function () {
	return [layerCondFix, feedbackConfigDefaults]
}

// The Node 18 release did not execute this upgrade factory. Preserve its runtime
// behavior when the current SDK applies this step to saved actions.
function layerCondFix(context, { config, actions, feedbacks }) {
	let updatedActions = []
	if (actions.length === 0) return { updatedActions: [], updatedFeedbacks: [] }
	for (const action of actions) {
		if (action.actionId === 'layerCond') {
			if (action.options[30] === undefined) {
				action.options[30] = false
				updatedActions.push(action)
			}
		}
	}
	return { updatedActions, updatedFeedbacks: [] }
}

function feedbackConfigDefaults(context, { config, actions, feedbacks }) {
	if (config && config.feedback == undefined) {
		config.feedback = 'none'
		config.pollingInterval = 30
		return { updatedConfig: config, updatedActions: [], updatedFeedbacks: [] }
	}
	return { updatedActions: [], updatedFeedbacks: [] }
}
