/** Space Station */

var playfield = $("#playfield");
var inner = $("#playfield-inner");

var TILE_SIZE_PX = 64;
var BACKGROUND_SIZE_PX = 645;

var score = 0;
var turns = 0;
var science = 0;
var power = 0;
var oxygen = 0;
var food = 0;
var people = 0;
var running = false;

var upcomingTiles = [];

/* placed tiles {}{} */
var placed  = {};
/* [y][x] = {
     tile: the tile type
     elem: associated html div
   }
 */

var minTileX = 0;
var minTileY = 0;

function tile(prefix, turnHandler) {
	this.prefix = prefix;
	this.turnHandler = turnHandler;
}

var Tiles = {
	NewTile: new tile("new"),
	Habitation: new tile("habitation", function() {
		people += 1;
	}, function() {
		oxygen -= 1;
	}),
	Oxygen: new tile("oxygen", function() {
	}, function() {
		oxygen += 5;
		power -= 1;
	}),
	Food: new tile("food", function() {
	}, function() {
		food += 2;
		power -= 1;
	}),
	Science: new tile("science", function() {
	}, function() {
		science += 1;
		food -= 1;
		power -= 2;
	}),
	Power: new tile("power", function() {
	}, function() {
		power += 1;
	}),
	Connector: new tile("connector")
};


function initGame() {
	score = 0;
	turns = 0;
	science = 0;
	power = 10;
	oxygen = 10;
	food = 10;
	people = 1;

	upcomingTiles = [];
	placed  = {};
	$(".tile").remove();

	placeTile(0,0, Tiles.Connector);
	inner.css("top", (playfield.height() - TILE_SIZE_PX)/2 + "px");
	inner.css("left", (playfield.width() - TILE_SIZE_PX - 16)/2 + "px");
	fixBackgroundImage();

	updateUpcomingTiles();
	updateScoreUI();
}

function startGame() {
	$("#menu").removeClass("active");
	running = true;
	initGame();
}

function stopGame(reason) {
	running = false;
	$("#game-over").css("display", "block");
	$("#game-over-reason").text(reason);
	$("#menu").addClass("active");
}

function randomTile() {
	var keys = Object.keys(Tiles);
	keys.splice(0,1);
	var rnd = Math.floor(Math.random() * keys.length);
	var tile = Tiles[keys[rnd]]
	return tile;
}


/* get tile or null */
function getTile(x,y) {
	var populated = placed[y] && placed[y][x];
	return populated ? placed[y][x] : null;
}

/* can a new module be placed here? */
function isPlaceable(x,y) {
	var tile = getTile(x,y);
	if (!tile) {
		return false;
	} else {
		return tile.tile == null;
	}
}

function makeTileElement(tile) {
	var elem = $("<div>");
	elem.addClass("tile").addClass("tile-" + tile.prefix);
	elem.css("background-image", "url(tile-" + tile.prefix + ".png)");
	elem.css("width", TILE_SIZE_PX + "px");
	elem.css("height", TILE_SIZE_PX + "px");
	//elem.text(tile.prefix);//debug
	return elem;
}

function placeTile(x,y, tile) {
	//remove old tile first
	var oldTile = getTile(x,y);
	if (oldTile) {
		oldTile.elem.remove();
	}
    
	var elem = makeTileElement(tile);
	elem.css("left", (x * TILE_SIZE_PX) + "px");
	elem.css("top", (y * TILE_SIZE_PX) + "px");
	inner.append(elem);

	if (!placed[y]) {
		placed[y] = {};
	}
	placed[y][x] = {
		tile: tile,
		elem: elem
	};

	// add more placeables if required
	if (tile !== Tiles.NewTile) {
		if (getTile(x-1,y) == null) {
			placeTile(x-1,y, Tiles.NewTile);
		}
		if (getTile(x+1,y) == null) {
			placeTile(x+1,y, Tiles.NewTile);
		}
		if (getTile(x,y-1) == null) {
			placeTile(x,y-1, Tiles.NewTile);
		}
		if (getTile(x,y+1) == null) {
			placeTile(x,y+1, Tiles.NewTile);
		}
	}

	//ensure background fits
	minTileX = Math.min(x, minTileX);
	minTileY = Math.min(y, minTileY);
}


function updateScoreUI() {
	$(".score").text(score);
	$("#science").text(science);
	$("#power").text(power);
	$("#oxygen").text(oxygen);
	$("#food").text(food);
	$("#people").text(people);

	if (running) {
		$("#menu").removeClass("active");
	} else {
		$("#menu").addClass("active");
	}
}

function nextTurn() {

	// each module functions
	$.each(placed, function(index, placedY) {
		$.each(placedY, function(index2, placedXY) {
			var tile = placedXY.tile;
			var turnFunc = tile.turnHandler;
			if (turnFunc) {
				turnFunc();
			}
		});
	});

	turns+=1;
	score = turns + science;

	// score update
	updateScoreUI();
	updateUpcomingTiles();

	// End?
	if (power < 1) {
		stopGame("Ran out of power");
	}
	if (oxygen < 1) {
		stopGame("Asphyxiation: Not enough oxygen");
	}
	if (food < 1) {
		stopGame("Starvation: No more food to eat");
	}
}

function updateUpcomingTiles() {
	$("#module-next .tile:first-child").remove();
	upcomingTiles.shift();

	while(upcomingTiles.length < 50) {
		var tile = randomTile();
		upcomingTiles.push(tile);
		var elem = makeTileElement(tile);
		$("#module-next").append(elem);
	}
}

/* make background stay with modules and cover the screen too */
function fixBackgroundImage() {
	//ensure background fits
	var offset = inner.offset();
	var bgStartX = offset.left - 5 * BACKGROUND_SIZE_PX;
	var bgStartY = offset.top - 5 * BACKGROUND_SIZE_PX;
	// adjust for slight paralax effect
	bgStartX *= 0.9;
	bgStartY *= 0.9;
	playfield.css("background-position-x", bgStartX + "px");
	playfield.css("background-position-y", bgStartY + "px");
}


/* start */
initGame();

/* playfield is dragable */
var wasDragged = false;
playfield.on("mousedown", function(event) {
	if (!running) {
		return;
	}
	if (event.button != 0) {
		return;
	}
	var mouseDownX = event.pageX;
	var mouseDownY = event.pageY;
	var innerStart = inner.offset();
	event.preventDefault();
	event.setCapture && event.setCapture();
	wasDragged = false;
	playfield.on("mousemove", function(event) {
		wasDragged = true;
		var dx = event.pageX - mouseDownX;
		var dy = event.pageY - mouseDownY;
		var offset = inner.offset();
		offset.top = innerStart.top + dy;
		offset.left = innerStart.left + dx;
		inner.offset(offset);
		fixBackgroundImage();
	});
	playfield.on("mouseup mouseleave", function(event) {
		playfield.off("mouseup").off("mousemove");
		playfield.removeClass("drag");
	});
	playfield.addClass("drag");
});


/* new tiles are clickable */
inner.on("click", ".tile-new", function(e) {
	e.preventDefault();
	if (wasDragged) {
		return;
	}
	if (!running) {
		return;
	}
	//clicked x,y on a New tile
	var clickX = Math.floor((e.pageX - inner.offset().left) / TILE_SIZE_PX);
	var clickY = Math.floor((e.pageY - inner.offset().top) / TILE_SIZE_PX);
	// place the next in line tile here
	placeTile(clickX, clickY, upcomingTiles[0]);
	// do turn-based stuff
	nextTurn();
});

$("#start").on("click", startGame);
