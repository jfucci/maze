/*global _:true, maze:true */
(function() {
	"use strict";

	maze.Model = function(setup) {
		this.getGridWidth  = _.constant(setup.gridWidth);
		this.getGridHeight = _.constant(setup.gridHeight);
		var coordinates    = _.product([_.range(this.getGridWidth()), _.range(this.getGridHeight())]);
		this.grid          = {};

		_.each(coordinates, function(coordinate) {
			this.grid[coordinate] = new maze.Cell(coordinate[0], coordinate[1]);
		}, this);

		this.player1Spawn = this.grid[[0,0]];
		this.dragonSpawn = this.grid[[(this.getGridWidth() - 1), (this.getGridHeight() - 1)]];
		
		this.player1Cell = this.player1Spawn;
		this.dragonCell = this.dragonSpawn;

		this.generate();
	};

	maze.Model.prototype.generate = function() {
		var currentCell  = _.pickRandom(this.grid);
		var cellStack    = [];
		var totalCells   = this.getGridHeight() * this.getGridWidth();
		var visitedCells = 1;

		while(visitedCells < totalCells) {
			var intactNeighbors = _.filter(this.getNeighbors(currentCell), function(cell) {
				return cell.allWallsIntact();
			});
			if(intactNeighbors.length > 0) {
				var newCell = _.pickRandom(intactNeighbors);

				maze.connectAdjacent(newCell, currentCell);

				cellStack.push(currentCell);
				currentCell = newCell;
				visitedCells++;
			} else {
				currentCell = cellStack.pop();
			}
		}
	};

	maze.Model.prototype.getNeighbors = function(cell) {
		var grid = this.grid;
		return _.chain(maze.getDirections()).map(function(offset) { //map directions to cells in the grid
			return grid[_.add(offset, cell.getLocation())];
		}).compact().value();
	};

	maze.Cell = function(x, y) {
		this.backtracks  = maze.createDirectionFlags();
		this.solutions   = maze.createDirectionFlags();
		this.borders     = maze.createDirectionFlags();
		this.walls       = maze.createDirectionFlags();
		this.getLocation = _.constant([x, y]);
	};

	maze.Cell.prototype.allWallsIntact = function() {
		return _.every(_.map(this.walls, function(flag) {
			return flag;
		}));
	};

	maze.getDirections = function() {
		return _.chain(_.range(-1, 2)).repeat(2).product().reject(function(pair) {
			return Math.abs(pair[0]) === Math.abs(pair[1]);
		}).value();
	};

	maze.createDirectionFlags = function() {
		return _.object(maze.getDirections(), _.repeat(true, 4));
	};

	maze.connectAdjacent = function(cellA, cellB) {
		var directionFromA2B = _.subtract(cellB.getLocation(), cellA.getLocation());
		var directionFromB2A = _.multiply(directionFromA2B, -1);
		cellA.walls[directionFromA2B] = false;
		cellB.walls[directionFromB2A] = false;
	};

	maze.Model.prototype.step = function() {
		//if the player touches the dragon, they die and respawn
		if(this.player1Cell === this.dragonCell) {
			this.player1Cell = this.player1Spawn;
		}
		//chooses the next cell the dragon will travel to

		var neighborXdistances = [];
		var neighborYdistances = [];

		_.each(this.getNeighbors(this.dragonCell), function(neighbor) {
			neighborXdistances.push(Math.abs(neighbor.getLocation()[0] - this.player1Cell.getLocation()[0])); 
			neighborYdistances.push(Math.abs(neighbor.getLocation()[1] - this.player1Cell.getLocation()[1]));
		}, this);

		var shortestXdistance = neighborXdistances[0];
		_.each(neighborXdistances, function(distance) {
			if(distance < shortestXdistance) {
				shortestXdistance = distance;
			}
		});

		var shortestYdistance = neighborYdistances[0];
		_.each(neighborYdistances, function(distance) {
			if(distance < shortestYdistance) {
				shortestYdistance = distance;
			}
		});

		if(shortestXdistance < shortestYdistance) {
			var nextDragonCell = this.getNeighbors(this.dragonCell)[neighborYdistances.indexOf(shortestYdistance)];			
		} else {
			var nextDragonCell = this.getNeighbors(this.dragonCell)[neighborXdistances.indexOf(shortestXdistance)];

		}
		if(!nextDragonCell) {
			_.pickRandom(this.getNeighbors(this.dragonCell));
		}


		var x = nextDragonCell.getLocation()[0] - this.dragonCell.getLocation()[0];
		var y = nextDragonCell.getLocation()[1] - this.dragonCell.getLocation()[1];
		if(Math.random() < 0.15) {
			this.dragonCell.walls[[x, y]] = false;
			nextDragonCell.walls[[-x, -y]] = false;
		}
		//the dragon moves to the next cell if there is not a wall between the dragon and it
		if(!this.dragonCell.walls[[x, y]]) {
			this.dragonCell = nextDragonCell;
		}
	};

}());