define([
	'jquery',
	'../Phase'
], function ($, Phase) {
    'use strict';
		
	var DeadPhase = function(ui, stage, mouse, ships, phaseTitle) {
		this.ui = ui;
		this.stage = stage;
		this.mouse = mouse;
		this.ships = ships;
		this.phaseTitle = phaseTitle;
	};
	
	DeadPhase.prototype = $.extend(true, {}, Phase.prototype);
	
	DeadPhase.prototype.onStart = function () {
		console.log("Dead phase has started");
		
		var self = this;
		
		this.phaseTitle('You are dead!');
		
		this.stage.mousedown = function (data) {

			if (self.mouse.x() < 0 || self.mouse.x() > 10000 || self.mouse.y() < 0 || self.mouse.y() > 10000) {
				return false;
			} else if (data.originalEvent.which === 3 || data.originalEvent.which === 2) {
				self.ui.startDrag(data);
			} else if (data.originalEvent.which === 1) {
				// do nothing
			}
		};
		
		this.stage.mousemove = function(data) {
			self.ui.drag(data);
		};
		
		this.stage.mouseup = function () {
			self.ui.stopDrag();
		};
		
	};
	
	DeadPhase.prototype.draw = function () {
		
		this.ships.forEach(function(ship) {
			ship.draw();
		});

	};
	
	DeadPhase.prototype.update = function () {
		// console.log("Waiting phase is updating");
	};
	
	DeadPhase.prototype.onEnd = function () {
		console.log("Dead phase has ended");
		
		this.phaseTitle('');

	};
	
	return DeadPhase;
	
});