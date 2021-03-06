/*global _:true, maze:true, $:true, document:true, window:true*/
(function() {
	"use strict";

	$(document).ready(function() {
		new maze.Controller();
	});

	maze.Controller = function() {
		this.setup = {
			gridHeight: 20, //number of cells per column
			gridWidth: 30,  //number of cells per row
			numEnemies: 3   //number of enemies in the game
		};
		
		this.model = new maze.Model(this.setup);
		this.view  = new maze.View(this.model);
		this.stepDelay = 30;

		$('#viewport').dragscrollable(); //enables click and drag on the maze

		var that = this;
		
		//binds right click to showing the wall tool
		$('#canvas').bind("contextmenu",function(e){
			that.view._mouseClick(e);
			return false;
		});

		//handler for all the keyboard input
		this.directionsForKeys = {};
		this.registerDirectionForKeys([37, 65], -1, 0); //left and A
		this.registerDirectionForKeys([38, 87], 0, -1); //up and W
		this.registerDirectionForKeys([39, 68], 1, 0);  //right and D
		this.registerDirectionForKeys([40, 83], 0, 1);  //down and S

		$(document).keydown(_.bind(function (e) {
			var key = e.which;
			
			if(this.directionsForKeys[key]){
				if(this.view.wallToolCell) {
					this.model.manipulateWall(this.view.wallToolCell, this.directionsForKeys[key]);
					this.view.wallToolCell = null;
					this.model.calculatePaths(); 	//any time the player changes a wall
													//the paths for the enemies are recalculated

				} else {
					var oldP1Cell = this.model.player1.currentCell;
					this.view.movePlayer(this.model.player1, this.directionsForKeys[key], 1);
					this.model.paths[oldP1Cell] = this.model.player1.currentCell;
				}

				this.view.update();

				//prevent the page from capturing keys 
				//so the page doesn't scroll when they (in particular the arrow keys) are pressed
				return false;
			}
		}, this));
	
		this.model.calculatePaths(); 
		this.interval = window.setInterval(_.bind(this.step, this), this.stepDelay);
		this.view.update();
	};

	maze.Controller.prototype.registerDirectionForKeys = function(keys, xOff, yOff) {
		_.each(keys, function(key){
			this.directionsForKeys[key] = [xOff, yOff];
		}, this);
	};

	maze.Controller.prototype.step = function() {
		//if the player wins the maze, reset. 
		//*broken* currently for reasons unknown 
		if(_.arrayEquals(this.model.player1.currentCell, this.model.enemySpawn)) {
			window.clearInterval(this.interval);
			this.interval = null;
			this.model = new maze.Model(this.setup); //
			this.view = new maze.View(this.model);   //these two lines might be why it breaks
			this.interval = window.setInterval(_.bind(this.step, this), this.stepDelay);
			this.model.steps = 0;
		}

		//if the player touches any enemy, they die and respawn
		if(this.model.checkDeathByEnemy()) {
			this.model.player1.currentCell = this.model.player1Spawn;
			this.view.resetScroll();
			this.model.calculatePaths();
		}

		this.model.step();
		this.view.update();
	};
}());
