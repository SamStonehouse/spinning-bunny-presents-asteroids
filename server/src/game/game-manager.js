/*jslint white: true node: true */

var redis;
var Game = require('./guessing-game')();

var GameIDGenerator = function() {
	this.currentID = 0;
};

GameIDGenerator.prototype.generateID = function() {
	return this.currentID++;
};

var GameManager = function(sessionManager) {
	this.sessionManager = sessionManager;
	this.gameIDGenerator = new GameIDGenerator();
	this.gameIDMap = {};

	this.outputPub = redis.createClient();
};

GameManager.prototype.createGame = function(usernames) {
	console.log("Game manager creating game with users: " + usernames.join(", "));
	var game = new Game(this.gameIDGenerator.generateID(), usernames);
	var self = this;

	this._addGame(game);

	game.on('game end', function() {
		self._removeGame(game);
	});

	return game;
};

GameManager.prototype.joinGame = function(_sessionID, _username, _game) {
	var sessionID = _sessionID;
	var username = _username;
	var game = _game;
	var self = this;


	//Start game procedure once all expected clients have joined
	var startGame = function() {
		self._sendResponse(sessionID, "start game", {
			success: true,
			message: "Game starting",
			id: game.id
		});
	};

	game.once('all players joined', startGame);

	//General game events
	var startTurn = function(turnNumber) {
		console.log("[Game Manager] Turn started");
		self._sendResponse(sessionID, "start turn", { turnNumber: turnNumber });
	};

	var turnResultProcessed = function(turnResult) {
		self._sendResponse(sessionID, "turn result processed", { turnResult: turnResult });
	};

	var gameEnd = function() {
		self._sendResponse(sessionID, "game end", { gameInfo: game.getInfo() });
		removeListeners();
		self._removeGame(game);
	};

	var playerLeave = function() {
		self._sendResponse(sessionID, "player leave", { username: username });
	};

	var allTurnsSubmitted = function() {
		//game.processTurnResult();
		//So do we need to do anything here? Maybe send a 'result being calculated message'
	};

	game.on('start turn', startTurn);
	game.on('turn result processed', turnResultProcessed);
	game.on('game end', gameEnd);
	game.on('player leave', playerLeave);
	game.on('all results submitted', allTurnsSubmitted);

	var turnSub = redis.createClient();

	turnSub.subscribe('game turn:' + sessionID);

	turnSub.on('message', function(channel, message) {
		console.log("Processing game turn");

		var messageObj = JSON.parse(message);
		
		self._sendResponse(sessionID, "turn added", { success: true, message: "Your turn has been added" });
		
		game.addTurn(username, messageObj.data);
	});


	var leaveSub = redis.createClient();

	leaveSub.subscribe('leave game:' + sessionID);
	leaveSub.subscribe('logout:' + sessionID);
	leaveSub.subscribe('disconnect:' + sessionID);

	leaveSub.on('message', function(channel, message) {
		removeListeners();
		game.removePlayer(username);
		self._sendResponse(sessionID, "leave game", { success: true, message: "You have left the game" });
	});

	var removeListeners = function() {
		leaveSub.unsubscribe('leave game:' + sessionID);
		leaveSub.unsubscribe('logout:' + sessionID);
		leaveSub.unsubscribe('disconnect:' + sessionID);
		turnSub.unsubscribe('game turn:' + sessionID);
		game.removeListener('start turn', startTurn);
		game.removeListener('turn result processed', turnResultProcessed);
		game.removeListener('game end', gameEnd);
		game.removeListener('player leave', playerLeave);
	};

	game.addPlayer(username);
};

GameManager.prototype._addGame = function(game) {
	this.gameIDMap[game.id] = game;
};

GameManager.prototype._removeGame = function(game) {
	game.removeAllListeners();
	delete this.gameIDMap[game.id];
}

GameManager.prototype._sendResponse = function(sessionID, channel, data) {
	var response = {};
	response.sessionID = sessionID;
	response.channel = channel;
	response.data = data;
	this.outputPub.publish('output message:' + sessionID, JSON.stringify(response));
}


module.exports = function(_redis) {
	redis = _redis;

	return GameManager;
};