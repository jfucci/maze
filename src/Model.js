/*global _:true, maze:true, $:true */
(function() {
	"use strict";

	maze.Model = function(setup) {
		this.getGridWidth = _.constant(setup.gridWidth);
		this.getGridHeight = _.constant(setup.gridHeight);
		var coordinates = _.product([_.range(this.getGridHeight()), _.range(this.getGridWidth())]);
		this.grid = {};
		_.each(coordinates, function(coordinate) {
			this.grid[coordinate] = new maze.Cell(coordinate[0], coordinate[1]);
		}, this);

		this.beginning = this.grid["0,0"];
		this.end = this.grid[(this.getGridWidth() - 1) + "," + (this.getGridHeight() - 1)];

		this.generate();
	};

	maze.Model.prototype.generate = function() {
		var currentCell = this.grid[[Math.round(Math.random() * (this.getGridWidth() - 1)), Math.round(Math.random() * (this.getGridHeight() - 1))]];
		var cellStack = [];
		var totalCells = this.getGridHeight() * this.getGridWidth();
		var visitedCells = 1;
		var cellNeighbors = [];

		while(visitedCells < totalCells) {
			cellNeighbors = _.filter(this.getNeighbors(currentCell), function(cell) {
				return cell.allWallsIntact();
			});
			if(cellNeighbors.length > 0) {
				var newCell = cellNeighbors[Math.round(Math.random() * (cellNeighbors.length - 1))];
				
				if(newCell.getX() > currentCell.getX()) {
					currentCell.walls.east = false;
					newCell.walls.west = false;
				} 

				else if(newCell.getX() < currentCell.getX()) {
					currentCell.walls.west = false;
					newCell.walls.east = false;
				} 

				else if(newCell.getY() < currentCell.getY()) {
					currentCell.walls.north = false;
					newCell.walls.south = false;
				} 

				else if(newCell.getY() > currentCell.getY()) {
					currentCell.walls.south = false;
					newCell.walls.north = false;
				}
				
				cellStack.push(currentCell);
				currentCell = newCell;
				visitedCells++;
			} else {
				currentCell = cellStack.pop();
			}
		}
	};

	maze.Model.prototype.getNeighbors = function(square){
		var grid = this.grid;
		return _.chain(_.range(-1,2))
		    .repeat(2)
		    .product()
		    .reject(function(pair) {
		    	return Math.abs(pair[0]) === Math.abs(pair[1]);
		    })
		    .map(function(offset){
		      var x = offset[0]+square.getX();
		      var y = offset[1]+square.getY();
		      if(grid[[x, y]]) {
		      	return grid[[x, y]];
		      }
		    })
		    .filter(function(cell) {
		    	return cell;
		    })
		    .value();
	};

	maze.Cell = function(x, y) {
		this.backtracks = new maze.Directions();
		this.solutions  = new maze.Directions();
		this.borders    = new maze.Directions();
		this.walls      = new maze.Directions();
		this.getX       = _.constant(x);
		this.getY       = _.constant(y);
	};

	maze.Cell.prototype.allWallsIntact = function() {
		return _.every(this.walls, _.identity);
	}

	maze.Directions = function() {
		this.north = true;
		this.south = true;
		this.east  = true;
		this.west  = true;
	};

}());