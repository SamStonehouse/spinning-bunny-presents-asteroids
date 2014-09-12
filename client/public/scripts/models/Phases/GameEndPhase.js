define([
	'jquery',
	'../Phase'
], function ($, Phase) {
    'use strict';
	
	var GameEndPhase = function(world, ships, bullets, socket) {
		this.world = world;
		this.ships = ships;
		this.bullets = bullets;
		this.socket = socket;
	};
	
	GameEndPhase.prototype = $.extend(true, {}, Phase.prototype);
	
	GameEndPhase.prototype.onStart = function () {
		console.log("Game End phase has started");
		
		alert('Game is over');
		this.socket.emit('info lobby', {});
		

		this.world.removeChildren(1); // removes children from index 1 to the end
		this.ships.length = 0;
		this.bullets.length = 0;
		
		$('#gameScreen').hide();
		$('#lobbyListScreen').show();
	};
	
	GameEndPhase.prototype.draw = function () {
	};
	
	GameEndPhase.prototype.update = function () {
	};
	
	GameEndPhase.prototype.onEnd = function () {
		console.log("Game End phase has ended");
	};
	
	return GameEndPhase;
	
});