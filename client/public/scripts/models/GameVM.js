define([
    'knockout',
    'jquery',
	'pixi',
    'models/Ship',
	'models/Asteroid'
], function (ko, $, PIXI, Ship, Asteroid) {
    'use strict';
    
    var GameVM = function GameVM() {
		
		// this.players = ko.observableArray();
		// this.chat = new Chat(this);
				
		this.test();
		
		// this.noughtsAndCrosses();
		
		this.guess = ko.observable();
		this.opponentGuess = ko.observable();
		this.number = ko.observable();
		this.winner = ko.observable();		
        
        // this._loadData();
    };
	
    GameVM.prototype = {
		endGame: function () {
			console.log("game over");
			$('#gameScreen').hide();
			$('#lobbyListScreen').show();
		},
		test: function () {
		
			var SCREEN_WIDTH = $(document).width();
			var SCREEN_HEIGHT = $(document).height();
			
			// create an new instance of a pixi stage
			var stage = new PIXI.Stage(0x66FF99);

			// create a renderer instance.
			var renderer = PIXI.autoDetectRenderer(SCREEN_WIDTH, SCREEN_HEIGHT);

			// add the renderer view element to the DOM
			$('#gameScreen').append(renderer.view);

			requestAnimFrame( animate );

			// create a texture from an image path
			var texture = PIXI.Texture.fromImage("images/bunny.png");
			// create a new Sprite using the texture
			var bunny = new PIXI.Sprite(texture);
			bunny.buttonMode = true;
			bunny.interactive = true;
			
			// center the sprites anchor point
			bunny.anchor.x = 0.5;
			bunny.anchor.y = 0.5;

			// move the sprite to the center of the screen
			bunny.position.x = SCREEN_WIDTH/2;
			bunny.position.y = SCREEN_HEIGHT/2;

			stage.addChild(bunny);
			
			var yellowShip = new Ship(400, 400, 40, 0xFFFF00);
			yellowShip.draw();
			console.log(yellowShip);
			
			var blueShip = new Ship(430, 460, 40, 0x0000FF);
			blueShip.draw();
			console.log(blueShip);
			
			var drawCurve = true;
			var moving = false;
			
			function B1(t) { return (1-t)*(1-t); }
			function B2(t) { return 2*t*(1-t); }
			function B3(t) { return t*t; }
			
			function getBezier(percent,C1,C2,C3) {
				var x = C1.x*B1(percent) + C2.x*B2(percent) + C3.x*B3(percent);
				var y = C1.y*B1(percent) + C2.y*B2(percent) + C3.y*B3(percent);
				return new PIXI.Point(x, y);
			}
			
			stage.mousedown = function () {
				// blueShip.rotateToPoint(stage.getMousePosition().x, stage.getMousePosition().y);
				// blueShip.destroy();	
				
				if (!moving) {
				
					moving = true;

					var percent = 0;
					var startPoint = new PIXI.Point(blueShip.midX, blueShip.midY);
					var endPoint = new PIXI.Point(stage.getMousePosition().x, stage.getMousePosition().y);
					var newPos;
					
					var interval = setInterval(function () {
						
						if (percent <= 1) {
							percent += 0.01;
							drawCurve = false;
							blueShip.graphics.clear();
							newPos = getBezier(percent, startPoint, blueShip.dest, endPoint);
							blueShip.rotateToPoint(newPos.x, newPos.y);
							blueShip.midX = newPos.x;
							blueShip.midY = newPos.y;
							blueShip.draw();
							
						} else if (percent <= 1.01) {
							percent = 1.3;
							blueShip.dest = getBezier(percent, startPoint, blueShip.dest, endPoint);
						} else {
							clearInterval(interval);
							drawCurve = true;
							moving = false;
						}
					}, 15);
					line.clear();
				
				}

			};		

			bunny.mousedown = function () {
				console.log("pressed bunny");
			};
						
			// draw a box around the ship
			var grid = new PIXI.Graphics();
			grid.lineStyle(1, 0x000000, 1);
			grid.moveTo(430-20, 460-20);
			grid.lineTo(430-20, 460+20);
			grid.lineTo(430+20, 460+20);
			grid.lineTo(430+20, 460-20);
			grid.lineTo(430-20, 460-20);
			stage.addChild(grid);
			
			var line = new PIXI.Graphics();
			stage.addChild(line);
			
			//calculates the distance between 2 points
			function dist(p1, p2)
			{
				var xs = 0;
				var ys = 0;

				xs = p2.x - p1.x;
				xs = xs * xs;

				ys = p2.y - p1.y;
				ys = ys * ys;

				return Math.sqrt( xs + ys );
			}
			
			var pass = false;
			var asteroids = [];  // the array of asteroids
			var asteroid;
			
			for (var j = 0; j < 30; j++) {
				// randomly generates an asteroid x and y with relation to the screen size
				var asteroidX = Math.floor(Math.random() * $(document).width());
				var asteroidY = Math.floor(Math.random() * $(document).height());
				
				if (j === 0) {
					// for the first asteroid place it anywhere
					asteroid = new Asteroid(asteroidX, asteroidY);
					asteroid.draw();
					stage.addChild(asteroid.graphics);
					asteroids[j] = asteroid;
				} else {	
					// for the following asteroids check whether it passes the check
					while (!pass) {
						asteroidX = Math.floor(Math.random() * $(document).width());
						asteroidY = Math.floor(Math.random() * $(document).height());
						// loop through the asteroids in the array
						for (var k = j-1; k >= 0; k--) {
							// check whether the distance between the generated points is large enough
							if (dist(new PIXI.Point(asteroidX, asteroidY), new PIXI.Point(asteroids[k].midX, asteroids[k].midY)) > 60) {
								pass = true;
							} else {
								//break this for loop and start again with another randomly generated x and y
								pass = false;
								break;
							}
						}
					}
					
					// when the check is passed then create an asteroid at that point
					asteroid = new Asteroid(asteroidX, asteroidY);
					asteroid.draw();
					stage.addChild(asteroid.graphics);
					asteroids[j] = asteroid;
				}
				
				// set check back to not passed
				pass = false;
				
			}
			 
			// add it the stage so we see it on our screens..
			stage.addChild(yellowShip.graphics);
			stage.addChild(blueShip.graphics);
			
			
			function animate() {
				requestAnimFrame( animate );

				// just for fun, lets rotate mr rabbit a little
				bunny.rotation += 0.1;
				
				if (yellowShip.midX < SCREEN_WIDTH) {
					yellowShip.graphics.clear();
					yellowShip.midX += 10;
					yellowShip.draw();
				}
				
				if (drawCurve) {
					line.clear();
					line.lineStyle(2, 0x000000, 1);
					line.moveTo(blueShip.midX, blueShip.midY);
					line.quadraticCurveTo(blueShip.dest.x, blueShip.dest.y, stage.getMousePosition().x, stage.getMousePosition().y);
					// line.bezierCurveTo(blueShip.dest.x, blueShip.dest.y, blueShip.dest.x, blueShip.dest.y, stage.getMousePosition().x, stage.getMousePosition().y);
					
					line.drawCircle(blueShip.dest.x, blueShip.dest.y, 1);
					
				} else {
					line.clear();
				}
				
				
				// render the stage   
				renderer.render(stage);
			} 
			
			// renderer.render(stage);
			
		},
		_sendGuessToServer: function () {
		
			var ourGuess = {"id": "me", "guess": ((this.guess() >= 1 && this.guess() <= 100) ? this.guess() : 0)};
		
			var theirGuess = {"id": "opponent", "guess": 26};
			
			var random = Math.floor(Math.random() * (100-1)) + 1;
			
			var bestDif =  Math.abs(random-ourGuess.guess);
			
			var winner = ourGuess.id;
			
			if (bestDif>Math.abs(random-theirGuess.guess)) {
				bestDif = Math.abs(random-theirGuess.guess);
				winner = theirGuess.id;
			}
			
			var gameState = {"number":random, "winner":winner,"opponentGuess": theirGuess.guess};
			
			this._processRecieved(gameState);
			
		},
		_processRecieved: function (gameState) {

			this.opponentGuess(gameState.opponentGuess);
			this.number(gameState.number);
			this.winner(gameState.winner);

		},
		noughtsAndCrosses: function () {
			
			var self = this;
			
			var SCREEN_WIDTH = $(document).width();
			var SCREEN_HEIGHT = $(document).height();
			
			// create an new instance of a pixi stage
			var stage = new PIXI.Stage(0xFFFFFF);
			stage.interactive = true;

			// create a renderer instance.
			var renderer = PIXI.autoDetectRenderer(SCREEN_WIDTH, SCREEN_HEIGHT);

			// add the renderer view element to the DOM
			$('#gameScreen').append(renderer.view);
			
			requestAnimFrame( animate );
			
			var assetsToLoad = [ "images/nought.png","images/cross.png" ];
			
			var loader = new PIXI.AssetLoader(assetsToLoad);
			loader.onComplete = onAssetsLoaded;
			
			loader.load();
			
			
			function onAssetsLoaded() {
				
				self.spacesUsed = [['-','-','-'],['-','-','-'],['-','-','-']];
				self.cross  = [];
				self.nought = [];
				
				var count = 0;
				var isNought = true; // nought by default	
						
				var noughtTex = PIXI.Texture.fromImage("images/nought.png");
				var noughtBut = new PIXI.Sprite(noughtTex);
				
				noughtBut.buttonMode = true;
				noughtBut.interactive = true;
				
				noughtBut.anchor.x = 0.5;
				noughtBut.anchor.y = 0.5;
				
				noughtBut.position.x = SCREEN_WIDTH/2;
				noughtBut.position.y = (SCREEN_HEIGHT/2)-50;
				
				var crossTex = PIXI.Texture.fromImage("images/cross.png");
				var crossBut = new PIXI.Sprite(crossTex);
				
				crossBut.buttonMode = true;
				crossBut.interactive = true;

				crossBut.anchor.x = 0.5;
				crossBut.anchor.y = 0.5;
				
				crossBut.position.x = SCREEN_WIDTH/2;
				crossBut.position.y = (SCREEN_HEIGHT/2)+50;
				
				stage.addChild(noughtBut);
				stage.addChild(crossBut);
				
				var graphics = new PIXI.Graphics();
				graphics.lineStyle(5, 0x000000, 1);
				var jump =  noughtBut.width + (graphics.lineWidth*3);
				
				// draw grid lines down
				graphics.moveTo(300, 100);
				graphics.lineTo(300, 100 + (jump*3));
				graphics.moveTo(300 + jump, 100);
				graphics.lineTo(300  + jump, 100 + (jump*3));
				
				// draw grid lines across
				graphics.moveTo(300-jump, 100+jump);
				graphics.lineTo(300+(jump*2), 100+jump);
				graphics.moveTo(300-jump, 100+(jump*2));
				graphics.lineTo(300+(jump*2), 100+(jump*2));
				
				
					
				stage.addChild(graphics);	
				
				noughtBut.mousedown = function () {
					console.log("pressed nought");
					isNought = true;
				};
				
				crossBut.mousedown = function () {
					console.log("pressed cross");
					isNought = false;
				};
				
				stage.mousedown = function () {
					var x = stage.getMousePosition().x;
					var y = stage.getMousePosition().y;
					console.log(stage.getMousePosition());
					
					// alternates between nought and cross
					if (count % 2 === 0) {
						isNought = true;
					} else {
						isNought = false;
					}
					
					if (whoWon() !== "-") {
					
						alert("The winner is "  + whoWon());
						resetGame();
						
					} else  if  (count === 9) {
						
						alert("The game is drawn");
						resetGame();
						
					} else {
						//check which space has been clicked
						if ((x >= 300-jump && x <=300) && (y >= 100 && y <=100+jump)){
							console.log("in top left");
							
							if (self.spacesUsed[0][0] === ("-")) {
								if (!isNought) {
									self.cross[0] = new PIXI.Sprite(crossTex);
									self.cross[0].position.x = 300-jump+(graphics.lineWidth*1.5);
									self.cross[0].position.y = 100+(graphics.lineWidth*1.5);
									stage.addChild(self.cross[0]);
									self.spacesUsed[0][0] = "X";
									count++;
								} else {
									self.nought[0] = new PIXI.Sprite(noughtTex);
									self.nought[0].position.x = 300-jump+(graphics.lineWidth*1.5);
									self.nought[0].position.y = 100+(graphics.lineWidth*1.5);
									stage.addChild(self.nought[0]);
									self.spacesUsed[0][0] = "O";
									count++;
								}
							} else {
								alert("space already filled");
							}
							
						} else if ((x >= 300 && x <=300+jump) && (y >= 100 && y <=100+jump)){
							console.log("in top mid");
							
							if (self.spacesUsed[0][1] === ("-")) {
								if (!isNought) {
									self.cross[1] = new PIXI.Sprite(crossTex);
									self.cross[1].position.x = 300+(graphics.lineWidth*1.5);
									self.cross[1].position.y = 100+(graphics.lineWidth*1.5);
									stage.addChild(self.cross[1]);
									self.spacesUsed[0][1] = "X";
									count++;
								} else {				
									self.nought[1] = new PIXI.Sprite(noughtTex);
									self.nought[1].position.x = 300+(graphics.lineWidth*1.5);
									self.nought[1].position.y = 100+(graphics.lineWidth*1.5);
									stage.addChild(self.nought[1]);
									self.spacesUsed[0][1] = "O";
									count++;
								}
							} else {
								alert("space already filled");
							}
							
						} else if ((x >= 300+(jump) && x <=300+(jump*2)) && (y >= 100 && y <=100+jump)){
							console.log("in top right");
							
							if (self.spacesUsed[0][2] === ("-")) {
								if (!isNought) {
									self.cross[2] = new PIXI.Sprite(crossTex);
									self.cross[2].position.x = 300+jump+(graphics.lineWidth*1.5);
									self.cross[2].position.y = 100+(graphics.lineWidth*1.5);
									stage.addChild(self.cross[2]);
									self.spacesUsed[0][2] = "X";
									count++;
								} else {				
									self.nought[2] = new PIXI.Sprite(noughtTex);
									self.nought[2].position.x = 300+jump+(graphics.lineWidth*1.5);
									self.nought[2].position.y = 100+(graphics.lineWidth*1.5);
									stage.addChild(self.nought[2]);
									self.spacesUsed[0][2] = "O";
									count++;
								}
							} else {
								alert("space already filled");
							}
													
						} else if ((x >= 300-jump && x <=300) && (y >= 100+jump && y <=100+(jump*2))){
							console.log("in mid left");
							
							if (self.spacesUsed[1][0] === ("-")) {
								if (!isNought) {
									self.cross[3] = new PIXI.Sprite(crossTex);
									self.cross[3].position.x = 300-jump+(graphics.lineWidth*1.5);
									self.cross[3].position.y = 100+jump+(graphics.lineWidth*1.5);
									stage.addChild(self.cross[3]);
									self.spacesUsed[1][0] = "X";
									count++;
								} else {				
									self.nought[3] = new PIXI.Sprite(noughtTex);
									self.nought[3].position.x = 300-jump+(graphics.lineWidth*1.5);
									self.nought[3].position.y = 100+jump+(graphics.lineWidth*1.5);
									stage.addChild(self.nought[3]);
									self.spacesUsed[1][0] = "O";
									count++;
								}
								
							} else {
								alert("space already filled");
							}
													
						} else if ((x >= 300 && x <=300+jump) && (y >= 100+jump && y <=100+(jump*2))){
							console.log("in mid mid");
							
							if (self.spacesUsed[1][1] === ("-")) {
								if (!isNought) {
									self.cross[4] = new PIXI.Sprite(crossTex);
									self.cross[4].position.x = 300+(graphics.lineWidth*1.5);
									self.cross[4].position.y = 100+jump+(graphics.lineWidth*1.5);
									stage.addChild(self.cross[4]);
									self.spacesUsed[1][1] = "X";
									count++;
								} else {			
									self.nought[4] = new PIXI.Sprite(noughtTex);
									self.nought[4].position.x = 300+(graphics.lineWidth*1.5);
									self.nought[4].position.y = 100+jump+(graphics.lineWidth*1.5);
									stage.addChild(self.nought[4]);
									self.spacesUsed[1][1] = "O";
									count++;
								}
								
							} else {
								alert("space already filled");
							}
							
														
						} else if ((x >= 300+jump && x <=300+(jump*2)) && (y >= 100+jump && y <=100+(jump*2))){
							console.log("in mid right");
							
							if (self.spacesUsed[1][2] === ("-")) {
								if (!isNought) {
									self.cross[5] = new PIXI.Sprite(crossTex);
									self.cross[5].position.x = 300+jump+(graphics.lineWidth*1.5);
									self.cross[5].position.y = 100+jump+(graphics.lineWidth*1.5);
									stage.addChild(self.cross[5]);
									self.spacesUsed[1][2] = "X";
									count++;
								} else {			
									self.nought[5] = new PIXI.Sprite(noughtTex);
									self.nought[5].position.x = 300+jump+(graphics.lineWidth*1.5);
									self.nought[5].position.y = 100+jump+(graphics.lineWidth*1.5);
									stage.addChild(self.nought[5]);
									self.spacesUsed[1][2] = "O";
									count++;
								}
								
							} else {
								alert("space already filled");
							}
													
						} else if ((x >= 300-jump && x <=300) && (y >= 100+(jump*2) && y <=100+(jump*3))){
							console.log("in bot left");
							
							if (self.spacesUsed[2][0] === ("-")) {
								if (!isNought) {
									self.cross[6] = new PIXI.Sprite(crossTex);
									self.cross[6].position.x = 300-jump+(graphics.lineWidth*1.5);
									self.cross[6].position.y = 100+(jump*2)+(graphics.lineWidth*1.5);
									stage.addChild(self.cross[6]);
									self.spacesUsed[2][0] = "X";
									count++;
								} else {			
									self.nought[6] = new PIXI.Sprite(noughtTex);
									self.nought[6].position.x = 300-jump+(graphics.lineWidth*1.5);
									self.nought[6].position.y = 100+(jump*2)+(graphics.lineWidth*1.5);
									stage.addChild(self.nought[6]);
									self.spacesUsed[2][0] = "O";
									count++;
								}

							} else {
								alert("space already filled");
							}
													
						} else if ((x >= 300 && x <=300+jump) && (y >= 100+(jump*2) && y <=100+(jump*3))){
							console.log("in bot mid");
							
							if (self.spacesUsed[2][1] === ("-")) {
								if (!isNought) {
									self.cross[7] = new PIXI.Sprite(crossTex);
									self.cross[7].position.x = 300+(graphics.lineWidth*1.5);
									self.cross[7].position.y = 100+(jump*2)+(graphics.lineWidth*1.5);
									stage.addChild(self.cross[7]);
									self.spacesUsed[2][1] = "X";
									count++;
								} else {				
									self.nought[7] = new PIXI.Sprite(noughtTex);
									self.nought[7].position.x = 300+(graphics.lineWidth*1.5);
									self.nought[7].position.y = 100+(jump*2)+(graphics.lineWidth*1.5);
									stage.addChild(self.nought[7]);
									self.spacesUsed[2][1] = "O";
									count++;
								}
								
							} else {
								alert("space already filled");
							}
													
						} else if ((x >= 300+jump && x <=300+(jump*2)) && (y >= 100+(jump*2) && y <=100+(jump*3))) {
							console.log("in bot right");
							
							if (self.spacesUsed[2][2] === ("-")) {
								if (!isNought) {
									self.cross[8] = new PIXI.Sprite(crossTex);
									self.cross[8].position.x = 300+jump+(graphics.lineWidth*1.5);
									self.cross[8].position.y = 100+(jump*2)+(graphics.lineWidth*1.5);
									stage.addChild(self.cross[8]);
									self.spacesUsed[2][2] = "X";
									count++;
								} else {				
									self.nought[8] = new PIXI.Sprite(noughtTex);
									self.nought[8].position.x = 300+jump+(graphics.lineWidth*1.5);
									self.nought[8].position.y = 100+(jump*2)+(graphics.lineWidth*1.5);
									stage.addChild(self.nought[8]);
									self.spacesUsed[2][2] = "O";
									count++;
								}
							} else {
								alert("space already filled");
							}
							
						} else {
							console.log ("not in grid");
						}
					
					}
				};
				
				function whoWon() {
					if ( self.spacesUsed[0][0] === self.spacesUsed[0][1] &&  self.spacesUsed[0][1] === self.spacesUsed[0][2] && self.spacesUsed[0][0] !== "-") {
						return self.spacesUsed[0][0];
					} else if (self.spacesUsed[1][0] === self.spacesUsed[1][1] &&  self.spacesUsed[1][1] === self.spacesUsed[1][2]  && self.spacesUsed[1][0] !== "-") {
						return self.spacesUsed[1][0];
					} else if (self.spacesUsed[2][0] === self.spacesUsed[2][1] &&  self.spacesUsed[2][1] === self.spacesUsed[2][2]  && self.spacesUsed[2][0] !== "-") {
						return self.spacesUsed[2][0];
					} else if (self.spacesUsed[0][0] === self.spacesUsed[1][1] &&  self.spacesUsed[1][1] === self.spacesUsed[2][2]  && self.spacesUsed[0][0] !== "-") {
						return self.spacesUsed[0][0];
					} else if (self.spacesUsed[0][2] === self.spacesUsed[1][1] &&  self.spacesUsed[1][1] === self.spacesUsed[2][0]  && self.spacesUsed[0][2] !== "-") {
						return self.spacesUsed[0][2];
					} else if (self.spacesUsed[0][0] === self.spacesUsed[1][0] &&  self.spacesUsed[1][0] === self.spacesUsed[2][0]  && self.spacesUsed[0][0] !== "-") {
						return self.spacesUsed[0][0];
					} else if (self.spacesUsed[0][1] === self.spacesUsed[1][1] &&  self.spacesUsed[1][1] === self.spacesUsed[2][1]  && self.spacesUsed[0][1] !== "-") {
						return self.spacesUsed[0][1];
					} else if (self.spacesUsed[0][2] === self.spacesUsed[1][2] &&  self.spacesUsed[1][2] === self.spacesUsed[2][2]  && self.spacesUsed[0][2] !== "-") {
						return self.spacesUsed[0][2];
					} else {
						return "-";
					}
				}
				
				function resetGame() {
					self.spacesUsed = [['-','-','-'],['-','-','-'],['-','-','-']];
					stage.removeChildren(3); // removes children from index 3 to the end of the list
					count = 0;
				}
				
			}
			
			
			function animate() {

				requestAnimFrame( animate );
				
				
				// render the stage   
				renderer.render(stage);
			}
		}		
    };
	
    return GameVM;
});