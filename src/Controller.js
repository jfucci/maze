/*global _:true, maze:true, $:true, document:true*/
(function() {
	"use strict";

	$(document).ready(function() {
		new maze.Controller();
	});

	maze.Controller = function() {
		var setup = {
			gridHeight: 20, //number of cells per column
			gridWidth: 20   //number of cells per row
		};
		this.model = new maze.Model(setup);
		this.view = new maze.View(this.model);
	};

}());