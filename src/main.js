import {zzfx, zzfxP, zzfxG, zzfxV, zzfxR, zzfxX, zzfxM} from  "../zzfxm.min.js";
const menu_theme = [[[,0,254,,,.25],[,0,440,,,,,,,,,,,80,,,,.75],[.6,0,64,,,.32,2,.3]],[[[,,9,,,,9,,,,,,9,,,,7,,,,7,,,,,,7,,,,7,,,,],[,,13,,,,13,,,,,,13,,,,12,,,,12,,,,,,12,,,,12,,,,],[,,16,,,,16,,,,,,16,,,,14,,,,14,,,,,,14,,,,14,,,,],[2,,9,,,,16,,,,16,,9,,,,7,,,,,,,,,,,,5,,7,,8,,],[1,,,,,,1,,1,,,,,,1,,,,,,,,1,,1,,,,1,,,,1,,]],[[,,9,,,,9,,,,,,9,,,,7,,,,,,7,,,,,,,,,,,,],[,,13,,,,13,,,,,,13,,,,12,,,,,,12,,,,,,,,,,,,],[,,16,,,,16,,,,,,16,,,,14,,,,,,14,,,,,,,,,,,,],[2,,9,,,,16,,,,16,,9,,,,7,,,,,,19,,,,19,,18,,14,,15,,],[1,,,,,,1,,1,,,,,,1,,,,,,,,1,,1,,,,1,,1,,1,,]],[[,,9,,,,9,,,,,,9,,,,7,,,,7,,,,,,7,,,,7,,,,],[,,13,,,,13,,,,,,13,,,,12,,,,12,,,,,,12,,,,12,,,,],[,,16,,,,16,,,,,,16,,,,14,,,,14,,,,,,14,,,,14,,,,],[2,,16,,9,,,,,,,,9,,14,,7,,,,7,,,,,,7,,,,7,,,,],[1,,,,,,1,,1,,,,,,1,,,,,,,,1,,1,,,,1,,,,1,,]],[[,,5,,,,5,,,,,,5,,,,7,,,,7,,,,,,7,,,,7,,,,],[,,7,,,,7,,,,,,7,,,,5,,,,12,,,,,,12,,,,12,,,,],[,,12,,,,12,,,,,,12,,,,12,,,,14,,,,,,14,,,,14,,,,],[2,,5,,,,5,,,,2.5,,5,,,,5,,,,,,4,,,,4,,,,2,,,,],[1,,,,,,1,,1,,,,,,1,,,,,,,,1,,1,,,,1,,1,,1,,]],[[1,,,,,,1,,1,,,,,,1,,,,,,,,1,,1,,,,1,,,,1,,]],[[1,,,,,,1,,1,,,,,,1,,1,,,,,,1,,1,,,,1,,1,,1,,]],[[1,,,,,,1,,1,,,,1,,1.49,,1,,,,,,,,,,,,,,,,,,]]],[0,1,2,3,0,1,2,3,4,5,6],155,{"title":"menu theme","instruments":["a","b","c"],"patterns":["0","1","2","3","4","5","6"]}];
let menu_data = zzfxM(...menu_theme);
let current_audio = zzfxP(...menu_data);
current_audio.loop = true;
current_audio.stop();

let fire_sfx = [,0,464,.01,.07,.08,2,2.5,-4,3,,,,,,,,.53,.09];
let explode_sfx = [2,,33,.09,.15,.41,4,.2,-6,-1,,,,.1,,.6,.23,.38,.18];
let spawn_sfx = [1.1,0,106,.01,.17,.33,,3.9,-7,,,,,.1,,.7,,.47,.07];
let pickup_sfx = [1.8,0,321,.03,.06,.26,1,2.4,,,239,.08,,,,,.1,.67,.01];
let jump_sfx = [.9,,395,.01,,,,3.5,11,65,,,,,,,,.72,.02,,-1499];
let win_sfx = [,0,325,.04,.2,.71,1,3.5,,158,350,.17,.03,,,,.25,.96,.26,.23,737];
let drill_hit_sfx = [.6,0,133,.01,.02,.13,,0,-1,-6,,,,1.2,,,,.51,.04];
let beam_charge_sfx = [.9,0,144,.05,.17,.83,1,3,.3,,,,,,,.1,,,.26];
let beam_fire_sfx = [,0,165,.02,.4,1.21,2,3.3,-.15,,,,,,,,.17,.76,.19];

import kontra, { init, initKeys, Sprite, SpriteSheet, GameLoop, keyPressed, on, off, emit, bindKeys } from "../kontra.min.mjs"

let { canvas } = init();
/*
const ws = new WebSocket('wss://relay.js13kgames.com/horns-of-war');
ws.onopen = _ => {
  ws.send('hello!')
}
ws.onmessage = event => {
  const msg = event.data
  switch (msg[0]) {
    case '@':
      console.log('My ID is:', msg.slice(1))
      break

    case '+':
      console.log('A client connected, ID:', msg.slice(1))
      break

    case '-':
      console.log('A client disconnected, ID:', msg.slice(1))
      break

    default:
      console.log('Message:', msg)
  }
} */

// left, right, down, jump, camera left/camera right, select material / weapon), fire/place, cancel
let controls = [
    ["a","d","s","w","q","e","z","x","c"],
    ["left","right","down","up", "k","l","b","n","m"]
];
let weapon_names = ["Horn","Drill","Beam"];
let sprites = [];
let blocks = [];
let heightmap = [];
let players = [];
let activePlayer = 0;
let cameraX = 0;
let currentMenu = 0;
let inMenuTransition = 0;
let gameType = 0; // 1 for vs bot, 2 for local multiplayer, 3 for online, 0 for the lobby
let seed = 0;
let windSpeed = 0;
let pressedWeaponLeft = 0, pressedWeaponRight = 0; // kontra 6 doesn't have onKey callbacks, so deal with weapon selection

const terrainLayers = 6;
const baseTerrainPoints = 8;
initKeys();

function cosp(a, b, mu) {
    let mu2 = (1 - Math.cos(mu * Math.PI)) / 2;
    return a * (1 - mu2) + b * mu2;
}

// need replicable PRNG for multiplayer
function xorshift32(a) {
    a ^= a << 13; a ^= a >>> 17; a ^= a << 5;
    return (a >>> 0);
}

// timers
let timers = [];
function getTimers(name) {
    return timers.filter(timer => timer.name == name);
};

function removeTimers(name) {
    if (getTimers(name)) {
        timers.map(timer => {
            off(`timer-${name}`, timer.callback);
            timer.ttl = Infinity; // sentinel for "should be removed without calling"
        });
    }
}
function setTimer(name, time, callback) {
    let timer = Sprite({
        width: 0,
        ttl: time,
        name: name,
        event: `timer-${name}`,
        update() {
            this.advance();
            if (!this.isAlive()) {
                emit(this.event);
            }
        }
    });
    on(`timer-${name}`, callback);
    timers.push(timer);
};

function generateTerrain(seed) {
    blocks = [];
    heightmap = [];
    let currentlayerPoints = baseTerrainPoints;
    let currentStrength = 0.5;
    for (let i = 0; i < terrainLayers; i++) {
        let layer = [];
        for (let j = 0; j <= currentlayerPoints; j++) {
            seed = xorshift32(seed);
            layer[j] = seed/4294967296;
        }
        layer = layer.map((point) => (point*currentStrength));
        heightmap.push(layer);
        currentlayerPoints *= 2;
        currentStrength *= 0.5;
    }
    // merge layers
    for (let i = 0; i < terrainLayers-1; i++) {
        let len = heightmap[i].length;
        for (let j=0; j<heightmap[terrainLayers-1].length; j++) {
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

// covers from frames 38-67. deletes on frame 105
function transitionCover() {
let cover = Sprite({
    x:0,
    y:-600,
    width:1000,
    height:650,
    color: "black",
    dy: 23,
    ddy: -0.44,
    update() {
        this.advance();
        if (this.y < -601) {
            this.ttl = 0;
        }
    }
});
sprites.push(cover);
}

function makePreviewPoint(i) {
    let preview = Sprite({
        anchor: {x: 0.5, y: 0.5},
        radius: (15-i)/2,
        color: `rgba(255, 255, 255, ${1-(i*0.03)})`,
        update() {
            let a = players[activePlayer];
            let magnitude = a.power * 0.18;
            let v_x = magnitude*Math.cos((Math.PI / 180) * a.angle)*a._fx;
            let v_y = magnitude*Math.sin((Math.PI / 180) * a.angle)*-1;
            let t = (8-this.radius)*6;
            this.x = a.x+ 8.5*(3*a._fx+1)+(t*v_x);
            this.y = a.y+(t*v_y+(t*t*0.075));
        },
        render() {
            if (currentMenu != 1) {return;}
            let c= this.context;
            c.save();
            c.translate(this.x-cameraX, this.y);
            c.fillStyle = this.color;
            c.beginPath();
            c.arc(0, 0, this.radius, 0, 2  * Math.PI);
            c.fill();
            c.restore();
        }
    });
    sprites.push(preview);
}

function makeExplosionParticle(x,y) {
    let theta = Math.random()*2*Math.PI;
    let r = 50*Math.sqrt(Math.random());
    let x_particle = Sprite({
        x: x + r*Math.cos(theta),
        y: y + r*Math.sin(theta),
        radius: (24*Math.random())+6,
        ttl: (55*Math.random())+5,
        update() {
            this.color=`lch(${45+(this.ttl*0.66)}% ${(0.33*this.ttl)+66} ${27.1+this.ttl})`;
            this.radius *= 0.92;
            if (this.radius < 0) {
                this.ttl = 0;
            }
        },
        render() {
            let c= this.context;
            c.save();
            c.translate(this.x-cameraX, this.y);
            c.fillStyle = this.color;
            c.beginPath();
            c.arc(0, 0, this.radius, 0, 2  * Math.PI);
            c.fill();
            c.restore();
        }
    });
    sprites.push(x_particle);
}

function explosion(x,y) {
    zzfx(...explode_sfx);
    // player damage
    players.map(player => {
        let dist = Math.hypot(x-(0.5*player.width +player.x),y-(0.5*player.height +player.y));
        if (dist < 100) {
            player.health -= Math.round(Math.max(0,Math.min(20,40-(dist/2.5))));
        }
        if (players[0].health < 1 && players[1].health < 1) {
            players[1-activePlayer].health = 1;
        }
        if (player.health < 1) {
            endGame();
        }
    });
    // spawn particles
    for(let i=0; i<20; i++) {
        makeExplosionParticle(x, y);
    }
}

function spawnBullet(p_x,p_y,v_x,v_y) {
removeTimers("turn-timeout");
let bullet = Sprite({
    x: p_x,
    y: p_y,
    dx: v_x,
    dy: v_y,
    ddx: windSpeed,
    ddy: 0.15,
    width: 15,
    height: 15,
    rotation: players[activePlayer].angle,
    render() {
        // draw a right-facing triangle
        let ctx = this.context;
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'white';
        ctx.save();
        ctx.translate(this.x-cameraX, this.y);
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
        cameraX = this.x-500;
        if (this.x > canvas.width*2 || this.x < 0) {
            this.ttl = 0;
            endTurn();
            return;
        }
        if (this.y > getWorldFloor(this.x, this.width, this.height)) {
            this.ttl = 0;
            endTurn();
            // explode on floor - calculate splash damage
            explosion(0.5*this.width+this.x, getWorldFloor(this.x, this.width, this.height));
            return;
        }
        // player collisions
        players.map(player => {
            if (this.x + this.width > player.x && this.x < player.x + player.width && 
                this.y + this.height > player.y && this.y < player.y + player.height) {
                this.ttl = 0;
                player.health -= 5;
                endTurn();
                explosion(0.5*this.width+this.x, 0.5*this.height+this.y);
                return;
            }
        });
    }
});
bullet.advance();
sprites.push(bullet);
}

function spawnDrill(p_x,p_y,v_x,v_y) {
removeTimers("turn-timeout");
let drill = Sprite({
    x: p_x,
    y: p_y,
    dx: v_x,
    dy: v_y,
    ddx: windSpeed,
    ddy: 0.15,
    width: 15,
    height: 15,
    rotation: players[activePlayer].angle,
    render() {
        // draw a right-facing triangle
        let ctx = this.context;
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'white';
        ctx.save();
        ctx.translate(this.x-cameraX, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.moveTo(-3, -5);
        ctx.lineTo(12, 0);
        ctx.lineTo(-3, 5);
        ctx.lineTo(-3, -5);
        ctx.fill();
        ctx.moveTo(0, 4);
        ctx.lineTo(0, -4);
        ctx.moveTo(3, 3);
        ctx.lineTo(3, -3);
        ctx.moveTo(6, 2);
        ctx.lineTo(6, -2);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    },
    update() {
        this.rotation=Math.atan2(this.dy, this.dx);
        this.advance();
        cameraX = this.x-500;
        if (this.x > canvas.width*2 || this.x < 0) {
            this.ttl = 0;
            endTurn();
            return;
        }
        if (this.y > getWorldFloor(this.x, this.width, this.height)) {
            this.ttl = 0;
            endTurn();
            zzfx(...drill_hit_sfx);
            return;
        }
        // player collisions
        players.map(player => {
            if (this.x + this.width > player.x && this.x < player.x + player.width && 
                this.y + this.height > player.y && this.y < player.y + player.height) {
                this.ttl = 0;
                zzfx(...drill_hit_sfx);
                player.health -= 30;
                if (player.health < 1) {
                    endGame();
                    return;
                }
                endTurn();
                return;
            }
        });
    }
});
drill.advance();
sprites.push(drill);
}

function spawnBeam() {
// callbacks must remove themselves
off("timer-beam-spawn", spawnBeam);
zzfx(...beam_fire_sfx);
let ap = players[activePlayer];
let v_x = Math.cos((Math.PI / 180) * ap.angle)*ap._fx;
let v_y = Math.sin((Math.PI / 180) * ap.angle)*-1;
let theta = Math.atan2(v_y, v_x);
let beam = Sprite({
    x: ap.x + 8.5*(3*ap._fx+1),
    y: ap.y,
    dx: 20*Math.cos(theta),
    dy: 20*Math.sin(theta),
    s_x: ap.x + 8.5*(3*ap._fx+1),
    s_y: ap.y,
    rotation: theta,
    height: 25,
    width: 5,
    color: "white",
    update() {
        this.advance();
        cameraX = this.x-500;
        if (this.x > canvas.width*2 || this.x < 0) {
            this.ttl = 0;
            endTurn();
            return;
        }
        if (this.y > getWorldFloor(this.x, this.width, this.height) || this.y < 0) {
            this.ttl = 0;
            endTurn();
            return;
        }
        // player collisions
        players.map(player => {
            if (this.x + this.width > player.x && this.x < player.x + player.width && 
                this.y + this.height > player.y && this.y < player.y + player.height) {
                this.ttl = 0;
                player.health -= 15;
                if (player.health < 1) {
                    endGame();
                    return;
                }
                endTurn();
                return;
            }
        });
    },
    render() {
        let c = this.context;
        c.save();
        c.translate(this.s_x-cameraX, this.s_y);
        c.strokeStyle = "#5BCEFA";
        c.lineWidth = 25;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(this.x-this.s_x, this.y-this.s_y);
        c.stroke();
        c.strokeStyle = "#F5A9B8";
        c.lineWidth = 15;
        c.moveTo(0, 0);
        c.lineTo(this.x-this.s_x, this.y-this.s_y);
        c.stroke();
        c.strokeStyle = "white";
        c.lineWidth = 5;
        c.moveTo(0, 0);
        c.lineTo(this.x-this.s_x, this.y-this.s_y);
        c.stroke();
        c.closePath();
        c.restore();
    },
});
sprites.push(beam);
}

function chargeBeam() {
removeTimers("turn-timeout");
setTimer("beam-spawn",100,spawnBeam);
}


// pickups are +3 to ammo / material
function spawnPlayer(x,y) {
    let player = Sprite({
        x: x,
        y: y,
        dx: 3,
        dy: 0,
        ddy: 0,
        width: 32,
        height: 32,
        id: players.length,
        health: 100,
        grounded: true,
        wood: 2,
        metal: 0,
        drills: 1,
        beams: 1,
        angle: 45,
        power: 50,
        weapon: 0,
        update() {
            this.health = Math.max(Math.min(this.health,100),0);
            if (gameType == 0 || inMenuTransition > 0) { return; }
            // move the sprite with the keyboard
            if (this.id == activePlayer && currentMenu == 0) {
                if (keyPressed('left') || keyPressed('a')) {
                    this.x -= this.dx;
                    this._fx = -1;
                    if (this.currentAnimation != this.animations["jump"] && this.currentAnimation != this.animations["fall"]) {
                        this.playAnimation("walk");
                    }
                    let worldFloor = getWorldFloor(this.x, this.width, this.height);
                    if (this.y - 8 > worldFloor) {
                        this.x += this.dx;
                    }
                }
                else if (keyPressed('right') || keyPressed('d')) {
                    this.x += this.dx;
                    this._fx = 1;
                    if (this.currentAnimation != this.animations["jump"] && this.currentAnimation != this.animations["fall"]) {
                        this.playAnimation("walk");
                    }
                    let worldFloor = getWorldFloor(this.x, this.width, this.height);
                    if (this.y - 8 > worldFloor) {
                        this.x -= this.dx;
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
                if ((keyPressed("up")||keyPressed("w"))  && this.id == activePlayer && currentMenu == 0) { // prevent jumps if building
                    this.dy = -5;
                    this.y -= 5;
                    this.jumped = true;
                    zzfx(...jump_sfx);
                }
            }
            let pickups = sprites.filter(sprite => sprite.type == "pickup");
            pickups.map(pickup => {
                if (this.x + this.width > pickup.x && this.x < pickup.x + pickup.width && 
                this.y + this.height > pickup.y && this.y < pickup.y + pickup.height) {
                    pickup.ttl = 0;
                    zzfx(...pickup_sfx);
                    switch(pickup.content) {
                        case 0: { this.health = Math.min(this.health+15, 100); break; }
                        case 1: { this.wood += 3; break; }
                        case 2: { this.metal += 2; break; }
                        case 3: { this.drills += 1; break; }
                        case 4: { this.beams += 1; break; }
                        default: break;
                    }
                }
            });
            if (this.id == activePlayer && currentMenu == 1 ) {
                this.angle += (keyPressed("up") - keyPressed("down"));
                this.angle = Math.max(0,Math.min(90,this.angle));
                this.power += (keyPressed("right") - keyPressed("left"));
                this.power = Math.max(0,Math.min(100,this.power));
                if (keyPressed('z') || keyPressed('b')) {
                    let magnitude = this.power * 0.18;
                    // -1, -17 / 1, 34
                    switch(this.weapon) {
                    case 1: { if (this.drills > 0) {
                        this.drills--;
                        if (this.drills == 0) { this.weapon = 0; }
                        spawnDrill(this.x + 8.5*(3*this._fx+1),this.y,
                            magnitude*Math.cos((Math.PI / 180) * this.angle)*this._fx,
                            magnitude*Math.sin((Math.PI / 180) * this.angle)*-1);
                        zzfx(...fire_sfx);
                        inMenuTransition = 1;
                        currentMenu = 0;
                    } break; }
                    case 2: { if (this.beams > 0) {
                        this.beams--;
                        if (this.beams == 0) { this.weapon = 0; }
                        chargeBeam();
                        zzfx(...beam_charge_sfx);
                        inMenuTransition = 1;
                        currentMenu = 0;
                    } break; }
                    default: spawnBullet(this.x + 8.5*(3*this._fx+1),this.y,
                            magnitude*Math.cos((Math.PI / 180) * this.angle)*this._fx,
                            magnitude*Math.sin((Math.PI / 180) * this.angle)*-1);
                        zzfx(...fire_sfx);
                        inMenuTransition = 1;
                        currentMenu = 0;
                    }
                    
                }
                if ((keyPressed("x") || keyPressed("n")) && pressedWeaponRight == 0) {
                    this.weapon += 1;
                    this.weapon %= 3;
                    pressedWeaponRight = 1;
                }
                if (!(keyPressed("x") || keyPressed("n"))) {
                    pressedWeaponRight = 0;
                }
            }
            
        },
        
        render() {
            if (gameType == 0 || this.health < 1) { return; }
            this.x -= cameraX;
            // get an image for the spritesheet - render the horn separately
            let c = this.context;
            c.save();
            this.draw();
            // hp text
            c.font = "20px system-ui";
            c.fillStyle = "black";
            let text_size = c.measureText(`${this.health}`);
            c.fillText(`${this.health}`, (this.x)-((text_size.width-this.width)/2), this.y-10);
            c.fillRect(this.x,this.y-8,this.width, 8);
            c.fillStyle = "lch(55% 100 37.97)";
            c.fillRect(this.x+1,this.y-7,this.width-2, 6);
            c.fillStyle = `lch(${55+(this.health/3)}% 100 ${this.health+37.97})`;
            c.fillRect(this.x+1,this.y-7,(this.width-2)*(this.health/100), 6);
            c.restore();
            this.x += cameraX;
        }
    });
    players.push(player);
};

spawnPlayer(300, 200);
spawnPlayer(1700, 200);
for(let i=0; i<10; i++) {
    makePreviewPoint(i);
}

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
    players[0].animations = unicorn_sheet.animations;
    players[0].playAnimation('idle');
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
    players[1].animations = unicorn_shift_sheet.animations;
    players[1].playAnimation('idle');
}

let wood = new Image();
wood.src = 'images/wood.png';

let metal = new Image();
metal.src = 'images/metal.png';

function spawnPlatform(x,y,type) {
let platform = Sprite({
    x:0,
    width: 24,
    height: 10,
    rotation: 0,
    image: (type == 0 ? wood: metal),
    });
};

// prevent default key behavior
bindKeys(['up', 'down', 'left', 'right'], function(e) {
    e.preventDefault();
});

// button callbacks
function fireMenu() {
    currentMenu = 1;
}
const fb = document.querySelector(".fire");
fb.onclick = function() {fireMenu();}

function buildMenu() {
    currentMenu = 2;
}
const bb = document.querySelector(".build");
bb.onclick = function() {buildMenu();}

function swapTurn() {
    // callbacks must remove themselves
    off("timer-end-turn", swapTurn);
    inMenuTransition = 0;
    activePlayer = 1-activePlayer;
    if (players[activePlayer].health < 1) {
        activePlayer = 1-activePlayer;
    }
    cameraX = players[activePlayer].x;
    // set wind speed
    seed = xorshift32(seed);
    windSpeed = Math.pow(((seed / 0x7FFFFFFF)-1),1)*0.05;
    removeTimers("turn-timeout");
    setTimer("turn-timeout",1800,endTurn); // start new turn timer
}

function endTurn() {
    // callbacks must remove themselves
    off("timer-turn-timeout", endTurn);
    inMenuTransition = 1;
    setTimer("spawn-pickup",60,spawnPickup);
}

function spawnPickup() {
    // callbacks must remove themselves
    off("timer-spawn-pickup", spawnPickup);
    seed = xorshift32(seed);
    let p_x = 200+(1600*(seed / 0xFFFFFFFF));
    seed = xorshift32(seed);
    let content = Math.floor(5*(seed / 0xFFFFFFFF));
    zzfx(...spawn_sfx);
    cameraX = p_x - 500;
    let pickup = Sprite({
        y:0,
        x:p_x,
        width: 16,
        height: 16,
        dy: 1,
        ddy: 0.15,
        type: "pickup",
        content: content,
        update() {
            this.advance();
            if(this.y > getWorldFloor(this.x, this.width, this.height)) {
                this.dy = 0;
                this.ddy = 0;
                this.y = getWorldFloor(this.x, this.width, this.height) - 0.5;
                setTimer("end-turn",60,swapTurn);
            }
        },
        render() {
            const pickup_icons = ["🩹","🪵","🪨","🔩","🏳️‍⚧️"]; // medkit, wood, metal, drill, beam
            let c= this.context;
            c.save();
            c.translate(this.x-cameraX, this.y);
            c.fillStyle = "#b4e2f1";
            c.beginPath();
            c.arc(0, 0, this.width, 0, 2  * Math.PI);
            c.fill();
            c.fillStyle = "white";
            c.font = "20px system-ui";
            c.fillText(pickup_icons[content],-11,7,this.width*1.3);
            c.restore();
        }
    })
    sprites.push(pickup);
}

function endMenu() {
    // callbacks must remove themselves
    off("timer-end-game", endMenu);
    inMenuTransition = 1;
    activePlayer = 1-activePlayer;
    if (players[activePlayer].health < 1) {
        activePlayer = 1-activePlayer;
    }
    currentMenu = 3;
    cameraX = players[activePlayer].x - 500;
    zzfx(...win_sfx);
}

function endGame() {
    removeTimers("turn-timeout");
    inMenuTransition = 1;
    setTimer("end-game",61,endMenu);
}

const uf = document.querySelector(".ui-fire");
const ub = document.querySelector(".ui-build");
const gc = document.querySelector(".game-controls");
const es = document.querySelector(".end-screen");

const etb = document.querySelector(".end-turn");
etb.onclick = function() {endTurn();}

function startGame() {
    seed = Date.now() & 0xFFFFFFFF;
    generateTerrain(seed);
    spawnPlayer(300, 200);
    spawnPlayer(1700, 200);
    unicorn_image.onload();
    unicorn_shift_image.onload();
    for(let i=0; i<10; i++) {
        makePreviewPoint(i);
    }
    setTimer("turn-timeout",1800,endTurn);
    windSpeed = 0;
}
const re = document.querySelector(".end-replay");
re.onclick = function() {exitGame(); startGame();}

function exitGame() {
    es.classList.add("none");
    es.classList.add("hidden");
    players.map(player => {
        player.ttl = 0;
    });
    activePlayer = 0;
    inMenuTransition = 0;
    currentMenu = 0;
    players = [];
    sprites = [];
}

const ex = document.querySelector(".end-quit");
ex.onclick = function() {
    gameType = 0; 
    current_audio.stop();
    current_audio = zzfxP(...menu_data);
    current_audio.loop = true;
    exitGame();
}

const sp = document.querySelector(".menu-splash");
const ps = document.querySelector(".play-s");
ps.onclick = function() {gameType = 1; exitGame(); startGame();}
const pm = document.querySelector(".play-m");
pm.onclick = function() {gameType = 2; exitGame(); startGame();}
const po = document.querySelector(".play-o");
const inst = document.querySelector(".instructions");
const sett = document.querySelector(".settings");

const timer = document.querySelector(".turn-timer");
const wind = document.querySelector(".wind-speed");

generateTerrain(Date.now() & 0xFFFFFFFF);
let loop = GameLoop({  // create the main game loop
  update() { // update the game state
    timers.map(timer => timer.update()); // DON'T FORGET TO DO TIMECARDS!
    timers = timers.filter(timer => timer.isAlive()); // TIMECAAAAAAAARDS
    timers = timers.filter(timer => timer.ttl != Infinity);
    sprites.map(sprite => sprite.update());
    players.map(players => players.update());
    sprites = sprites.filter(sprite => sprite.isAlive());
    if (!gameType > 0 || inMenuTransition > 0) {
        gc.classList.add("none");
        timer.classList.add("none");
        wind.classList.add("none");
        if (currentMenu == 3) { // end game
            es.classList.remove("none");
            es.classList.remove("hidden");
            let p = es.querySelector("p");
            p.innerHTML = `Player ${activePlayer+1} wins`;
        } else {
            es.classList.add("none");
            es.classList.add("hidden");
        }
    } else {
        gc.classList.remove("none");
        timer.classList.remove("none");
        timer.innerHTML = `${(getTimers("turn-timeout")[0].ttl/60).toFixed(1)}`;
        wind.classList.remove("none");
        wind.innerHTML = `Wind: ${(windSpeed*1000).toFixed(0)} mph`
        uf.classList.add("none");
        ub.classList.add("none");
        let ap = players[activePlayer];
        let ammo = ap.weapon == 0 ? "" : ap.weapon == 1 ? `(${ap.drills})`  : `(${ap.beams})`;
        // update current UI
        switch (currentMenu) {
            case 1: { uf.classList.remove("none"); 
                uf.innerHTML = `Angle: ${ap.angle} Power: ${ap.power}
                </br>Current weapon: ${weapon_names[ap.weapon]} ${ammo}`; break; }
            case 2: { ub.classList.remove("none"); 
                ub.innerHTML = `🪵: ${ap.wood}\t🪨: ${ap.metal}`;
            }
            default: break;
        }
    }
    if (gameType == 0) {
        sp.classList.remove("none");
    } else {
        sp.classList.add("none");
    }
    
    if (keyPressed('c')){
        currentMenu = 0;
    }
    if (keyPressed('p')){
        current_audio.stop();
        current_audio = zzfxP(...menu_data);
        current_audio.loop = true;
    }

    if (gameType == 0) {cameraX = 0; return;}
    if (currentMenu > 0 && inMenuTransition == 0) {
        cameraX += 5 * (keyPressed('e') - keyPressed('q'));
    } else {
        if (inMenuTransition == 0) {
            cameraX = players[activePlayer].x - 500;
        }
    }
    cameraX = Math.min(canvas.width,Math.max(0, cameraX));
  },
  render() { // render the game state
    if (!gameType > 0) {return;}
    blocks.map(block => block.render());
    players.map(players => players.render());
    sprites.map(sprite => sprite.render());
  },
});

loop.start();    // start the game