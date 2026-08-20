let { init, Sprite, SpriteSheet, GameLoop, pointerPressed, pointer, keyPressed } = kontra
let { canvas, context } = init();
//let mySongData = zzfxM(...menu_theme);

let sprites = [];
let blocks = [];
let heightmap = [];
let cameraX = 0;
let currentMenu = 0;
let gameType = 2; // 1 for vs bot, 2 for local multiplayer, 3 for online, 0 for the lobby
let currentWood = 100, currentMetal = 100; // pickups are +3
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

function getWorldFloor(x, width, height) {
    let totalPoints = (baseTerrainPoints*Math.pow(2,terrainLayers-1))+1;
    let blockWidth = (canvas.width*2/totalPoints);
    let t_left = x / blockWidth, t_right = (x+width) / blockWidth;
    let firstBlock = Math.floor(t_left);
    let lastBlock = Math.ceil(t_right);
    t_left -= firstBlock; t_right -= lastBlock-1;
    lastBlock--;
    // check first / last block - if any in between
    let left_corner = ((heightmap[firstBlock+1] - heightmap[firstBlock])*t_left)+heightmap[firstBlock];
    let right_corner = ( lastBlock+1 === heightmap.length ? heightmap[lastBlock]: ((heightmap[lastBlock+1] - heightmap[lastBlock])*t_right)+heightmap[lastBlock]);
    let floorHeight =(Math.max(...heightmap.slice(firstBlock+1, lastBlock+1),left_corner, right_corner));
    let worldFloor = ((1-floorHeight) * canvas.height) - height;
    return worldFloor;
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
    width: 32,
    height: 32,
    color: 'blue',
    grounded: true,
    update() {
        // move the sprite with the keyboard
        if (currentMenu == 0) {
            if (keyPressed('left') || keyPressed('a')) {
                this.x -= this.dx;
                this._fx = -1;
                if (this.currentAnimation != this.animations["jump"] && this.currentAnimation != this.animations["fall"]) {
                    this.playAnimation("walk");
                }
            }
            else if (keyPressed('right') || keyPressed('d')) {
                this.x += this.dx;
                this._fx = 1;
                if (this.currentAnimation != this.animations["jump"] && this.currentAnimation != this.animations["fall"]) {
                    this.playAnimation("walk");
                }
            } else {
                this.playAnimation("idle");
            }
            // reset the sprites position when it reaches the edge of the game
            if (this.x > canvas.width*2 - this.width) {
                this.x = canvas.width*2 - this.width;
            }
            else if (this.x < 0) {
                this.x = 0;
            }
        }
        let prevX = this.x;
        this.advance();
        this.x = prevX;
        // collisions with ground
        let worldFloor = getWorldFloor(this.x, this.width, this.height);
        if (worldFloor > this.y) {
            this.grounded = false;
            this.ddy = 0.15;
            if (this.jumped || (this.dy > 1.5)) {
                if (this.dy < 0) {
                    this.playAnimation("jump");
                } else {
                    this.playAnimation("fall");
                }
            }
        } else {
            if (this.currentAnimation == this.animations["jump"] || this.currentAnimation == this.animations["fall"]) {
                this.playAnimation("idle");
            }
            this.grounded = true;
            this.jumped = false;
            this.ddy = 0;
            this.dy = 0;
            this.y = worldFloor;
            if ((keyPressed("up")||keyPressed("w")) && currentMenu == 0) { // prevent jumps if building
                this.dy = -5;
                this.y -= 5;
                this.jumped = true;
            }
        }
    },
    
    render() {
        this.x -= cameraX;
        // get an image for the spritesheet - render the horn separately
        let c = this.context;
        c.save();
        this.draw();
        c.restore();
        
        this.x += cameraX;
    }
});
sprites.push(player);

let unicorn_anims = {
    idle: {
        frames: 0,
        loop: false
    },
    walk: {
        frames: [1,2],
        frameRate: 6,
        loop: true,
    },
    jump: {
        frames: 3,
        loop: false
    },
    fall: {
        frames: 4,
        loop: false
    }
};
let unicorn_image = new Image();
unicorn_image.src = 'images/unicorn.png';
unicorn_image.onload = function() {
    let unicorn_sheet = SpriteSheet({
        image: unicorn_image,
        frameWidth: 16,
        frameHeight: 16,
        frameMargin: 0,
    });
    unicorn_sheet.createAnimations(unicorn_anims);
    player.animations = unicorn_sheet.animations;
    player.playAnimation('idle');
};

let unicorn_shift_image = new Image();
unicorn_shift_image.src = 'images/unicorn hueshift.png';
unicorn_shift_image.onload = function() {
    let unicorn_shift_sheet = SpriteSheet({
        image: unicorn_shift_image,
        frameWidth: 16,
        frameHeight: 16,
        frameMargin: 0,
    });
    unicorn_shift_sheet.createAnimations(unicorn_anims);
}

// prevent default key behavior
kontra.bindKeys(['up', 'down', 'left', 'right'], function(e) {
    e.preventDefault();
});

// button callbacks

function fireMenu() {
    currentMenu = 1;
}
const fb = document.querySelector(".btn-fire");
fb.onclick = function() {fireMenu();}

function buildMenu() {
    currentMenu = 2;
}
const bb = document.querySelector(".btn-build");
bb.onclick = function() {buildMenu();}

function endTurn() {
    alert("END TURN");
}
const etb = document.querySelector(".btn-end-turn");
etb.onclick = function() {endTurn();}

const uf = document.querySelector(".ui-fire");
const ub = document.querySelector(".ui-build");
const gc = document.querySelector(".game-controls");

generateTerrain(Date.now() & 0xFFFFFFFF);
//generateTerrain(306379322);
let loop = GameLoop({  // create the main game loop
  update() { // update the game state
    if (!gameType > 0) {
        gc.classList.add("none");
        gc.classList.add("hidden");
        return;
    } else {
        gc.classList.remove("none");
        gc.classList.remove("hidden");
    }
    uf.classList.add("none");
    ub.classList.add("none");
    // update current UI
    switch (currentMenu) {
        case 1: { uf.classList.remove("none"); break; }
        case 2: { ub.classList.remove("none"); 
            ub.innerHTML = `🪵: ${currentWood}<br/>🪨: ${currentMetal}`;
        }
        default: break;
    }
    
    sprites.map(sprite => {
      sprite.update();
    });
    sprites = sprites.filter(sprite => sprite.isAlive());
    if (keyPressed('space')){
        SpawnBullet(player.x, player.y, Math.random() * 4 -2,(Math.random()*3+2)*-1);
    }
    if (keyPressed('c')){
        currentMenu = 0;
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
    if (!gameType > 0) {return;}
    sprites.map(sprite => sprite.render());
    blocks.map(block => block.render());
  },
});

loop.start();    // start the game