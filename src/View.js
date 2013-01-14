/*global _:true, maze:true, $:true */
(function() {
	"use strict";

	maze.View = function(model) {
		this.model = model;
		this.canvas = $("#canvas");
		this.ctx = this.canvas[0].getContext("2d");

		var width = this.canvas.width();
		var height = this.canvas.height();

		this.ctx.scale(width, height);
		this.pixel = 1 / width;

		//this.canvas.click(_.bind(this._mouseClick, this));
		//this.canvas.mousemove(_.bind(this._mouseMove, this));

		this.cellSize = 1 / this.model.getGridWidth();

		this.update();
	};

	maze.View.prototype.getCellXCoordinate = function(event) {
		var pixelX = event.pageX - this.canvas.offset().left;
		var x = 0;
		if(pixelX < this.canvas.width() && pixelX > 0) {
			var cellWidthInPixels = this.canvas.width() * this.cellSize;
			x = Math.floor(pixelX / cellWidthInPixels); //find the x index of the cell
		}
		return x;
	};

	maze.View.prototype.getCellYCoordinate = function(event) {
		var pixelY = event.pageY - this.canvas.offset().top;
		var y = 0;
		if(pixelY < this.canvas.height() && pixelY > 0) {
			var cellHeightInPixels = this.canvas.height() * this.cellSize;
			y = Math.floor(pixelY / cellHeightInPixels); //find the y index of the cell
		}
		return y;
	};

	maze.View.prototype.update = function() {
		this.ctx.save();
		this.ctx.clearRect(0, 0, 1, 1);
		this._drawBoard();
		this.ctx.restore();
	};

	maze.View.prototype._drawBoard = function() {
		this.ctx.beginPath();

		_.each(this.model.grid, function(cell) {
			if(cell.walls.north) {
				this.drawNorthWall(cell);
			}
			if(cell.walls.south) {
				this.drawSouthWall(cell);
			}
			if(cell.walls.east) {
				this.drawEastWall(cell);
			}
			if(cell.walls.west) {
				this.drawWestWall(cell);
			}
		}, this);

		this._stroke(1/2, 'black');
	};

	maze.View.prototype.drawNorthWall = function(cell) {
		this.ctx.moveTo((cell.getX() + this.pixel/2) / this.model.getGridWidth(), (cell.getY() + this.pixel/2) / this.model.getGridHeight());
		this.ctx.lineTo((cell.getX() + this.pixel/2 + 1) / this.model.getGridWidth(), (cell.getY() + this.pixel/2) / this.model.getGridHeight());
	};

	maze.View.prototype.drawSouthWall = function(cell) {
		this.ctx.moveTo((cell.getX() + this.pixel/2) / this.model.getGridWidth(), (cell.getY() + 1 + this.pixel/2) / this.model.getGridHeight());
		this.ctx.lineTo((cell.getX() + this.pixel/2 + 1) / this.model.getGridWidth(), (cell.getY()  + 1 + this.pixel/2) / this.model.getGridHeight());
	};

	maze.View.prototype.drawEastWall = function(cell) {
		this.ctx.moveTo((cell.getX() + 1 + this.pixel/2) / this.model.getGridWidth(), (cell.getY() + this.pixel/2) / this.model.getGridHeight());
		this.ctx.lineTo((cell.getX() + 1 + this.pixel/2) / this.model.getGridWidth(), (cell.getY() + 1 + this.pixel/2) / this.model.getGridHeight());
	};

	maze.View.prototype.drawWestWall = function(cell) {
		this.ctx.moveTo((cell.getX() + this.pixel/2) / this.model.getGridWidth(), (cell.getY() + this.pixel/2) / this.model.getGridHeight());
		this.ctx.lineTo((cell.getX() + this.pixel/2) / this.model.getGridWidth(), (cell.getY() + 1 + this.pixel/2) / this.model.getGridHeight());
	};

	maze.View.prototype._stroke = function(pixelWeight, color) {
		this.ctx.strokeStyle = color;
		this.ctx.lineWidth = this.pixel * pixelWeight;
		this.ctx.stroke();
	};


}());