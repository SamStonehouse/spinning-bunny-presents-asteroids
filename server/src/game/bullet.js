/*jslint node: true, white: true */

var SPEED_FACTOR = 2500;

var Bullet = function(source, originPosition, direction, startT) {
	//Player that the bullet originated from
	this.source = source;
	//Position of the player when shot
	this.originPosition = {};
	this.originPosition.x = originPosition.x;
	this.originPosition.y = originPosition.y;

	this.position = {};
	this.position.x = originPosition.x;
	this.position.y = originPosition.y;

	//Angle bullet was fired, with down being 0, increasing counter clockwise
	this.direction = direction;

	this.turnStartPosition = { };

	this.startT = startT;

	this.destroyed = false;
	this.destroyedAt = -1;
};

Bullet.prototype.updateTurnStartPosition = function() {
	this.startT = 0;
	this.turnStartPosition.x = this.position.x;
	this.turnStartPosition.y = this.position.y;
}

Bullet.prototype.update = function(dt) {
	var dx = Math.cos(this.direction) * dt * SPEED_FACTOR;
	var dy = Math.sin(this.direction) * dt * SPEED_FACTOR;

	//Fix later to +=
	this.position.x += dx;
	this.position.y += dy;
};

Bullet.prototype.setDestroyed = function(t) {
	this.destroyedAt = t;
	this.destroyed = true;
}

Bullet.prototype.isDestroyed = function() {
	return this.destroyed;
}

Bullet.prototype.getSource = function() {
	return this.source;
}

Bullet.prototype.distanceTo = function(obj) {
	var objectsPosition = obj.getCurrentPosition();

	return Math.sqrt(Math.pow(objectsPosition.x - this.position.x, 2) + Math.pow(objectsPosition.y - this.position.y, 2));
};

Bullet.prototype.getCurrentPosition = function() {
	return {
		x: this.position.x,
		y: this.position.y
	}
}

Bullet.prototype.getBulletInfo = function() {
	return {
		startT: this.startT,
		turnStartPosition: this.turnStartPosition,
		originPosition: this.originPosition,
		destroyed: this.destroyed,
		destroyedAt: this.destroyedAt,
		direction: this.direction
	}
}

module.exports = function() {
	return Bullet;
}