'use strict';
const GW = window.innerWidth, GH = window.innerHeight;

// ── Death counter (persistent, never resets to 0 automatically) ────────────
let gDeaths = 0;
function updateDeathDisplay(){const el=document.getElementById('death-count');if(el)el.textContent=gDeaths;}

// ── Snow (sector 3 — continuous, survives restarts via CSS only) ───────────
// We spawn snow once and leave the DOM container alive across restarts.
let _snowSpawned = false;
function ensureSnow(){
    if(_snowSpawned)return;
    _snowSpawned=true;
    const c=document.getElementById('snow-container');
    if(!c)return;
    c.innerHTML='';
    for(let i=0;i<55;i++){
        const el=document.createElement('span');
        el.className='snowflake';
        el.textContent=['❄','❅','❆','·','*'][Math.floor(Math.random()*5)];
        el.style.cssText=`left:${Math.random()*100}vw;font-size:${Math.random()*10+4}px;`+
            `animation-duration:${Math.random()*8+5}s;animation-delay:${-Math.random()*13}s;`+
            `opacity:${Math.random()*0.5+0.15}`;
        c.appendChild(el);
    }
    c.style.display='block';
}
function showSnow(){document.getElementById('snow-container').style.display='block';}
function hideSnow(){document.getElementById('snow-container').style.display='none';}

// ── Result screen ──────────────────────────────────────────────────────────
function showResultScreen(level){
    const ov=document.getElementById('result-overlay');
    document.getElementById('result-title').textContent=`LEVEL  ${level}`;
    const prev=document.getElementById('btn-prev-lvl');
    const next=document.getElementById('btn-next-lvl');
    prev.style.visibility=level>1?'visible':'hidden';
    next.style.visibility=level<20?'visible':'hidden';
    prev.onclick=()=>{ov.style.display='none';launchLevel(level-1);};
    next.onclick=()=>{ov.style.display='none';launchLevel(level+1);};
    document.getElementById('btn-replay').onclick=()=>{ov.style.display='none';launchLevel(level);};
    document.getElementById('btn-result-menu').onclick=()=>{
        ov.style.display='none';hideSnow();
        document.getElementById('hud').classList.remove('show');
        document.getElementById('menu').classList.add('on');
        game.scene.stop('G');
    };
    ov.style.display='flex';
    const card=ov.querySelector('.result-card');
    card.style.cssText='transform:scale(0.88) translateY(16px);opacity:0;transition:none';
    requestAnimationFrame(()=>{
        card.style.cssText='transition:transform 0.36s cubic-bezier(0.22,1,0.36,1),opacity 0.28s ease';
        requestAnimationFrame(()=>{card.style.transform='scale(1) translateY(0)';card.style.opacity='1';});
    });
}
function launchLevel(lvl){
    document.getElementById('result-overlay').style.display='none';
    document.getElementById('menu').classList.remove('on');
    document.getElementById('hud').classList.add('show');
    game.scene.start('G',{level:lvl});
}

// ── Menu canvas — floating dots, glowing dots, dark dots, sparkles ─────────
function initMenuCanvas(){
    const canvas=document.getElementById('menu-canvas');
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    let W,H;
    function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
    resize(); window.addEventListener('resize',resize);

    // Subtle large blobs (very low alpha, just colour wash)
    const BLOBS=[
        {x:.15,y:.3,r:260,rgb:'61,171,56',   vx:.18,vy:.10,ph:0  },
        {x:.82,y:.2,r:300,rgb:'201,162,39',  vx:-.15,vy:.13,ph:1.2},
        {x:.50,y:.8,r:240,rgb:'194,88,32',   vx:.12,vy:-.17,ph:2.4},
        {x:.20,y:.78,r:210,rgb:'68,180,216', vx:.22,vy:-.09,ph:3.5},
        {x:.88,y:.7,r:220,rgb:'200,50,110',  vx:-.18,vy:.12,ph:.8 },
        {x:.55,y:.12,r:190,rgb:'120,60,230', vx:.11,vy:.19,ph:1.9 },
    ].map(o=>({...o,x:o.x*window.innerWidth,y:o.y*window.innerHeight}));

    // 160 floating dots (−20%): glow=40, normal=72, dark=48
    const PALETTE=['#ff6030','#ffcc00','#3dab38','#44b4d8','#c25820','#e030a0','#8040e0','#30c8b0','#ffffff','#c9a227'];
    const DOTS=Array.from({length:160},(_,i)=>{
        const kind = i<40?'glow': i<112?'normal':'dark';
        return{
            x:Math.random()*window.innerWidth,
            y:Math.random()*window.innerHeight,
            vx:(Math.random()-.5)*1.1,   // 2× faster (was 0.55)
            vy:(Math.random()-.5)*1.1,
            r:kind==='glow'?Math.random()*2.5+1.2 : kind==='normal'?Math.random()*1.8+0.4 : Math.random()*1.4+0.3,
            ph:Math.random()*Math.PI*2,
            spd:Math.random()*.025+.007,
            kind,
            col:kind==='dark'?'rgba(255,255,255,0.12)':PALETTE[Math.floor(Math.random()*PALETTE.length)],
        };
    });

    // 22 4-point sparkles
    const SPARKS=Array.from({length:22},()=>({
        x:Math.random()*window.innerWidth,
        y:Math.random()*window.innerHeight,
        r:Math.random()*2.8+1.2,
        ph:Math.random()*Math.PI*2,
        spd:Math.random()*.018+.005,
        col:['#ffdd44','#ffffff','#c9a227','#44e8d0','#e060ff','#ff7030'][Math.floor(Math.random()*6)],
    }));

    // Connection lines between close glow dots
    const GLOW_DOTS=DOTS.filter(d=>d.kind==='glow');

    let t=0;
    (function frame(){
        if(!canvas.isConnected)return;
        requestAnimationFrame(frame);
        t+=.009;
        ctx.clearRect(0,0,W,H);

        // Background blobs
        BLOBS.forEach(o=>{
            o.ph+=.003; o.x+=o.vx; o.y+=o.vy;
            if(o.x<-o.r||o.x>W+o.r)o.vx*=-1;
            if(o.y<-o.r||o.y>H+o.r)o.vy*=-1;
            const a=0.035+0.015*Math.sin(o.ph);
            const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r);
            g.addColorStop(0,`rgba(${o.rgb},${a})`);
            g.addColorStop(.5,`rgba(${o.rgb},${a*.3})`);
            g.addColorStop(1,`rgba(${o.rgb},0)`);
            ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();
        });

        // Connection lines between nearby glow dots
        ctx.lineWidth=.6;
        for(let i=0;i<GLOW_DOTS.length;i++){
            for(let j=i+1;j<GLOW_DOTS.length;j++){
                const dx=GLOW_DOTS[i].x-GLOW_DOTS[j].x, dy=GLOW_DOTS[i].y-GLOW_DOTS[j].y;
                const d=Math.sqrt(dx*dx+dy*dy);
                if(d<100){ctx.strokeStyle=`rgba(255,255,255,${.055*(1-d/100)})`;ctx.beginPath();ctx.moveTo(GLOW_DOTS[i].x,GLOW_DOTS[i].y);ctx.lineTo(GLOW_DOTS[j].x,GLOW_DOTS[j].y);ctx.stroke();}
            }
        }

        // Draw all dots
        DOTS.forEach(p=>{
            p.ph+=p.spd; p.x+=p.vx; p.y+=p.vy;
            if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1;
            const pulse=.5+.5*Math.sin(p.ph+t);
            if(p.kind==='glow'){
                ctx.save();
                ctx.shadowBlur=14;ctx.shadowColor=p.col;
                ctx.fillStyle=p.col;ctx.globalAlpha=(.7+.3*pulse)*.92;
                ctx.beginPath();ctx.arc(p.x,p.y,p.r*1.5,0,Math.PI*2);ctx.fill();
                ctx.restore();
            } else if(p.kind==='normal'){
                ctx.fillStyle=p.col;ctx.globalAlpha=(.35+.25*pulse);
                ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
            } else {
                ctx.fillStyle=p.col;ctx.globalAlpha=.12+.05*pulse;
                ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
            }
        });
        ctx.globalAlpha=1;

        // 4-point sparkles
        SPARKS.forEach(s=>{
            s.ph+=s.spd;
            const a=.45+.55*Math.sin(s.ph);
            ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.ph*.4);
            ctx.globalAlpha=a;ctx.shadowBlur=14;ctx.shadowColor=s.col;ctx.fillStyle=s.col;
            for(let arm=0;arm<4;arm++){
                ctx.save();ctx.rotate(arm*Math.PI/2);
                ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s.r*.35,-s.r*.35);ctx.lineTo(0,-s.r*1.9);ctx.lineTo(-s.r*.35,-s.r*.35);ctx.closePath();ctx.fill();
                ctx.restore();
            }
            ctx.restore();
        });
        ctx.globalAlpha=1;
    })();
}

// ── Seeded RNG ─────────────────────────────────────────────────────────────
class RNG{
    constructor(s){this.s=s;}
    next(lo,hi){this.s=(this.s*9301+49297)%233280;return lo+(this.s/233280)*(hi-lo);}
    int(lo,hi){return Math.floor(this.next(lo,hi));}
    bool(p=.5){return this.next(0,1)<p;}
}

// ═══════════════════════════════════════════════════════════════════════════
class GameScene extends Phaser.Scene{
    constructor(){super({key:'G'});}

    preload(){
        const dot=(key,col,r=4)=>{const g=this.make.graphics({add:false});g.fillStyle(col,1);g.fillCircle(r,r,r);g.generateTexture(key,r*2,r*2);g.destroy();};
        dot('px',0xffffff);
        dot('wind',0xffffff,3);
        dot('wleaf',0xe8a820,5); // golden-orange autumn leaf
        dot('dust',0xc8a060,3);
    }

    init(data){
        this.lvl=data.level||1;
        this.sector=Math.ceil(this.lvl/5);
        this.rider=null;this.riderOffX=0;this.riderPrevX=0;this.riderPrevY=0;
        this.platVX=0;this.platVY=0;
        this.onMoving=false;this.goalDone=false;
        this._slimeGraphics=[];
    }

    create(){
        this.keys=this.input.keyboard.createCursorKeys();
        const rng=new RNG(this.lvl*1337);
        const H=this.scale.height;

        // Snow: always alive once spawned, just show/hide
        if(this.sector===3){ensureSnow();showSnow();}else{hideSnow();}

        const THEMES=[
            {sky:0x0a1608,plat:0x162410,edge:0x3a7020,ball:0xd4e8c8}, // s1 nature — much darker
            {sky:0x020202,plat:0x090909,edge:0xa08018,ball:0xf0e060}, // s2 obsidian — near black
            {sky:0x04101e,plat:0xa8c8de,edge:0x4898bc,ball:0xe8f4ff}, // s3 ice — deep night sky
            {sky:0x0e0600,plat:0x281208,edge:0x9a5018,ball:0xffd0a0}, // s4 autumn — near black dusk
        ];
        const T=THEMES[Math.min(this.sector-1,3)];

        this.add.rectangle(0,0,GW*30,H,T.sky).setOrigin(0).setScrollFactor(0);
        if(this.sector===1)this._bgNature(H,rng);
        if(this.sector===2)this._bgObsidian(H,rng);
        if(this.sector===3)this._bgIce(H,rng);
        if(this.sector===4)this._bgAutumn(H,rng);

        // Dark overlay: dims the entire scene for better contrast on platforms/ball
        this.add.rectangle(0,0,GW*30,H,0x000000,0.42).setOrigin(0).setScrollFactor(0).setDepth(0);

        this.statics=this.physics.add.staticGroup();
        this.movers=this.physics.add.group({allowGravity:false,immovable:true});

        let cx=200,cy=H-150;

        const spawnStatic=(x,y,w)=>{
            const p=this.add.rectangle(x,y,w,20,T.plat).setStrokeStyle(1,T.edge).setDepth(1);
            this._platDeco(x,y,w,T,rng);
            this.statics.add(p);
        };
        spawnStatic(cx,cy,260);

        const GAP={1:[240,320],2:[250,330],3:[300,410],4:[180,280]}[this.sector];
        const PW=this.sector===3?200:170;

        for(let i=0;i<15;i++){
            cx+=rng.int(GAP[0],GAP[1]);
            cy=Phaser.Math.Clamp(cy+rng.int(-100,100),200,H-180);
            if(this.sector===2&&rng.bool(.3)){
                this._spawnMover(cx,cy,PW,T,rng);
            }else{
                spawnStatic(cx,cy,PW);
            }
        }
        this.endX=cx;this.endY=cy;

        // Ball
        this.ball=this.add.circle(200,H-280,14,T.ball).setDepth(2);
        this.physics.add.existing(this.ball);
        this.ball.body.setCircle(14).setMaxVelocityY(1400);

        // Goal
        const GR=22,gCY=cy-GR-11;
        this.goal=this.add.circle(cx,gCY,GR,0xc9a227).setDepth(5);
        this.add.circle(cx-5,gCY-7,7,0xffe880,.55).setDepth(6);
        this.physics.add.existing(this.goal,true);
        this.glowRing=this.add.circle(cx,gCY,GR+10,0xc9a227,0).setStrokeStyle(1.5,0xffd040).setDepth(4).setAlpha(.8);
        this.tweens.add({targets:this.glowRing,scaleX:1.8,scaleY:1.8,alpha:0,duration:1400,repeat:-1,ease:'Sine.easeOut',
            onRepeat:()=>{this.glowRing.setScale(1).setAlpha(.8);}});

        if(this.sector===4){this.windDir=(this.lvl%2===0)?1:-1;this._buildWind(cx,H);}

        this.physics.add.collider(this.ball,this.statics,()=>{this.rider=null;this.onMoving=false;this.platVX=0;this.platVY=0;});
        this.physics.add.collider(this.ball,this.movers,(ball,plat)=>{
            if(ball.body.touching.down&&plat.body.touching.up){
                if(this.rider!==plat){this.rider=plat;this.riderOffX=ball.x-plat.x;this.riderPrevX=plat.x;this.riderPrevY=plat.y;this.platVX=0;this.platVY=0;}
                this.onMoving=true;
            }
        });
        this.physics.add.overlap(this.ball,this.goal,()=>{if(!this.goalDone){this.goalDone=true;this._winSequence();}});
        this.cameras.main.startFollow(this.ball,true,.1,.1).setBounds(0,0,cx+800,H);
        document.getElementById('cur-lvl').textContent=this.lvl;
    }

    // ── Moving platform + gold slime ─────────────────────────────────────
    _spawnMover(cx,cy,pW,T,rng){
        const p=this.add.rectangle(cx,cy,pW,20,T.plat).setStrokeStyle(1,T.edge).setDepth(1);
        this._platDeco(cx,cy,pW,T,rng);

        // Create slime as a child Container so it moves with the rectangle automatically
        const slime=this._buildGoldSlime(pW);
        // Position slime at same world coords as platform
        slime.setPosition(cx,cy);
        slime.setDepth(3);

        this.physics.add.existing(p,false);
        p.body.setImmovable(true).setAllowGravity(false).setSize(pW,20);
        p._startX=cx;p._startY=cy;

        const vert=rng.bool(.5),dist=rng.int(90,140),period=rng.int(2200,3600);
        // Tween BOTH the platform rect AND the slime container together
        this.tweens.add({
            targets:[p,slime],
            x:vert?cx:cx+dist,
            y:vert?cy-dist:cy,
            duration:period,yoyo:true,repeat:-1,ease:'Sine.easeInOut'
        });
        this.movers.add(p);
    }

    // Build slime as a Container of Graphics centered at (0,0)
    // so we can position it and tween it independently
    _buildGoldSlime(pW){
        const container=this.add.container(0,0);
        const g=this.add.graphics();

        const gBase=0xaa8010, gBright=0xd4a020, gHi=0xfae060, gDark=0x7a5808;
        const h=pW;

        // Dripping tendrils from edges — drawn BEFORE body so body covers them at top
        // Left drip chain
        g.fillStyle(gBright,.82);
        g.fillEllipse(-h/2-5,  2, 13, 18);
        g.fillStyle(gBase,.75);
        g.fillEllipse(-h/2-7,  13, 9,  12);
        g.fillStyle(gBase,.6);
        g.fillEllipse(-h/2-6,  22, 7,   9);

        // Right drip chain
        g.fillStyle(gBright,.82);
        g.fillEllipse( h/2+5,  2, 13, 18);
        g.fillStyle(gBase,.75);
        g.fillEllipse( h/2+7,  13, 9,  12);
        g.fillStyle(gBase,.6);
        g.fillEllipse( h/2+6,  22, 7,   9);

        // A couple of mid-edge drips
        g.fillStyle(gBase,.7);
        g.fillEllipse(-h/4, 12, 8, 14);
        g.fillEllipse( h/4, 11, 7, 12);

        // Dark underbelly shadow
        g.fillStyle(gDark,.45);
        g.fillEllipse(0, 6, h+14, 12);

        // Main slime pool on top of platform — slightly wavy with 3 ellipses
        g.fillStyle(gBase,.95);
        g.fillEllipse(0,-9, h+10, 17);

        g.fillStyle(gBright,.9);
        g.fillEllipse(-6,-11, h*.7, 12);
        g.fillEllipse( 8,-10, h*.55,  9);

        // Specular highlight strip
        g.fillStyle(gHi,.55);
        g.fillEllipse(-h*.18,-14, h*.4, 5);

        // Bubbles on surface
        [[-h*.28,-17,3.5],[h*.2,-18,2.8],[h*.02,-15,2.2],[-h*.08,-13,1.8]]
            .forEach(([bx,by,br])=>{
                g.fillStyle(gBright,.5); g.fillCircle(bx,by,br);
                g.fillStyle(gHi,.55);   g.fillCircle(bx-br*.3,by-br*.3,br*.38);
            });

        container.add(g);

        // Subtle pulse — squash/stretch like liquid
        this.tweens.add({targets:container,scaleY:1.09,scaleX:.96,
            duration:700+Math.random()*500,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});

        return container;
    }

    // ── Platform decoration (no grass for sector 1) ───────────────────────
    _platDeco(x,y,w,T,rng){
        const s=this.sector;
        // Top edge highlight (all sectors)
        this.add.rectangle(x,y-9,w,2,T.edge,s===2?.9:.55).setOrigin(.5);
        // Sector 2: gold corner studs + veins
        if(s===2){
            [x-w/2+4,x+w/2-4].forEach(px=>{this.add.circle(px,y-9,3,0xc9a227,.9).setOrigin(.5);});
            for(let vx=x-w/2+20;vx<x+w/2-10;vx+=rng.int(20,36))
                this.add.rectangle(vx,y,1,18,0xc9a227,.18).setOrigin(.5);
        }
        // Sector 3: frost sheen
        if(s===3) this.add.rectangle(x,y-9,w*.6,3,0xddf4ff,.4).setOrigin(.5);
        // Sector 4: leaf pile
        if(s===4){
            const lc=[0xa83800,0xc85010,0xa88010,0x7a2800];
            for(let i=0;i<4;i++) this.add.circle(x+rng.int(-w/2+8,w/2-8),y-12,rng.int(3,5),lc[rng.int(0,4)],.75).setOrigin(.5);
        }
        // Sector 1: NO grass — just the edge highlight above is enough
    }

    // ── BACKGROUNDS ──────────────────────────────────────────────────────
    _bgNature(H,rng){
        const sky=this.add.graphics().setScrollFactor(0);
        sky.fillGradientStyle(0x2a6040,0x2a6040,0x4a9860,0x4a9860,1);sky.fillRect(0,0,GW,H*.55);
        sky.fillGradientStyle(0x4a9860,0x4a9860,0x2a5c1a,0x2a5c1a,1);sky.fillRect(0,H*.45,GW,H*.35);
        const far=this.add.graphics().setScrollFactor(.04);
        far.fillStyle(0x1c4a28,.9);
        for(let x=-300;x<GW*22;x+=280){const h=rng.int(100,200);far.fillTriangle(x,H,x+280,H,x+140,H-h);}
        const mid=this.add.graphics().setScrollFactor(.12);
        for(let x=-100;x<GW*22;x+=90){
            const h=rng.int(80,160),tw=rng.int(14,22),bx=x+rng.int(-8,8);
            mid.fillStyle(0x3a6e20,1);mid.fillRect(bx+tw/2-tw*.3,H-50-h,tw*.6,h*.55);
            mid.fillStyle(0x2c5c18,1);mid.fillEllipse(bx+tw/2,H-50-h*.55,tw*3.4,h*.65);
            mid.fillStyle(0x3a7020,.9);mid.fillEllipse(bx+tw/2-10,H-50-h*.35,tw*2.8,h*.5);
            mid.fillStyle(0x48882c,.8);mid.fillEllipse(bx+tw/2+8,H-50-h*.2,tw*2.4,h*.4);
        }
        const gnd=this.add.graphics().setScrollFactor(.25);
        gnd.fillStyle(0x2a6018,1);gnd.fillRect(0,H-52,GW*22,56);
        gnd.fillStyle(0x1c4810,1);gnd.fillRect(0,H-26,GW*22,30);
    }

    _bgObsidian(H,rng){
        const rock=this.add.graphics().setScrollFactor(.1);
        for(let x=0;x<GW*22;x+=140){
            const h=rng.int(80,240),w=rng.int(100,200);
            rock.fillStyle(0x080808,1);rock.fillTriangle(x,H,x+w,H,x+w*.6,H-h);rock.fillTriangle(x,H,x+w*.4,H-h*.7,x+w*.8,H-h*.5);
            rock.lineStyle(1,0xb8961e,.35);rock.beginPath();
            rock.moveTo(x+rng.int(10,w-10),H-h*.1);rock.lineTo(x+rng.int(5,w-5),H-h*rng.next(.4,.9));rock.strokePath();
            if(rng.bool(.6)){rock.fillStyle(0xc9a227,.22);rock.fillCircle(x+rng.int(10,w-10),H-rng.int(20,h-20),rng.int(2,6));}
        }
        const floor=this.add.graphics().setScrollFactor(0);
        floor.fillGradientStyle(0x000000,0x000000,0x1a0a00,0x1a0a00,1);floor.fillRect(0,H-60,GW,60);
    }

    _bgIce(H,rng){
        const far=this.add.graphics().setScrollFactor(.04);
        far.fillStyle(0x0e1e30,1);
        for(let x=-200;x<GW*22;x+=320){const h=rng.int(200,380),w=rng.int(240,380);far.fillTriangle(x,H,x+w,H,x+w/2,H-h);}
        const mid=this.add.graphics().setScrollFactor(.085);
        for(let x=-80;x<GW*22;x+=220){
            const h=rng.int(130,240),w=rng.int(160,280);
            mid.fillStyle(0x182840,.9);mid.fillTriangle(x,H,x+w,H,x+w/2,H-h);
            const cb=w*.25;mid.fillStyle(0xd8f0ff,.4);
            mid.fillTriangle(x+w/2-cb,H-h*.7,x+w/2+cb,H-h*.7,x+w/2,H-h);
        }
        const ice=this.add.graphics().setScrollFactor(.13);
        ice.fillStyle(0x7ab8d8,.32);
        for(let x=10;x<GW*22;x+=rng.int(50,90)){const ih=rng.int(20,80);ice.fillTriangle(x,0,x+14,0,x+7,ih);}
        const ifl=this.add.graphics().setScrollFactor(.2);
        ifl.fillStyle(0x90c8e8,.4);ifl.fillRect(0,H-36,GW*22,40);
    }

    // Sector 4 background: trees WITH orange/red leaf canopies
    _bgAutumn(H,rng){
        const sky=this.add.graphics().setScrollFactor(0);
        sky.fillGradientStyle(0x2a1400,0x2a1400,0x3c1a00,0x3c1a00,1);sky.fillRect(0,0,GW,H*.6);
        sky.fillGradientStyle(0x3c1a00,0x3c1a00,0x200c00,0x200c00,1);sky.fillRect(0,H*.5,GW,H*.5);

        const trees=this.add.graphics().setScrollFactor(.11);
        for(let x=-60;x<GW*22;x+=110){
            const h=rng.int(90,190),tw=rng.int(9,16);

            // Trunk
            trees.fillStyle(0x3a1c04,1);trees.fillRect(x,H-45-h,tw,h);

            // Branches
            trees.lineStyle(Math.max(2,tw*.5),0x3a1c04,.85);
            [[-28,.72],[34,.68],[-14,.44]].forEach(([dx,f])=>{
                trees.beginPath();trees.moveTo(x+tw/2,H-45-h*f);
                trees.lineTo(x+tw/2+dx,H-45-h*(f+.2));trees.strokePath();
            });

            // Leaf canopy — rich autumn orange/red/gold clusters
            const leafCols=[0xc04010,0xe06020,0xb87010,0xd85010,0xa83010,0xd49020];
            // Main canopy cloud (3 overlapping ellipses)
            trees.fillStyle(leafCols[rng.int(0,3)],.9);
            trees.fillEllipse(x+tw/2, H-45-h*.75, tw*3.8, h*.55);
            trees.fillStyle(leafCols[rng.int(0,6)],.8);
            trees.fillEllipse(x+tw/2-tw*1.2, H-45-h*.62, tw*2.8, h*.4);
            trees.fillStyle(leafCols[rng.int(3,6)],.85);
            trees.fillEllipse(x+tw/2+tw*1.0, H-45-h*.65, tw*2.6, h*.38);
            // Extra small tufts at top
            trees.fillStyle(leafCols[rng.int(0,4)],.75);
            trees.fillEllipse(x+tw/2, H-45-h*.92, tw*2.2, h*.32);
        }

        const gnd=this.add.graphics().setScrollFactor(.22);
        gnd.fillStyle(0x280e00,1);gnd.fillRect(0,H-45,GW*22,50);
    }

    // ── Wind system — leaves spawn at tree line, flow right-to-left (or L→R) ─
    _buildWind(maxX,H){
        const d=this.windDir;
        // spawn edge: leaves come FROM the side the wind blows from
        const spawnEdge=d===1?{min:-50,max:0}:{min:maxX+GW,max:maxX+GW+50};
        const mkX=sp=>d===1?{min:sp*.4,max:sp}:{min:-sp,max:-sp*.4};

        // Leaves — spawn at ground/tree level, not mid-air
        this.leafEmit=this.add.particles(0,0,'wleaf',{
            x:spawnEdge,
            y:{min:H*.45,max:H*.85},   // tree canopy height band
            speedX:mkX(180),
            speedY:{min:-18,max:35},
            lifespan:{min:4000,max:7000},
            scale:{start:1.1,end:.05},
            rotate:{min:0,max:360},
            quantity:2,frequency:220,
            alpha:{start:.95,end:0},
            tint:[0xff9910,0xffcc00,0xdd6010,0xe8a010,0xff7020,0xffdd40],
            emitting:true
        });

        // White wind streaks — visible horizontal rush
        this.windStreaks=this.add.particles(0,0,'wind',{
            x:{min:0,max:maxX+200},y:{min:0,max:H},
            speedX:mkX(540),speedY:{min:-5,max:5},
            lifespan:{min:180,max:460},
            scale:{start:.32,end:0},scaleY:.04,
            quantity:14,frequency:14,
            alpha:{start:.5,end:0},
            tint:[0xffffff,0xf4f8ff],
            emitting:true
        });

        // Mid-air white puffs
        this.windPuffs=this.add.particles(0,0,'wind',{
            x:{min:0,max:maxX+200},y:{min:0,max:H},
            speedX:mkX(260),speedY:{min:-18,max:28},
            lifespan:{min:600,max:1400},
            scale:{start:.26,end:0},
            quantity:4,frequency:34,
            alpha:{start:.42,end:0},
            tint:[0xffffff,0xffeedd],
            emitting:true
        });

        // Ground dust
        this.dustEmit=this.add.particles(0,0,'dust',{
            x:{min:0,max:maxX+200},y:{min:H*.75,max:H-5},
            speedX:mkX(160),speedY:{min:-12,max:12},
            lifespan:{min:700,max:1800},
            scale:{start:.48,end:0},
            quantity:3,frequency:55,
            alpha:{start:.5,end:0},
            tint:[0xeebb70,0xcc9940,0xffdd90],
            emitting:true
        });
    }

    // ── Win ──────────────────────────────────────────────────────────────
    _winSequence(){
        this.ball.body.setVelocity(0,0).setGravityY(-this.physics.world.gravity.y);
        this.tweens.add({targets:this.ball,x:this.endX,y:this.endY-26,scaleX:.1,scaleY:.1,alpha:0,
            duration:480,ease:'Cubic.easeIn',onComplete:()=>this._winFX()});
    }
    _winFX(){
        const cx=this.endX,cy=this.endY-26;
        this.tweens.add({targets:this.goal,scaleX:2.5,scaleY:2.5,alpha:0,duration:380,ease:'Cubic.easeOut'});
        [0,120,240].forEach((delay,i)=>{
            const ring=this.add.circle(cx,cy,24,0xc9a227,0).setStrokeStyle(2-i*.5,i===0?0xffd040:0xffffff).setDepth(20).setAlpha(.85);
            this.tweens.add({targets:ring,scaleX:9-i*1.5,scaleY:9-i*1.5,alpha:0,duration:700+i*120,delay,ease:'Cubic.easeOut'});
        });
        const flash=this.add.rectangle(0,0,GW*30,this.scale.height,0xffffff,.28).setOrigin(0).setScrollFactor(0).setDepth(26);
        this.tweens.add({targets:flash,alpha:0,duration:420,ease:'Expo.easeOut'});
        const b1=this.add.particles(cx,cy,'px',{speed:{min:60,max:460},scale:{start:.65,end:0},lifespan:1200,tint:[0xc9a227,0xffe060,0xffffff,0xffcc00],alpha:{start:1,end:0},emitting:false}).setDepth(22);
        b1.explode(90,cx,cy);
        this.time.delayedCall(900,()=>showResultScreen(this.lvl));
    }

    // ── Update ────────────────────────────────────────────────────────────
    update(time,delta){
        if(!this.ball?.body||this.goalDone)return;
        const dt=Math.max(delta,1)/1000;
        const body=this.ball.body,floor=body.touching.down;

        // Moving platform ride
        if(this.onMoving&&this.rider){
            const plat=this.rider;
            const rawVX=(plat.x-this.riderPrevX)/dt,rawVY=(plat.y-this.riderPrevY)/dt;
            const LP=.14;
            this.platVX+=LP*(rawVX-this.platVX);this.platVY+=LP*(rawVY-this.platVY);
            this.ball.x=plat.x+this.riderOffX;this.ball.y=plat.y-10-14;
            body.reset(this.ball.x,this.ball.y);
            body.setVelocityX(this.platVX);body.setVelocityY(this.platVY<0?this.platVY:0);
            this.riderPrevX=plat.x;this.riderPrevY=plat.y;
        }else if(!floor){
            this.rider=null;this.onMoving=false;this.platVX=0;this.platVY=0;
        }

        const wasOnMoving=this.onMoving;
        this.onMoving=false;

        const WIND=(this.sector===4&&this.ball.x>400)?this.windDir*65:0;
        const SPEED=340;
        const left=this.keys.left.isDown,right=this.keys.right.isDown,up=this.keys.up.isDown;

        if(left||right){
            if(wasOnMoving){this.rider=null;this.onMoving=false;}
            if(this.sector===3){
                body.setVelocityX(Phaser.Math.Clamp(body.velocity.x+(left?-36:36),-SPEED,SPEED));
            }else{
                body.setVelocityX((left?-SPEED:SPEED)+WIND);
            }
        }else{
            if(!wasOnMoving){
                const frict=this.sector===3?(floor?.993:.9988):.78;
                body.setVelocityX(body.velocity.x*frict+WIND);
            }
        }

        if(up&&(floor||wasOnMoving)){body.setVelocityY(-980);this.rider=null;this.onMoving=false;}
        if(this.ball.y>this.scale.height+400){gDeaths++;updateDeathDisplay();this.scene.restart({level:this.lvl});}
    }
}

// ── Phaser ─────────────────────────────────────────────────────────────────
const game=new Phaser.Game({
    type:Phaser.AUTO,parent:'gc',width:GW,height:GH,
    backgroundColor:'#050508',
    physics:{default:'arcade',arcade:{gravity:{y:2900}}},
    scene:[GameScene]
});

// ── Menu ───────────────────────────────────────────────────────────────────
window.onload=()=>{
    hideSnow();updateDeathDisplay();initMenuCanvas();

    const grid=document.getElementById('all-levels-grid');
    const names=['Sector I','Sector II','Sector III','Sector IV'];
    const bCls=['band-s1','band-s2','band-s3','band-s4'];

    for(let s=0;s<4;s++){
        const band=document.createElement('div');
        band.className=`sector-band ${bCls[s]}`;
        const hdr=document.createElement('div');
        hdr.className='sector-band-header';hdr.textContent=names[s];
        band.appendChild(hdr);
        const row=document.createElement('div');row.className='sector-levels';
        for(let i=1;i<=5;i++){
            const lvl=s*5+i;
            const btn=document.createElement('button');
            btn.className='lvl-btn';
            btn.innerHTML=`<span class="lb-num">${lvl}</span>`;
            btn.onclick=()=>{document.getElementById('result-overlay').style.display='none';launchLevel(lvl);};
            row.appendChild(btn);
        }
        band.appendChild(row);grid.appendChild(band);
    }
};

window.togglePause=()=>{
    const ov=document.getElementById('pause-overlay');
    const ico=document.getElementById('pause-icon'),lbl=document.getElementById('pause-lbl');
    if(game.scene.isPaused('G')){game.scene.resume('G');ov.style.display='none';ico.textContent='⏸';lbl.textContent='PAUSE';}
    else{game.scene.pause('G');ov.style.display='flex';ico.textContent='▶';lbl.textContent='RESUME';}
};
window.returnToMenu=()=>{
    hideSnow();
    ['result-overlay','pause-overlay'].forEach(id=>{document.getElementById(id).style.display='none';});
    document.getElementById('hud').classList.remove('show');
    document.getElementById('menu').classList.add('on');
    game.scene.stop('G');
};
window.resetProgress=()=>{gDeaths=0;updateDeathDisplay();window.location.reload();};
window.addEventListener('resize',()=>game.scale.resize(window.innerWidth,window.innerHeight));
