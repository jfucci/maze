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

		this.player1Spawn = [0,0]; //top left cell
		this.enemySpawn = [(this.getGridWidth() - 1), (this.getGridHeight() - 1)]; //bottom right cell. the objective.
		
		this.player1 = new maze.Creature(this.player1Spawn);
		
		this.enemies = [];
		for(var i = 0; i < setup.numEnemies; i++) {
			this.enemies.push(new maze.Enemy(this.enemySpawn, i*0.1));
		}

		this.generate();
	};

	maze.Model.prototype.generate = function() {
		var currentCell  = _.pickRandom(this.grid);
		var cellStack    = [];
		var totalCells   = this.getGridHeight() * this.getGridWidth();
		var visitedCells = 1;
		var wallsToDestroy = totalCells * 0.05; //5% of total cells should have walls destroyed

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

		if(!cell) {
			return null; //necessary if there is no path between the player and any enemy
		}

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

	//calculates the paths between all the cells using Dijkstra's Algorithm
	maze.Model.prototype.calculatePaths = function() {
		var grid = this.grid;
		var unvisited = {};

		for (var prop in grid) {
			unvisited[prop] = grid[prop];
		}

		var currentNode = grid[this.player1.currentCell];	//start at the player's current cell; the algorithm 
															//will branch out to find paths to the enemies

		var distances = {};
		_.each(this.grid, function(cell) {
			distances[cell.getLocation()] = Infinity;
		}, this);

		this.paths = {};
		_.each(this.grid, function(cell) {
			this.paths[cell.getLocation()] = currentNode.getLocation();
		}, this);

		distances[currentNode.getLocation()] = 0;

		//this.getUnWalledNeighbors(currentNode) will return null if there is no path between the player and any enemy
		while(!_.isEmpty(unvisited) && this.getUnWalledNeighbors(currentNode)) { 
			_.each(this.getUnWalledNeighbors(currentNode), function(neighbor) {
				var distance = distances[currentNode.getLocation()] + 1;
				if(distance < distances[neighbor.getLocation()]) {
					distances[neighbor.getLocation()] = distance;
					this.paths[neighbor.getLocation()] = currentNode.getLocation();
				}
			}, this);

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
	};

	maze.Model.prototype.moveCreature = function(creature, x, y) {
		if(!this.grid[creature.currentCell].walls[[x, y]]) {
			creature.currentCell = [creature.currentCell[0] + x, creature.currentCell[1] + y];
		}
	};

	maze.Creature = function(spawn) {
		this.currentCell = spawn;
		this.previousCell = [spawn];
	};

	maze.Creature.prototype.getDirection = function() {
		return [this.currentCell[0] - this.previousCell[0], this.currentCell[1] - this.previousCell[1]];
	};

	maze.Enemy = function(spawn, pCorrectTurn) {
		maze.Creature.call(this, spawn); //call the Creature constructor
		this.pCorrectTurn = pCorrectTurn;	//the probability that the enemy will make the correct turn 
											//(i.e. the turn that will bring it closer to the player) at an intersection
	};

	maze.Enemy.prototype = new maze.Creature(); //Enemy inherits Creature
	maze.Enemy.prototype.constructor = maze.Enemy; //else the Enemy constructor pointer will point to Creature
}());