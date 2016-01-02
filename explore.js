/** zombie */
var playfield = $("#playfield");
var inner = $("#playfield-inner");

var TILE_SIZE_PX = 48;

function tile(prefix) {
	this.prefix = prefix;
}

var Tiles = {
	GrassLand: new tile("grassland")
};

function placeTile(x,y, tile) {
	var elem = $("<div>");
	elem.addClass("tile").addClass(tile.prefix);
	elem.css("background-url", tile.prefix + ".png");
	elem.css("left", (x * TILE_SIZE_PX) + "px");
	elem.css("top", (y * TILE_SIZE_PX) + "px");
	elem.css("width", TILE_SIZE_PX + "px");
	elem.css("height", TILE_SIZE_PX + "px");
	inner.append(elem);
}

/* start */
placeTile(0,0, Tiles.GrassLand);
inner.css("top", (playfield.height() - TILE_SIZE_PX)/2 + "px");
inner.css("left", (playfield.width() - TILE_SIZE_PX)/2 + "px");

/* playfield is dragable */
playfield.on("mousedown", function(event) {
	var mouseDownX = event.pageX;
	var mouseDownY = event.pageY;
	var innerStart = inner.offset();
	event.setCapture && event.setCapture();
	playfield.on("mousemove", function(event) {
		var dx = event.pageX - mouseDownX;
		var dy = event.pageY - mouseDownY;
		var offset = inner.offset();
		offset.top = innerStart.top + dy;
		offset.left = innerStart.left + dx;
		inner.offset(offset);
	});
	playfield.on("mouseup", function(event) {
		playfield.off("mouseup").off("mousemove");
	});
});

