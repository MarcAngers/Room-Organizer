const ViewState = {
    Normal: "Normal",
    Selected: "Selected",
    Panning: "Panning",
    PreMove: "PreMove",
    Moving: "Moving",
    PreRotate: "PreRotate",
    Rotating: "Rotating"
}

const PieceState = {
    Normal: "Normal",
    Selected: "Selected",
    Moving: "Moving",
    Rotating: "Rotating"
}

var scaling_factor = 1;

var Xtranslation = 0;
var Ytranslation = 0;

class Piece {
    constructor(width, height, room) {
        this.width = width;
        this.height = height;

        this.x = -0.5 * width;
        this.y = -0.5 * height;
        this.rotation = 0;

        this.extensions = [];
        this.state = PieceState.Normal;
        this.isRoom = room;

        this.Xoffset = 0;
        this.Yoffset = 0;
        this.oldRotation = 0;
    }

    getArea() {
        return this.width * this.height;
    }
    getCenter() {
        if (this.extensions.length == 0)
            return [(this.x + this.width / 2), (this.y + this.height / 2)];
        else
            console.log("this is gonna be difficult");
    }

    contains(x, y, scaling_factor) {
        scaling_factor *= 50;

        let left = this.x * scaling_factor;
        let top = this.y * scaling_factor;

        let right = left + this.width * scaling_factor;
        let bottom = top + this.height * scaling_factor;

        if ((x > left && x < right) && (y > top && y < bottom))
            return true;
        
        return false;
    }

    offset(x, y, scaling_factor) {
        scaling_factor *= 50;

        this.Xoffset = x - (this.x * scaling_factor);
        this.Yoffset = y - (this.y * scaling_factor);
    }
    offsetRotation(x) {
        this.Xoffset = x;
        this.oldRotation = this.rotation;
    }

    move(newX, newY, scaling_factor) {
        scaling_factor *= 50;

        this.x = (newX - this.Xoffset) / scaling_factor;
        this.y = (newY - this.Yoffset) / scaling_factor;
    }
    rotate(newX) {
        this.rotation = this.oldRotation + (newX - this.Xoffset) * 0.5;
    }

    draw(scaling_factor, context) {
        scaling_factor *= 50;

        switch (this.state) {
            case PieceState.Normal:
                if (this.isRoom)
                    context.strokeStyle = "#5599dd";
                else
                    context.strokeStyle = "#3366aa";
                break;
            case PieceState.Selected:
                context.strokeStyle = "#55cc55";
                break;
            case PieceState.Moving:
            case PieceState.Rotating:
                context.strokeStyle = "#dddd44";
                break;
        }

        context.translate(this.getCenter()[0] * scaling_factor, this.getCenter()[1] * scaling_factor);
        context.rotate(-(this.rotation) * (Math.PI / 180));
        context.translate(-(this.getCenter()[0] * scaling_factor), -(this.getCenter()[1] * scaling_factor));

        context.lineWidth = 3;
        context.strokeRect(this.x * scaling_factor, this.y * scaling_factor, this.width * scaling_factor, this.height * scaling_factor);

        context.fillStyle = "#eeeeee44";
        context.fillRect(this.x * scaling_factor + 1, this.y * scaling_factor + 1, this.width * scaling_factor - 3, this.height * scaling_factor - 3);

        context.translate(this.getCenter()[0] * scaling_factor, this.getCenter()[1] * scaling_factor);
        context.rotate(this.rotation * (Math.PI / 180));
        context.translate(-(this.getCenter()[0] * scaling_factor), -(this.getCenter()[1] * scaling_factor));
    }
}

window.onload = function() {
    var pieces = [];
    var selected = null;
    var state = ViewState.Normal;

    var canvas = document.getElementById("canvas");
    var WIDTH = 10000;
    var HEIGHT = 10000;
    var ctx = canvas.getContext("2d");

    var grid_freq = 10;
    var large_grid_freq = 100;
    
    window.addEventListener("wheel", function(e) {
        if (e.wheelDelta > 0) {
            scaling_factor *= 1.025;
        } else {
            scaling_factor /= 1.025;
        }
        $("#scaling-factor-label").html(parseFloat(2 / scaling_factor).toFixed(2) + "m");
    }, false);

    $("#canvas").on("mousedown", function(e) {       
        if (state == ViewState.PreMove) {
            if (selected.contains(e.pageX - Xtranslation, e.pageY - Ytranslation, scaling_factor)) {
                selected.offset(e.pageX, e.pageY, scaling_factor);
                state = ViewState.Moving;
            }
        }
        if (state == ViewState.PreRotate) {
            selected.offsetRotation(e.pageX);
            state = ViewState.Rotating;
        }
        if (state == ViewState.Normal || state == ViewState.Selected) {
            let x = e.pageX;
            let y = e.pageY;
            let smallestArea = Number.MAX_VALUE;
            var newSelected = null;
            
            for (i = 0; i < pieces.length; i++) {
                if (pieces[i].contains(x - Xtranslation, y - Ytranslation, scaling_factor))
                    if (pieces[i].getArea() < smallestArea) {
                        newSelected = pieces[i];
                    }
            }

            if (newSelected != null) {
                selected = newSelected;
                selected.state = PieceState.Selected;
                state = ViewState.Selected;
            } else {
                if (selected != null) {
                    selected.state = PieceState.Normal;
                    state = ViewState.Normal;
                    selected = null;
                } else {
                    state = ViewState.Panning;
                }
            }
        }
    });
    $("#canvas").on("mouseup", function() {
        if (state == ViewState.Moving)
            state = ViewState.PreMove;
        if (state == ViewState.Rotating)
            state = ViewState.PreRotate;
        if (state == ViewState.Panning)
            state = ViewState.Normal;
    });
    $("#canvas").on("mousemove", function(e) {
        if (state == ViewState.Moving)
            selected.move(e.pageX, e.pageY, scaling_factor);
        if (state == ViewState.Rotating)
            selected.rotate(e.pageX);
        
        if (state == ViewState.Panning) {
            Xtranslation += (e.pageX - Xtranslation);
            Ytranslation += (e.pageY - Ytranslation);
            ctx.setTransform(1, 0, 0, 1, Xtranslation, Ytranslation);
        }
    });

    $("#room-dimensions-add").on("click", function() {
        if (state == ViewState.PreMove || state == ViewState.Moving)
            return;
        
        let width = $("#room-width").val();
        let height = $("#room-height").val();

        if (width == undefined || width == null || width == 0 || height == undefined || height == null || height == 0)
            return;

        pieces.push(new Piece(width, height, true));
    });

    $("#move").on("click", function() {
        if (state == ViewState.Normal)
            return;
        
        if (state == ViewState.PreMove) {
            state = ViewState.Normal;
            selected.state = PieceState.Normal;
            selected = null;
        }

        if (state == ViewState.Selected) {
            state = ViewState.PreMove;
            selected.state = PieceState.Moving;
        }

        $("#move-inner").toggleClass("glyphicon-move");
        $("#move-inner").toggleClass("glyphicon-ok");
        $("#move").toggleClass("btn-light");
        $("#move").toggleClass("btn-success");
    });
    $("#rotate").on("click", function() {
        if (state == ViewState.Normal)
            return;
        
        if (state == ViewState.PreRotate) {
            state = ViewState.Normal;
            selected.state = PieceState.Normal;
            selected = null;
        }

        if (state == ViewState.Selected) {
            state = ViewState.PreRotate;
            selected.state = PieceState.Rotating;
        }

        $("#rotate-inner").toggleClass("glyphicon-refresh");
        $("#rotate-inner").toggleClass("glyphicon-ok");
        $("#rotate").toggleClass("btn-light");
        $("#rotate").toggleClass("btn-success");
    });

    $("#delete").on("click", function() {
        if (state == ViewState.Selected && confirm("Are you sure you want to delete this element?")) {
            pieces.splice(pieces.indexOf(selected), 1);
            selected = null;
        }
    });

    function renderFrame() {
        requestAnimationFrame(renderFrame);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-(WIDTH / 2), -(HEIGHT / 2), WIDTH, HEIGHT);

        // draw small gridlines
        ctx.fillStyle = "#dddddd";
        for (i = 500; i < WIDTH; i += (grid_freq * scaling_factor))
            ctx.fillRect(i, -(HEIGHT / 2), 1, HEIGHT);
        for (i = 500; i >= -(WIDTH / 2); i -= (grid_freq * scaling_factor))
            ctx.fillRect(i, -(HEIGHT / 2), 1, HEIGHT);
        for (i = 500; i < HEIGHT; i += (grid_freq * scaling_factor))
            ctx.fillRect(-(WIDTH / 2), i, WIDTH, 1);
        for (i = 500; i >= -(HEIGHT / 2); i -= (grid_freq * scaling_factor))
            ctx.fillRect(-(WIDTH / 2), i, WIDTH, 1);

        // draw large gridlines
        ctx.fillStyle = "#aaaaaa";
        for (i = 500; i < WIDTH; i += (large_grid_freq * scaling_factor))
            ctx.fillRect(i, -(HEIGHT / 2), 3, HEIGHT);
        for (i = 500; i >= -(WIDTH / 2); i -= (large_grid_freq * scaling_factor))
            ctx.fillRect(i, -(HEIGHT / 2), 3, HEIGHT);
        for (i = 500; i < HEIGHT; i += (large_grid_freq * scaling_factor))
            ctx.fillRect(-(WIDTH / 2), i, WIDTH, 3);
        for (i = 500; i >= -(HEIGHT / 2); i -= (large_grid_freq * scaling_factor))
            ctx.fillRect(-(WIDTH / 2), i, WIDTH, 3);

        pieces.forEach(piece => piece.draw(scaling_factor, ctx));
    }

    renderFrame();
}