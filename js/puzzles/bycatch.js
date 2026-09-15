/* Puzzle: Breathe! Bycatch Escape (arcade game) - air breathing, ghost nets, boat strike. */
ER.register({
  id: 'bycatch',
  title: 'Bycatch Escape',
  icon: '🥅',
  kind: 'game',
  tagline: 'Guide a dolphin past ghost nets, and don\'t forget to breathe!',
  code: { letter: 'J', number: 5 },
  printable: false,
  fact: 'Marine mammals breathe air with lungs, just like us. When a dolphin, dugong or whale gets caught in a fishing net (called bycatch) it cannot reach the surface, so it can drown. Lost "ghost nets" keep trapping animals for years.',
  hints: [
    'Watch the AIR bar. Swim up to the surface to take a breath. Each breath refills some air, then your dolphin dips back under by itself, so plan your breaths for the gaps between nets and boats.',
    'Breathe whenever there is a clear gap above you, then stay deep until the next gap. Never surface under a boat. When a net hangs from the top, go low early, and watch for nets rising from the sea floor too.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const W = 800, H = 450, SURF = 90, FLOOR = 420, GOAL = 90, DX = 170;

    const canvas = el('canvas', { width: W, height: H, class: 'game-canvas' });
    const overlay = el('div', { class: 'game-overlay' });
    body.append(
      el('div', { class: 'card game-info' },
        el('p', {}, '🐬 Dolphins are mammals, so they must come to the ', el('b', {}, 'surface to breathe air'),
          '. Guide your dolphin to safe waters. Move with the ', el('b', {}, 'mouse'), ' or ', el('kbd', {}, '↑'), ' ', el('kbd', {}, '↓'),
          '. Dodge ghost nets and boats, and keep your ', el('b', {}, 'AIR'), ' bar up. Each time you surface you take ', el('b', {}, 'one breath'), ' and then dip back under.')),
      el('div', { class: 'game-wrap' }, canvas, overlay));

    const ctx = canvas.getContext('2d');
    const keys = ER.keys();
    let g, raf = 0, last = 0;
    const rand = (a, b) => a + Math.random() * (b - a);

    function reset() {
      g = {
        y: 200, vy: 0, ty: null, air: 100, lives: 3, inv: 0, dist: 0,
        obs: [], spawn: 1.2, running: false, pops: [], lowWarned: false, dive: 0, surfCool: 0,
        scroll: 0, bubbles: [],
      };
    }

    function showOverlay(kind) {
      overlay.innerHTML = '';
      overlay.hidden = false;
      const card = (emoji, title, text, btn) => overlay.append(el('div', { class: 'overlay-card' + (kind === 'win' ? ' win' : '') },
        el('div', { class: 'overlay-emoji' }, emoji), el('h3', {}, title), ...text.map((t) => el('p', {}, t)), btn));
      if (kind === 'start') card('🐬💨', 'Bycatch Escape', ['Mouse or ↑ ↓ to swim.', 'Surface to breathe: one breath, then you dip back down.', 'Avoid nets 🥅 and boats 🚤. Reach safe waters!'],
        el('button', { class: 'btn btn-sun btn-big', onclick: start }, '▶ Start swimming'));
      else if (kind === 'lose') card('🥅', 'Tangled!', [g.lastHit === 'air' ? 'Your dolphin ran out of air.' : 'Your dolphin got caught.', 'Every year thousands of dolphins, dugongs and whales drown in nets. Try again!'],
        el('button', { class: 'btn btn-sun btn-big', onclick: start }, '🔁 Try again'));
      else if (kind === 'win') card('🏝️', 'Safe waters!', ['You dodged the nets and remembered to breathe.'],
        el('button', { class: 'btn btn-light', onclick: start }, '🔁 Play again'));
    }

    function start() {
      sfx.unlock();
      reset();
      g.running = true;
      overlay.hidden = true;
      canvas.focus();
    }

    canvas.tabIndex = 0;
    const onMove = (e) => { if (g) g.ty = ER.canvasPoint(canvas, e).y; };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);

    function spawnObstacle() {
      const r = Math.random();
      const x = W + 60;
      if (r < 0.28) g.obs.push({ type: 'net', x, w: 46, top: SURF - 8, bottom: SURF + rand(110, 210) });
      else if (r < 0.46) g.obs.push({ type: 'floor', x, w: 46, top: FLOOR - rand(110, 190), bottom: FLOOR });
      else if (r < 0.64) g.obs.push({ type: 'boat', x, w: 130 });
      else if (r < 0.82) g.obs.push({ type: 'drift', x, cy: rand(SURF + 90, FLOOR - 70), r: 30, t: rand(0, 6) });
      else {
        // a hanging net and a floor net together: squeeze through the gap in the middle
        const netBottom = SURF + rand(80, 140);
        g.obs.push({ type: 'net', x, w: 46, top: SURF - 8, bottom: netBottom });
        g.obs.push({ type: 'floor', x, w: 46, top: netBottom + rand(115, 150), bottom: FLOOR });
      }
    }

    function hit(kind) {
      if (g.inv > 0) return;
      g.lives--;
      g.inv = 1.8;
      g.lastHit = kind;
      sfx.hurt();
      g.pops.push({ x: DX, y: g.y - 40, text: kind === 'air' ? 'Out of air!' : kind === 'boat' ? 'Boat strike!' : 'Tangled!', life: 1.4, color: '#ff5d73' });
      if (kind === 'air') g.air = 100;
      if (g.lives <= 0) { g.running = false; showOverlay('lose'); }
    }

    function update(dt) {
      let ky = 0;
      if (keys.down('arrowup', 'w')) ky -= 1;
      if (keys.down('arrowdown', 's')) ky += 1;
      g.dive = Math.max(0, g.dive - dt);
      g.surfCool = Math.max(0, g.surfCool - dt);
      if (g.dive > 0) g.vy = 230;
      else if (ky) { g.vy = ky * 240; g.ty = null; }
      else if (g.ty != null) g.vy = Math.max(-260, Math.min(260, (g.ty - g.y) * 6));
      else g.vy *= 0.85;
      g.y = Math.max(SURF - 14, Math.min(FLOOR - 16, g.y + g.vy * dt));

      const speed = 170 + g.dist * 0.9;
      g.dist += dt;
      g.scroll += speed * dt;
      g.inv = Math.max(0, g.inv - dt);

      // breathing: one breath per surfacing, then the dolphin automatically dips back under
      if (g.y < SURF + 4 && g.dive <= 0) {
        if (g.surfCool <= 0) {
          sfx.breath();
          g.pops.push({ x: DX + 10, y: SURF - 30, text: '💨 Breathe!', life: 0.9, color: '#ffffff' });
          g.air = Math.min(100, g.air + 50);
          g.surfCool = 1.6;
          g.lowWarned = false;
        }
        g.dive = 0.55;
      }
      g.air -= 9 * dt;
      if (g.air < 30 && !g.lowWarned) { g.lowWarned = true; sfx.bad(); }
      if (g.air <= 0) hit('air');

      g.spawn -= dt;
      if (g.spawn <= 0) {
        spawnObstacle();
        g.spawn = Math.max(1.25, 2.3 - g.dist * 0.02) + rand(0, 0.5);
      }

      const box = { l: DX - 34, r: DX + 34, t: g.y - 10, b: g.y + 10 };
      g.obs.forEach((o) => {
        o.x -= speed * dt;
        if (o.type === 'drift') { o.t += dt; o.y = o.cy + Math.sin(o.t * 1.4) * 40; }
        let collide = false;
        if (o.type === 'net' || o.type === 'floor') {
          collide = box.r > o.x + 6 && box.l < o.x + o.w - 6 && box.b > o.top && box.t < o.bottom;
        } else if (o.type === 'boat') {
          collide = box.r > o.x + 10 && box.l < o.x + o.w - 10 && box.t < SURF + 26;
        } else if (o.type === 'drift') {
          const cx = Math.max(box.l, Math.min(o.x, box.r)), cy = Math.max(box.t, Math.min(o.y, box.b));
          collide = Math.hypot(cx - o.x, cy - o.y) < o.r - 4;
        }
        if (collide && g.running) hit(o.type === 'boat' ? 'boat' : 'net');
      });
      g.obs = g.obs.filter((o) => o.x > -200);

      if (Math.random() < dt * 3) g.bubbles.push({ x: DX + 36, y: g.y - 4, life: 1 });
      g.bubbles.forEach((b) => { b.x -= speed * dt * 0.6; b.y -= 40 * dt; b.life -= dt; });
      g.bubbles = g.bubbles.filter((b) => b.life > 0 && b.y > SURF);
      g.pops.forEach((p) => { p.life -= dt; p.y -= 25 * dt; });
      g.pops = g.pops.filter((p) => p.life > 0);

      if (g.running && g.dist >= GOAL) {
        g.running = false;
        showOverlay('win');
        api.solve();
      }
    }

    function drawNet(x, w, top, bottom) {
      ctx.fillStyle = 'rgba(210,225,200,0.18)';
      ctx.fillRect(x, top, w, bottom - top);
      ctx.strokeStyle = 'rgba(225,235,210,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let yy = top; yy <= bottom; yy += 14) { ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); }
      for (let xx = x; xx <= x + w; xx += 12) { ctx.moveTo(xx, top); ctx.lineTo(xx + (Math.sin(xx + yyWave) * 3), bottom); }
      ctx.stroke();
      ctx.strokeStyle = '#2b3a2e';
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + w, top); ctx.moveTo(x, bottom); ctx.lineTo(x + w, bottom); ctx.stroke();
    }
    let yyWave = 0;

    function draw(t) {
      yyWave = t;
      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, SURF);
      sky.addColorStop(0, '#7fd8ff'); sky.addColorStop(1, '#d4f5ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, SURF);
      ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(700, 36, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const cOff = -((g.scroll * 0.1) % (W + 200));
      [[120, 30], [420, 22], [760, 40]].forEach(([cx, cy]) => {
        const xx = ((cx + cOff) % (W + 200) + W + 200) % (W + 200) - 100;
        ctx.beginPath(); ctx.ellipse(xx, cy, 34, 10, 0, 0, Math.PI * 2); ctx.ellipse(xx + 22, cy - 6, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
      });
      // water
      const sea = ctx.createLinearGradient(0, SURF, 0, H);
      sea.addColorStop(0, '#29b6f0'); sea.addColorStop(1, '#0a3d7a');
      ctx.fillStyle = sea; ctx.fillRect(0, SURF, W, H - SURF);
      // surface band
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(0, SURF, W, 16);
      ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 10) {
        const y = SURF + Math.sin((x + g.scroll) * 0.03 + t * 2) * 3;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // light rays
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 5; i++) {
        const x = ((i * 190 - g.scroll * 0.2) % (W + 200) + W + 200) % (W + 200) - 100;
        ctx.beginPath(); ctx.moveTo(x, SURF); ctx.lineTo(x + 60, SURF); ctx.lineTo(x + 140, H); ctx.lineTo(x + 40, H); ctx.fill();
      }
      // seafloor + seagrass
      ctx.fillStyle = '#f2d48f'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
      ctx.fillStyle = '#e0bd6e';
      for (let i = 0; i < 20; i++) { const x = ((i * 60 - g.scroll) % W + W) % W; ctx.fillRect(x, FLOOR + 10, 18, 4); }
      ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const x = ((i * 37 - g.scroll) % (W + 40) + W + 40) % (W + 40) - 20;
        ctx.beginPath(); ctx.moveTo(x, FLOOR + 2); ctx.quadraticCurveTo(x + Math.sin(t * 2 + i) * 8, FLOOR - 16, x + Math.sin(t * 2 + i) * 4, FLOOR - 28 - (i % 3) * 6); ctx.stroke();
      }
      ctx.lineCap = 'butt';

      g.obs.forEach((o) => {
        if (o.type === 'net') {
          drawNet(o.x, o.w, o.top, o.bottom);
          ['#ff7b39', '#ffd23f'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(o.x + 10 + i * 26, SURF - 4, 8, 0, Math.PI * 2); ctx.fill(); });
        } else if (o.type === 'floor') {
          drawNet(o.x, o.w, o.top, o.bottom);
          ctx.fillStyle = '#6b7a8f'; ctx.fillRect(o.x - 4, o.bottom - 10, o.w + 8, 10);
          ctx.fillStyle = '#ff7b39'; ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.top - 6, 7, 0, Math.PI * 2); ctx.fill();
        } else if (o.type === 'boat') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.moveTo(o.x, SURF - 26); ctx.lineTo(o.x + o.w, SURF - 26); ctx.lineTo(o.x + o.w - 18, SURF + 12); ctx.lineTo(o.x + 10, SURF + 12); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ff5d73'; ctx.fillRect(o.x + 6, SURF - 10, o.w - 14, 8);
          ctx.fillStyle = '#26408a'; ctx.fillRect(o.x + 30, SURF - 50, 50, 24);
          ctx.fillStyle = '#9fe6ff'; ctx.fillRect(o.x + 38, SURF - 44, 14, 10); ctx.fillRect(o.x + 58, SURF - 44, 14, 10);
          ctx.fillStyle = 'rgba(255,60,90,0.25)'; ctx.fillRect(o.x + 8, SURF + 12, o.w - 20, 14);
          ctx.save(); ctx.translate(o.x + o.w - 26, SURF + 20); ctx.rotate(t * 20);
          ctx.fillStyle = '#c3ccd9'; ctx.fillRect(-12, -2, 24, 4); ctx.fillRect(-2, -12, 4, 24); ctx.restore();
        } else if (o.type === 'drift') {
          ctx.fillStyle = 'rgba(210,225,200,0.25)';
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(230,240,215,0.9)'; ctx.lineWidth = 2;
          for (let i = 0; i < 6; i++) {
            ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r, o.r * 0.35, i * 0.55 + o.t * 0.3, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.fillStyle = '#ff7b39'; ctx.beginPath(); ctx.arc(o.x + 14, o.y - 18, 6, 0, Math.PI * 2); ctx.fill();
        }
      });

      g.bubbles.forEach((b) => { ctx.strokeStyle = `rgba(255,255,255,${b.life})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.stroke(); });

      if (!(g.inv > 0 && Math.floor(t * 12) % 2)) {
        ER.drawDolphin(ctx, DX, g.y, 0.9, 1, Math.max(-0.45, Math.min(0.45, g.vy / 500)));
      }

      g.pops.forEach((p) => {
        ctx.globalAlpha = Math.min(1, p.life * 1.5);
        ctx.fillStyle = p.color; ctx.strokeStyle = '#10204a'; ctx.lineWidth = 4;
        ctx.font = 'bold 24px Fredoka, sans-serif'; ctx.textAlign = 'center';
        ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y);
      });
      ctx.globalAlpha = 1;

      // HUD: lives
      ctx.font = '22px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; ctx.textAlign = 'left';
      for (let i = 0; i < 3; i++) ctx.fillText(i < g.lives ? '❤️' : '🤍', 14 + i * 30, 30);
      // air
      const airX = 120, airY = 12, airW = 220;
      ctx.fillStyle = 'rgba(16,32,74,0.75)'; rr(airX, airY, airW + 64, 26, 13); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Fredoka, sans-serif'; ctx.fillText('AIR', airX + 12, airY + 19);
      const low = g.air < 30;
      ctx.fillStyle = '#23304f'; rr(airX + 50, airY + 6, airW, 14, 7); ctx.fill();
      ctx.fillStyle = low ? (Math.floor(t * 6) % 2 ? '#ff5d73' : '#ffd23f') : '#7fe7ff';
      rr(airX + 50, airY + 6, Math.max(0, airW * g.air / 100), 14, 7); ctx.fill();
      if (low && g.running) {
        ctx.fillStyle = '#ff5d73'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.font = 'bold 22px Fredoka, sans-serif'; ctx.textAlign = 'center';
        ctx.strokeText('LOW AIR! Swim up to breathe!', W / 2, SURF + 50); ctx.fillText('LOW AIR! Swim up to breathe!', W / 2, SURF + 50);
      }
      // progress
      const pX = 440, pW = 340;
      ctx.fillStyle = 'rgba(16,32,74,0.75)'; rr(pX - 10, 12, pW + 20, 26, 13); ctx.fill();
      ctx.fillStyle = '#23304f'; rr(pX, 19, pW, 12, 6); ctx.fill();
      ctx.fillStyle = '#3ddc84'; rr(pX, 19, pW * Math.min(1, g.dist / GOAL), 12, 6); ctx.fill();
      ctx.font = '18px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🐬', pX + pW * Math.min(1, g.dist / GOAL), 32);
      ctx.fillText('🏝️', pX + pW + 2, 32);
    }

    function rr(x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (g.running) update(dt);
      draw(now / 1000);
      raf = requestAnimationFrame(loop);
    }

    reset();
    showOverlay('start');
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); keys.dispose(); };
  },
});
