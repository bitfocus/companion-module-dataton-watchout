const choicesConditions = (max) => {
	const choicesConditions = []
	for (let i = 1; i <= max; i++) {
		choicesConditions[i - 1] = {
			type: 'checkbox',
			label: 'Condition ' + i,
			id: i - 1,
			default: false,
		}
	}

	// Extra checkbox to force the use of the conditions previously set in the producer's GUI
	choicesConditions[max] = {
		type: 'checkbox',
		label: 'Force to default GUI conditions',
		id: max,
		default: false,
	}

	return choicesConditions
}

const CHOICES_YESNO_BOOLEAN = [
	{ id: 'true', label: 'Yes' },
	{ id: 'false', label: 'No' },
]

module.exports = { choicesConditions, CHOICES_YESNO_BOOLEAN }
