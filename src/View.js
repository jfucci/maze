/*global _:true, maze:true, $:true, Image:true */
(function() {
	"use strict";

	maze.View = function(model) {
		this.model  = model;
		this.canvas = $("#canvas");

		//the dragon animation was obtained and edited from
		//http://forums.wesnoth.org/viewtopic.php?f=23&t=26202&start=30#p370377
		//set up enemy animations:
		this.setAnimation("enemyLeft", "sprites/dragon_flying_left/", 10);
		this.setAnimation("enemyRight", "sprites/dragon_flying_right/", 10);

		//set up player sprite:
		this.setImage("playerSprite", "sprites/player.png");

		//set wall tool sprite:
		//the axe image was obtained and edited from: http://www.minecraftopia.com/gold_pickaxe.html
		this.setImage("axeSprite", "sprites/gold_pickaxe.png");

		this.setupCanvas();
	};

	maze.View.prototype.setImage = function(varName, imgLocation) {
		this[varName] = new Image();
		this[varName].src = imgLocation;
	};

	maze.View.prototype.setAnimation = function(animName, folder, numFrames) {
		this[animName] = [];
		for(var i = 0; i < numFrames; i++) {
			this[animName][i] = new Image();
			this[animName][i].src = folder + "frame" + i + ".png"; //all image names have the form "frame#.png"
		}
	};

	maze.View.prototype.setupCanvas = function() {
		this.ctx = this.canvas[0].getContext("2d");

		var width = this.canvas.width();
		var height = this.canvas.height();

		this.ctx.scale(width, height);
		this.pixel = 1 / width;
		
		this.update();
	};

	maze.View.prototype._mouseClick = function(event) {
		if(this.wallToolCell) {
			this.wallToolCell = null;
		} else {
			this.wallToolCell = this.model.grid[[this.getCellXCoordinate(event), this.getCellYCoordinate(event)]];
		}
		this.update();
		return false; //else the right click menu will spawn
	};

	maze.View.prototype.getCellXCoordinate = function(event) {
		var pixelX = event.pageX - this.canvas.offset().left;
		var x = 0;
		if(pixelX < this.canvas.width() && pixelX > 0) {
			var cellWidthInPixels = this.canvas.width() / this.model.getGridWidth();
			x = Math.floor(pixelX / cellWidthInPixels); //find the x index of the cell
		}
		return x;
	};

	maze.View.prototype.getCellYCoordinate = function(event) {
		var pixelY = event.pageY - this.canvas.offset().top;
		var y = 0;
		if(pixelY < this.canvas.height() && pixelY > 0) {
			var cellHeightInPixels = this.canvas.height() / this.model.getGridHeight();
			y = Math.floor(pixelY / cellHeightInPixels); //find the y index of the cell
		}
		return y;
	};

	maze.View.prototype.update = function() {
		this.ctx.save();
		try {
			this.ctx.clearRect(0, 0, 1, 1);
			this._drawBoard();
		} finally {
			this.ctx.restore();
		}
	};

	maze.View.prototype._drawBoard = function() {
		this.ctx.beginPath();

		_.each(this.model.grid, function(cell) {
			_.each(maze.getDirections(), function(direction) {
				if(cell.walls[direction]) {
					direction = _.multiply(direction, 1 / 2);
					//offsets are relative to cell center
					var wallCenterOffset = _.add(direction, 1 / 2);
					//reverse computes the perpendicular direction
					var wallHeading = direction.reverse();

					var wallStartOffset = _.add(wallCenterOffset, wallHeading);
					var wallEndOffset = _.add(wallCenterOffset, _.multiply(wallHeading, -1));

					this.drawWall(cell, wallStartOffset, wallEndOffset);
				}
			}, this);
		}, this);

		this._stroke(1 / 2, 'black');

		this.drawSquare(this.model.enemySpawn, "black");
		this.drawSprite(this.model.player1.currentCell, this.playerSprite);
		
		_.each(this.model.enemies, function(enemy) {
			this.drawEnemy(enemy);
		}, this);
		
		if(this.wallToolCell) {
			this.drawSprite(this.wallToolCell.getLocation(), this.axeSprite);
		}
	};

	maze.View.prototype.drawWall = function(cell, startOffset, endOffset) {
		var nudge  = this.pixel / 2;
		var center = _.add(cell.getLocation(), nudge);
		var start  = _.add(startOffset, center);
		var end    = _.add(endOffset, center);

		var scale      = [1 / this.model.getGridWidth(), 1 / this.model.getGridHeight()];
		var startPixel = _.multiply(start, scale);
		var endPixel   = _.multiply(end, scale);

		this.ctx.moveTo(startPixel[0], startPixel[1]);
		this.ctx.lineTo(endPixel[0], endPixel[1]);
	};

	maze.View.prototype._stroke = function(pixelWeight, color) {
		this.ctx.strokeStyle = color;
		this.ctx.lineWidth   = this.pixel * pixelWeight;
		this.ctx.stroke();
	};


	maze.View.prototype.drawSquare = function(cellLocation, color) {
		this.ctx.fillStyle = color;
		this.drawRectOrSprite(null, cellLocation);
	};

	maze.View.prototype.drawSprite = function(cellLocation, img) {
		this.drawRectOrSprite(img, cellLocation);
	};

	maze.View.prototype.drawRectOrSprite = function(imgOrNull, cellLocation) {
		var x = cellLocation[0] / this.model.getGridWidth() + (1 / (10 * this.model.getGridWidth())),
			y = cellLocation[1] / this.model.getGridHeight() + (1 / (10 * this.model.getGridHeight())),
			w = 1 / (1.25 * this.model.getGridWidth()),
			h =	1 / (1.25 * this.model.getGridHeight());

		if(imgOrNull !== null) {
			this.ctx.drawImage(imgOrNull, x, y, w, h);
		} else {
			this.ctx.fillRect(x, y, w, h);
		}
	};

	maze.View.prototype.drawEnemy = function(enemy) {
		var spriteList = _.max(enemy.getDirection()) > 0 ? this.enemyRight : this.enemyLeft;

		//_.add in order to add an offset for each dragon. -0.1 because the pCorrectTurns are 0, 0.1, and 0.2
		//(the offsets will be -0.1, 0, and 0.1) and *0.5 because 0.1 was too big an offset
		this.drawSprite(_.add(enemy.currentCell, (enemy.pCorrectTurn-0.1)*0.5), spriteList[this.model.steps % spriteList.length]);
	};

}());
