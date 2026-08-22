//! ZzFXM (v2.0.3) | (C) Keith Clark | MIT | https://github.com/keithclark/ZzFXM
zzfx=(...z)=>zzfxP(zzfxG(...z)),zzfxP=(...z)=>{let t=zzfxX.createBufferSource(),f=zzfxX.createBuffer(z.length,z[0].length,zzfxR);return z.map((z,t)=>f.getChannelData(t).set(z)),t.buffer=f,t.connect(zzfxX.destination),t.start(),t},zzfxG=(z=1,t=.05,f=220,e=0,x=0,a=.1,n=0,h=1,r=0,M=0,R=0,o=0,i=0,s=0,l=0,u=0,g=0,d=1,c=0,m=0)=>{let b,w,P=2*Math.PI,X=r*=500*P/zzfxR**2,C=(0<l?1:-1)*P/4,G=f*=(1+2*t*Math.random()-t)*P/zzfxR,p=[],A=0,B=0,I=0,V=1,k=0,D=0,S=0;for(e=99+zzfxR*e,c*=zzfxR,x*=zzfxR,a*=zzfxR,g*=zzfxR,M*=500*P/zzfxR**3,l*=P/zzfxR,R*=P/zzfxR,o*=zzfxR,i=zzfxR*i|0,w=e+c+x+a+g|0;I<w;p[I++]=S)++D%(100*u|0)||(S=n?1<n?2<n?3<n?Math.sin((A%P)**3):Math.max(Math.min(Math.tan(A),1),-1):1-(2*A/P%2+2)%2:1-4*Math.abs(Math.round(A/P)-A/P):Math.sin(A),S=(i?1-m+m*Math.sin(2*Math.PI*I/i):1)*(0<S?1:-1)*Math.abs(S)**h*z*zzfxV*(I<e?I/e:I<e+c?1-(I-e)/c*(1-d):I<e+c+x?d:I<w-g?(w-I-g)/a*d:0),S=g?S/2+(g>I?0:(I<w-g?1:(w-I)/g)*p[I-g|0]/2):S),b=(f+=r+=M)*Math.sin(B*l-C),A+=b-b*s*(1-1e9*(Math.sin(I)+1)%2),B+=b-b*s*(1-1e9*(Math.sin(I)**2+1)%2),V&&++V>o&&(f+=R,G+=R,V=0),!i||++k%i||(f=G,r=X,V=V||1);return p},zzfxV=.3,zzfxR=44100,zzfxX=new(window.AudioContext||webkitAudioContext),zzfxM=(z,t,f,e=125)=>{let x,a,n,h,r,M,R,o,i,s,l,u,g,d,c,m=0,b=[],w=[],P=[],X=0,C=0,G=1,p={},A=zzfxR/e*60>>2;for(;G;X++)b=[G=o=l=g=0],f.map((e,l)=>{for(R=t[e][X]||[0,0,0],G|=!!t[e][X],c=g+(t[e][0].length-2-!o)*A,d=l==f.length-1,a=2,h=g;a<R.length+d;o=++a){for(r=R[a],i=a==R.length+d-1&&d||s!=(R[0]||0)|r|0,n=0;n<A&&o;n++>A-99&&i?u+=(u<1)/99:0)M=(1-u)*b[m++]/2||0,w[h]=(w[h]||0)-M*C+M,P[h]=(P[h++]||0)+M*C+M;r&&(u=r%1,C=R[1]||0,(r|=0)&&(b=p[[s=R[m=0]||0,r]]=p[[s,r]]||(x=[...z[s]],x[2]*=2**((r-12)/12),r>0?zzfxG(...x):[])))}g=c});return[w,P]};
const menu_theme = [[[,0,254,,,.25],[,0,440,,,,,,,,,,,80,,,,.75],[.6,0,64,,,.32,2,.3]],[[[,,9,,,,9,,,,,,9,,,,7,,,,7,,,,,,7,,,,7,,,,],[,,13,,,,13,,,,,,13,,,,12,,,,12,,,,,,12,,,,12,,,,],[,,16,,,,16,,,,,,16,,,,14,,,,14,,,,,,14,,,,14,,,,],[2,,9,,,,16,,,,16,,9,,,,7,,,,,,,,,,,,5,,7,,8,,],[1,,,,,,1,,1,,,,,,1,,,,,,,,1,,1,,,,1,,,,1,,]],[[,,9,,,,9,,,,,,9,,,,7,,,,,,7,,,,,,,,,,,,],[,,13,,,,13,,,,,,13,,,,12,,,,,,12,,,,,,,,,,,,],[,,16,,,,16,,,,,,16,,,,14,,,,,,14,,,,,,,,,,,,],[2,,9,,,,16,,,,16,,9,,,,7,,,,,,19,,,,19,,18,,14,,15,,],[1,,,,,,1,,1,,,,,,1,,,,,,,,1,,1,,,,1,,1,,1,,]],[[,,9,,,,9,,,,,,9,,,,7,,,,7,,,,,,7,,,,7,,,,],[,,13,,,,13,,,,,,13,,,,12,,,,12,,,,,,12,,,,12,,,,],[,,16,,,,16,,,,,,16,,,,14,,,,14,,,,,,14,,,,14,,,,],[2,,16,,9,,,,,,,,9,,14,,7,,,,7,,,,,,7,,,,7,,,,],[1,,,,,,1,,1,,,,,,1,,,,,,,,1,,1,,,,1,,,,1,,]],[[,,5,,,,5,,,,,,5,,,,7,,,,7,,,,,,7,,,,7,,,,],[,,7,,,,7,,,,,,7,,,,5,,,,12,,,,,,12,,,,12,,,,],[,,12,,,,12,,,,,,12,,,,12,,,,14,,,,,,14,,,,14,,,,],[2,,5,,,,5,,,,2.5,,5,,,,5,,,,,,4,,,,4,,,,2,,,,],[1,,,,,,1,,1,,,,,,1,,,,,,,,1,,1,,,,1,,1,,1,,]],[[1,,,,,,1,,1,,,,,,1,,,,,,,,1,,1,,,,1,,,,1,,]],[[1,,,,,,1,,1,,,,,,1,,1,,,,,,1,,1,,,,1,,1,,1,,]],[[1,,,,,,1,,1,,,,1,,1.49,,1,,,,,,,,,,,,,,,,,,]]],[0,1,2,3,0,1,2,3,4,5,6],155,{"title":"menu theme","instruments":["a","b","c"],"patterns":["0","1","2","3","4","5","6"]}];
let menu_data = zzfxM(...menu_theme);
let menu_audio = zzfxP(...menu_data);
menu_audio.loop = true;
menu_audio.stop();

let { init, Sprite, SpriteSheet, GameLoop, pointerPressed, pointer, keyPressed, emit } = kontra
let { canvas, context } = init();

// left, right, jump, camera left, camera right, power up, power down
let controls = [
    ["a","d","w","q","e", "z", "x"],
    ["left","right","up"]
];
let sprites = [];
let blocks = [];
let heightmap = [];
let players = [];
let activePlayer = 0;
let cameraX = 0;
let currentMenu = 0;
let inMenuTransition = 0;
let gameType = 2; // 1 for vs bot, 2 for local multiplayer, 3 for online, 0 for the lobby
let currentWood = 100, currentMetal = 100; // pickups are +3
let currentAngle = 45, currentPower = 50;
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

// timers
let timers = [];
function getTimer(name) {
    return timers.filter(timer => timer.name == name);
};
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
    kontra.on(`timer-${name}`, callback);
    timers.push(timer);
};

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

function spawnBullet(p_x,p_y,v_x,v_y) {
let bullet = Sprite({
    x: p_x,
    y: p_y,
    dx: v_x,
    dy: v_y,
    ddy: 0.15,
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
        if (this.y > getWorldFloor(this.x, this.width, this.height)) {
            this.ttl = 0;
        }
        if (this.x > canvas.width+cameraX || this.x < 0) {
            this.ttl = 0;
        }
        
        // player collisions
    }
});
sprites.push(bullet);
}

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
        update() {
            if (gameType == 0 || inMenuTransition > 0) { return; }
            // move the sprite with the keyboard
            if (this.id == activePlayer && currentMenu == 0) {
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
                if ((keyPressed("up")||keyPressed("w"))  && this.id == activePlayer && currentMenu == 0) { // prevent jumps if building
                    this.dy = -5;
                    this.y -= 5;
                    this.jumped = true;
                }
            }
            if (this.id == activePlayer && currentMenu == 1 ) {
                currentAngle += (keyPressed("up") - keyPressed("down"));
                currentAngle = Math.max(0,Math.min(90,currentAngle));
                currentPower += (keyPressed("right") - keyPressed("left"));
                currentPower = Math.max(0,Math.min(100,currentPower));
                if (keyPressed('z')) {
                    let magnitude = currentPower * 0.15;
                    spawnBullet(this.x + 15*(1+this._fx),this.y,
                                magnitude*Math.cos((Math.PI / 180) * currentAngle)*this._fx,
                                magnitude*Math.sin((Math.PI / 180) * currentAngle)*-1);
                    endTurnMenu();
                    currentMenu = 0;
                    console.log("fire");
                }
            }
            
        },
        
        render() {
            if (gameType == 0) { return; }
            this.x -= cameraX;
            // get an image for the spritesheet - render the horn separately
            let c = this.context;
            c.save();
            this.draw();
            // hp text
            c.font = "20px system-ui";
            c.fillStyle = `lch(${55+(this.health/3)}% 100 ${this.health+37.97})`;
            let text_size = c.measureText(`${this.health}`);
            c.fillText(`${this.health}`, (this.x)-((text_size.width-this.width)/2), this.y-0);
            c.restore();
            this.x += cameraX;
        }
    });
    players.push(player);
};

spawnPlayer(300, 200);
spawnPlayer(1700, 200);

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
    inMenuTransition = 0;
    activePlayer = 1-activePlayer;
    cameraX = players[activePlayer].x;
    // callbacks must remove themselves
    kontra.off("timer-end-turn", endTurn);
}

function endTurnMenu() {
    inMenuTransition = 1;
    setTimer("end-turn",60,endTurn);
}
const etb = document.querySelector(".btn-end-turn");
etb.onclick = function() {endTurnMenu();}

const uf = document.querySelector(".ui-fire");
const ub = document.querySelector(".ui-build");
const gc = document.querySelector(".game-controls");

generateTerrain(Date.now() & 0xFFFFFFFF);
//generateTerrain(306379322);
let loop = GameLoop({  // create the main game loop
  update() { // update the game state
    timers.map(timer => timer.update()); // DON'T FORGET TO DO TIMECARDS!
    timers = timers.filter(timer => timer.isAlive()); // TIMECAAAAAAAARDS
    sprites.map(sprite => sprite.update());
    players.map(players => players.update());
    sprites = sprites.filter(sprite => sprite.isAlive());
    if (!gameType > 0 || inMenuTransition > 0) {
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
        case 1: { uf.classList.remove("none"); 
            uf.innerHTML = `Angle: ${currentAngle} Power: ${currentPower}`; break; }
        case 2: { ub.classList.remove("none"); 
            ub.innerHTML = `🪵: ${currentWood}<br/>🪨: ${currentMetal}`;
        }
        default: break;
    }
    
    if (keyPressed('c')){
        currentMenu = 0;
    }
    if (keyPressed('p')){
        menu_audio.stop();
        menu_audio = zzfxP(...menu_data);
        menu_audio.loop = true;
    }

    if (currentMenu > 0) {
        cameraX += 5 * (keyPressed('e') - keyPressed('q'));
    } else {
        cameraX = players[activePlayer].x - 500;
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