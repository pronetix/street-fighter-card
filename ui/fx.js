const FX = {
    canvas: document.getElementById('fx-canvas'),
    ctx: null,
    particles: [],
    rafId: null,
    init() {
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        // loop стартует только при emit(), не вручную
    },
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    emit(x, y, color, count, speed=5) {
        for(let i=0; i<count; i++) {
            this.particles.push({
                x, y, vx: (Math.random()-0.5)*speed*2, vy: (Math.random()-0.5)*speed*2,
                life: 1.0, color, size: Math.random()*4 + 2
            });
        }
        if(!this.rafId) this.rafId = requestAnimationFrame(() => this.loop());
    },
    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for(let i=this.particles.length-1; i>=0; i--) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
            if(p.life <= 0) this.particles.splice(i, 1);
        }
        this.ctx.globalAlpha = 1;
        if(this.particles.length > 0) {
            this.rafId = requestAnimationFrame(() => this.loop());
        } else {
            this.rafId = null;
        }
    }
};
FX.init();

