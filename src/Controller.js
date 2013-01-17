/*global _:true, maze:true, $:true, document:true, window:true*/
(function() {
	"use strict";

	$(document).ready(function() {
		new maze.Controller();
	});

	maze.Controller = function() {
		var setup = {
			gridHeight: 20, //number of cells per column
			gridWidth: 30   //number of cells per row
		};
		
		this.model = new maze.Model(setup);
		this.view  = new maze.View(this.model);

		$(window).resize(_.bind(function() {
			this.view.resizeCanvas();
		}, this));

		$(document).keydown(_.bind(function (e) {
			if(this.view.selectedCell) {

				var key = e.which;

				switch(key) {
					case 37: //left
						this.manipulateWall(this.view.selectedCell, -1, 0);
						break;
					case 38: //up
						this.manipulateWall(this.view.selectedCell, 0, -1);
						break;
					case 39: //right
						this.manipulateWall(this.view.selectedCell, 1, 0);
						break;
					case 40: //down
						this.manipulateWall(this.view.selectedCell, 0, 1);
						break;
				}

				this.view.selectedCell = null;
				this.view.update();

			} else {
				//code to move player
			}

		}, this));
	};

	maze.Controller.prototype.manipulateWall = function(cell, x, y) {
		cell.walls[[x,y]] = !cell.walls[[x,y]];
		var neighbor = this.model.grid[[cell.getLocation()[0] + x, cell.getLocation()[1] + y]];
		neighbor.walls[[-x, -y]] = !neighbor.walls[[-x, -y]];
	}
}());