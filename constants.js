const { combineRgb } = require('@companion-module/base')

// Some regex to parse messages from Watchout
const regex = {
	/* Response messages splitter
		this is used to split the received string from Watchout into multiple messages (they can come in a single burst)
	*/
	watchoutReply:
		/(?<=\r\n|^)(Ready|Busy|Reply|Error|Status) (.*?)(?=(\r\nReady|\r\nBusy|\r\nReply|\r\nError|\r\nStatus)|$)/gs,

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
	generalStatus:
		/"([^"]*)" "([^"]*)" (true|false) (0|1|2|3) (true|false) (true|false) (true|false) (\d+) (true|false) ([0-9]*\.?[0-9]+) (true|false) (\d+)/g,
}
// Store feedback colors in one place to be retrieved later for dynamic preset creation
const feedbacksSettings = {
	colors: {
		task: {
			play: {
				fg: 0x000000,
				bg: combineRgb(0, 204, 0),
			},
			pause: {
				fg: 0x000000,
				bg: 0xffff00,
			},
			stop: {
				fg: 0x000000,
				bg: 0xff0000,
			},
		},
	},
	// Icons for feedbacks are similar to the ones used in Watchout
	images: {
		// Same icons of Watchout
		//play: "iVBORw0KGgoAAAANSUhEUgAAACgAAAARCAYAAACvi+4IAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA7ElEQVRIic3WP05CQRDH8Q8EKxo5AKcwsZbQaGdJD7UVpScwyg3o1cQLaGIojIQCW4+hjZUFFu8Zecqf9x7I7jfZbHZnZveX2UlmK5iJmBp8HByVPqA+Ha13+k7BEL1i59cK6tmMLl4xwVO+kIzAXNlIKZ31y3Tu4Ga9e7XcLVvgGm84XO0WTiDsY4xH9Be77LYGF1FFKx1NybM/Z83xcIZztH+24hIIJ7jHZ7KMT+ADTrGXLMPX4DwD3MnUYHiBM7zgFhd/zWEFvuNY0lmWEK4GO2hYKY5fGdzk05CbvvK9+N8Z4qpYSEXk/8EvpY4lbjcQqfcAAAAASUVORK5CYII=",
		//pause: "iVBORw0KGgoAAAANSUhEUgAAACgAAAARCAYAAACvi+4IAAAACXBIWXMAAAsTAAALEwEAmpwYAAABJElEQVRIic3Wv0oDQRAG8F8kVjZpLO30CQQbG8VGO0sbFdQ6WKT0CURtrNNoo4IvoBAsRLHQ1kJbKwXTCIJFLHaPGPyTywXv8sGyw+03ex+zM8yU0DLAKMPb5EzmC0ZuL7qTkhDUsdHb/eUe9fSHddzjBpfpXDoEpopGROao78R9Ccfd6UPZ/pIRJTxG+wivmPrbJV+BMIEVnKCCazRQ+5mebw4mOMQT3gWxs3GNCc9+1abmH8EEDayiipf4rYotzLVpxQlMsI9RoWiaWMAZPsJx8QI38SwUTQXnWMRwOC4mB2Eaa3El2MOpjhwsRuAyDqLdwp1Q1dvfqfkLfMB4tJuYFzrLL8hX4NexJGUn6RDYz9CQGjXZe/G/o47d3lxKBnwe/AQw2jSbUiV2YwAAAABJRU5ErkJggg==",
		//stop: "iVBORw0KGgoAAAANSUhEUgAAACgAAAARCAYAAACvi+4IAAAACXBIWXMAAAsTAAALEwEAmpwYAAABGElEQVRIic3WPy+DURTH8U+lJksXo41XILFYiIXNpgsSzI2hY1+BYDF3YUHiDZA0EkIMrAZWE4kuEomhhvs8KVHah7hPf8lNTu79nZtvTs79U0BLH6sIL+NTv95g6Pq0uyktQR1r2fYvZuT5m1Zxiyuc95Yy8I84nbWJMyz0Zo8LWMB9Eu/jGRM/p8Sv4BiWcIgSLtFAtbM9bg+m2sMDXgXY6WSM4AAXbWv8CqZqYBkVPCVzFdQw07blB5hqB8Moo4k5HOMtLOcPuI5H4dCUcIJ5DIblfHoQJrGSjFTbOPKpB/MBXMRuErdwI5zqja/W+IB3GE3iJmaFl+UbxQX8+C0pC1dKF8WvYFWmtzguYB1b2VIK+vw/+A5dITBKiBmzmAAAAABJRU5ErkJggg=="
		// Regular, single icons
		play: 'iVBORw0KGgoAAAANSUhEUgAAABEAAAASCAYAAAC9+TVUAAAA70lEQVQ4ja3Sr0pEQRSA8d+KoE0xWwxrMZnV5gtYBNknMIlBUEEQg6gYtFiMmgym3WbyT1MEZQWDwVdYEJPsMjAXLsvuOvfqB6ecw/nmzMyp2LWMFcxgHQ0FGcJsjCrquMZ0EU2Q/MTIWMIL9jCWKqnEyDOCHTyjVlaSMYVL3GJukCSFBdzhDJNlJeK0q3jFBkZTr9OLcRzhEYuYGC7Q3E3Yq2Nc/EXyji08lZG0cIhTfIVEEUkb59jHZ76QKnnAJu57FX/74o+4sfP9BPlJ2l35bxzgJL7BQIIki4wrbMcpkgjNTbzFE9dwk9r8f6ADuKMokqIGAikAAAAASUVORK5CYII=',
		pause:
			'iVBORw0KGgoAAAANSUhEUgAAABEAAAASCAYAAAC9+TVUAAAAgElEQVQ4je3TMQrCQBSE4Q8R1EqwtLD1fLlVjmKXUuzEwk7BSq1GVjYgqdOZgYF9u8Pwv2KNpkSbOCSOiS5xSzTJ9613U++7miv5tjDMK8i+evUDth1AlnlTXfTEohxmY2wzlUwlf1jSf8AT3ljjhR2ug2yZ77hgiQfOY0CMJHwAeEQxBHfIt9gAAAAASUVORK5CYII=',
		stop: 'iVBORw0KGgoAAAANSUhEUgAAABEAAAASCAYAAAC9+TVUAAAAr0lEQVQ4jd2UTQrCQAyFvwwFoQs9mguP5w0EwavpougqEu3IMD+ZoUsflEeTTPPmJVQUzsAJeALCFxa3F6VEGpuBqxXfgf16iJx7UHgEYKm1i1CH19wSYrE0eAASeh17OWs2kd19i6JJk7qasZ5fPyV5py1KPp6M3L/G8Rn2xFNYTCfHyA4Ve5LD8yTm/kuJ2kcO3ohb8YRnG/FF4KjwslhrySojtt/ITuDmiB0E8AaNyz9eqBbaeQAAAABJRU5ErkJggg==',
	},
}

module.exports = { regex, feedbacksSettings }
