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
		this.stepDelay = 300;

		$('#viewport').dragscrollable(); //enables click and drag on the maze

		var that = this;
		
		//binds right click to showing the wall tool
		$('#canvas').bind("contextmenu",function(e){
			that.view._mouseClick(e);
			return false;
		});

		//handler for all the keyboard input
		$(document).keydown(_.bind(function (e) {
			var key = e.which;

			if(this.view.wallToolCell) {
				switch(key) {
					case 37: //left
					case 65: //A
						this.model.manipulateWall(this.view.wallToolCell, -1, 0);
						break;
					case 38: //up
					case 87: //W
						this.model.manipulateWall(this.view.wallToolCell, 0, -1);
						break;
					case 39: //right
					case 68: //D
						this.model.manipulateWall(this.view.wallToolCell, 1, 0);
						break;
					case 40: //down
					case 83: //S
						this.model.manipulateWall(this.view.wallToolCell, 0, 1);
						break;
				}

				this.view.wallToolCell = null;
				this.view.update();
			} else {
				switch(key) {
					case 37: //left
					case 65: //A
						this.view.moveCreature(this.model.player1, -1, 0);
						break;
					case 38: //up
					case 87: //W
						this.view.moveCreature(this.model.player1, 0, -1);
						break;
					case 39: //right
					case 68: //D
						this.view.moveCreature(this.model.player1, 1, 0);
						break;
					case 40: //down
					case 83: //S
						this.view.moveCreature(this.model.player1, 0, 1);
						break;
				}
			}

			this.model.calculatePaths();//any time the player presses a key (thereby changing the environment) 
										//the paths for the enemies are recalculated

			//prevent the page from capturing the arrow keys 
			//so the page doesn't scroll when they are pressed
			if (key >= 37 && key <= 40) {
				return false;
			}
		}, this));
	
		this.model.calculatePaths(); 
		this.interval = window.setInterval(_.bind(this.step, this), this.stepDelay);
		this.view.update();
	};

	//executed once every second, handles winning the maze, player death, and enemy movement
	maze.Controller.prototype.step = function() {
		//if the player wins the maze, reset. 
		//*broken* currently for reasons unknown 
		if(this.model.player1.currentCell[0] === this.model.enemySpawn[0] &&
			this.model.player1.currentCell[1] === this.model.enemySpawn[1]) {
			window.clearInterval(this.interval);
			this.interval = null;
			this.model = new maze.Model(this.setup); //
			this.view = new maze.View(this.model);   //these two lines might be why it breaks
			this.interval = window.setInterval(_.bind(this.step, this), this.stepDelay);
			this.model.steps = 0;
		}

		//if the player touches any enemy, they die and respawn
		if (_.any(this.model.enemies, function(enemy) {
			return this.model.player1.currentCell[0] === enemy.currentCell[0] &&
				this.model.player1.currentCell[1] === enemy.currentCell[1];
		}, this)) {
			this.view.moveCreature(this.model.player1, this.model.player1Spawn[0] - this.model.player1.currentCell[0],
				this.model.player1Spawn[1] - this.model.player1.currentCell[1]);
			this.model.calculatePaths();
		}

		var newEnemyCell;

		//enemy movement:
		_.each(this.model.enemies, function(enemy) {
			enemy.previousCell = enemy.currentCell;
			if(_.random(1) > enemy.pCorrectTurn && this.model.getUnWalledNeighbors(this.model.grid[enemy.currentCell]).length > 2) {
				newEnemyCell = _.pickRandom(this.model.getUnWalledNeighbors(this.model.grid[enemy.currentCell])).getLocation();
			} else {
				newEnemyCell = this.model.grid[this.model.paths[enemy.currentCell]].getLocation();
			}
			this.view.moveCreature(enemy, newEnemyCell[0] - enemy.currentCell[0], newEnemyCell[1] - enemy.currentCell[1]);
		}, this);

		//idea: if the unwalledneighbors.length === 2, keep going in that direction

		this.model.steps++;
	};
}());