define([
	'client/net/GameConnection',
	'client/Constants',
	'client/Clock',
	'client/entity/PhysBall',
	'shared/handleCollisions',
	'client/interface/buildmode/BuildMode',
	'shared/level/Level'
], function(
	GameConnection,
	Constants,
	Clock,
	PhysBall,
	handleCollisions,
	BuildMode,
	Level
) {
	//set up entities
	var camera = { x: 0, y: 0 };
	var entities = [];
	var playableEntity = null;
	function getEntity(id) {
		for(var i = 0; i < entities.length; i++) {
			if(entities[i].entityId === id) {
				return entities[i];
			}
		}
		return null;
	}
	function spawnEntity(entity) {
		if(entity.type === 'PhysBall') {
			var ball = new PhysBall(entity.id, entity.state);
			entities.push(ball);
			return ball;
		}
		else {
			return null;
		}
	}
	function despawnEntity(id) {
		entities = entities.filter(function(entity) {
			return entity.entityId !== id;
		});
		if(playableEntity && playableEntity.entityId === id) {
			playableEntity = null;
		}
	}

	//add UI handlers
	BuildMode.on('draw-polygon', function(state) {
		var polygon = Level.createPolygonAndAssignId(state, 'temp');
		GameConnection.bufferSend({
			messageType: 'create-polygon-request',
			state: polygon.getState()
		});
	});
	BuildMode.on('move-polygon', function(info) {
		GameConnection.bufferSend({
			messageType: 'modify-polygon-request',
			modifyType: 'move',
			x: info.x,
			y: info.y,
			state: info.polygon.getState()
		});
	});
	BuildMode.on('delete-polygon', function(polygon) {
		Level.removePolygonById(polygon.id);
		GameConnection.bufferSend({
			messageType: 'delete-polygon-request',
			id: polygon.id
		});
	});

	//set up network handlers
	GameConnection.on('receive', function(msg) {
		if(msg.messageType === 'game-state') {
			entities = [];
			msg.state.entities.forEach(spawnEntity);
			playableEntity = getEntity(msg.state.playableEntityId);
			if(playableEntity) {
				playableEntity.setPlayerControlled(true);
			}
			Level.setState(msg.state.level);
		}
		else if(msg.messageType === 'entity-state-update') {
			getEntity(msg.entity.id).onStateUpdateFromServer(msg.entity.state);
		}
		else if(msg.messageType === 'spawn-entity') {
			spawnEntity(msg.entity);
		}
		else if(msg.messageType === 'despawn-entity') {
			despawnEntity(msg.entityId);
		}
		else if(msg.messageType === 'player-input') {
			getEntity(msg.entityId).onInputFromServer(msg.input, msg.details);
		}
		else if(msg.messageType === 'update-polygon-id') {
			Level.getPolygonById(msg.tempId).id = msg.id;
		}
		else if(msg.messageType === 'create-polygon') {
			Level.createPolygon(msg.state);
		}
		else if(msg.messageType === 'update-polygon-state') {
			Level.getPolygonById(msg.state.id).setState(msg.state);
		}
		else if(msg.messageType === 'delete-polygon') {
			Level.removePolygonById(msg.id);
		}
	});

	var timeUntilSuggestState = 0.0;
	return {
		reset: function() {
			entities = [];
			camera.x = 0;
			camera.y = 0;
			playableEntity = null;
			Level.reset();
			BuildMode.reset();
		},
		tick: function(t) {
			for(var i = 0; i < entities.length; i++) {
				entities[i].startOfFrame(t);
			}

			for(i = 0; i < entities.length; i++) {
				entities[i].tick(t);
				handleCollisions(entities[i].sim, t);
				handleCollisions(entities[i].serverSim, t);
			}

			for(i = 0; i < entities.length; i++) {
				entities[i].endOfFrame(t);
			}

			timeUntilSuggestState -= t;
			if(timeUntilSuggestState <= 0.0) {
				this.timeUntilSuggestState = 1.2;
				if(playableEntity) {
					playableEntity.sendStateSuggestion();
				}
			}
		},
		render: function(ctx) {
			camera.x = (playableEntity ? playableEntity.sim.pos.x - Constants.CANVAS_WIDTH / 2 : 0);
			camera.y = (playableEntity ? playableEntity.sim.pos.y - Constants.CANVAS_HEIGHT * 0.57 : 0);
			if(GameConnection.isConnected() && GameConnection.isSynced()) {
				if(Clock.speed > 1.0) { ctx.fillStyle = '#df0'; } //greener -- sped up
				else if(Clock.speed < 1.0) { ctx.fillStyle = '#fd0'; } //redder -- slowed down
				else { ctx.fillStyle = '#ff0'; } //yellow -- normal speed
			}
			else if(GameConnection.isConnected()) { ctx.fillStyle = '#f0f'; } //magenta -- syncing
			else { ctx.fillStyle = '#000'; } //black -- not connected
			ctx.fillRect(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);

			//render Level
			ctx.fillStyle = '#fff';
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 1;
			var polygons = Level.getPolygons();
			for(var i = 0; i < polygons.length; i++) {
				var points = polygons[i].points;
				ctx.beginPath();
				ctx.moveTo(points[points.length - 2] - camera.x, points[points.length - 1] - camera.y);
				for(var j = 0; j < points.length - 1; j += 2) {
					ctx.lineTo(points[j] - camera.x, points[j+1] - camera.y);
				}
				ctx.fill();
				ctx.stroke();
			}

			//render entities
			for(i = 0; i < entities.length; i++) {
				entities[i].render(ctx, camera);
			}

			//render polygon being drawing
			BuildMode.render(ctx, camera);
		},
		onMouseEvent: function(evt) {
			if(BuildMode.isOn()) {
				BuildMode.onMouseEvent(evt, camera);
			}
		},
		onKeyboardEvent: function(evt, keyboard) {
			if(playableEntity) {
				if(evt.key === 'TOGGLE_BUILD_MODE') {
					if(evt.isDown) {
						BuildMode.toggle();
					}
				}
				else {
					if(BuildMode.isOn()) {
						BuildMode.onKeyboardEvent(evt, keyboard);
					}
					playableEntity.onKeyboardEvent(evt, keyboard);
				}
			}
		}
	};
});