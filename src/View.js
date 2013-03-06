/*global _:true, maze:true, $:true */
(function() {
	"use strict";

	maze.View = function(model) {
		this.model  = model;
		this.canvas = $("#canvas");

		//set animations:
		//the dragon animation was obtained and edited from
		//http://forums.wesnoth.org/viewtopic.php?f=23&t=26202&start=30#p370377
		this.enemyLeft = [];
		for(var i = 0; i < 10; i++) {
			this.enemyLeft.push(new Image());
			this.enemyLeft[i].src = "sprites/dragon_flying_left/frame" + i + ".png";
		}

		this.enemyRight = [];
		for(var i = 0; i < 10; i++) {
			this.enemyRight.push(new Image());
			this.enemyRight[i].src = "sprites/dragon_flying_right/frame" + i + ".png";
		}

		//set player image:
		this.playerSprite = new Image();
		this.playerSprite.src = "sprites/player.png";
		
		//set wall destroyer/maker image:
		this.axeSprite = new Image();
		//the axe image was obtained and edited from: http://www.minecraftopia.com/gold_pickaxe.html
		this.axeSprite.src = "sprites/gold_pickaxe.png";

		this.setupCanvas();
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
		if(this.playerSelectedCell) {
			this.playerSelectedCell = null;
		} else {
			this.playerSelectedCell = this.model.grid[[this.getCellXCoordinate(event), this.getCellYCoordinate(event)]];
		}
		this.update();
		return false;
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
		this.drawSprite(this.model.player1Cell.getLocation(), this.playerSprite);
		
		_.each(this.model.enemies, function(enemy) {
			if(enemy.getDirection()[0] > 0) {
				this.drawSprite(enemy.currentCell, this.enemyRight[this.model.steps % this.enemyRight.length]);
			} else {
				this.drawSprite(enemy.currentCell, this.enemyLeft[this.model.steps % this.enemyLeft.length]);
			}
		}, this);
		
		if(this.playerSelectedCell) {
			this.drawSprite(this.playerSelectedCell.getLocation(), this.axeSprite);
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

	maze.View.prototype.drawSquare = function(cell, color) {
		this.ctx.fillStyle = color;
		this.ctx.fillRect(cell.getLocation()[0] / this.model.getGridWidth() + (1 / (10 * this.model.getGridWidth())), 
			cell.getLocation()[1] / this.model.getGridHeight() + (1 / (10 * this.model.getGridHeight())), 
			1 / (1.25 * this.model.getGridWidth()), 1 / (1.25 * this.model.getGridHeight()));
	};

	maze.View.prototype.drawSprite = function(cellLocation, img) {
		this.ctx.drawImage(img, cellLocation[0] / this.model.getGridWidth() + (1 / (10 * this.model.getGridWidth())), 
			cellLocation[1] / this.model.getGridHeight() + (1 / (10 * this.model.getGridHeight())), 
			1 / (1.25 * this.model.getGridWidth()), 1 / (1.25 * this.model.getGridHeight()));
	};

}());