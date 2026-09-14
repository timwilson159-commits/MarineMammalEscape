/* The research station room: movement, stations, notes, scenes and modals. */
(function () {
  const { el, sfx } = ER;
  const W = 320, H = 224, S = 3;

  const canvas = document.getElementById('room');
  const ctx = canvas.getContext('2d');
  const roomView = document.getElementById('room-view');
  const puzzleView = document.getElementById('puzzle-view');
  const promptEl = document.getElementById('prompt');
  const notesList = document.getElementById('notes-list');
  const hudCodes = document.getElementById('hud-codes');
  const hudTime = document.getElementById('hud-time');

  const state = {
    solved: [],
    timerOn: false,
    startTime: 0,
    elapsed: 0,
    escaped: false,
    current: null,
    cleanup: null,
  };

  // ---------- Modals ----------
  ER.modal = function ({ title, content, buttons = [], className = '', dismissable = true }) {
    const root = document.getElementById('modal-root');
    const box = el('div', { class: 'modal ' + className, role: 'dialog', 'aria-modal': 'true' });
    const overlay = el('div', { class: 'overlay' }, box);
    const onKey = (e) => { if (e.key === 'Escape' && dismissable) close(); };
    const close = () => {
      document.removeEventListener('keydown', onKey);
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 180);
    };
    if (title) box.append(el('h2', { class: 'modal-title' }, title));
    if (content) box.append(content.nodeType ? content : el('div', { html: content }));
    const row = el('div', { class: 'modal-buttons' });
    buttons.forEach((b) =>
      row.append(el('button', {
        class: 'btn ' + (b.class || ''),
        onclick: () => { if (b.close !== false) close(); if (b.onClick) b.onClick(); },
      }, b.label))
    );
    if (buttons.length) box.append(row);
    if (dismissable) overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    root.append(overlay);
    setTimeout(() => { const b = row.querySelector('button'); if (b) b.focus(); }, 60);
    return { close, box };
  };
  const modalOpen = () => !!document.querySelector('#modal-root .overlay:not(.closing)');

  // ---------- Layout of the lab (logical pixels, 16px tiles) ----------
  const STATIONS = {
    bones:   { x: 48,  y: 34,  front: [64, 78] },
    rebus:   { x: 240, y: 34,  front: [256, 78] },
    sonar:   { x: 18,  y: 70,  front: [62, 88] },
    bycatch: { x: 18,  y: 136, front: [62, 154] },
    song:    { x: 270, y: 70,  front: [258, 88] },
    vaquita: { x: 270, y: 136, front: [258, 154] },
    foodweb: { x: 88,  y: 172, front: [104, 166] },
    logic:   { x: 200, y: 172, front: [216, 166] },
  };
  const DOOR = { x: 136, y: 2, w: 48, h: 30, front: [160, 46] };
  const POOL = { x: 160, y: 112, r: 30 };
  const DECOR = [
    { type: 'plant', x: 116, y: 34, w: 14, h: 16 },
    { type: 'plant', x: 190, y: 34, w: 14, h: 16 },
    { type: 'crate', x: 18, y: 184, w: 26, h: 22 },
    { type: 'locker', x: 278, y: 180, w: 24, h: 26 },
  ];
  const SOLIDS = [
    ...Object.values(STATIONS).map((s) => ({ x: s.x, y: s.y, w: 32, h: 32 })),
    ...DECOR,
  ];

  const player = { x: 160, y: 168, dir: 'down', moving: false, anim: 0, target: null, pendingOpen: null, stepT: 0 };

  function blocked(x, y) {
    const l = x - 5, r = x + 5, t = y - 6, b = y;
    if (l < 16 || r > 304 || t < 34 || b > 206) return true;
    for (const s of SOLIDS) {
      if (r > s.x && l < s.x + s.w && b > s.y && t < s.y + s.h) return true;
    }
    if (Math.hypot(x - POOL.x, y - 3 - POOL.y) < POOL.r + 5) return true;
    return false;
  }

  function rectDist(px, py, s, w = 32, h = 32) {
    const cx = Math.max(s.x, Math.min(px, s.x + w));
    const cy = Math.max(s.y, Math.min(py, s.y + h));
    return Math.hypot(px - cx, py - cy);
  }

  function nearest() {
    let best = null, bd = 1e9;
    for (const id in STATIONS) {
      const d = rectDist(player.x, player.y - 3, STATIONS[id]);
      if (d < 14 && d < bd) { bd = d; best = id; }
    }
    const dd = Math.hypot(player.x - DOOR.front[0], player.y - DOOR.front[1]);
    if (dd < 18 && dd < bd) best = 'door';
    return best;
  }

  // ---------- Sprites ----------
  const PAL = { k: '#1b1b3a', h: '#7a4a2a', o: '#ff7b39', m: '#8ff0ff', w: '#ffffff', s: '#f6c7a1', y: '#ffd23f', Y: '#e6a100', b: '#2f6fed', g: '#9aa7bd' };
  const TOP_DOWN = ['...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.kommmmmmok.', '.kmwmmmmwmk.', '.kssssssssk.', '..kssoossk..', '..kyyyyyyk..', '.kyyYyyYyyk.', 'kyyyyyyyyyyk', 'ksyyyYYyyysk', '.kkyyyyyykk.'];
  const TOP_UP = ['...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.kohhhhhhok.', '.khhhhhhhhk.', '.khhhhhhhhk.', '..kkhhhhkk..', '..kyggggyk..', '.kyyggggyyk.', 'kyyyggggyyyk', 'ksyyggggyysk', '.kkyyyyyykk.'];
  const TOP_SIDE = ['...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.khhoommmmk.', '.khhhsmwmmk.', '.khhssssssk.', '..khsssssok.', '..kkyyyyyk..', '..gkyyyyyk..', '..gkyyysyk..', '..gkyyysyk..', '...kyyyyyk..'];
  const LEGS_A = ['..kbbkkbbk..', '..kbbkkbbk..', '.kbbbkkbbbk.', '.kkkkkkkkkk.'];
  const LEGS_B = ['..kbbkkbbk..', '..kbbkkbbk..', '.kbbbk.kbbk.', '.kkkkk.kkk..'];
  const SIDE_A = ['...kbbbbk...', '...kbbbbk...', '...kbbbbk...', '...kkkkkkk..'];
  const SIDE_B = ['...kbbbbk...', '..kbbkkbbk..', '.kbbk..kbbk.', '.kkk....kkk.'];
  const mirror = (rows) => rows.map((r) => r.split('').reverse().join(''));

  function makeSprite(rows) {
    const c = document.createElement('canvas');
    c.width = 12; c.height = 16;
    const x = c.getContext('2d');
    rows.forEach((r, j) => {
      for (let i = 0; i < 12; i++) {
        const ch = r[i];
        if (ch && ch !== '.') { x.fillStyle = PAL[ch]; x.fillRect(i, j, 1, 1); }
      }
    });
    return c;
  }
  const SPR = {
    down: [makeSprite([...TOP_DOWN, ...LEGS_A]), makeSprite([...TOP_DOWN, ...LEGS_B]), makeSprite([...TOP_DOWN, ...LEGS_A]), makeSprite([...TOP_DOWN, ...mirror(LEGS_B)])],
    up: [makeSprite([...TOP_UP, ...LEGS_A]), makeSprite([...TOP_UP, ...LEGS_B]), makeSprite([...TOP_UP, ...LEGS_A]), makeSprite([...TOP_UP, ...mirror(LEGS_B)])],
    right: [makeSprite([...TOP_SIDE, ...SIDE_A]), makeSprite([...TOP_SIDE, ...SIDE_B])],
    left: [makeSprite(mirror([...TOP_SIDE, ...SIDE_A])), makeSprite(mirror([...TOP_SIDE, ...SIDE_B]))],
  };

  // ---------- Drawing ----------
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const circle = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

  function drawFloor() {
    for (let ty = 2; ty < 13; ty++) {
      for (let tx = 1; tx < 19; tx++) {
        px(tx * 16, ty * 16, 16, 16, (tx + ty) % 2 ? '#7fe0ee' : '#6fd4e4');
        px(tx * 16, ty * 16, 16, 1, '#5cc0d3');
        px(tx * 16, ty * 16, 1, 16, '#5cc0d3');
      }
    }
    // hazard walkway strip leading to the hatch
    for (let i = 0; i < 6; i++) px(148, 34 + i * 4, 24, 2, i % 2 ? '#ffd23f' : '#6fd4e4');
    // floor grates
    [[40, 110], [264, 112], [150, 196]].forEach(([x, y]) => {
      px(x, y, 20, 10, '#4aa9bd');
      for (let i = 0; i < 5; i++) px(x + 2 + i * 4, y + 2, 2, 6, '#2f7f95');
    });
  }

  function drawWalls(t) {
    px(0, 0, W, 32, '#26408a');
    px(0, 26, W, 6, '#1c2f68');
    for (let x = 0; x < W; x += 32) { px(x, 0, 1, 26, '#34539f'); circle(x + 4, 4, 1, '#5c7cc9'); circle(x + 28, 4, 1, '#5c7cc9'); }
    px(0, 32, 16, 176, '#20367a');
    px(304, 32, 16, 176, '#20367a');
    px(0, 208, W, 16, '#1c2f68');
    px(6, 32, 4, 176, '#ffb627');
    px(310, 32, 4, 176, '#ff7b54');
    for (let y = 48; y < 208; y += 40) { px(4, y, 8, 3, '#e08e00'); px(308, y, 8, 3, '#d9573a'); }
    for (let x = 0; x < W; x += 16) px(x, 212, 8, 3, '#ffd23f');

    // portholes with passing whales
    [[64, 14, 0], [256, 14, 17]].forEach(([cx, cy, off]) => {
      circle(cx, cy, 11, '#dfe8f7');
      circle(cx, cy, 9, '#2aa9e0');
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.clip();
      px(cx - 9, cy - 9, 18, 5, '#5cc8f2');
      const wx = ((t * 6 + off) % 40) - 20;
      ctx.fillStyle = '#123e78';
      ctx.beginPath(); ctx.ellipse(cx + wx, cy + 2, 6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + wx - 5, cy + 2); ctx.lineTo(cx + wx - 9, cy - 1); ctx.lineTo(cx + wx - 9, cy + 5); ctx.fill();
      const by = cy + 8 - ((t * 8 + off) % 18);
      circle(cx + 4, by, 1, '#bff0ff');
      ctx.restore();
      circle(cx - 3, cy - 4, 2, 'rgba(255,255,255,0.55)');
    });

    // hatch frame + door
    px(DOOR.x, DOOR.y, DOOR.w, DOOR.h, '#ffd23f');
    for (let i = 0; i < 12; i += 2) { px(DOOR.x + i * 4, DOOR.y, 4, 3, '#1b1b3a'); px(DOOR.x + i * 4 + 4, DOOR.y + DOOR.h - 3, 4, 3, '#1b1b3a'); }
    px(DOOR.x + 4, DOOR.y + 4, DOOR.w - 8, DOOR.h - 7, '#4c5877');
    const all = state.solved.length === 8;
    const pulse = all ? 0.5 + 0.5 * Math.sin(t * 5) : 0;
    circle(160, 18, 11, all ? `rgb(${170 + pulse * 80},${200 + pulse * 40},120)` : '#aab6cc');
    circle(160, 18, 8, '#7c8aa8');
    ctx.save();
    ctx.translate(160, 18);
    ctx.rotate(all ? t * 1.5 : 0);
    ctx.strokeStyle = '#dfe6f2'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke(); }
    ctx.restore();
    circle(160, 18, 2.5, '#ff5d73');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 5px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', 160, 31.5);

    // code lights
    const lx = [100, 108, 116, 124, 196, 204, 212, 220];
    lx.forEach((x, i) => {
      const on = i < state.solved.length;
      if (on) circle(x, 12, 4, 'rgba(61,255,138,0.35)');
      circle(x, 12, 2.6, on ? '#3dff8a' : '#ff4d6d');
      circle(x - 0.8, 11.2, 0.8, 'rgba(255,255,255,0.7)');
    });
  }

  function drawPool(t) {
    const { x, y, r } = POOL;
    ctx.fillStyle = 'rgba(0,40,80,0.18)';
    ctx.beginPath(); ctx.ellipse(x, y + 4, r + 2, r - 2, 0, 0, Math.PI * 2); ctx.fill();
    circle(x, y, r, '#eef4fb');
    circle(x, y, r - 2, '#9fb3d9');
    circle(x, y, r - 4, '#1fa7ea');
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r - 4, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const rr = ((t * 6 + i * 9) % 26);
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
    }
    // a dugong swimming laps
    const a = t * 0.7;
    const dx = x + Math.cos(a) * 13, dy = y + Math.sin(a) * 9;
    ctx.translate(dx, dy);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = '#b3a399';
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-10, -3.5); ctx.lineTo(-9, 0); ctx.lineTo(-10, 3.5); ctx.fill();
    ctx.fillStyle = '#8d7f76';
    ctx.fillRect(5, -1.5, 2.5, 3);
    ctx.restore();
    circle(x - 12, y - 12, 2, 'rgba(255,255,255,0.5)');
  }

  function drawDecor(d, t) {
    if (d.type === 'plant') {
      const sway = Math.sin(t * 2 + d.x) * 1.2;
      px(d.x + 3, d.y + 10, 8, 6, '#ff7b54');
      px(d.x + 3, d.y + 10, 8, 1, '#ffa27f');
      ctx.fillStyle = '#2ecc71';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(d.x + 5 + i * 2, d.y + 10);
        ctx.quadraticCurveTo(d.x + 2 + i * 4 + sway, d.y + 3, d.x + 3 + i * 4 + sway * 1.5, d.y - 2 + i);
        ctx.lineTo(d.x + 6 + i * 2, d.y + 10);
        ctx.fill();
      }
    } else if (d.type === 'crate') {
      px(d.x, d.y + 6, d.w, d.h - 6, '#c98a54');
      px(d.x, d.y + 6, d.w, 2, '#e0a877');
      px(d.x + 2, d.y + 10, d.w - 4, 1, '#8a5a30');
      px(d.x + 2, d.y + 16, d.w - 4, 1, '#8a5a30');
      px(d.x + 4, d.y, 14, 8, '#ffb627');
      px(d.x + 4, d.y, 14, 1, '#ffd67a');
    } else if (d.type === 'locker') {
      px(d.x, d.y, d.w, d.h, '#8fa0c8');
      px(d.x + d.w / 2, d.y, 1, d.h, '#5b6c95');
      for (let i = 0; i < 3; i++) { px(d.x + 3, d.y + 4 + i * 3, 7, 1, '#5b6c95'); px(d.x + 14, d.y + 4 + i * 3, 7, 1, '#5b6c95'); }
      px(d.x + 9, d.y + 15, 2, 3, '#ffd23f');
      px(d.x + 14, d.y + 15, 2, 3, '#ffd23f');
    }
  }

  const STATION_ART = {
    sonar(x, y, t) {
      px(x + 2, y + 14, 28, 18, '#3a4a8a'); px(x + 2, y + 14, 28, 2, '#5f73c2');
      px(x + 4, y + 1, 24, 15, '#26325c');
      circle(x + 16, y + 8, 6.5, '#07372a');
      ctx.strokeStyle = '#39ff9f'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(x + 16, y + 8, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 16, y + 8, 3, 0, Math.PI * 2); ctx.stroke();
      const a = t * 3;
      ctx.beginPath(); ctx.moveTo(x + 16, y + 8); ctx.lineTo(x + 16 + Math.cos(a) * 6, y + 8 + Math.sin(a) * 6); ctx.stroke();
      if (Math.sin(t * 3 - 1) > 0.5) circle(x + 19, y + 6, 1, '#b8ffd9');
      px(x + 6, y + 20, 4, 3, '#ff5d73'); px(x + 12, y + 20, 4, 3, '#ffd23f'); px(x + 18, y + 20, 4, 3, '#39ff9f');
      px(x + 6, y + 26, 16, 2, '#26325c');
    },
    bycatch(x, y, t) {
      px(x + 1, y + 3, 30, 27, '#9aa8c8');
      px(x + 3, y + 5, 26, 21, '#3fb6ff');
      px(x + 3, y + 5, 26, 4, '#7ad3ff');
      px(x + 3, y + 23, 26, 3, '#f2d48f');
      ctx.strokeStyle = 'rgba(230,240,220,0.8)'; ctx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(x + 17 + i * 3, y + 5); ctx.lineTo(x + 29, y + 9 + i * 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 29 - i * 3, y + 5); ctx.lineTo(x + 17, y + 9 + i * 4); ctx.stroke();
      }
      const fx = x + 10 + Math.sin(t * 1.5) * 5;
      ctx.fillStyle = '#d4e6f7';
      ctx.beginPath(); ctx.ellipse(fx, y + 15, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx - 4, y + 15); ctx.lineTo(fx - 7, y + 12.5); ctx.lineTo(fx - 7, y + 17.5); ctx.fill();
      px(x + 4, y + 29, 24, 3, '#5b6c95');
    },
    bones(x, y) {
      px(x + 2, y + 1, 28, 23, '#b07a3f');
      px(x + 4, y + 3, 24, 19, '#1f3f75');
      px(x + 12, y + 5, 8, 4, '#fff5e1');
      px(x + 11, y + 10, 4, 4, '#fff5e1'); px(x + 17, y + 10, 4, 4, '#fff5e1');
      for (let i = 0; i < 4; i++) px(x + 11 + i * 3, y + 15, 2, 2, '#fff5e1');
      for (let i = 0; i < 4; i++) px(x + 11 + i * 3, y + 18, 1, 3, '#fff5e1');
      px(x + 6, y + 24, 3, 8, '#8a5a30'); px(x + 23, y + 24, 3, 8, '#8a5a30');
    },
    foodweb(x, y, t) {
      px(x + 1, y + 1, 30, 23, '#7a4a22');
      px(x + 3, y + 3, 26, 19, '#d9a066');
      ctx.strokeStyle = '#e2334b'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(x + 8, y + 17); ctx.lineTo(x + 16, y + 8); ctx.lineTo(x + 24, y + 17); ctx.moveTo(x + 16, y + 8); ctx.lineTo(x + 16, y + 17); ctx.stroke();
      px(x + 13, y + 5, 6, 5, '#ffffff');
      px(x + 5, y + 15, 6, 5, '#b8f5c9'); px(x + 13, y + 15, 6, 5, '#ffe9a8'); px(x + 21, y + 15, 6, 5, '#bfe3ff');
      px(x + 6, y + 24, 3, 8, '#5a3818'); px(x + 23, y + 24, 3, 8, '#5a3818');
    },
    rebus(x, y) {
      px(x + 2, y + 1, 28, 21, '#e9eef6');
      px(x + 3, y + 2, 26, 19, '#ffffff');
      px(x + 5, y + 6, 6, 6, '#ff7b9c'); px(x + 13, y + 8, 2, 2, '#1b1b3a'); px(x + 12, y + 7, 4, 1, '#1b1b3a'); px(x + 13.5, y + 6, 1, 4, '#1b1b3a');
      px(x + 18, y + 6, 6, 6, '#56c6ff');
      px(x + 5, y + 15, 20, 2, '#ffd23f');
      px(x + 4, y + 22, 24, 2, '#b07a3f');
      px(x + 7, y + 22, 2, 10, '#8a5a30'); px(x + 23, y + 22, 2, 10, '#8a5a30'); px(x + 15, y + 22, 2, 8, '#8a5a30');
    },
    song(x, y, t) {
      px(x + 5, y + 5, 22, 26, '#7a45c0');
      px(x + 5, y + 5, 22, 2, '#9b6ce0');
      const pulse = 1 + Math.max(0, Math.sin(t * 6)) * 0.8;
      circle(x + 16, y + 13, 5, '#2b1a4a'); circle(x + 16, y + 13, 2 + pulse * 0.6, '#c7a8ff');
      circle(x + 16, y + 25, 3.5, '#2b1a4a'); circle(x + 16, y + 25, 1.5, '#c7a8ff');
      ctx.strokeStyle = `rgba(255,210,63,${0.4 + 0.4 * Math.sin(t * 4)})`; ctx.lineWidth = 0.8;
      for (let i = 1; i <= 2; i++) { ctx.beginPath(); ctx.arc(x + 16, y + 13, 7 + i * 3, Math.PI * 0.8, Math.PI * 1.2); ctx.stroke(); }
    },
    logic(x, y) {
      px(x + 1, y + 11, 30, 19, '#a0673a'); px(x + 1, y + 11, 30, 3, '#c98a54');
      px(x + 5, y + 5, 15, 11, '#ffffff');
      for (let i = 1; i < 4; i++) { px(x + 5 + i * 4, y + 5, 1, 11, '#9fc2ff'); px(x + 5, y + 5 + i * 3, 15, 1, '#9fc2ff'); }
      px(x + 10, y + 9, 2, 2, '#2ecc71'); px(x + 14, y + 12, 2, 2, '#ff5d73');
      ctx.save(); ctx.translate(x + 24, y + 8); ctx.rotate(0.6); px(-1, -6, 2, 10, '#ffd23f'); px(-1, 4, 2, 2, '#f6c7a1'); ctx.restore();
      px(x + 4, y + 30, 3, 2, '#5a3818'); px(x + 25, y + 30, 3, 2, '#5a3818');
    },
    vaquita(x, y, t) {
      px(x + 1, y + 16, 30, 16, '#6d7ea6'); px(x + 1, y + 16, 30, 2, '#8fa0c8');
      px(x + 4, y + 1, 24, 16, '#1b1b3a');
      px(x + 6, y + 3, 20, 12, '#0e2240');
      const hs = [10, 7, 5, 3, 2];
      hs.forEach((h, i) => px(x + 8 + i * 4, y + 14 - h, 3, h, i < 2 ? '#ffb627' : '#ff5d73'));
      if (Math.sin(t * 4) > 0) px(x + 23, y + 4, 2, 2, '#ff5d73');
      px(x + 8, y + 21, 16, 4, '#dfe6f2');
    },
  };

  function drawStation(id, s, t, isNear, idx) {
    ctx.fillStyle = 'rgba(0,40,80,0.2)';
    ctx.fillRect(s.x + 2, s.y + 29, 28, 4);
    STATION_ART[id](s.x, s.y, t);
    if (isNear) {
      ctx.strokeStyle = `rgba(255,210,63,${0.6 + 0.4 * Math.sin(t * 8)})`;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(s.x - 1, s.y - 1, 34, 34);
    }
  }

  function drawIcons(t, near) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ER.puzzles.forEach((def, i) => {
      const s = STATIONS[def.id];
      if (!s) return;
      const bob = Math.sin(t * 2.4 + i) * 1.5;
      const cx = s.x + 16, cy = s.y - 5 + bob;
      const solved = state.solved.includes(def.id);
      circle(cx, cy, 6.5, solved ? '#3ddc84' : near === def.id ? '#ffd23f' : '#ffffff');
      ctx.strokeStyle = '#1b1b3a'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(cx, cy, 6.5, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '7px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      ctx.fillStyle = '#000';
      ctx.fillText(solved ? '✅' : def.icon, cx, cy + 0.5);
    });
    ctx.textBaseline = 'alphabetic';
  }

  function drawPlayer() {
    const p = player;
    ctx.fillStyle = 'rgba(0,40,80,0.25)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
    const frames = SPR[p.dir];
    const f = p.moving ? Math.floor(p.anim * 8) % frames.length : 0;
    ctx.drawImage(frames[f], Math.round(p.x - 6), Math.round(p.y - 16));
  }

  function draw(t) {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const near = nearest();
    drawFloor();
    drawWalls(t);
    drawPool(t);
    const ents = [];
    Object.entries(STATIONS).forEach(([id, s], i) => ents.push({ y: s.y + 32, fn: () => drawStation(id, s, t, near === id, i) }));
    DECOR.forEach((d) => ents.push({ y: d.y + d.h, fn: () => drawDecor(d, t) }));
    ents.push({ y: player.y, fn: drawPlayer });
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.fn());
    if (near === 'door') {
      ctx.strokeStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 8)})`;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(DOOR.x - 1, DOOR.y - 1, DOOR.w + 2, DOOR.h + 2);
    }
    drawIcons(t, near);
    updatePrompt(near);
  }

  // ---------- Prompt under the canvas ----------
  let lastPrompt = undefined;
  function updatePrompt(near) {
    if (near === lastPrompt) return;
    lastPrompt = near;
    promptEl.innerHTML = '';
    if (!near) { promptEl.hidden = true; return; }
    const def = near === 'door' ? ER.door : ER.get(near);
    const solved = state.solved.includes(near);
    promptEl.append(
      el('button', { class: 'btn btn-sun prompt-btn', onclick: () => openScene(near) },
        el('span', { class: 'prompt-icon' }, def.icon),
        el('span', {}, `${solved ? 'Replay' : 'Open'} ${def.title}`),
        el('kbd', {}, 'E'))
    );
    promptEl.hidden = false;
  }

  // ---------- Input ----------
  const held = new Set();
  const roomActive = () => !roomView.hidden && !modalOpen();
  const isTyping = (e) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;

  window.addEventListener('keydown', (e) => {
    if (!roomActive() || isTyping(e)) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      held.add(k);
      player.target = null;
      player.pendingOpen = null;
      e.preventDefault();
    } else if (k === 'e' || ((k === ' ' || k === 'enter') && (e.target === document.body || e.target === canvas))) {
      const n = nearest();
      if (n) { e.preventDefault(); openScene(n); }
    }
  });
  window.addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => held.clear());

  canvas.addEventListener('pointerdown', (e) => {
    if (!roomActive()) return;
    sfx.unlock();
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    // click a station (or its floating icon) -> walk to it and open
    for (const id in STATIONS) {
      const s = STATIONS[id];
      if (x >= s.x - 2 && x <= s.x + 34 && y >= s.y - 14 && y <= s.y + 34) {
        if (nearest() === id) { openScene(id); return; }
        player.target = s.front.slice();
        player.pendingOpen = id;
        return;
      }
    }
    if (x >= DOOR.x && x <= DOOR.x + DOOR.w && y <= DOOR.y + DOOR.h + 6) {
      if (nearest() === 'door') { openScene('door'); return; }
      player.target = DOOR.front.slice();
      player.pendingOpen = 'door';
      return;
    }
    player.target = [x, y];
    player.pendingOpen = null;
  });

  // ---------- Update loop ----------
  function update(dt) {
    let vx = 0, vy = 0;
    if (held.has('arrowleft') || held.has('a')) vx -= 1;
    if (held.has('arrowright') || held.has('d')) vx += 1;
    if (held.has('arrowup') || held.has('w')) vy -= 1;
    if (held.has('arrowdown') || held.has('s')) vy += 1;
    const speed = 68;
    let arrived = false;
    if (!vx && !vy && player.target) {
      const dx = player.target[0] - player.x, dy = player.target[1] - player.y;
      const d = Math.hypot(dx, dy);
      if (d < 1.5) { arrived = true; }
      else { vx = dx / d; vy = dy / d; }
      if (d < speed * dt) { vx *= d / (speed * dt); vy *= d / (speed * dt); }
    } else if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }

    let moved = false;
    if (vx || vy) {
      const mx = vx * speed * dt, my = vy * speed * dt;
      if (mx && !blocked(player.x + mx, player.y)) { player.x += mx; moved = true; }
      if (my && !blocked(player.x, player.y + my)) { player.y += my; moved = true; }
      if (Math.abs(vx) > Math.abs(vy)) player.dir = vx > 0 ? 'right' : 'left';
      else player.dir = vy > 0 ? 'down' : 'up';
      if (!moved && player.target) arrived = true;
    }
    player.moving = moved;
    if (moved) {
      player.anim += dt;
      player.stepT += dt;
      if (player.stepT > 0.28) { player.stepT = 0; sfx.step(); }
    }
    if (arrived) {
      const pend = player.pendingOpen;
      player.target = null;
      player.pendingOpen = null;
      if (pend && nearest() === pend) openScene(pend);
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!roomView.hidden) {
      if (!modalOpen()) update(dt);
      draw(now / 1000);
    }
    if (state.timerOn) {
      state.elapsed = (Date.now() - state.startTime) / 1000;
      const txt = fmtTime(state.elapsed);
      if (hudTime.textContent !== txt) hudTime.textContent = txt;
    }
    requestAnimationFrame(frame);
  }

  const fmtTime = (s) => {
    s = Math.floor(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  };

  // ---------- Notes ----------
  function codeTiles(code) {
    return el('span', { class: 'code-tiles' },
      el('span', { class: 'tile letter' }, el('small', {}, 'letter'), code.letter),
      el('span', { class: 'tile number' }, el('small', {}, 'number'), String(code.number)));
  }
  ER.codeTiles = codeTiles;

  function renderNotes(newId) {
    notesList.innerHTML = '';
    ER.puzzles.forEach((def) => {
      const solved = state.solved.includes(def.id);
      notesList.append(el('li', { class: 'note' + (solved ? ' solved' : '') + (def.id === newId ? ' new' : '') },
        el('span', { class: 'note-icon' }, def.icon),
        el('div', { class: 'note-text' },
          el('b', {}, def.title),
          solved ? null : el('span', { class: 'note-missing' }, 'Code not found yet')),
        solved ? codeTiles(def.code) : el('span', { class: 'code-tiles empty' }, el('span', { class: 'tile' }, '?'), el('span', { class: 'tile' }, '?'))));
    });
    hudCodes.textContent = `${state.solved.length} / 8`;
  }

  // ---------- Scenes ----------
  function openScene(id) {
    const def = id === 'door' ? ER.door : ER.get(id);
    if (!def || modalOpen()) return;
    sfx.unlock();
    sfx.open();
    held.clear();
    player.target = null;
    player.pendingOpen = null;
    state.current = id;
    roomView.hidden = true;
    puzzleView.hidden = false;
    puzzleView.innerHTML = '';

    const hintBox = el('div', { class: 'hint-box', hidden: true });
    let shown = 0;
    const hints = def.hints || [];
    const hintBtn = el('button', { class: 'btn btn-sun' }, `💡 Hint (${hints.length} left)`);
    hintBtn.addEventListener('click', () => {
      if (shown >= hints.length) return;
      sfx.hint();
      hintBox.hidden = false;
      hintBox.append(el('div', { class: 'hint' }, el('b', {}, shown === 0 ? 'Hint 1: ' : 'Hint 2: '), hints[shown]));
      shown++;
      const left = hints.length - shown;
      hintBtn.textContent = left ? `💡 Another hint (${left} left)` : '💡 No more hints';
      hintBtn.disabled = !left;
    });
    const printBtn = def.printable
      ? el('button', { class: 'btn btn-light', onclick: () => {
          document.body.classList.add('printing');
          setTimeout(() => { window.print(); document.body.classList.remove('printing'); }, 50);
        } }, '🖨️ Print sheet')
      : null;

    const head = el('header', { class: 'scene-head' },
      el('button', { class: 'btn btn-back', onclick: closeScene }, '⬅ Back to lab'),
      el('div', { class: 'scene-title' },
        el('span', { class: 'scene-icon' }, def.icon),
        el('div', {}, el('h2', {}, def.title), el('p', {}, def.tagline))),
      el('div', { class: 'tools' }, hintBtn, printBtn));

    const banner = state.solved.includes(id) && id !== 'door'
      ? el('div', { class: 'solved-banner' }, el('span', {}, '✅ Already solved! Your code is in your Field Notes:'), codeTiles(def.code))
      : null;
    const body = el('div', { class: 'scene-body' });
    const scene = el('div', { class: 'scene kind-' + def.kind }, head, hintBox, banner, body);
    puzzleView.append(scene);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const api = {
      sfx,
      alreadySolved: state.solved.includes(id),
      solve: () => solvePuzzle(def),
      codes: () => state.solved.map((sid) => ER.get(sid)),
      missing: () => ER.puzzles.filter((p) => !state.solved.includes(p.id)),
      allDone: state.solved.length === ER.puzzles.length,
      escape: showEscape,
    };
    try {
      state.cleanup = def.build(body, api) || null;
    } catch (err) {
      console.error(err);
      body.append(el('p', { class: 'feedback bad' }, 'Oops, this station had a problem loading. Go back and try again.'));
    }
  }

  function closeScene() {
    if (state.cleanup) { try { state.cleanup(); } catch (e) { console.error(e); } }
    state.cleanup = null;
    state.current = null;
    puzzleView.hidden = true;
    puzzleView.innerHTML = '';
    roomView.hidden = false;
    lastPrompt = undefined;
    sfx.back();
    canvas.focus();
  }
  ER.closeScene = closeScene;

  function solvePuzzle(def) {
    if (state.solved.includes(def.id)) return;
    state.solved.push(def.id);
    renderNotes(def.id);
    sfx.solve();
    setTimeout(() => {
      const content = el('div', { class: 'reward' },
        el('div', { class: 'reward-burst' }, '🎉'),
        el('p', { class: 'reward-lead' }, 'You found a code! It has been saved in your Field Notes.'),
        el('div', { class: 'reward-tiles' }, codeTiles(def.code)),
        def.fact ? el('div', { class: 'fact-card' }, el('b', {}, '🐋 Did you know? '), def.fact) : null,
        el('p', { class: 'muted small' }, state.solved.length === 8
          ? '🚪 That is all 8 codes! Head to the EXIT hatch at the top of the lab.'
          : `${state.solved.length} of 8 codes found.`));
      ER.modal({
        title: `${def.icon} ${def.title} solved!`,
        content,
        className: 'reward-modal',
        buttons: [
          { label: '⬅ Back to the lab', class: 'btn-aqua btn-big', onClick: closeScene },
          { label: 'Stay here', class: 'btn-light' },
        ],
      });
    }, 650);
  }

  function showEscape() {
    if (state.timerOn) state.elapsed = (Date.now() - state.startTime) / 1000;
    state.escaped = true;
    state.timerOn = false;
    sfx.escape();
    const confetti = el('div', { class: 'confetti', 'aria-hidden': 'true' });
    const colors = ['#ffd23f', '#ff6b6b', '#19c3e6', '#3ddc84', '#a970ff', '#ff9f43'];
    for (let i = 0; i < 70; i++) {
      confetti.append(el('i', { style: {
        left: Math.random() * 100 + '%',
        background: colors[i % colors.length],
        animationDelay: Math.random() * 2.5 + 's',
        animationDuration: 2.5 + Math.random() * 2 + 's',
        transform: `rotate(${Math.random() * 360}deg)`,
      } }));
    }
    const content = el('div', { class: 'escape-content' },
      confetti,
      el('div', { class: 'escape-swimmers', 'aria-hidden': 'true' },
        el('span', { class: 'swim s1', html: ER.art.humpback }),
        el('span', { class: 'swim s2', html: ER.art.dugong }),
        el('span', { class: 'swim s3', html: ER.art.orca })),
      el('h2', { class: 'escape-title' }, 'YOU ESCAPED!'),
      el('p', { class: 'escape-time' }, `⏱️ Your time: ${fmtTime(state.elapsed)}`),
      el('div', { class: 'answer-word' }, ...'BLOWHOLE'.split('').map((c) => el('span', {}, c))),
      el('div', { class: 'fact-card' },
        el('b', {}, '🐳 BLOWHOLE: '),
        'a blowhole is a whale\'s nostril, moved to the top of its head so it can breathe without lifting its whole head out of the water. Toothed whales like dolphins have one blowhole. Baleen whales like humpbacks have two.'),
      el('p', { class: 'muted' }, 'You cracked a Vigenère cypher and proved you are a true marine mammal expert. Show your teacher this screen!'));
    ER.modal({
      content,
      className: 'escape-modal',
      dismissable: false,
      buttons: [
        { label: '🐬 Back to the lab', class: 'btn-light', onClick: closeScene },
        { label: '🔁 Play again', class: 'btn-sun btn-big', onClick: () => location.reload() },
      ],
    });
  }

  // ---------- Intro / help ----------
  function showIntro(first) {
    const content = el('div', { class: 'intro' },
      el('div', { class: 'intro-art', 'aria-hidden': 'true' },
        el('span', { html: ER.art.humpback }), el('span', { html: ER.art.dugong }), el('span', { html: ER.art.orca })),
      el('p', { class: 'intro-story' },
        'You are a marine biologist at ', el('b', {}, 'Research Station Nautilus'),
        ', deep under the sea. A storm has knocked out the power and the ', el('b', {}, 'escape hatch is locked'), '! ',
        'The security computer will only open for someone who really knows their whales, dolphins, dugongs and manatees.'),
      el('ul', { class: 'intro-steps' },
        el('li', {}, el('span', {}, '🚶'), el('div', {}, el('b', {}, 'Explore the lab. '), 'Walk with ', el('kbd', {}, 'WASD'), ' or the ', el('kbd', {}, 'arrow keys'), ', or click where you want to go.')),
        el('li', {}, el('span', {}, '🧩'), el('div', {}, el('b', {}, 'Solve 8 stations. '), 'Walk up to a glowing station and press ', el('kbd', {}, 'E'), ' or click it. You can do them in any order.')),
        el('li', {}, el('span', {}, '📓'), el('div', {}, el('b', {}, 'Collect codes. '), 'Each station gives you a letter and a number. They are saved in your Field Notes.')),
        el('li', {}, el('span', {}, '✏️'), el('div', {}, el('b', {}, 'Grab a pencil and paper. '), 'Some puzzles are much easier if you write things down.')),
        el('li', {}, el('span', {}, '🚪'), el('div', {}, el('b', {}, 'Escape! '), 'Take all 8 codes to the EXIT hatch and crack the code with the key word ', el('b', {}, 'CETACEAN'), '.'))),
      el('p', { class: 'muted small' }, '⚠️ Your progress is only kept while this page is open, so don\'t refresh or close the tab.'));
    ER.modal({
      title: first ? '🌊 Welcome aboard, scientist!' : '❓ How to play',
      content,
      className: 'intro-modal',
      dismissable: !first,
      buttons: [{
        label: first ? '🌊 Dive in!' : 'Got it!',
        class: 'btn-sun btn-big',
        onClick: () => {
          sfx.unlock();
          if (!state.timerOn && !state.escaped) { state.timerOn = true; state.startTime = Date.now() - state.elapsed * 1000; }
          canvas.focus();
        },
      }],
    });
  }

  // ---------- Top bar ----------
  const soundBtn = document.getElementById('btn-sound');
  soundBtn.addEventListener('click', () => {
    sfx.setMuted(!sfx.muted);
    soundBtn.textContent = sfx.muted ? '🔇' : '🔊';
    if (!sfx.muted) sfx.tap();
  });
  document.getElementById('btn-help').addEventListener('click', () => showIntro(false));

  window.addEventListener('beforeunload', (e) => {
    if (state.solved.length && !state.escaped) { e.preventDefault(); e.returnValue = ''; }
  });

  // background bubbles
  const bubbles = document.getElementById('bubbles');
  for (let i = 0; i < 22; i++) {
    const size = 6 + Math.random() * 22;
    bubbles.append(el('span', { style: {
      left: Math.random() * 100 + '%',
      width: size + 'px', height: size + 'px',
      animationDuration: 9 + Math.random() * 14 + 's',
      animationDelay: -Math.random() * 20 + 's',
    } }));
  }

  canvas.tabIndex = 0;
  renderNotes();
  requestAnimationFrame(frame);
  showIntro(true);

  // Handy for testing in the console: ER._debug.solveAll()
  ER._debug = {
    state,
    solveAll() { ER.puzzles.forEach((p) => { if (!state.solved.includes(p.id)) state.solved.push(p.id); }); renderNotes(); },
    open: openScene,
    player,
    step(seconds) { for (let t = 0; t < seconds; t += 0.02) update(0.02); },
  };
})();
