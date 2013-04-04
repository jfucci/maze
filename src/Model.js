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

	maze.Model.prototype.isEdgeCell = function(cell) {
		return this.getNeighbors(cell).length < 4;
	};

	maze.Model.prototype.getNeighbors = function(cell) {
		var grid = this.grid;
		return _.chain(maze.getDirections()).map(function(offset) { //map directions to cells in the grid
			return grid[_.add(offset, cell.getLocation())];
		}).compact().value();
	};

	maze.Model.prototype.getWalledNeighbors = function(cell) {
		return _.filter(this.getNeighbors(cell), function(neighbor) {
				return neighbor.allWallsIntact();
			});
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

	maze.Model.prototype.manipulateWall = function(cell, direction) {
		cell.walls[direction] = !cell.walls[direction];
		var neighbor = this.grid[_.add(cell.getLocation(), direction)];
		neighbor.walls[_.multiply(direction, -1)] = !neighbor.walls[_.multiply(direction, -1)];
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

	//calculates the paths between each enemy and the player using the A* Algorithm
	maze.Model.prototype.calculatePathsAStar = function() {
		_.each(this.enemies, function(enemy) {
			var set       = {},
				paths     = {},
				f_score   = {},	//f_score = g_score + h_score, but g_score is a constant. To find the h_score, this algorithm uses the "Manhattan method"
				current   = this.player1.currentCell,
				target    = enemy.currentCell;
		
			set[current] = "open";
			f_score[current] = Math.abs(current[0] - target[0]) + Math.abs(current[1] - target[1]);

			while(_.filter(set, function(state) { return state == "open" }).length > 0) {
				_.each(set, function(val, cell) {
					if(val == "open" && (set[current] === "closed" || f_score[cell] <= f_score[current])) {
						current = cell;
					}
				});

				if(current == target) {
					enemy.paths = paths;
					console.log(paths);
					break;
				}

				set[current] = "closed";

				var neighbors = this.getUnWalledNeighbors(this.grid[current]);
				_.each(neighbors, function(neighbor) {
					neighbor = neighbor.getLocation();
					if(set[neighbor] !== "open" && set[neighbor] !== "closed") {
						paths[neighbor] = _.map(current.split(","), function(num){return Number(num);});
						set[neighbor] = "open";
						f_score[neighbor] = Math.abs(neighbor[0] - target[0]) + Math.abs(neighbor[1] - target[1]);
					}
				}, this);
			}
		}, this);
	};

	//executed once every second, handles player death and enemy movement
	maze.Model.prototype.step = function() {
		//enemy movement:
		_.each(this.enemies, function(enemy) {
			if(enemy.currentCell[0] % 1 === 0 && enemy.currentCell[1] % 1 === 0) {
				enemy.previousCell = enemy.currentCell;
				if(_.random(1) > enemy.pCorrectTurn && this.getUnWalledNeighbors(this.grid[enemy.currentCell]).length > 2) {
					enemy.target = _.pickRandom(this.getUnWalledNeighbors(this.grid[enemy.currentCell])).getLocation();
				} else {
					enemy.target = this.paths[enemy.roundCurrentCell()];
				} 
			} 
			//sets the current cell to current cell +- 0.1 in the direction of the target cell
			enemy.move(_.multiply(_.subtract(enemy.target, enemy.roundCurrentCell()), 0.1), 1);
		}, this);
			
		//idea: if the unwalledneighbors.length === 2, keep going in that direction
		
		this.steps++;
	};

	maze.Model.prototype.isMoveValid = function(creature, direction) {
		return !this.grid[creature.roundCurrentCell()].walls[direction];
	};

	maze.Model.prototype.checkDeathByEnemy = function() {
		return _.any(this.enemies, function(enemy) {
			return _.arrayEquals(this.player1.currentCell, enemy.currentCell);
		}, this);
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

	maze.Creature = function(spawn) {
		this.currentCell = spawn;
		this.previousCell = spawn;
	};

	maze.Creature.prototype.move = function(direction) {
		this.currentCell = _.add(this.currentCell, direction);
	};

	maze.Creature.prototype.roundCurrentCell = function() {
		if(this.previousCell[0] < this.currentCell[0] || this.previousCell[1] < this.currentCell[1]) {
			return _.vectorFloor(this.currentCell);
		} else {
			return _.vectorCeiling(this.currentCell);
		}
	};

	maze.Creature.prototype.getDirection = function() {
		return _.subtract(this.currentCell, this.previousCell);
	};

	maze.Enemy = function(spawn, pCorrectTurn) {
		maze.Creature.call(this, spawn); //call the Creature constructor
		this.pCorrectTurn = pCorrectTurn;	//the probability that the enemy will make the correct turn 
											//(i.e. the turn that will bring it closer to the player) at an intersection
	};

	maze.Enemy.prototype = new maze.Creature(); //Enemy inherits Creature

	maze.Enemy.prototype.constructor = maze.Enemy; //else the Enemy constructor pointer will point to Creature

	maze.Enemy.prototype.move = function(direction, decPlaces) {
		this.currentCell = _.add(this.currentCell, direction);
		this.currentCell[0] = Number(this.currentCell[0].toFixed(decPlaces));
		this.currentCell[1] = Number(this.currentCell[1].toFixed(decPlaces));
	};
}());
