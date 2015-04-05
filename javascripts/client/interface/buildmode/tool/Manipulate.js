define([
	'shared/utils/EventHelper'
], function(
	EventHelper
) {
	var events = new EventHelper([ 'move-poly' ]);
	var MIN_DRAG_DISTANCE = 5;
	var mousePos = { x: 0, y: 0 };
	var level = null;
	var selectedPolygon = null;
	var dragStartPos = null;
	var isDraggingSelectedPolygon = false;

	return {
		on: function(eventName, callback) {
			events.on(eventName, callback);
		},
		setLevel: function(lvl) {
			level = lvl;
		},
		reset: function() {
			selectedPolygon = null;
			dragStartPos = null;
			isDraggingSelectedPolygon = false;
		},
		onMouseEvent: function(evt, camera) {
			var i;
			mousePos.x = evt.x + camera.x;
			mousePos.y = evt.y + camera.y;
			if(level !== null) {
				//if we mousedown on a polygon, we select it
				if(evt.type === 'mousedown') {
					//we might need to deselect the currently selected polygon
					if(selectedPolygon && !selectedPolygon.containsPoint(mousePos.x, mousePos.y)) {
						selectedPolygon = null;
						dragStartPos = null;
					}
					//or select another polygon
					for(i = level.polygons.length - 1; i >= 0; i--) {
						if(level.polygons[i].containsPoint(mousePos.x, mousePos.y)) {
							selectedPolygon = level.polygons[i];
							dragStartPos = { x: mousePos.x, y: mousePos.y };
							return;
						}
					}
				}
				//if we move after mousedown-ing a polygon, we start dragging it
				else if(evt.type === 'mousemove') {
					if(selectedPolygon && dragStartPos && !isDraggingSelectedPolygon) {
						var dx = mousePos.x - dragStartPos.x;
						var dy = mousePos.y - dragStartPos.y;
						if(dx * dx + dy * dy > MIN_DRAG_DISTANCE * MIN_DRAG_DISTANCE) {
							isDraggingSelectedPolygon = true;
						}
					}
				}
				//if we release the polygon after dragging it, that means we want to move it
				else if(evt.type === 'mouseup') {
					if(isDraggingSelectedPolygon) {
						for(i = 0; i < selectedPolygon.points.length - 1; i += 2) {
							selectedPolygon.points[i] += mousePos.x - dragStartPos.x;
							selectedPolygon.points[i + 1] += mousePos.y - dragStartPos.y;
						}
						selectedPolygon.recalculateGeometry();
						events.trigger('move-poly', selectedPolygon);
					}
					isDraggingSelectedPolygon = false;
					dragStartPos = null;
				}
			}
		},
		onKeyboardEvent: function(evt, keyboard) {},
		render: function(ctx, camera) {
			if(selectedPolygon) {
				//draw a blue rectangle around the selected polygon
				var minX = selectedPolygon.minX, maxX = selectedPolygon.maxX,
					minY = selectedPolygon.minY, maxY = selectedPolygon.maxY;
				ctx.strokeStyle = '#06f';
				ctx.lineWidth = 1;
				ctx.strokeRect(minX - 2 - 3 - camera.x, minY - 2 - 3 - camera.y, 6, 6);
				ctx.strokeRect(maxX + 2 - 3 - camera.x, minY - 2 - 3 - camera.y, 6, 6);
				ctx.strokeRect(maxX + 2 - 3 - camera.x, maxY + 2 - 3 - camera.y, 6, 6);
				ctx.strokeRect(minX - 2 - 3 - camera.x, maxY + 2 - 3 - camera.y, 6, 6);
				ctx.beginPath();
				ctx.moveTo(minX - 2 + 3 - camera.x, minY - 2 + 0 - camera.y);
				ctx.lineTo(maxX + 2 - 3 - camera.x, minY - 2 + 0 - camera.y);
				ctx.moveTo(maxX + 2 + 0 - camera.x, minY - 2 + 3 - camera.y);
				ctx.lineTo(maxX + 2 + 0 - camera.x, maxY + 2 - 3 - camera.y);
				ctx.moveTo(maxX + 2 - 3 - camera.x, maxY + 2 + 0 - camera.y);
				ctx.lineTo(minX - 2 + 3 - camera.x, maxY + 2 + 0 - camera.y);
				ctx.moveTo(minX - 2 + 0 - camera.x, maxY + 2 - 3 - camera.y);
				ctx.lineTo(minX - 2 + 0 - camera.x, minY - 2 + 3 - camera.y);
				ctx.moveTo((minX + maxX) / 2 - 5 - camera.x, (minY + maxY) / 2 - camera.y);
				ctx.lineTo((minX + maxX) / 2 + 5 - camera.x, (minY + maxY) / 2 - camera.y);
				ctx.moveTo((minX + maxX) / 2 - camera.x, (minY + maxY) / 2 - 5 - camera.y);
				ctx.lineTo((minX + maxX) / 2 - camera.x, (minY + maxY) / 2 + 5 - camera.y);
				ctx.stroke();

				//if we're dragging the polygon, we want to draw an outline of its new position
				if(isDraggingSelectedPolygon) {
					ctx.strokeStyle = '#f00';
					ctx.lineWidth = 5;
					ctx.beginPath();
					for(i = 0; i < selectedPolygon.points.length - 1; i += 2) {
						ctx[i === 0 ? 'moveTo' : 'lineTo'](selectedPolygon.points[i] - camera.x - dragStartPos.x + mousePos.x,
								selectedPolygon.points[i + 1] - camera.y - dragStartPos.y + mousePos.y);
					}
					ctx.closePath();
					ctx.stroke();
				}
			}
		}
	};
});