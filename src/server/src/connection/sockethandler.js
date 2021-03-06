/*jslint white: true, node: true*/

//Module dependencies
var redis;
var MessageValidator;
var SessionValidator;
var ContentValidator;

var SocketHandler = function(io, sessionManager) {
	this.io = io;
	this.sessionManager = sessionManager;

	//Redis message queue publisher
	this.inputPublisher = redis.createClient();

	io.on('connection', this.clientConnected.bind(this));

	this.setUpValidators();
};

SocketHandler.prototype.setUpValidators = function() {
	var self = this;

	var queueFailResponse = function(request, channel, message) {
		if (typeof request.sessionID === "undefined") {
			return; //We don't have a sessionID to send it back to
		}

		self.inputPublisher.publish('output message:' + request.sessionID, JSON.stringify({
			channel: channel,
			data: {
				success: false,
				message: message || "Unknown error occured, please try again"
			}
		}));
	};

	this.sessionValidator = new SessionValidator(this.sessionManager);
	this.contentValidator = new ContentValidator();


	/*
	 * Global chat
	 */
	this.globalValidator = new MessageValidator();

	this.globalValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.sessionValidator.hasProperty('username'))
		.requirement(self.contentValidator.hasProperty('content'));

	this.globalValidator.on('success', function(request) {
		self.inputPublisher.publish('global message:' + request.sessionID, JSON.stringify(request));
	});


	/*
	 * Login
	 */
	this.loginValidator = new MessageValidator();

	this.loginValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.contentValidator.hasProperty('username'))
		.requirement(self.contentValidator.hasProperty('password'));

	this.loginValidator.on('success', function(request) {
		console.log("Login success");
		self.inputPublisher.publish('login:' + request.sessionID, JSON.stringify(request));
	});

	this.loginValidator.on('error', function(error, request) {
		console.log("Login error");
		queueFailResponse(request, 'login', "Login valididator experienced an error");
	});

	this.loginValidator.on('fail', function(request) {
		console.log("Login fail: " + request.failMessage);
		queueFailResponse(request, 'login', request.failMessage);
	});

	/*
	 * Logout
	 */
	this.logoutValidator = new MessageValidator();

	this.logoutValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.sessionValidator.hasProperty('username'));

	this.logoutValidator.on('success', function(request) {
		self.inputPublisher.publish('logout:' + request.sessionID, JSON.stringify(request));
	});

	/*
	 * Registration
	 */
	this.registrationValidator = new MessageValidator();

	this.registrationValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.contentValidator.hasProperty('username'))
		.requirement(self.contentValidator.hasProperty('password'))
		.requirement(self.contentValidator.propertyMatches('username', '^[a-z0-9_-]{3,16}$', 'Username is invalid, requirements are 3-16 characters, a-z, 0-9 _ and -'))
		.requirement(self.contentValidator.propertyMatches('password', '^.{6,}$', 'Password is invalid, requires at least 6 characters'));

	this.registrationValidator.on('success', function(request) {
		self.inputPublisher.publish('register:' + request.sessionID, JSON.stringify(request));
	});

	this.registrationValidator.on('fail', function(request) {
		queueFailResponse(request, 'register', request.failMessage);
	});

	/*
	 * Create Lobby
	 */
	this.createLobbyValidator = new MessageValidator();

	this.createLobbyValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.sessionValidator.hasProperty('username'))
		.requirement(self.contentValidator.hasProperty('name'))
		.requirement(self.contentValidator.propertyMatches('name', '^[\\sa-zA-Z0-9_-]{3,160}$', 'Name is invalid, requirements are 3-160 characters, a-z, A-Z, 0-9 _ and -'))

	this.createLobbyValidator.on('success', function(request) {
		self.inputPublisher.publish('create lobby:' + request.sessionID, JSON.stringify(request));
	});

	this.createLobbyValidator.on('fail', function(request) {
		queueFailResponse(request, 'create lobby', request.failMessage);
	});

	/*
	 * Join Lobby
	 */
	this.joinLobbyValidator = new MessageValidator();

	this.joinLobbyValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.sessionValidator.hasProperty('username'))
		.requirement(self.contentValidator.hasProperty('id'));

	this.joinLobbyValidator.on('success', function(request) {
		self.inputPublisher.publish('join lobby:' + request.sessionID, JSON.stringify(request));
	});


	/*
	 * Leave Lobby
	 */
	this.leaveLobbyValidator = new MessageValidator();

	this.leaveLobbyValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.sessionValidator.hasProperty('username'));

	this.leaveLobbyValidator.on('success', function(request) {
		self.inputPublisher.publish('leave lobby:' + request.sessionID, JSON.stringify(request));
	});
	

	/*
	 * Close lobby
	 */
	this.closeLobbyValidator = new MessageValidator();

	this.closeLobbyValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.sessionValidator.hasProperty('username'));

	this.closeLobbyValidator.on('success', function(request) {
		self.inputPublisher.publish('close lobby:' + request.sessionID, JSON.stringify(request));
	});


	/*
	 * Info Lobby
	 */
	this.infoLobbyValidator = new MessageValidator();

	this.infoLobbyValidator
		.requirement(self.sessionValidator.hasSession());

	this.infoLobbyValidator.on('success', function(request) {
		self.inputPublisher.publish('info lobby:' + request.sessionID, JSON.stringify(request));
	});

	/*
	 * Launch Game
	 */
	this.launchGameValidator = new MessageValidator();

	this.launchGameValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.sessionValidator.hasProperty('username'));

	this.launchGameValidator.on('success', function(request) {
		self.inputPublisher.publish('launch game:' + request.sessionID, JSON.stringify(request));
	});

	/*
	 * Game Turn
	 */
	this.gameTurnValidator = new MessageValidator();

	this.gameTurnValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.sessionValidator.hasProperty('username'));

	this.gameTurnValidator.on('success', function(request) {
		self.inputPublisher.publish('game turn:' + request.sessionID, JSON.stringify(request));
	});

	/*
	 * User info
	 */
	this.userInfoValidator = new MessageValidator();

	this.userInfoValidator
		.requirement(self.sessionValidator.hasSession());

	this.userInfoValidator.on('success', function(request) {
		self.inputPublisher.publish('user info:' + request.sessionID, JSON.stringify(request));
	});

	/*
	 * User count
	 */
	
	this.userCountValidator = new MessageValidator();
	this.userCountValidator
		.requirement(self.sessionValidator.hasSession());

	this.userCountValidator.on('success', function(request) {
		console.log("Count request validated");
		self.inputPublisher.publish('user count:' + request.sessionID, JSON.stringify(request));
	});

	this.userCountValidator.on('fail', function(request) {
		console.error("Count request failed");
	});

	this.userCountValidator.on('error', function(err, request) {
		console.error("Error on count request");
		console.dir(err);
	});

	/*
	 * Leave game
	 */
	
	this.leaveGameValidator = new MessageValidator();

	this.leaveGameValidator
		.requirement(self.sessionValidator.hasSession())
		.requirement(self.sessionValidator.hasProperty('username'));

	this.leaveGameValidator.on('success', function(request) {
		console.log("Leave game request validated");
		self.inputPublisher.publish('leave game:' + request.sessionID, JSON.stringify(request));
	});

	this.leaveGameValidator.on('fail', function(request) {
		console.log("Failed leave game request validation");
	});

	this.leaveGameValidator.on('error', function(err, request) {
		console.log("Error on leave game request validation: " + err);
	});
}

SocketHandler.prototype.clientConnected = function(connection) {
	var self = this;

	console.log("Client connected");
	var sessionID;

	//Create subscriber for output messages
	var outputSubscriber = redis.createClient();

	connection.on('session', function(data) {
		console.log("Session request");
		if (sessionID !== undefined) {
			//Client requesting a new session but they already have one
			return;
		}

		//Create new session ID
		sessionID = self.sessionManager.create();
		console.log("Created new session for client with ID: " + sessionID);

		connection.emit('session', { sessionID: sessionID, success: true });

		outputSubscriber.subscribe('output message:' + sessionID);
	});

	outputSubscriber.subscribe('output message');

	outputSubscriber.on('message', function(channelPattern, message) {
		data = JSON.parse(message);
		connection.emit(data.channel, data.data);
	});

	connection.on('disconnect', function() {
		if (typeof sessionID === "undefined") {
			return; //Nothing happens, they never had a session
		}

		outputSubscriber.punsubscribe('output message:' + sessionID);
		outputSubscriber.unsubscribe('output message');

		self.inputPublisher.publish('disconnect:' + sessionID, JSON.stringify({ sessionID: sessionID }));
	});

	connection.on('global message', function(message) {
		console.log("Received global chat message");
		self.globalValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('login', function(message) {
		console.log("Received login message");
		self.loginValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('logout', function(message) {
		console.log("Received logout message");
		self.logoutValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('register', function(message) {
		console.log("Received register message");
		self.registrationValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('create lobby', function(message) {
		console.log("Received create lobby message");
		self.createLobbyValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('close lobby', function(message) {
		console.log("Received close lobby message");
		self.closeLobbyValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('join lobby', function(message) {
		console.log("Received join lobby message");
		self.joinLobbyValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('leave lobby', function(message) {
		console.log("Received leave lobby message");
		self.leaveLobbyValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('info lobby', function(message) {
		console.log("Received info lobby message");
		self.infoLobbyValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('launch game', function(message) {
		console.log("Received launch game message");
		self.launchGameValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('game turn', function(message) {
		console.log("Received game turn message");
		self.gameTurnValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('leave game', function(message) {
		console.log("Received leave game message");
		self.leaveGameValidator.validate({ sessionID: sessionID, message: message });
	});

	connection.on('user info', function(message) {
		console.log("Received user info message");
		self.userInfoValidator.validate({ sessionID: sessionID, message: message });
	})

	connection.on('user count', function(message) {
		console.log("Recieved user count message");
		self.userCountValidator.validate({ sessionID: sessionID, message: message });
	});
};

module.exports = function(_redis, _MessageValidator, _SessionValidator, _ContentValidator) {
	redis = _redis;
	MessageValidator = _MessageValidator;
	SessionValidator = _SessionValidator;
	ContentValidator = _ContentValidator;

	return SocketHandler;
}