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

const PPM = 50; // Pixels Per Meter
const GRID_FREQ = 10;
const LARGE_GRID_FREQ = 100;
const WIDTH = 8000;
const HEIGHT = 8000;

var scaling_factor = 1;

var Xtranslation = 400;
var Ytranslation = 400;

class Piece {
    constructor(width, height, room, round) {
        this.width = width;
        
        if (round) {
            this.height = width;
            this.x = 0;
            this.y = 0;
        } else {
            this.height = height;

            this.x = -0.5 * width; // In meters
            this.y = -0.5 * height; // In meters
        }
        this.rotation = 0;

        this.name = "";

        this.extensions = [];
        this.state = PieceState.Normal;
        this.isRoom = room;
        this.isRound = round;

        this.Xoffset = 0; // In pixels
        this.Yoffset = 0; // In pixels
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

    contains(x, y) {
        x = (x - Xtranslation) / scaling_factor;
        y = (y - Ytranslation) / scaling_factor;

        let left = this.x * PPM;
        let top = this.y * PPM;

        let right = left + this.width * PPM;
        let bottom = top + this.height * PPM;

        console.log([left, top, right, bottom], [x, y]);

        if ((x > left && x < right) && (y > top && y < bottom))
            return true;
        
        return false;
    }

    offset(x, y) {
        this.Xoffset = x - (this.x * PPM * scaling_factor);
        this.Yoffset = y - (this.y * PPM * scaling_factor);
    }
    offsetRotation(x) {
        this.Xoffset = x;
        this.oldRotation = this.rotation;
    }

    move(newX, newY) {
        this.x = (newX - this.Xoffset) / (PPM * scaling_factor);
        this.y = (newY - this.Yoffset) / (PPM * scaling_factor);
    }
    rotate(newX) {
        this.rotation = this.oldRotation + (newX - this.Xoffset) * 0.5;
    }

    draw(context) {
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

        context.translate(this.getCenter()[0] * PPM, this.getCenter()[1] * PPM);
        context.rotate(-(this.rotation) * (Math.PI / 180));
        context.translate(-(this.getCenter()[0] * PPM), -(this.getCenter()[1] * PPM));

        context.lineWidth = 3;

        if (this.isRound) {
            context.beginPath();
            context.arc(this.x * PPM, this.y * PPM, (this.width * PPM) / 2, 0, 2 * Math.PI, false);
            context.stroke();

            context.fillStyle = "#eeeeee44";
            context.fill();
        } else {
            context.strokeRect(this.x * PPM, this.y * PPM, this.width * PPM, this.height * PPM);
    
            context.fillStyle = "black";
            context.fillText(this.name, this.getCenter()[0] * PPM - 3*this.name.length, this.getCenter()[1] * PPM + 9);
    
            context.fillStyle = "#eeeeee44";
            context.fillRect(this.x * PPM + 1, this.y * PPM + 1, this.width * PPM - 3, this.height * PPM - 3);
        }

        context.translate(this.getCenter()[0] * PPM, this.getCenter()[1] * PPM);
        context.rotate(this.rotation * (Math.PI / 180));
        context.translate(-(this.getCenter()[0] * PPM), -(this.getCenter()[1] * PPM));
    }
}

window.onload = function() {
    var pieces = [];
    var selected = null;
    var state = ViewState.Normal;

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.font = "18px Arial";
    ctx.setTransform(scaling_factor, 0, 0, scaling_factor, Xtranslation, Ytranslation);

    var Xanchor, Yanchor;
    
    window.addEventListener("wheel", function(e) {
        if (e.wheelDelta > 0) {
            scaling_factor *= 1.025;
        } else {
            scaling_factor /= 1.025;
        }
        $("#scaling-factor-label").html(parseFloat(2 / scaling_factor).toFixed(2) + "m");
        ctx.setTransform(scaling_factor, 0, 0, scaling_factor, Xtranslation, Ytranslation);
    }, false);

    $("#canvas").on("mousedown", function(e) {       
        if (state == ViewState.PreMove) {
            if (selected.contains(e.pageX, e.pageY)) {
                selected.offset(e.pageX, e.pageY);
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
                if (pieces[i].contains(x, y))
                    if (pieces[i].getArea() < smallestArea) {
                        newSelected = pieces[i];
                    }
            }

            if (newSelected != null) {
                if (selected == null) {
                    selected = newSelected;
                    $("#piece-name-input").val(selected.name);
                    selected.state = PieceState.Selected;
                    state = ViewState.Selected;
                } else if (newSelected == selected) {
                    Xanchor = x - Xtranslation;
                    Yanchor = y - Ytranslation;
                    state = ViewState.Panning;
                } else {
                    selected.state = PieceState.Normal;
                    selected = newSelected;
                    $("#piece-name-input").val(selected.name);
                    selected.state = PieceState.Selected;
                    state = ViewState.Selected;
                }
            } else {
                if (selected != null) {
                    selected.state = PieceState.Normal;
                    state = ViewState.Normal;
                    selected = null;
                    $("#piece-name-input").val("");
                } else {
                    Xanchor = x - Xtranslation;
                    Yanchor = y - Ytranslation;
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
            selected.move(e.pageX, e.pageY);
        if (state == ViewState.Rotating)
            selected.rotate(e.pageX);
        
        if (state == ViewState.Panning) {
            Xtranslation = (e.pageX - Xanchor);
            Ytranslation = (e.pageY - Yanchor);
            ctx.setTransform(scaling_factor, 0, 0, scaling_factor, Xtranslation, Ytranslation);
        }
    });

    $("#room-dimensions-add").on("click", function() {
        if (state == ViewState.PreMove || state == ViewState.Moving)
            return;
        
        let width = $("#room-width").val();
        let height = $("#room-height").val();

        if (width == undefined || width == null || width == 0 || height == undefined || height == null || height == 0)
            return;

        pieces.push(new Piece(width, height, true, false));
    });
    $("#furniture-dimensions-add").on("click", function() {
        if (state == ViewState.PreMove || state == ViewState.Moving)
            return;
        
        let width = $("#furniture-width").val();
        let height = $("#furniture-height").val();

        if (width == undefined || width == null || width == 0)
            return;

        if (!$("#round-check").is(":checked") && (height == undefined || height == null || height == 0))
            return;

        pieces.push(new Piece(width, height, false, $("#round-check").is(":checked")));
    });

    $("#move").on("click", function() {
        if (state == ViewState.Normal)
            return;
        
        if (state == ViewState.PreMove) {
            state = ViewState.Normal;
            selected.state = PieceState.Normal;
            selected = null;
            $("#piece-name-input").val("");
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
            $("#piece-name-input").val("");
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
            $("#piece-name-input").val("");
        }
    });
    $("#home").on("click", function() {
        Xtranslation = 400;
        Ytranslation = 400;
        scaling_factor = 1;
        ctx.setTransform(scaling_factor, 0, 0, scaling_factor, Xtranslation, Ytranslation);
    });

    $("#round-check").on("change", function() {
        if ($("#round-check").is(":checked")) {
            $("#furniture-add-text").html("diameter");
            $("#furniture-height").addClass("hidden");
        } else {
            $("#furniture-add-text").html("by");
            $("#furniture-height").removeClass("hidden");
        }
    });

    $("#piece-name-input").on("change", function() {
        if (state != ViewState.Selected)
            return;
        
        selected.name = $("#piece-name-input").val();
    });

    function renderFrame() {
        requestAnimationFrame(renderFrame);

        ctx.fillStyle = "#aaaaaa";
        ctx.fillRect(-WIDTH, -HEIGHT, WIDTH*2, HEIGHT*2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-(WIDTH / 2), -(HEIGHT / 2), WIDTH, HEIGHT);

        // draw small gridlines
        ctx.fillStyle = "#dddddd";
        for (i = -(WIDTH / 2); i < WIDTH; i += GRID_FREQ)
            ctx.fillRect(i, -(HEIGHT / 2), 1, HEIGHT);
        for (i = -(HEIGHT / 2); i < HEIGHT; i += GRID_FREQ)
            ctx.fillRect(-(WIDTH / 2), i, WIDTH, 1);
        
        // draw large gridlines
        ctx.fillStyle = "#aaaaaa";
        for (i = -(WIDTH / 2); i < WIDTH; i += LARGE_GRID_FREQ)
            ctx.fillRect(i, -(HEIGHT / 2), 3, HEIGHT);
        for (i = -(HEIGHT / 2); i < HEIGHT; i += LARGE_GRID_FREQ)
            ctx.fillRect(-(WIDTH / 2), i, WIDTH, 3);

        pieces.forEach(piece => piece.draw(ctx));
    }

    renderFrame();
}