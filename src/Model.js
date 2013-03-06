/*global _:true, maze:true */
(function() {
	"use strict";

	maze.Model = function(setup) {
		this.getGridWidth  = _.constant(setup.gridWidth);
		this.getGridHeight = _.constant(setup.gridHeight);
		var coordinates    = _.product([_.range(this.getGridWidth()), _.range(this.getGridHeight())]);
		this.grid          = {};
		this.steps         = 0;

		_.each(coordinates, function(coordinate) {
			this.grid[coordinate] = new maze.Cell(coordinate[0], coordinate[1]);
		}, this);

		this.player1Spawn = this.grid[[0,0]];
		this.enemySpawn = this.grid[[(this.getGridWidth() - 1), (this.getGridHeight() - 1)]];
		
		this.player1Cell = this.player1Spawn;
		
		this.enemies = [];
		for(var i = 0; i < setup.numEnemies; i++) {
			this.enemies.push(new maze.Enemy(this.enemySpawn.getLocation(), i*0.1)); //i*0.2 + 0.25
		}

		this.generate();
	};

	maze.Model.prototype.generate = function() {
		var currentCell  = _.pickRandom(this.grid);
		var cellStack    = [];
		var totalCells   = this.getGridHeight() * this.getGridWidth();
		var visitedCells = 1;
		var wallsToDestroy = totalCells * 0.05; //10% of total cells should be destroyed

		while(visitedCells < totalCells) {
			var intactNeighbors = this.getWalledNeighbors(currentCell);
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
			if(!this.isEdgeCell(randomCell)) {
				var randomWall = _.chain(randomCell.walls).map(function(val, key) {
									if(val) {
										return key;
									} else {
										return undefined;
									}
								}).compact().pickRandom().value();
				if(randomWall !== undefined) {
					var x = Number(randomWall.split(",")[0]);
					var y = Number(randomWall.split(",")[1]);
					this.manipulateWall(randomCell, x, y);
					wallsToDestroy--;
				}
			}
		}
	};

	maze.Model.prototype.getWalledNeighbors = function(cell) {
		return _.filter(this.getNeighbors(cell), function(neighbor) {
				return neighbor.allWallsIntact();
			});
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

	maze.Model.prototype.isEdgeCell = function(cell) {
		return this.getNeighbors(cell).length < 4;
	};

	maze.Cell = function(x, y) {
		this.borders     = maze.createDirectionFlags();
		this.walls       = maze.createDirectionFlags();
		this.getLocation = _.constant([x, y]);
		this.parentCell  = null;
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

	maze.Model.prototype.getUnWalledNeighbors = function(cell) {
		var grid = this.grid;
		return _.chain(cell.walls)
					.pairs()
					.reject(function(wall) {
						return wall[1]; 
					})	//up to this point the chain returns an array of
						//the directions around the current cell without walls
					.flatten()
					.filter(function(value) { //reject the "false" items from the array
						return value;
					}) 
					.map(function(coordinate){
						//make the coordinates arrays of numbers instead of strings
						var offset = [Number(coordinate.split(",")[0]), Number(coordinate.split(",")[1])];
						//map directions to cells in the grid
						return grid[_.add(offset, cell.getLocation())];
					})
					.compact().value();
	};

	maze.Model.prototype.step = function() {
		//if the player touches any enemy, they die and respawn
		if (_.any(this.enemies, function(enemy) {
			return this.player1Cell.getLocation()[0] === enemy.currentCell[0] && 
				   this.player1Cell.getLocation()[1] === enemy.currentCell[1];
		}, this)) {
			this.player1Cell = this.player1Spawn;
		}

		//calculates the paths between all the cells using Dijkstra's Algorithm:
		
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
			_.each(this.getUnWalledNeighbors(currentNode), function(neighbor) {
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

		//enemy movement:
		_.each(this.enemies, function(enemy) {
			enemy.previousCell = enemy.currentCell;
			if(_.random(1) > enemy.pCorrectTurn && this.getUnWalledNeighbors(grid[enemy.currentCell]).length > 2) {
				enemy.currentCell = _.pickRandom(this.getUnWalledNeighbors(grid[enemy.currentCell])).getLocation();
			} else {
				enemy.currentCell = grid[paths[enemy.currentCell]].getLocation();
			}
		}, this);

		//idea: if the unwalledneighbors.length === 2, keep going in that direction

		this.steps++;
	};

	maze.Enemy = function(spawn, pCorrectTurn) {
		this.currentCell = spawn;
		this.previousCell = [];
		this.pCorrectTurn = pCorrectTurn; //the probability that the enemy will make the correct turn 
										  //(i.e. the turn that will bring it closer to the player) at an intersection
	};

	maze.Enemy.prototype.getDirection = function() {
		return [this.currentCell[0] - this.previousCell[0], this.currentCell[1] - this.previousCell[1]];
	};

}());
