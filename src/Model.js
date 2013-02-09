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
		var wallsToDestroy = 5;

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

		while(wallsToDestroy >= 0) {
			var randomCell = _.pickRandom(this.grid);
			//implement the following better? it simply ignores the cell if it is on the edge because 
			//picking a random wall could pick an edge and crash the program at "this.manipulateWall"
			if (randomCell.getLocation()[0] === this.getGridWidth() - 1 || 
				randomCell.getLocation()[0] === 0 || 
				randomCell.getLocation()[1] === this.getGridHeight() - 1 || 
				randomCell.getLocation()[1] === 0) {
				continue;
			} else {
				var randomWall = _.chain(randomCell.walls).map(function(val, key) {
									if(val) {
										return key;
									} else{
										return undefined;
									}
								}).compact().pickRandom().value();
				var x = Number(randomWall.split(",")[0]);
				var y = Number(randomWall.split(",")[1]);
				console.log(randomCell.getLocation() + " " + randomWall);
				this.manipulateWall(randomCell, x, y);
				wallsToDestroy--;
			}
		}
	};

	maze.Model.prototype.manipulateWall = function(cell, x, y) {
		cell.walls[[x,y]] = !cell.walls[[x,y]];
		var neighbor = this.grid[[cell.getLocation()[0] + x, cell.getLocation()[1] + y]];
		neighbor.walls[[-x, -y]] = !neighbor.walls[[-x, -y]];
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

		//chooses the next cell the dragon will travel to using Dijkstra's algorithm

		var unvisited = _.clone(this.grid);
		var currentNode = this.player1Cell;
		var grid = this.grid;

		var distances = {};
		_.each(this.grid, function(cell) {
			distances[cell.getLocation()] = Infinity;
		}, this);

		var paths = {};
		_.each(this.grid, function(cell) {
			paths[cell.getLocation()] = currentNode.getLocation();
		}, this);

		distances[currentNode.getLocation()] = 0;

		while(!_.isEmpty(unvisited)) {
			_.chain(currentNode.walls)
				.pairs()
				.reject(function(wall) {
					return wall[1]; 
				}) //up to this point the chain returns an array of
				   //the directions around the current cell without walls
				.flatten()
				.filter(function(value) { //reject the "false" items from the array
					return value;
				}) 
				.map(function(coordinate){
					//make the coordinates arrays of numbers instead of strings
					var offset = [Number(coordinate.split(",")[0]), Number(coordinate.split(",")[1])];
					//map directions to cells in the grid
					return grid[_.add(offset, currentNode.getLocation())];
				})
				.compact()
				//for each of the reachable neighbors, calculate the distance
				.each(function(neighbor) {
					var distance = distances[currentNode.getLocation()] + 1;
					if(distance < distances[neighbor.getLocation()]) {
						distances[neighbor.getLocation()] = distance;
						paths[neighbor.getLocation()] = currentNode.getLocation();
					}
				});

			delete unvisited[currentNode.getLocation()];

			//the next current node will be the one with the smallest distance in unvisited
			var smallest = [Infinity];
			_.each(unvisited, function(val, key) {
				if(distances[key] < smallest[0]) {
					smallest = [distances[key], key];
				}
			});

			currentNode = unvisited[smallest[1]];
		}
		this.dragonCell = grid[paths[this.dragonCell.getLocation()]]
	};
}());