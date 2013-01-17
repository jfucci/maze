/*global _:true, maze:true, $:true */
(function() {
	"use strict";

	maze.View = function(model) {
		this.model  = model;
		this.canvas = $("#canvas");

		this.resizeCanvas();

		this.canvas.click(_.bind(this._mouseClick, this));
		//this.canvas.mousemove(_.bind(this._mouseMove, this));
	};

	maze.View.prototype.resizeCanvas = function() {
		var canvas_wrap = $("#canvas_wrap");
		var height = canvas_wrap.innerHeight();
		var width = (this.model.getGridWidth() * height) / this.model.getGridHeight();
		this.canvas[0].width = width;
		this.canvas[0].height = height;

		this.ctx = this.canvas[0].getContext("2d");

		this.ctx.scale(width, height);

		this.pixel = 1 / width;

		this.update();
	};

	maze.View.prototype._mouseClick = function(event) {
		this.selectedCell = this.model.grid[[this.getCellXCoordinate(event), this.getCellYCoordinate(event)]];
		this.update();
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
		if(this.selectedCell) {
			this.ctx.fillRect(this.selectedCell.getLocation()[0] / this.model.getGridWidth(), this.selectedCell.getLocation()[1] / this.model.getGridHeight(), 1 / this.model.getGridWidth(), 1/ this.model.getGridHeight());
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
}());