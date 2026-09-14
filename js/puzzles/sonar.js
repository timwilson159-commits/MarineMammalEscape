/* Puzzle: Sonar Hunt (arcade game) - echolocation. */
ER.register({
  id: 'sonar',
  title: 'Sonar Hunt',
  icon: '📡',
  kind: 'game',
  tagline: 'Hunt in the dark using echolocation, just like a dolphin',
  code: { letter: 'W', number: 4 },
  printable: false,
  fact: 'Toothed whales like dolphins, orcas and sperm whales make fast clicking sounds and listen for the echoes. This lets them "see" with sound in dark or murky water. It is called echolocation. Baleen whales, like humpbacks, do not echolocate.',
  hints: [
    'Click the water (or press Space) to send a sonar click. Anything the sound wave touches glows for a moment. GREEN glowing shapes are fish. RED shapes are plastic bags.',
    'Click, spot the closest green fish, then swim straight to it before the glow fades. Steer around red plastic: touching it costs you 5 seconds of energy.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const W = 800, H = 500, GOAL = 8, TIME = 80;

    const canvas = el('canvas', { width: W, height: H, class: 'game-canvas' });
    const overlay = el('div', { class: 'game-overlay' });
    body.append(
      el('div', { class: 'card game-info' },
        el('p', {}, '🐬 Deep water is dark, so dolphins find food with ', el('b', {}, 'echolocation'),
          '. Move your mouse (or use the arrow keys) to swim. ', el('b', {}, 'Click'), ' or press ', el('kbd', {}, 'Space'),
          ' to send a sonar click. Catch ', el('b', {}, GOAL + ' fish'), ' before your energy runs out!')),
      el('div', { class: 'game-wrap' }, canvas, overlay),
      el('div', { class: 'legend' },
        el('span', {}, el('i', { class: 'dot', style: { background: '#4dffa6' } }), 'Fish (food)'),
        el('span', {}, el('i', { class: 'dot', style: { background: '#ff5d73' } }), 'Plastic bag (avoid)'),
        el('span', {}, el('i', { class: 'dot', style: { background: '#7f9cff' } }), 'Rock')));

    const ctx = canvas.getContext('2d');
    const keys = ER.keys();
    let g, raf = 0, last = 0, ringId = 0;

    const rand = (a, b) => a + Math.random() * (b - a);
    function spawnFish(awayFrom) {
      let x, y;
      do { x = rand(60, W - 60); y = rand(60, H - 60); } while (awayFrom && Math.hypot(x - awayFrom.x, y - awayFrom.y) < 220);
      const a = rand(0, Math.PI * 2);
      return { x, y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 20, glow: 0, ring: -1, t: rand(0, 5) };
    }
    function spawnBag(awayFrom) {
      let x, y;
      do { x = rand(60, W - 60); y = rand(60, H - 60); } while (awayFrom && Math.hypot(x - awayFrom.x, y - awayFrom.y) < 200);
      return { x, y, vx: rand(-15, 15), vy: rand(-10, 10), glow: 0, ring: -1, rot: rand(0, 6) };
    }

    function reset() {
      const d = { x: 110, y: H / 2, vx: 0, vy: 0, face: 1 };
      g = {
        d, rings: [], pops: [], caught: 0, time: TIME, cooldown: 0, running: false, pointer: null,
        fish: Array.from({ length: 7 }, () => spawnFish(d)),
        bags: Array.from({ length: 7 }, () => spawnBag(d)),
        rocks: Array.from({ length: 9 }, () => ({ x: rand(40, W - 40), y: rand(80, H - 30), r: rand(14, 30), glow: 0, ring: -1 })),
        flash: 0,
      };
    }

    function showOverlay(kind) {
      overlay.innerHTML = '';
      overlay.hidden = false;
      if (kind === 'start') {
        overlay.append(el('div', { class: 'overlay-card' },
          el('div', { class: 'overlay-emoji' }, '📡🐬'),
          el('h3', {}, 'Sonar Hunt'),
          el('p', {}, 'Swim: mouse or arrow keys. Click or Space: sonar click.'),
          el('p', {}, 'Catch ' + GOAL + ' 🐟 before your energy runs out.'),
          el('button', { class: 'btn btn-sun btn-big', onclick: start }, '▶ Start hunting')));
      } else if (kind === 'lose') {
        overlay.append(el('div', { class: 'overlay-card' },
          el('div', { class: 'overlay-emoji' }, '😵'),
          el('h3', {}, 'Out of energy!'),
          el('p', {}, `You caught ${g.caught} fish. Tip: click often, and swim to the nearest green glow.`),
          el('button', { class: 'btn btn-sun btn-big', onclick: start }, '🔁 Try again')));
      } else if (kind === 'win') {
        overlay.append(el('div', { class: 'overlay-card win' },
          el('div', { class: 'overlay-emoji' }, '🏆'),
          el('h3', {}, 'Full belly!'),
          el('p', {}, 'You used echolocation to catch ' + GOAL + ' fish in the dark.'),
          el('button', { class: 'btn btn-light', onclick: start }, '🔁 Play again')));
      }
    }

    function start() {
      sfx.unlock();
      reset();
      g.running = true;
      overlay.hidden = true;
      canvas.focus();
      ping();
    }

    function ping() {
      if (!g.running || g.cooldown > 0) return;
      g.cooldown = 0.45;
      g.rings.push({ x: g.d.x, y: g.d.y, r: 0, id: ringId++ });
      sfx.ping();
    }

    canvas.tabIndex = 0;
    const onMove = (e) => { g.pointer = ER.canvasPoint(canvas, e); };
    const onDown = (e) => { g.pointer = ER.canvasPoint(canvas, e); ping(); };
    const onLeave = () => { if (g) g.pointer = null; };
    const onKey = (e) => { if (e.key === ' ' && g.running) ping(); };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerleave', onLeave);
    window.addEventListener('keydown', onKey);

    function hitTest(obj, ring) {
      if (obj.ring === ring.id) return false;
      const dist = Math.hypot(obj.x - ring.x, obj.y - ring.y);
      if (Math.abs(dist - ring.r) < 18) { obj.ring = ring.id; obj.glow = 1; return dist; }
      return false;
    }

    function update(dt) {
      const d = g.d;
      let kx = 0, ky = 0;
      if (keys.down('arrowleft', 'a')) kx -= 1;
      if (keys.down('arrowright', 'd')) kx += 1;
      if (keys.down('arrowup', 'w')) ky -= 1;
      if (keys.down('arrowdown', 's')) ky += 1;
      const SPEED = 210;
      let tx = d.vx, ty = d.vy;
      if (kx || ky) {
        const m = Math.hypot(kx, ky);
        tx = (kx / m) * SPEED; ty = (ky / m) * SPEED;
        g.pointer = null;
      } else if (g.pointer) {
        const dx = g.pointer.x - d.x, dy = g.pointer.y - d.y, dist = Math.hypot(dx, dy);
        const sp = Math.min(SPEED, dist * 3);
        tx = dist > 4 ? (dx / dist) * sp : 0;
        ty = dist > 4 ? (dy / dist) * sp : 0;
      } else { tx *= 0.9; ty *= 0.9; }
      d.vx += (tx - d.vx) * Math.min(1, dt * 6);
      d.vy += (ty - d.vy) * Math.min(1, dt * 6);
      d.x = Math.max(40, Math.min(W - 40, d.x + d.vx * dt));
      d.y = Math.max(30, Math.min(H - 30, d.y + d.vy * dt));
      if (Math.abs(d.vx) > 10) d.face = d.vx > 0 ? 1 : -1;

      g.cooldown -= dt;
      g.time -= dt;
      g.flash = Math.max(0, g.flash - dt * 2);

      g.rings.forEach((r) => {
        r.r += 480 * dt;
        g.fish.forEach((f) => { const hit = hitTest(f, r); if (hit !== false) sfx.echo(Math.min(0.5, hit / 900)); });
        g.bags.forEach((b) => hitTest(b, r));
        g.rocks.forEach((k) => hitTest(k, r));
      });
      g.rings = g.rings.filter((r) => r.r < 520);

      g.fish.forEach((f, i) => {
        f.t += dt;
        f.vx += Math.sin(f.t * 0.9 + i) * 8 * dt;
        f.vy += Math.cos(f.t * 1.1 + i) * 6 * dt;
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < 40 || f.x > W - 40) f.vx *= -1;
        if (f.y < 40 || f.y > H - 40) f.vy *= -1;
        f.x = Math.max(40, Math.min(W - 40, f.x)); f.y = Math.max(40, Math.min(H - 40, f.y));
        f.glow = Math.max(0, f.glow - dt * 0.55);
        if (Math.hypot(f.x - d.x, f.y - d.y) < 34) {
          g.caught++;
          sfx.gulp();
          g.pops.push({ x: f.x, y: f.y, text: '+1 🐟', life: 1, color: '#4dffa6' });
          g.fish[i] = spawnFish(d);
        }
      });
      g.bags.forEach((b, i) => {
        b.x += b.vx * dt; b.y += b.vy * dt; b.rot += dt * 0.5;
        if (b.x < 40 || b.x > W - 40) b.vx *= -1;
        if (b.y < 40 || b.y > H - 40) b.vy *= -1;
        b.glow = Math.max(0, b.glow - dt * 0.55);
        if (Math.hypot(b.x - d.x, b.y - d.y) < 32) {
          g.time -= 5;
          g.flash = 1;
          sfx.bad();
          g.pops.push({ x: b.x, y: b.y, text: 'Plastic! -5s', life: 1.3, color: '#ff5d73' });
          g.bags[i] = spawnBag(d);
        }
      });
      g.rocks.forEach((k) => { k.glow = Math.max(0, k.glow - dt * 0.55); });
      g.pops.forEach((p) => { p.life -= dt; p.y -= 30 * dt; });
      g.pops = g.pops.filter((p) => p.life > 0);

      if (g.caught >= GOAL) {
        g.running = false;
        showOverlay('win');
        api.solve();
      } else if (g.time <= 0) {
        g.time = 0;
        g.running = false;
        sfx.hurt();
        showOverlay('lose');
      }
    }

    function vis(o) {
      const near = Math.hypot(o.x - g.d.x, o.y - g.d.y);
      return Math.max(o.glow, near < 70 ? (1 - near / 70) * 0.55 : 0);
    }

    function draw(t) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#062a55');
      grad.addColorStop(1, '#010a1c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // faint marine snow
      ctx.fillStyle = 'rgba(160,200,255,0.18)';
      for (let i = 0; i < 40; i++) {
        const x = (i * 97 + t * 8) % W, y = (i * 53 + t * 14 * ((i % 3) + 1)) % H;
        ctx.fillRect(x, y, 2, 2);
      }
      const d = g.d;
      const light = ctx.createRadialGradient(d.x, d.y, 10, d.x, d.y, 90);
      light.addColorStop(0, 'rgba(90,170,255,0.18)');
      light.addColorStop(1, 'rgba(90,170,255,0)');
      ctx.fillStyle = light;
      ctx.fillRect(d.x - 90, d.y - 90, 180, 180);

      g.rocks.forEach((k) => {
        const a = vis(k);
        if (a <= 0.01) return;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#7f9cff';
        ctx.beginPath(); ctx.ellipse(k.x, k.y, k.r, k.r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      });
      g.bags.forEach((b) => {
        const a = vis(b);
        if (a <= 0.01) return;
        ctx.globalAlpha = a;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.sin(b.rot) * 0.4);
        ctx.fillStyle = '#ff5d73';
        ctx.beginPath();
        ctx.moveTo(-14, -10); ctx.lineTo(-8, -10); ctx.lineTo(-6, -18); ctx.lineTo(-2, -10); ctx.lineTo(2, -10); ctx.lineTo(6, -18); ctx.lineTo(8, -10); ctx.lineTo(14, -10);
        ctx.quadraticCurveTo(18, 8, 10, 18); ctx.lineTo(-10, 18); ctx.quadraticCurveTo(-18, 8, -14, -10);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(-6, -4, 3, 14);
        ctx.restore();
      });
      g.fish.forEach((f) => {
        const a = vis(f);
        if (a <= 0.01) return;
        ctx.globalAlpha = a;
        const face = f.vx >= 0 ? 1 : -1;
        ctx.save(); ctx.translate(f.x, f.y); ctx.scale(face, 1);
        ctx.shadowColor = '#4dffa6'; ctx.shadowBlur = 12;
        ctx.fillStyle = '#4dffa6';
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-22, -8); ctx.lineTo(-22, 8); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#062a55';
        ctx.beginPath(); ctx.arc(7, -2, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha = 1;

      g.rings.forEach((r) => {
        ctx.strokeStyle = `rgba(130,225,255,${Math.max(0, 1 - r.r / 520)})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
      });

      const tilt = Math.max(-0.5, Math.min(0.5, (d.vy / 260) * d.face));
      ER.drawDolphin(ctx, d.x, d.y, 0.85, d.face, tilt);

      g.pops.forEach((p) => {
        ctx.globalAlpha = Math.min(1, p.life * 1.5);
        ctx.fillStyle = p.color;
        ctx.font = 'bold 22px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      });
      ctx.globalAlpha = 1;

      if (g.flash > 0) { ctx.fillStyle = `rgba(255,60,90,${g.flash * 0.25})`; ctx.fillRect(0, 0, W, H); }

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      roundRect(12, 12, 150, 40, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Fredoka, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`🐟 ${g.caught} / ${GOAL}`, 26, 41);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      roundRect(W - 262, 12, 250, 40, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Fredoka, sans-serif';
      ctx.fillText('ENERGY', W - 250, 38);
      const frac = Math.max(0, g.time / TIME);
      ctx.fillStyle = '#23304f'; roundRect(W - 180, 24, 158, 16, 8); ctx.fill();
      ctx.fillStyle = frac > 0.4 ? '#4dffa6' : frac > 0.2 ? '#ffd23f' : '#ff5d73';
      roundRect(W - 180, 24, 158 * frac, 16, 8); ctx.fill();
    }

    function roundRect(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
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

    return () => {
      cancelAnimationFrame(raf);
      keys.dispose();
      window.removeEventListener('keydown', onKey);
    };
  },
});
