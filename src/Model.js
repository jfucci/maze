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

		this.beginning = this.grid[[0,0]];
		this.end = this.grid[[(this.getGridWidth() - 1), (this.getGridHeight() - 1)]];

		this.generate();
	};

	maze.Model.prototype.generate = function() {
		var currentCell = this.grid[[Math.round(Math.random() * (this.getGridWidth() - 1)), 
			Math.round(Math.random() * (this.getGridHeight() - 1))]]; //select a random cell
		var cellStack = [];
		var totalCells = this.getGridHeight() * this.getGridWidth();
		var visitedCells = 1;

		while(visitedCells < totalCells) {
			var cellNeighbors = _.filter(this.getNeighbors(currentCell), function(cell) {
				return cell.allWallsIntact();
			});
			if(cellNeighbors.length > 0) {
				var newCell = cellNeighbors[Math.round(Math.random() * (cellNeighbors.length - 1))];
				
				if(newCell.getX() > currentCell.getX()) {
					currentCell.walls[0].flag = false;
					newCell.walls[3].flag = false;
				} else if(newCell.getX() < currentCell.getX()) {
					currentCell.walls[3].flag = false;
					newCell.walls[0].flag = false;
				} else if(newCell.getY() < currentCell.getY()) {
					currentCell.walls[2].flag = false;
					newCell.walls[1].flag = false;
				} else if(newCell.getY() > currentCell.getY()) {
					currentCell.walls[1].flag = false;
					newCell.walls[2].flag = false;
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
		    .map(function(offset){ //map directions to cells in the grid
		      var x = offset[0]+square.getX();
		      var y = offset[1]+square.getY();
		      return grid[[x, y]];
		    })
		    .compact()
		    .value();
	};

	maze.Cell = function(x, y) {
		this.backtracks = maze.createDirections();
		this.solutions  = maze.createDirections();
		this.borders    = maze.createDirections();
		this.walls      = maze.createDirections();
		this.getX       = _.constant(x);
		this.getY       = _.constant(y);
	};

	maze.createDirections = function() {
		return _.chain(_.range(-1,2))
		    .repeat(2)
		    .product()
		    .reject(function(pair) {
		    	return Math.abs(pair[0]) === Math.abs(pair[1]);
		    })
		    .map(function(offset) {
		    	return new maze.Direction(offset[0], offset[1]);
		    })
		    .value();
	};

	maze.Cell.prototype.allWallsIntact = function() {
		return _.every(_.map(this.walls, function(direction) {
			return direction.flag;
		}));
	};

	maze.Direction = function(xOff, yOff) {
		this.getXOff = _.constant(xOff);
		this.getYOff = _.constant(yOff);
		this.flag = true;
	};

}());