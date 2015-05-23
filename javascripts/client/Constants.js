define({
	TARGET_FRAME_RATE: 60,
	CANVAS_WIDTH: 800,
	CANVAS_HEIGHT: 600,
	TIME_REQUIRED_TO_SPEED_UP_SIM: 3 / 60,
	TIME_REQUIRED_TO_SLOW_DOWN_SIM: 3 / 60,
	TIME_REQUIRED_TO_RESET: 50 / 60,
	SPEED_UP_SIM_MULT: 1.07,
	SLOW_DOWN_SIM_MULT: 0.93,
	KEY_BINDINGS: {
		32: 'JUMP', //space bar
		38: 'MOVE_UP', 87: 'MOVE_UP', //up arrow key / w key
		37: 'MOVE_LEFT', 65: 'MOVE_LEFT', //left arrow key / a key
		40: 'MOVE_DOWN', 83: 'MOVE_DOWN', //down arrow key / s key
		39: 'MOVE_RIGHT', 68: 'MOVE_RIGHT', //right arrow key / d key
		66: 'TOGGLE_BUILD_MODE', //b key
		8: 'DELETE', //delete key
		49: 'BUILD_MODE_1', //1 key
		50: 'BUILD_MODE_2', //2 key
		51: 'BUILD_MODE_3' //3 key
	},
	TIME_BETWEEN_PINGS: 0.90,
	NUM_CACHED_PINGS: 20,
	PINGS_TO_IGNORE: 3,
	GAINS_REQUIRED_TO_LOWER_ROUND_TRIP_TIME: 75,
	DEBUG_DRAW_SERVER_GHOSTS: true,
	DEBUG_HIDE_SPRITES: false,
	DEBUG_TRACE_SPRITES: false
});