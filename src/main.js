let { init, Sprite, GameLoop, pointerPressed, pointer, keyPressed } = kontra
let { canvas, context } = init();

let sprites = [];
let heightmap = [];
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
    console.log(seed);
    heightmap = [];
    let terrainLayers = 6;
    let currentlayerPoints = 8;
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
    heightmap = heightmap.map((point) => ((point-min)/(max-min) *0.5 +0.25));

    let blockWidth = canvas.width / heightmap.length;
    // make it two screens wide + add scrolling based on bullet / player position (freecam?)
    for (i = 0; i < heightmap.length; i++) {
        let block = Sprite({
            x: blockWidth * i,
            y: (1-heightmap[i]) * canvas.height,
            width: blockWidth,
            height: blockWidth,
            color: "green",
            type: "block"
        });
        sprites.push(block);
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
        ctx.strokeStyle = 'white';
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
    dy: 3,
    width: 20,
    height: 40,
    color: 'red',
    // pass a custom update function to the sprite
    update() {
    // move the sprite with the keyboard
    if (keyPressed('up') || keyPressed('w')) {
        this.y -= this.dy;
    }
    if (keyPressed('down') || keyPressed('s')) {
        this.y += this.dy;
    }

    if (keyPressed('left') || keyPressed('a')) {
        this.x -= this.dx;
    }
    if (keyPressed('right') || keyPressed('d')) {
        this.x += this.dx;
    }

    // reset the sprites position when it reaches the edge of the game
    if (this.x > canvas.width) {
        this.x = -this.width;
    }
    else if (this.x < -this.width) {
        this.x = canvas.width;
    }

    if (this.y > canvas.height) {
        this.y = -this.height;
    }
    else if (this.y < -this.height) {
        this.y = canvas.height;
    }
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
    console.log(`sprites: ${sprites.length}`);
    sprites.map(sprite => {
      sprite.update();
    });
    sprites = sprites.filter(sprite => sprite.isAlive());
    if (keyPressed('space')){
        SpawnBullet(pointer.x, pointer.y, Math.random() * 4 -2,(Math.random()*3+2)*-1);
    }
  },
  render() { // render the game state
    sprites.map(sprite => sprite.render());
  },
});

loop.start();    // start the game