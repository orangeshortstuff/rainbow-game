let { init, Sprite, GameLoop, pointerPressed, pointer, keyPressed } = kontra
let { canvas, context } = init();
//let mySongData = zzfxM(...menu_theme);

let sprites = [];
let blocks = [];
let heightmap = [];
let cameraX = 0;
const terrainLayers = 6;
const baseTerrainPoints = 8;
kontra.initKeys();
kontra.initPointer();
function cosp(a, b, mu) {
    mu2 = (1 - Math.cos(mu * Math.PI)) / 2;
    return a * (1 - mu2) + b * mu2;
}

// need replicable PRNG for multiplayer
function xorshift32(a) {
    a ^= a << 13; a ^= a >>> 17; a ^= a << 5;
    return (a >>> 0);
}

function generateTerrain(seed) {
    //console.log(seed);
    blocks = [];
    heightmap = [];
    let currentlayerPoints = baseTerrainPoints;
    let currentStrength = 0.5;
    for (i = 0; i < terrainLayers; i++) {
        let layer = [];
        for (j = 0; j <= currentlayerPoints; j++) {
            seed = xorshift32(seed);
            layer[j] = seed/4294967296;
        }
        layer = layer.map((point) => (point*currentStrength));
        heightmap.push(layer);
        currentlayerPoints *= 2;
        currentStrength *= 0.5;
    }
    // merge layers
    for (i = 0; i < terrainLayers-1; i++) {
        let len = heightmap[i].length;
        for (j=0; j<heightmap[terrainLayers-1].length; j++) {
            let idx = j/Math.pow(2,(terrainLayers-1)-i);
            heightmap[terrainLayers-1][j] += cosp(heightmap[i][Math.floor(idx)],heightmap[i][Math.ceil(idx)], idx-Math.floor(idx));
        }
    }
    heightmap = heightmap[terrainLayers-1];
    heightmap = heightmap.slice(0,(heightmap.length+1));
    let min = Math.min(...heightmap); let max = Math.max(...heightmap);
    heightmap = heightmap.map((point) => ((point-min)/(max-min) *0.5 +0.2));
    // smoothing over an average of 3
    let smoothedHeights = [];
    smoothedHeights.push((heightmap[0] + heightmap[1])/2.0);
    for (var i = 1; i < heightmap.length-1; i++)
    {
        var mean = (heightmap[i] + heightmap[i-1] + heightmap[i+1])/3.0;
        smoothedHeights.push(mean);
    }
    smoothedHeights.push((heightmap[heightmap.length-1] + heightmap[heightmap.length-2])/2.0);
    heightmap = smoothedHeights;

    let blockWidth = canvas.width*2 / heightmap.length;
    // todo: make it two screens wide + add scrolling based on bullet / player position (freecam?)
    for (i = 0; i < heightmap.length; i++) {
        let block = Sprite({
            x: blockWidth * i,
            y: (1-heightmap[i]) * canvas.height,
            width: blockWidth,
            height: blockWidth,
            color: "green",
            type: "block",
            render() {
                // draw a right-facing triangle
                let ctx = this.context;
                ctx.strokeStyle = 'green';
                ctx.fillStyle = 'green';
                ctx.save();
                ctx.translate(this.x-cameraX, this.y);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.width, this.drop);
                ctx.lineTo(this.width, this.drop+20);
                ctx.lineTo(0, 20);
                ctx.fill();
                ctx.closePath();
                ctx.stroke();
                ctx.strokeStyle = '#713b22';
                ctx.fillStyle = '#713b22';
                ctx.beginPath();
                ctx.moveTo(0, 20);
                ctx.lineTo(this.width, this.drop+20);
                ctx.lineTo(this.width, 600);
                ctx.lineTo(0, 600);
                ctx.fill();
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            },
        });
        block.drop = (i+1 == heightmap.length ? 0 : ((1-heightmap[i+1]) * canvas.height)-block.y);
        blocks.push(block);
    }
}

function SpawnBullet(p_x,p_y,v_x,v_y) {
let bullet = Sprite({
    x: p_x,
    y: p_y,
    dx: v_x,
    dy: v_y,
    ddy: 0.05,
    width: 20,
    height: 20,
    colour:"white",
    rotation: Math.atan2(this.dy, this.dx),
    render() {
        // draw a right-facing triangle
        let ctx = this.context;
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'white';
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.moveTo(-3, -5);
        ctx.lineTo(12, 0);
        ctx.lineTo(-3, 5);
        ctx.fill();
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    },
    update() {
        this.rotation=Math.atan2(this.dy, this.dx);
        this.advance();
        if (this.y > canvas.height) {
            this.ttl = 0;
        }
        if (this.x > canvas.width || this.x < 0) {
            this.ttl = 0;
        }
    }
});
sprites.push(bullet);
}

let player = Sprite({
    x: 290,
    y: 180,
    dx: 3,
    dy: 0,
    ddy: 0,
    width: 40,
    height: 30,
    color: 'red',
    grounded: true,
    update() {
        // move the sprite with the keyboard
        if (keyPressed('left') || keyPressed('a')) {
            this.x -= this.dx;
        }
        if (keyPressed('right') || keyPressed('d')) {
            this.x += this.dx;
        }
        // reset the sprites position when it reaches the edge of the game
        if (this.x > canvas.width*2 - this.width) {
            this.x = canvas.width*2 - this.width;
        }
        else if (this.x < 0) {
            this.x = 0;
        }
        let prevX = this.x;
        this.advance();
        this.x = prevX;
        // collisions with ground
        let totalPoints = (baseTerrainPoints*Math.pow(2,terrainLayers-1))+1;
        //console.log(totalPoints);
        let blockWidth = (canvas.width*2/totalPoints);
        //blockWidth = (canvas.width*2/257);
        let t_left = this.x / blockWidth, t_right = (this.x+this.width) / blockWidth;
        let firstBlock = Math.floor(t_left);
        let lastBlock = Math.ceil(t_right);
        t_left -= firstBlock; t_right -= lastBlock-1;
        lastBlock--;
        // check first / last block - if any in between
        let left_corner = ((heightmap[firstBlock+1] - heightmap[firstBlock])*t_left)+heightmap[firstBlock];
        let right_corner = ( lastBlock+1 === heightmap.length ? heightmap[lastBlock]: ((heightmap[lastBlock+1] - heightmap[lastBlock])*t_right)+heightmap[lastBlock]);
        let floorHeight =(Math.max(...heightmap.slice(firstBlock+1, lastBlock+1),left_corner, right_corner));
        let worldFloor = ((1-floorHeight) * canvas.height) - this.height;
        if (worldFloor > this.y) {
            this.grounded = false;
            this.ddy = 0.15;
        } else {
            this.grounded = true;
            this.ddy = 0;
            this.dy = 0;
            this.y = worldFloor;
            if (keyPressed("up")||keyPressed("w")) {
                this.dy = -5;
                this.y -= 5;
            }
        }
    },
    render() {
        this.x -= cameraX;
        this.draw();
        this.x += cameraX;
    }
});
sprites.push(player);

// prevent default key behavior
kontra.bindKeys(['up', 'down', 'left', 'right'], function(e) {
    e.preventDefault();
});

generateTerrain(Date.now() & 0xFFFFFFFF);
//generateTerrain(306379322);
let loop = GameLoop({  // create the main game loop
  update() { // update the game state
    //console.log(`sprites: ${sprites.length}`);
    sprites.map(sprite => {
      sprite.update();
    });
    sprites = sprites.filter(sprite => sprite.isAlive());
    if (keyPressed('space')){
        SpawnBullet(pointer.x, pointer.y, Math.random() * 4 -2,(Math.random()*3+2)*-1);
    }
    if (keyPressed('q')){
        cameraX -=5;
    }
    if (keyPressed('e')){
        cameraX +=5;
    }
    cameraX = Math.min(canvas.width,Math.max(0, cameraX));
  },
  render() { // render the game state
    sprites.map(sprite => sprite.render());
    blocks.map(block => block.render());
  },
});

loop.start();    // start the game