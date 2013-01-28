/*global _:true, maze:true, $:true, document:true, window:true*/
(function() {
	"use strict";

	$(document).ready(function() {
		new maze.Controller();
	});

	maze.Controller = function() {
		this.setup = {
			gridHeight: 20, //number of cells per column
			gridWidth: 30   //number of cells per row
		};
		
		this.model = new maze.Model(this.setup);
		this.view  = new maze.View(this.model);
		this.stepDelay = 150;

		$(window).resize(_.bind(function() {
			this.view.resizeCanvas();
		}, this));

		$(document).keydown(_.bind(function (e) {
			var key = e.which;

			if(this.view.playerSelectedCell) {
				switch(key) {
					case 37: //left
					case 65: //A
						this.manipulateWall(this.view.playerSelectedCell, -1, 0);
						break;
					case 38: //up
					case 87: //W
						this.manipulateWall(this.view.playerSelectedCell, 0, -1);
						break;
					case 39: //right
					case 68: //D
						this.manipulateWall(this.view.playerSelectedCell, 1, 0);
						break;
					case 40: //down
					case 83: //S
						this.manipulateWall(this.view.playerSelectedCell, 0, 1);
						break;
				}

				this.view.playerSelectedCell = null;
			} else {
				switch(key) {
					case 37: //left
					case 65: //A
						this.movePlayer(-1, 0);
						break;
					case 38: //up
					case 87: //W
						this.movePlayer(0, -1);
						break;
					case 39: //right
					case 68: //D
						this.movePlayer(1, 0);
						break;
					case 40: //down
					case 83: //S
						this.movePlayer(0, 1);
						break;
				}
			}

			this.view.update();

			//prevent the page from capturing the arrow keys 
	 		//so the page doesn't scroll when they are pressed
			if (key >= 37 && key <= 40) {
     		   return false;
    		}
		}, this));
	
		this.interval = window.setInterval(_.bind(this.step, this), this.stepDelay);
	};

	maze.Controller.prototype.manipulateWall = function(cell, x, y) {
		cell.walls[[x,y]] = !cell.walls[[x,y]];
		var neighbor = this.model.grid[[cell.getLocation()[0] + x, cell.getLocation()[1] + y]];
		neighbor.walls[[-x, -y]] = !neighbor.walls[[-x, -y]];
	};

	maze.Controller.prototype.movePlayer = function(x, y) {
		if(!this.model.player1Cell.walls[[x, y]]) {
			this.model.player1Cell = this.model.grid[[this.model.player1Cell.getLocation()[0] + x, 
			this.model.player1Cell.getLocation()[1] + y]];

			this.view.update();
		}
	};

	maze.Controller.prototype.step = function() {
		if (this.model.player1Cell === this.model.dragonSpawn) { //winning the maze
			this.model = new maze.Model(this.setup);
			this.view = new maze.View(this.model);
			this.interval = window.setInterval(_.bind(this.step, this), this.stepDelay);
		}
		this.model.step();
		this.view.update();
	};

}());