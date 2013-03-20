maze
====
Escape the dragons by getting to the exit in the bottom right of the maze.

Controls
---------

W, A, S, D: movement (arrow keys work too, for lefties)

primary click and drag: scroll the maze

secondary click: place the wall tool (left click again removes it)

movement keys while the wall tool is placed: if a wall exists in the specified direction, destroy it; if not, build one


Todo (in order of importance)
------------------------------

-smooth movement

-show the player sprite at the start of the maze

-implement a better search algorithm (A* or D* Lite, perhaps)

-enemies glitch when there is not a path between all of them and the player -- fix this (could be a consequence of the above)

-levels

-lives, a limited number of destroys and builds for walls, and indicators for these

-optimize

-do something with the fact that player1 has a direction property
