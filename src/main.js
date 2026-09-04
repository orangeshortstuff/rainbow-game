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
let error_sfx = [2.8,0,100,,,.07,1,1.8,,,,.07,.02,,37,,.08,.78,,,99];

import { init, initKeys, Sprite, SpriteSheet, GameLoop, keyPressed, on, off, emit, bindKeys } from "../kontra.min.mjs"

let { canvas } = init();

// left, right, down, jump, camera left/camera right, fire/place, select material / weapon, cancel, flip platform
let controls = [
    ["a","d","s","w","q","e","z","x","c","r"],
    ["left","right","down","up", "k","l","b","n","m","j"]
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
let inputSwitch = 0, inputRotate = 0; // kontra 6 doesn't have onKey callbacks, so deal with weapon selection
let validPlatform = false;

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
                let c = this.context;
                c.strokeStyle = 'green';
                c.fillStyle = 'green';
                c.save();
                c.translate(this.x-cameraX, this.y);
                c.beginPath();
                c.moveTo(0, 0);
                c.lineTo(this.width, this.drop);
                c.lineTo(this.width, this.drop+20);
                c.lineTo(0, 20);
                c.fill();
                c.closePath();
                c.stroke();
                c.strokeStyle = '#713b22';
                c.fillStyle = '#713b22';
                c.beginPath();
                c.moveTo(0, 20);
                c.lineTo(this.width, this.drop+20);
                c.lineTo(this.width, 600);
                c.lineTo(0, 600);
                c.fill();
                c.closePath();
                c.stroke();
                c.restore();
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

function shotOffset(power, angle, t, flip) {
    let magnitude = power * 0.18;
    let v_x = magnitude*Math.cos((Math.PI / 180) * angle)*flip;
    let v_y = magnitude*Math.sin((Math.PI / 180) * angle)*-1;
    return {x: t*v_x+(t*t*windSpeed/2), y: t*v_y+(t*t*0.075)};
}

function solveShot(diff_x, diff_y) {
    let flip = (diff_x < 0 ? -1 : 1);
    let candidate_shots = [];
    let power = 100, found_shot = false;
    for (let angle = 85; angle >= 0; angle -= 5) {
        power = 100;
        // given the current angle, return the power to get a hit
        // a is known (gravity), s is known (drop to other player), u (power) is searchable through, t is derivable
        let min_power = (diff_y > 0 ? 0 : Math.pow((-0.3*diff_y),0.5)/0.18*((Math.sin((Math.PI / 180) * angle))));
        if (min_power > power) { continue; }
        for (let i = 0; i < 5; i++) {
            let magnitude = power * 0.18;
            let v_y = magnitude*Math.sin((Math.PI / 180) * angle)*-1;
            let t = -(v_y/0.15) + Math.pow(((v_y * v_y) + 2*0.15*diff_y),0.5)/0.15;
            let guess_x = shotOffset(power,angle,t,flip).x;
            if (guess_x*flip < diff_x*flip && power == 100) { // if there's not enough power at max, skip
                found_shot = true;
                break;
            }
            if (Math.abs(guess_x-diff_x) < 10) {
                candidate_shots.push([angle, power]);
                found_shot = true;
                break;
            }
            // distance is proportional to square of power, so power correction should be proportional to square root of error? it works
            let nextPower = Math.min(Math.pow(diff_x/guess_x,0.5) * power,100);
            if (nextPower < min_power) {
                nextPower = (min_power + power) / 2;
            }
            power = nextPower;
        }
        if (!found_shot && !isNaN(power)) {
            candidate_shots.push([angle, power]); // push the best we have
        }
    }
    return candidate_shots;
}

function makePreviewPoint(i) {
    let preview = Sprite({
        anchor: {x: 0.5, y: 0.5},
        radius: (15-i)/2,
        color: `rgba(255, 255, 255, ${1-(i*0.03)})`,
        update() {
            let a = players[activePlayer];
            let t = (8-this.radius)*6;
            let res = shotOffset(a.power, a.angle, t, a._fx);
            this.x = res.x + a.x+ 8.5*(3*a._fx+1);
            this.y = res.y + a.y;
        },
        render() {
            if (currentMenu != 1 || (gameType == activePlayer)) {return;}
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
        let c = this.context;
        c.strokeStyle = 'black';
        c.fillStyle = 'white';
        c.save();
        c.translate(this.x-cameraX, this.y);
        c.rotate(this.rotation);
        c.beginPath();
        c.moveTo(-3, -5);
        c.lineTo(12, 0);
        c.lineTo(-3, 5);
        c.fill();
        c.closePath();
        c.stroke();
        c.restore();
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
        if (this.y > getWorldFloor(this.x, this.width, this.height) || collidePlatforms(this).mask) {
            if (collidePlatforms(this).objects[0]) {
                sprites[collidePlatforms(this).objects[0]].ttl = 0;
            }
            this.ttl = 0;
            endTurn();
            // explode on floor - calculate splash damage
            explosion(0.5*this.width+this.x, 0.5*this.height+this.y);
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
        let c = this.context;
        c.strokeStyle = 'black';
        c.fillStyle = 'white';
        c.save();
        c.translate(this.x-cameraX, this.y);
        c.rotate(this.rotation);
        c.beginPath();
        c.moveTo(-3, -5);
        c.lineTo(12, 0);
        c.lineTo(-3, 5);
        c.lineTo(-3, -5);
        c.fill();
        c.moveTo(0, 4);
        c.lineTo(0, -4);
        c.moveTo(3, 3);
        c.lineTo(3, -3);
        c.moveTo(6, 2);
        c.lineTo(6, -2);
        c.closePath();
        c.stroke();
        c.restore();
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
        if (this.y > getWorldFloor(this.x, this.width, this.height) || collidePlatforms(this).mask) {
            let hit = sprites[collidePlatforms(this).objects[0]];
            if (hit && (hit.material == "wood")){
                hit.ttl = 0;
            } else {
                this.ttl = 0;
                endTurn();
                zzfx(...drill_hit_sfx);
                return;
            }
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
    dx: 10*Math.cos(theta),
    dy: 10*Math.sin(theta),
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
        if (this.y > getWorldFloor(this.x, this.width, this.height) || this.y < 0 || collidePlatforms(this).mask)  {
            let hit = sprites[collidePlatforms(this).objects[0]];
            if (hit && (hit.material == "metal")){
                hit.ttl = 0;
            } else {
                this.ttl = 0;
            endTurn();
            return;
            }
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

function collidePlatforms(obj) {
    let x_offset, y_offset, hit = 0, objs = [];
    sprites.forEach(sprite => {
        if (sprite.type != "platform") { return; }
        if (sprite.rotation > 0) {
            x_offset = 5;
            y_offset = 12;
        } else {
            x_offset = 12;
            y_offset = 5;
        }
        if (obj.x < sprite.x + x_offset && obj.x + obj.width > sprite.x - x_offset &&
            obj.y < sprite.y + y_offset && obj.y + obj.height > sprite.y - y_offset) {
            objs.push(sprites.indexOf(sprite));
            // horizontal checks
            if (obj.x+(obj.width/2) < sprite.x) {
                hit |= 2; // left of object
            } else {
                hit |= 1; // right of object
            }
            if (obj.y+(obj.height/2) < sprite.y) {
                hit |= 8; // below object
            } else {
                hit |= 4; // above object
            }
        }
    })
    return {mask: hit, objects: objs};
}

function filterInputs(mask) {
    let l = controls[0].length;
    let inputs = Array(l).fill(false);
    mask.forEach(row => {
        for (let i = 0; i < l; i++) {
            inputs[i] |= keyPressed(controls[row][i]);
        }}
    )
    return inputs;
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
        pl_x: 0,
        pl_y: 0,
        pl_type: 0,
        pl_rotate: 0,
        target_x: 0,
        update() {
            let inputs; // left, right, down, jump, camera left/camera right, fire/place, select material / weapon, cancel
            if (gameType == 2) {
                inputs = filterInputs([this.id]);
            } else {
                inputs = filterInputs([0,1]);
            }
            this.health = Math.max(Math.min(this.health,100),0);
            if (gameType == 0 || inMenuTransition > 0) { return; }
            // collisions with ground
            let worldFloor = getWorldFloor(this.x, this.width, this.height);
            if ((worldFloor > this.y)) {
                this.grounded = false;
            } else {
                this.grounded = true;
                this.y = worldFloor;
            }
            let ticks; ticks = 0;
            if (!this.grounded && collidePlatforms(this).mask & 8) { // floors
                while (collidePlatforms(this).mask & 8) { 
                    this.grounded = true;
                    this.dy = 0;
                    this.y -= this.ddy;
                    ticks += 1;
                    if (ticks > 15) {
                        this.y -= 0.5;
                        break;
                    }
                }
            }
            if (!this.grounded && collidePlatforms(this).mask & 4) { // ceilings
                while (collidePlatforms(this).mask & 4) {
                    this.dy = this.ddy;
                    this.y += this.ddy;
                    ticks += 1;
                    if (ticks > 15) {
                        if (getWorldFloor(this.x-3, this.width, this.height) > getWorldFloor(this.x+3, this.width, this.height)) {
                            this.x -= this.dx;
                        } else {
                            this.x += this.dx;
                        }
                        this.y += this.dx;
                        break;
                    }
                }
            }
            if (this.grounded) {
                this.jumped = false;
                this.ddy = 0;
                this.dy = 0;

                if (this.currentAnimation == this.animations["jump"] || this.currentAnimation == this.animations["fall"]) {
                    this.playAnimation("idle");
                }
                
                if (inputs[3] && this.id == activePlayer && currentMenu == 0 || // prevent jumps if building
                    (this.id == activePlayer && this.id == gameType && (getTimers("turn-timeout")[0].ttl%16 == 9))) { 
                    this.dy = -5;
                    this.jumped = true;
                    zzfx(...jump_sfx);
                }
            } else {
                this.ddy = 0.15;
                if (this.jumped || (this.dy > 1.5)) {
                    if (this.dy < 0) {
                        this.playAnimation("jump");
                    } else {
                        this.playAnimation("fall");
                    }
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
            let prevX = this.x;
            this.advance();
            this.x = prevX;
            if (this.id != activePlayer) { return; }
            if (this.id == activePlayer && this.id == gameType) {
                // cpu
                if (inMenuTransition == 0) {
                    cameraX = this.x - 500;
                }
                this.cpu();
            }
            if (currentMenu > 0 && inMenuTransition == 0) {
                cameraX += 5 * (inputs[5] - inputs[4]);
            } else {
                if (inMenuTransition == 0) {
                    cameraX = this.x - 500;
                }
            }
            if (currentMenu == 0) {
                if (inputs[0]) {
                    this.walk(-1);
                }
                else if (inputs[1]) {
                    this.walk(1);
                } else {
                    if (this.grounded) {this.playAnimation("idle")};
                }
                // reset the sprites position when it reaches the edge of the game
                if (this.x > canvas.width*2 - this.width) {
                    this.x = canvas.width*2 - this.width;
                }
                else if (this.x < 0) {
                    this.x = 0;
                }
            }
            if (inputs[8]){
                currentMenu = 0;
            }
            if (currentMenu == 1 ) {
                this.angle += (inputs[3] - inputs[2]);
                this.angle = Math.max(0,Math.min(90,this.angle));
                this.power += (inputs[1] - inputs[0]);
                this.power = Math.max(0,Math.min(100,this.power));
                if (inputs[6]) {
                    currentMenu = 0;
                    this.fire();
                }
                if (inputs[7] && inputSwitch == 0) {
                    this.weapon += 1;
                    this.weapon %= 3;
                    inputSwitch = 1;
                }
                if (!inputs[7]) {
                    inputSwitch = 0;
                }
            }
            if (currentMenu == 2 ) {
                this.pl_x += 2*(inputs[1] - inputs[0]);
                this.pl_x = Math.max(-84,Math.min(116,this.pl_x));
                this.pl_y += 2*(inputs[2] - inputs[3]);
                this.pl_y = Math.max(-84,Math.min(116,this.pl_y));
                validPlatform = getWorldFloor(this.x+this.pl_x-10, this.pl_rotate ? 30 : 44, this.pl_rotate ? 44 : 30) > this.y+this.pl_y+50;
                if (inputs[6]) {
                    if(this.pl_type == 1 ? (this.metal > 0) : (this.wood > 0)) {
                        spawnPlatform(this.x+this.pl_x, Math.round(this.y+this.pl_y), this.pl_rotate, this.pl_type);
                        // if it would hit either player, or it is less than 50 pixels off the ground, remove it
                        if (collidePlatforms(players[0]).mask || collidePlatforms(players[1]).mask || !validPlatform ) {
                            sprites[sprites.length-1].ttl = 0;
                            zzfx(...error_sfx);
                        } else {
                            this.pl_type == 1 ? (this.metal--) : (this.wood--);
                        }
                    } else {
                        zzfx(...error_sfx);
                    }
                    currentMenu = 0;
                    this.pl_x = 16;
                    this.pl_y = 16;
                }
                if (inputs[7] && inputSwitch == 0) {
                    this.pl_type += 1;
                    this.pl_type %= 2;
                    inputSwitch = 1;
                }
                if (!inputs[7]) {
                    inputSwitch = 0;
                }
                if (inputs[9] && inputRotate == 0) {
                    this.pl_rotate += 1;
                    this.pl_rotate %= 2;
                    inputRotate = 1;
                }
                if (!inputs[9]) {
                    inputRotate = 0;
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
            this.x += cameraX;
            c.restore();
            if (currentMenu == 2 && this.id == activePlayer) {
                c.save();
                c.translate(this.x+this.pl_x-cameraX, Math.round(this.y+this.pl_y));
                c.rotate(this.pl_rotate * (Math.PI/2));
                c.translate(-12,-5);
                let im = this.pl_type == 1 ? metal : wood;
                c.drawImage(im,0,0);
                if (!validPlatform) {
                    c.fillStyle = "rgba(255 0 0 / 0.2)"
                    c.fillRect(0,0,24,10);
                }
                c.restore();
                
            }
        },

        walk(direction) {
            this.x += this.dx * direction;
            this._fx = direction;
            if (this.currentAnimation != this.animations["jump"] && this.currentAnimation != this.animations["fall"]) {
                this.playAnimation("walk");
            }
            let worldFloor = getWorldFloor(this.x, this.width, this.height);
            let dMask = (direction == 1 ? 2 : 1);
            if ((this.y - 8 > worldFloor) || (this.y > worldFloor && (collidePlatforms(this).mask & 4)) || (collidePlatforms(this).mask & dMask)) {
                let hit = collidePlatforms(this).objects;
                if (hit.length > 0) {
                    if (this.snapCheck(hit) && !(collidePlatforms(this).mask & dMask)) {
                        this.x += this.dx * direction;
                    }
                }
                this.x -= this.dx * direction;
            }
        },

        snapCheck(items) {
            let snapped = false;
            items.forEach(i => {
                let snapDistance = (sprites[i].y - (sprites[i].rotation > 0 ? 12 : 5)) - (this.height + this.y);
                if (snapDistance <= 0 && snapDistance >= -4 && !snapped) {
                    this.y += snapDistance;
                    snapped = true;
                }
            });
            return snapped;
        },

        fire () {
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
        },

        cpu() {
            let target_distance = this.target_x-this.x;
            let ttl = getTimers("turn-timeout")[0].ttl;
            let heuristic = (2700-ttl)+Math.abs(target_distance/3);
            if (currentMenu == 0) { // scout for pickups
                if (this.target_x == 0) {
                    // find all pickups, and get the nearest one
                    let pickups = sprites.filter(sprite => sprite.type == "pickup");
                    let distances = pickups.map(p => p.x-(this.x+8));
                    pickups = distances.map(d => Math.abs(d));
                    this.target_x = distances[pickups.indexOf(Math.min(...pickups))]+(this.x-8);
                    target_distance = this.target_x-this.x;
                    return;
                } else if (Math.abs(target_distance) > 2 && heuristic < 700) {
                    this.walk(Math.round(Math.abs(target_distance)/target_distance)); // -1 if left, 1 if right
                } else if (this.grounded) {
                    currentMenu = 1; // end of state
                    // 0 if found, -1 if blocked going left, -2 if blocked right
                    this.target_x = (heuristic < 700 ? 0 : (target_distance < 0 ? -1 : -2));
                }
            }
            if (currentMenu == 1) { // run to the hill / valley
                if (heuristic > 1200) {
                    this.target_x = (target_distance < 0 ? -1 : -2);
                }
                if (this.target_x < 1) {
                    let totalPoints = (baseTerrainPoints*Math.pow(2,terrainLayers-1))+1;
                    let blockWidth = (canvas.width*2/totalPoints);
                    let mid_block = Math.floor((players[0].x+16)/(blockWidth));
                    let heights = blocks.map(b => b.y);
                    let left_bound = Math.max(2,mid_block-60);
                    let right_bound = Math.min(254,mid_block+60);
                    let near_heights = heights.slice(left_bound,right_bound);
                    let far_heights = heights.slice(6,left_bound).concat(heights.slice(right_bound,250));
                    let hill_idx = heights.indexOf(Math.min(...near_heights));
                    let valley_idx = heights.indexOf(Math.max(...far_heights));
                    if (this.target_x != 0) { // if blocked, run away from the pickups
                        mid_block = Math.floor((players[1].x+16)/(blockWidth));
                        if (this.target_x == -1) {
                            let right_heights = heights.slice(mid_block+4,Math.min(250,mid_block+60));
                            hill_idx = heights.indexOf(Math.min(...right_heights));
                            valley_idx = heights.indexOf(Math.max(...right_heights));
                        } else {
                            let left_heights = heights.slice(Math.max(6,mid_block-60),mid_block-4);
                            hill_idx = heights.indexOf(Math.min(...left_heights));
                            valley_idx = heights.indexOf(Math.max(...left_heights));
                        }
                    }
                    if (heights[mid_block]-heights[hill_idx] > 150 && heuristic < 1200) { // if you can get the high ground close, do so
                        this.target_x = Math.round((hill_idx-2) * blockWidth);
                    } else {
                        this.target_x = Math.round((valley_idx-2) * blockWidth);
                    }
                    target_distance = this.target_x-this.x;
                }
                if (Math.abs(target_distance) > 2) {
                    this.walk(Math.round(Math.abs(target_distance)/target_distance));
                } else if (this.grounded) {
                    currentMenu = 2; // end of state
                    this.target_x = 0;
                }
            }
            if (currentMenu == 2) { // fire
                let shots = solveShot(players[1-this.id].x-this.x, players[1-this.id].y-this.y);
                let powers = shots.map(s => s[1]);
                let shot_idx = ( players[1].y-players[0].y > 120 ? powers.indexOf(Math.min(...powers)) : 0);
                this.angle = Math.min(90,Math.max(0,shots[shot_idx][0]+(Math.random()*3)-1.5));
                this.power = Math.min(100,Math.max(0,shots[shot_idx][1]+(Math.random()*3)-1.5));
                this._fx = (this.x > players[0].x ? -1 : 1);
                currentMenu = 0;
                this.target_x = 0;
                this.fire();
            }
        },
    });
    players.push(player);
};

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
    if (!(players[0] === undefined)) {
        players[0].animations = unicorn_sheet.animations;
        players[0].playAnimation('idle');
    }
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
    if (!(players[1] === undefined)) {
        players[1].animations = unicorn_shift_sheet.animations;
        players[1].playAnimation('idle');
    }
}

let wood = new Image();
wood.src = 'images/wood.png';

let metal = new Image();
metal.src = 'images/metal.png';

function spawnPlatform(x,y,rotated,type) {
let platform = Sprite({
    x:x,
    y:y,
    anchor: {x: 0.5, y: 0.5},
    width: 24,
    height: 10,
    rotation: rotated ? Math.PI / 2 : 0,
    image: (type == 0 ? wood: metal),
    material: (type == 0 ? "wood": "metal"),
    type: "platform",
    render() {
        let c = this.context;
        c.save();
        c.translate(-cameraX, 0);
        this.draw();
        c.restore();
    }
    });
    sprites.push(platform);
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
    setTimer("turn-timeout",2700,endTurn); // start new turn timer
}

function endTurn() {
    // callbacks must remove themselves
    off("timer-turn-timeout", endTurn);
    inMenuTransition = 1;
    currentMenu = 0;
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
            if (collidePlatforms(this).mask & 8) {
                this.y -= this.dy;
                this.dy = 0;
                this.ddy = 0;
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
    setTimer("turn-timeout",2700,endTurn);
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
const inst = document.querySelector(".instructions");
const sett = document.querySelector(".settings");

const timer = document.querySelector(".turn-timer");
const wind = document.querySelector(".wind-speed");

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
        if (activePlayer != gameType) {
            gc.classList.remove("none");
        }
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
            case 1: { uf.classList.remove("none"); uf.innerHTML = `Angle: ${ap.angle} Power: ${ap.power}</br>Current weapon: ${weapon_names[ap.weapon]} ${ammo}`; break; }
            case 2: { ub.classList.remove("none"); ub.innerHTML = `🪵: ${ap.wood}\t🪨: ${ap.metal}`;}
            default: break;
        }
    }
    if (gameType == 0) { sp.classList.remove("none"); } else { sp.classList.add("none"); }
    
    if (keyPressed('v')){
        current_audio.stop();
        current_audio = zzfxP(...menu_data);
        current_audio.loop = true;
    }

    if (gameType == 0) {cameraX = 0; return;}
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