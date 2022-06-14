class Piece {
    constructor(width, height, type) {
        this.width = width;
        this.height = height;

        this.x = -0.5 * width;
        this.y = -0.5 * height;

        this.extensions = [];
        this.type = type;
        this.selected = false;
    }

    getArea() {
        return this.width * this.height;
    }

    contains(x, y, scaling_factor) {
        scaling_factor *= 50;

        let left = this.x * scaling_factor + 500;
        let top = this.y * scaling_factor + 500;

        let right = left + this.width * scaling_factor;
        let bottom = top + this.height * scaling_factor;

        if ((x > left && x < right) && (y > top && y < bottom))
            return true;
        
        return false;
    }

    draw(scaling_factor, context) {
        scaling_factor *= 50;

        // replace this with a switch later probably?
        if (this.type)
            context.strokeStyle = "#5599dd";
        else
            context.strokeStyle = "#3366aa";

        if (this.selected)
            context.strokeStyle = "#55cc55";

        context.lineWidth = 3;
        context.strokeRect(this.x * scaling_factor + 500, this.y * scaling_factor + 500, this.width * scaling_factor, this.height * scaling_factor);

        context.fillStyle = "#eeeeee88";
        context.fillRect(this.x * scaling_factor + 501, this.y * scaling_factor + 501, this.width * scaling_factor - 3, this.height * scaling_factor - 3);
    }
}

window.onload = function() {
    var pieces = [];
    var selected = null;

    var canvas = document.getElementById("canvas");
    var WIDTH = canvas.width;
    var HEIGHT = canvas.height;
    var ctx = canvas.getContext("2d");

    var grid_freq = 10;
    var large_grid_freq = 100;
    
    var scaling_factor = 1;
    
    window.addEventListener("wheel", function(e) {
        if (e.wheelDelta > 0) {
            scaling_factor *= 1.025;
        } else {
            scaling_factor /= 1.025;
        }
        $("#scaling-factor-label").html(parseFloat(2 / scaling_factor).toFixed(2) + "m");
    }, false);

    $("#canvas").on("click", function(e) {
        let x = e.originalEvent.x;
        let y = e.originalEvent.y;
        console.log(x, y);
        let smallestArea = Number.MAX_VALUE;
        var newSelected = null;
        
        for (i = 0; i < pieces.length; i++) {
            if (pieces[i].contains(x, y, scaling_factor))
                if (pieces[i].getArea() < smallestArea) {
                    newSelected = pieces[i];
                }
        }

        if (newSelected != null) {
            selected = newSelected;
            selected.selected = true;
        } else {
            if (selected != null) {
                selected.selected = false;
                selected = null;
            }
        }
    });

    $("#room-dimensions-add").on("click", function() {
        let width = $("#room-width").val();
        let height = $("#room-height").val();

        if (width == undefined || width == null || width == 0 || height == undefined || height == null || height == 0)
            return;

        pieces.push(new Piece(width, height, 0));
    });

    function renderFrame() {
        requestAnimationFrame(renderFrame);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // draw small gridlines
        ctx.fillStyle = "#dddddd";
        for (i = 500; i < WIDTH; i += (grid_freq * scaling_factor))
            ctx.fillRect(i, 0, 1, HEIGHT);
        for (i = 500; i >= 0; i -= (grid_freq * scaling_factor))
            ctx.fillRect(i, 0, 1, HEIGHT);
        for (i = 500; i < HEIGHT; i += (grid_freq * scaling_factor))
            ctx.fillRect(0, i, WIDTH, 1);
        for (i = 500; i >= 0; i -= (grid_freq * scaling_factor))
            ctx.fillRect(0, i, WIDTH, 1);

        // draw large gridlines
        ctx.fillStyle = "#aaaaaa";
        for (i = 500; i < WIDTH; i += (large_grid_freq * scaling_factor))
            ctx.fillRect(i, 0, 3, HEIGHT);
        for (i = 500; i >= 0; i -= (large_grid_freq * scaling_factor))
            ctx.fillRect(i, 0, 3, HEIGHT);
        for (i = 500; i < HEIGHT; i += (large_grid_freq * scaling_factor))
            ctx.fillRect(0, i, WIDTH, 3);
        for (i = 500; i >= 0; i -= (large_grid_freq * scaling_factor))
            ctx.fillRect(0, i, WIDTH, 3);

        pieces.forEach(piece => piece.draw(scaling_factor, ctx));
    }

    renderFrame();
}