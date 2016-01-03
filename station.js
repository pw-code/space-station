/** Space Station */

var playfield = $("#playfield");
var inner = $("#playfield-inner");

var TILE_SIZE_PX = 64;
var BACKGROUND_SIZE_PX = 645;
var CHOOSALBE_SIZE = 3;

var score = 0;
var turns = 0;
var science = 0;
var power = 0;
var oxygen = 0;
var food = 0;
var people = 0;
var running = false;

var upcomingTiles = [];
var upcomingChosenIndex = -1;

/* placed tiles {}{} */
var placed  = {};
/* [y][x] = {
     tile: the tile type
     elem: associated html div
   }
 */

var minTileX = 0;
var minTileY = 0;

function tile(prefix, initHandler, turnHandler, tipHtml) {
	this.prefix = prefix;
	this.initHandler = initHandler;
	this.turnHandler = turnHandler;
	this.tipHtml = tipHtml;
}

var Tiles = {
	NewTile: new tile("new"),

	Habitation: new tile("habitation",
		function() {
			people += 2;
		},
		function() {
			power -= 1;
		},
		"Provides sleeping and personal space for 2 people. People will consume oxygen.<p>-1 Power"),

	Oxygen: new tile("oxygen",
		function() {
		},
		function() {
			oxygen += 5;
			power -= 1;
		},
		"Produces oxygen.<p>+5 Oxygen<br>-1 Power"),

	Food: new tile("food",
		function() {
		},
		function() {
			food += 2;
			oxygen -= 1;
			power -= 1;
		},
		"Farming for food.<p>+2 Food<br>-1 Oxygen<br>-1 Power"),

	Science: new tile("science",
		function() {
		},
		function() {
			science += (people / countTiles(Tiles.Science));
			power -= 1;
		},
		"Research science. The quantity depends on the number of people present.<p>+ Science<br>-1 Power"),

	Power: new tile("power",
		function() {
		},
		function() {
			power += 5;
		},
		"Power generation for the station.<p>+5 Power"),

	Connector: new tile("connector",
		null,
		null,
		"Connects to other modules")
};


function initGame() {
	score = 0;
	turns = 0;
	science = 0;
	power = 0;
	oxygen = 0;
	food = 0;
	people = 0;

	upcomingTiles = [];
	placed  = {};
	$(".tile").remove();

	fixBackgroundImage();
	placeTile(0,0, Tiles.Connector);
	inner.css("top", (playfield.height() - TILE_SIZE_PX)/2 + "px");
	inner.css("left", (playfield.width() - TILE_SIZE_PX - 18)/2 + "px");

	//initial sane set to get started with
	addUpcomingTile(Tiles.Power);
	addUpcomingTile(Tiles.Oxygen);
	addUpcomingTile(Tiles.Food);

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

function countTiles(tileType) {
	var count = 0;
	$.each(placed, function(index, placedY) {
		$.each(placedY, function(index2, placedXY) {
			if (placedXY.tile === tileType) {
				count++;
			}
		});
	});
	return count;
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
	if (tile.tipHtml) {
		var tip = $("<div>");
		tip.addClass("tip");
		tip.html(tile.tipHtml);
		tip.appendTo(elem);
	}
	return elem;
}

function placeTile(x,y, tile) {
	//remove old tile first
	var oldTile = getTile(x,y);
	if (oldTile) {
		oldTile.elem.remove();
	}

	if (tile.initHandler) {
		tile.initHandler();
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

	// these do not stack/store. Fresh values on each turn
	power = 0;
	oxygen = 0;

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

	oxygen -= people;

	turns += 1;
	score = turns + science;

	// End?
	// Check end before updating UI - we prefer not to display negatives
	if (power < 0) {
		stopGame("Blackout: Ran out of power");
	} else if (oxygen < 0) {
		stopGame("Asphyxiation: Not enough oxygen");
	} else if (food < 0) {
		stopGame("Starvation: No enough food to eat");
	} else {

		// still running
		updateScoreUI();
		updateUpcomingTiles();
	}

}

function addUpcomingTile(tile) {
	upcomingTiles.push(tile);
	var elem = makeTileElement(tile);
	$("#module-next").append(elem);
}

function updateUpcomingTiles() {

	while(upcomingTiles.length < 50) {
		addUpcomingTile(randomTile());
	}

	var elems = $("#module-next .tile");
	elems.removeClass("choosable").removeClass("selected");
	for (i=0; i<CHOOSALBE_SIZE && i < elems.length; ++i) {
		$(elems[i]).addClass("choosable");
	}
}

function removeChoosableUpcomingTile(index) {
	upcomingTiles.splice(index, 1);
	$("#module-next .tile")[index].remove();
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


/* new tile spaces are clickable (when visible) */
inner.on("click", ".tile-new", function(e) {
	e.preventDefault();
	if (wasDragged || !running || upcomingChosenIndex < 0) {
		return;
	}
	//clicked x,y on a New tile
	var clickX = Math.floor((e.pageX - inner.offset().left) / TILE_SIZE_PX);
	var clickY = Math.floor((e.pageY - inner.offset().top) / TILE_SIZE_PX);
	// place the next in line tile here
	placeTile(clickX, clickY, upcomingTiles[upcomingChosenIndex]);
	removeChoosableUpcomingTile(upcomingChosenIndex);
	upcomingChosenIndex = -1;
	$(".tile-new").css("display", "none");
	// do turn-based stuff
	nextTurn();
});

$("#module-next").on("click", ".tile.choosable", function() {
	$("#module-next .tile").removeClass("selected");
	upcomingChosenIndex = $.inArray(this, $("#module-next .tile.choosable"));
	if (upcomingChosenIndex >= 0) {
		$(this).addClass("selected");
		$(".tile-new").css("display", "block");
	}
});

$("#start").on("click", startGame);
