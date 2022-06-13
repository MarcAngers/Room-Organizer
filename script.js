window.onload = function() {
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

    function renderFrame() {
        requestAnimationFrame(renderFrame);

        ctx.fillStyle = "white";
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
        
    }

    renderFrame();
}