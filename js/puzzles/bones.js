/* Puzzle: Flipper Bones (4 stages) - homologous structures and whale evolution. */
ER.register({
  id: 'bones',
  title: 'Flipper Bones',
  icon: '🦴',
  kind: 'digital',
  tagline: 'Four lab stages: rebuild flippers and trace how whales evolved',
  code: { letter: 'D', number: 1 },
  printable: false,
  fact: 'Whales evolved from four-legged land mammals about 50 million years ago. Their flippers still have the same bones as our arms, and some whales still have tiny leftover hip bones. Same bones, different job = homologous structures.',
  hints: [
    'Stages 1 and 2: the HUMERUS is the single big bone nearest the body. The RADIUS is on the thumb side (left). The ULNA has a round elbow bump and sits on the pinky side (right). Then come the small WRIST bones (carpals), then the long FINGER bones (phalanges).',
    'Stage 3: HOMOlogous = same bones, different job. ANALOGOUS = different body parts doing the same job. VESTIGIAL = a leftover part that has lost its use. Stage 4: put the ancestors in order from the most land-living to the most ocean-living.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const STAGES = ['Whale flipper', 'Dugong flipper', 'Sort the evidence', 'Whale ancestors'];
    const steps = el('div', { class: 'stage-steps' }, STAGES.map((s, i) => el('span', {}, `${i + 1}. ${s}`)));
    const host = el('div', { class: 'stage' });
    body.append(steps, host);
    const builders = [stageFlipper, stageDugong, stageSort, stageTimeline];
    let idx = 0;

    function show(i) {
      idx = i;
      [...steps.children].forEach((s, j) => { s.className = j < i ? 'done' : j === i ? 'now' : ''; });
      host.innerHTML = '';
      builders[i]();
      if (i > 0) steps.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function finish(msg) {
      const last = idx === builders.length - 1;
      const next = last ? null : el('button', { class: 'btn btn-aqua btn-big', onclick: () => { sfx.tap(); show(idx + 1); } }, 'Next stage ➜');
      const card = el('div', { class: 'card stage-done' }, el('p', {}, msg), next);
      host.append(card);
      if (last) {
        steps.children[idx].className = 'done';
        api.solve();
      }
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
    }

    // ---------------- Stage 1: whale flipper ----------------
    function stageFlipper() {
      const BONES = [
        { id: 'humerus', name: 'Humerus', color: '#ff6b6b' },
        { id: 'radius', name: 'Radius', color: '#4d9fff' },
        { id: 'ulna', name: 'Ulna', color: '#2ecc71' },
        { id: 'carpals', name: 'Wrist bones', color: '#a970ff' },
        { id: 'phalanges', name: 'Finger bones', color: '#ffa53d' },
      ];
      const C = Object.fromEntries(BONES.map((b) => [b.id, b.color]));
      const fingers = [82, 96, 110, 124].map((x) =>
        `<rect x="${x}" y="328" width="11" height="34" rx="5"/><rect x="${x}" y="366" width="11" height="24" rx="5"/><rect x="${x}" y="394" width="11" height="18" rx="5"/><rect x="${x}" y="416" width="11" height="12" rx="5"/>`).join('');
      const human = `
        <svg viewBox="-20 0 250 440" class="bone-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Labelled human arm bones">
          <path d="M60,10 C60,0 140,0 140,10 L150,160 L140,300 C150,340 150,420 120,436 L75,436 C50,420 48,340 60,300 L50,160 Z" fill="#fde7d4" stroke="#f3c7a3" stroke-width="3"/>
          <g fill="${C.humerus}"><rect x="88" y="24" width="24" height="136" rx="12"/><circle cx="100" cy="26" r="17"/><ellipse cx="100" cy="158" rx="20" ry="10"/></g>
          <g fill="${C.radius}"><rect x="72" y="174" width="16" height="118" rx="8"/></g>
          <g fill="${C.ulna}"><rect x="112" y="174" width="16" height="120" rx="8"/><circle cx="122" cy="174" r="11"/></g>
          <g fill="${C.carpals}"><circle cx="78" cy="305" r="7"/><circle cx="92" cy="302" r="7"/><circle cx="106" cy="302" r="7"/><circle cx="120" cy="305" r="7"/><circle cx="85" cy="318" r="6"/><circle cx="100" cy="317" r="6"/><circle cx="115" cy="318" r="6"/></g>
          <g fill="${C.phalanges}">${fingers}<rect x="60" y="322" width="11" height="26" rx="5" transform="rotate(20 65 335)"/><rect x="52" y="350" width="11" height="20" rx="5" transform="rotate(20 57 360)"/><rect x="46" y="372" width="11" height="14" rx="5" transform="rotate(20 51 379)"/></g>
          <g font-family="Fredoka, sans-serif" font-size="15" font-weight="600" fill="#10204a">
            <line x1="118" y1="80" x2="150" y2="80" stroke="#10204a"/><text x="153" y="85">Humerus</text>
            <line x1="128" y1="235" x2="150" y2="235" stroke="#10204a"/><text x="153" y="240">Ulna</text>
            <line x1="72" y1="235" x2="40" y2="235" stroke="#10204a"/><text x="37" y="240" text-anchor="end">Radius</text>
            <line x1="128" y1="308" x2="150" y2="308" stroke="#10204a"/><text x="153" y="306">Wrist</text><text x="153" y="322" font-size="12">(carpals)</text>
            <line x1="136" y1="385" x2="150" y2="385" stroke="#10204a"/><text x="153" y="383">Finger</text><text x="153" y="399" font-size="12">(phalanges)</text>
            <text x="40" y="330" text-anchor="end" font-size="12">thumb</text>
          </g>
        </svg>`;
      const digit = (x0, n) => {
        let s = '';
        for (let k = 0; k < n; k++) {
          const x = x0 + (100 - x0) * (k / 14);
          s += `<rect x="${(x - 5).toFixed(1)}" y="${214 + k * 18}" width="10" height="14" rx="4"/>`;
        }
        return s;
      };
      const flipper = `
        <svg viewBox="0 0 200 440" class="bone-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Whale flipper with empty bone spaces">
          <path d="M62,12 C30,40 38,130 44,210 C50,300 70,390 100,434 C128,392 150,300 156,210 C162,130 162,40 136,12 C115,0 82,0 62,12 Z" fill="#bfe6f5" stroke="#3a8fb7" stroke-width="3"/>
          <g class="fbone" data-bone="humerus" fill="${C.humerus}"><rect x="78" y="32" width="46" height="54" rx="20"/><circle cx="101" cy="34" r="20"/></g>
          <g class="fbone" data-bone="radius" fill="${C.radius}"><rect x="68" y="100" width="28" height="60" rx="10"/></g>
          <g class="fbone" data-bone="ulna" fill="${C.ulna}"><rect x="104" y="104" width="28" height="56" rx="10"/><circle cx="124" cy="104" r="10"/></g>
          <g class="fbone" data-bone="carpals" fill="${C.carpals}"><circle cx="74" cy="180" r="8"/><circle cx="92" cy="178" r="8"/><circle cx="110" cy="178" r="8"/><circle cx="128" cy="180" r="8"/><circle cx="83" cy="197" r="8"/><circle cx="101" cy="196" r="8"/><circle cx="119" cy="197" r="8"/></g>
          <g class="fbone" data-bone="phalanges" fill="${C.phalanges}">${digit(70, 8)}${digit(88, 11)}${digit(110, 11)}${digit(128, 7)}</g>
        </svg>`;
      const ZONES = { humerus: [62, 12, 76, 80], radius: [56, 94, 44, 72], ulna: [100, 92, 44, 74], carpals: [58, 168, 86, 40], phalanges: [52, 208, 96, 210] };
      const stage = el('div', { class: 'flipper-stage', html: flipper });
      const zones = Object.entries(ZONES).map(([id, [x, y, w, h]]) => {
        const z = el('div', { class: 'bone-zone', 'data-accept': id, 'aria-label': 'Empty bone space', style: {
          left: (x / 200) * 100 + '%', top: (y / 440) * 100 + '%', width: (w / 200) * 100 + '%', height: (h / 440) * 100 + '%',
        } }, el('span', { class: 'zone-q' }, '?'));
        stage.append(z);
        return z;
      });
      const pieceArt = {
        humerus: '<rect x="14" y="18" width="32" height="32" rx="12"/><circle cx="30" cy="18" r="13"/>',
        radius: '<rect x="20" y="6" width="20" height="48" rx="7"/>',
        ulna: '<rect x="20" y="14" width="20" height="42" rx="7"/><circle cx="35" cy="13" r="8"/>',
        carpals: '<circle cx="16" cy="24" r="7"/><circle cx="30" cy="22" r="7"/><circle cx="44" cy="24" r="7"/><circle cx="23" cy="38" r="7"/><circle cx="37" cy="38" r="7"/>',
        phalanges: [12, 24, 36, 48].map((x, i) => Array.from({ length: 5 - (i === 3 ? 2 : 0) }, (_, k) => `<rect x="${x - 4}" y="${4 + k * 11}" width="8" height="9" rx="3"/>`).join('')).join(''),
      };
      const tray = el('div', { class: 'tray' });
      const pieces = ER.shuffle(BONES).map((b, i) => {
        const p = el('button', { class: 'bone-piece', 'data-bone': b.id, 'aria-label': 'Mystery bone ' + (i + 1) },
          el('span', { html: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="#fff5e1" stroke="#b9a98a" stroke-width="2">${pieceArt[b.id]}</g></svg>` }),
          el('small', {}, 'Bone ' + 'ABCDE'[i]));
        tray.append(p);
        return p;
      });
      const fb = el('p', { class: 'feedback', 'aria-live': 'polite' }, 'Drag each mystery bone into the right space on the flipper (or tap a bone, then tap a space).');

      host.append(
        el('div', { class: 'card intro-card' },
          el('p', {}, el('b', {}, 'Stage 1: '), '🦴 A museum\'s whale flipper skeleton has fallen apart! Use the ', el('b', {}, 'human arm'), ' as a guide to put the ', el('b', {}, '5 bone groups'), ' back into the flipper.')),
        el('div', { class: 'bones-layout' },
          el('figure', { class: 'bone-fig' }, el('figcaption', {}, '🙋 Human arm'), el('div', { html: human })),
          el('div', { class: 'bones-arrow', 'aria-hidden': 'true' }, '➜'),
          el('figure', { class: 'bone-fig' }, el('figcaption', {}, '🐋 Whale flipper'), stage)),
        el('h4', { class: 'tray-title' }, 'Mystery bones'),
        tray, fb);

      let placed = 0;
      ER.dnd({
        pieces, zones, tray,
        onDrop(p, z) {
          if (!z) return;
          const want = z.dataset.accept, have = p.dataset.bone;
          if (want === have) {
            sfx.good();
            p.remove();
            z.classList.add('filled');
            z.innerHTML = '';
            z.append(el('span', { class: 'zone-label' }, BONES.find((b) => b.id === have).name));
            stage.querySelector(`.fbone[data-bone="${have}"]`).classList.add('show');
            placed++;
            if (placed < 5) ER.say(fb, `✅ Correct! ${5 - placed} bone group${5 - placed === 1 ? '' : 's'} to go.`, 'good');
            else { fb.textContent = ''; finish('✅ Flipper rebuilt! A whale flipper has the same bones as your arm. Next: a dugong, with no colours to help.'); }
          } else {
            sfx.bad();
            ER.shake(p);
            ER.say(fb, 'Not quite! Compare the shape and position with the human arm.', 'bad');
          }
        },
      });
    }

    // ---------------- Stage 2: dugong flipper labels ----------------
    function stageDugong() {
      const B = 'fill="#efe6d2" stroke="#a89878" stroke-width="2"';
      const digits = [[62, 3], [81, 4], [100, 4], [119, 4], [138, 3]].map(([x, n]) =>
        Array.from({ length: n }, (_, k) => `<rect x="${x - 6}" y="${216 + k * 18}" width="12" height="14" rx="4" ${B}/>`).join('')).join('');
      const badge = (x, y, n) => `<circle cx="${x}" cy="${y}" r="13" fill="#10204a" stroke="#ffd23f" stroke-width="3"/><text x="${x}" y="${y + 5.5}" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="16" font-weight="700" fill="#fff">${n}</text>`;
      const svg = `
        <svg viewBox="0 0 200 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dugong flipper with 5 numbered bone groups">
          <path d="M60,14 C34,40 38,120 42,190 C46,270 62,340 100,366 C138,340 154,270 158,190 C162,120 166,40 140,14 C118,0 82,0 60,14 Z" fill="#d9ccc2" stroke="#8d7f76" stroke-width="3"/>
          <g ${B}><rect x="78" y="30" width="44" height="60" rx="18"/><circle cx="100" cy="32" r="20"/></g>
          <g ${B}><rect x="66" y="102" width="26" height="66" rx="9"/></g>
          <g ${B}><rect x="106" y="106" width="26" height="62" rx="9"/><circle cx="126" cy="106" r="10"/></g>
          <g ${B}><circle cx="72" cy="184" r="8"/><circle cx="90" cy="182" r="8"/><circle cx="108" cy="182" r="8"/><circle cx="126" cy="184" r="8"/><circle cx="81" cy="200" r="7"/><circle cx="99" cy="199" r="7"/><circle cx="117" cy="200" r="7"/></g>
          ${digits}
          ${badge(119, 140, 1)}${badge(100, 262, 2)}${badge(100, 62, 3)}${badge(142, 212, 4)}${badge(79, 138, 5)}
          <line x1="130" y1="206" x2="126" y2="192" stroke="#10204a" stroke-width="2"/>
          <text x="44" y="30" font-family="Fredoka, sans-serif" font-size="12" fill="#5a6a8f" text-anchor="middle">thumb</text>
          <text x="44" y="42" font-family="Fredoka, sans-serif" font-size="12" fill="#5a6a8f" text-anchor="middle">side</text>
        </svg>`;
      const task = ER.matchTask({
        layout: 'list',
        slots: [['1', 'ulna'], ['2', 'phalanges'], ['3', 'humerus'], ['4', 'carpals'], ['5', 'radius']].map(([n, id]) => ({ label: `Bone ${n}`, accept: id })),
        cards: [
          { id: 'humerus', content: 'Humerus' },
          { id: 'radius', content: 'Radius' },
          { id: 'ulna', content: 'Ulna' },
          { id: 'carpals', content: 'Carpals (wrist bones)' },
          { id: 'phalanges', content: 'Phalanges (finger bones)' },
        ],
        onSolved: () => finish('✅ Dugong bones labelled! Dugongs are sirenians, not whales, yet their flippers hide the same arm bones too.'),
      });
      host.append(
        el('div', { class: 'card intro-card' },
          el('p', {}, el('b', {}, 'Stage 2: '), '🌿 Dugongs are ', el('b', {}, 'sirenians'), ', not whales, but their flippers have arm bones too. This time there are ', el('b', {}, 'no colours'), ' to help! Drag each bone name next to the matching number.')),
        el('div', { class: 'dugong-layout' },
          el('div', { class: 'card', html: svg }),
          el('div', { class: 'card' }, el('h4', {}, '🏷️ Name the numbered bones'), task)));
    }

    // ---------------- Stage 3: sort homologous / analogous / vestigial ----------------
    function stageSort() {
      const BINS = [
        { id: 'homo', title: '🦴 Homologous', desc: 'Same bones, different job' },
        { id: 'ana', title: '🎯 Analogous', desc: 'Different body parts, same job' },
        { id: 'vest', title: '💤 Vestigial', desc: 'A leftover part that has lost its use' },
      ];
      const CARDS = [
        ['homo', '🐋 Whale flipper and 🦇 bat wing'],
        ['homo', '🌿 Dugong flipper and 🙋 human arm'],
        ['homo', '🦭 Seal front flipper and 🐕 dog front leg'],
        ['ana', '🐬 Dolphin tail fluke and 🐟 fish tail fin'],
        ['ana', '🐬 Dolphin body shape and 🦈 shark body shape'],
        ['ana', '🐦 Bird wing and 🦋 butterfly wing'],
        ['vest', '🐋 Tiny hip bones inside a whale\'s body'],
        ['vest', '🙋 The tailbone at the bottom of your spine'],
        ['vest', '🐍 Tiny back-leg bones inside a python'],
      ].map(([cat, text], i) => el('button', { class: 'mt-card', 'data-cat': cat, 'data-i': i }, text.replace('🦭', '🌊')));

      const tray = el('div', { class: 'tray mt-tray' });
      ER.shuffle(CARDS).forEach((c) => tray.append(c));
      const drops = [];
      const bins = el('div', { class: 'sort-bins' }, BINS.map((b) => {
        const drop = el('div', { class: 'bin-drop', 'data-cat': b.id });
        drops.push(drop);
        return el('div', { class: 'sort-bin' }, el('h4', {}, b.title), el('p', {}, b.desc), drop);
      }));
      const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
      const btn = el('button', { class: 'btn btn-sun btn-big' }, '✔ Check my sorting');

      ER.dnd({
        pieces: CARDS, zones: drops, tray,
        onDrop(card, zone) {
          sfx.tap();
          (zone || tray).append(card);
          fb.textContent = '';
        },
      });
      btn.addEventListener('click', () => {
        const left = tray.querySelectorAll('.mt-card').length;
        if (left) { sfx.bad(); ER.say(fb, `Sort every card first (${left} still in the tray).`, 'bad'); return; }
        let wrong = 0;
        drops.forEach((d) => d.querySelectorAll('.mt-card:not(.locked)').forEach((c) => {
          if (c.dataset.cat === d.dataset.cat) c.classList.add('locked');
          else { wrong++; tray.append(c); ER.shake(c); }
        }));
        if (!wrong) {
          btn.hidden = true;
          tray.hidden = true;
          sfx.good();
          fb.textContent = '';
          finish('✅ Evidence sorted! Homologous and vestigial structures are clues that living things share ancestors.');
        } else {
          sfx.bad();
          ER.say(fb, `${9 - wrong} correct and locked in 🔒. ${wrong} went back to the tray. Read the three definitions again!`, 'bad');
        }
      });

      host.append(
        el('div', { class: 'card intro-card' },
          el('p', {}, el('b', {}, 'Stage 3: '), '🔬 Scientists use body parts as evidence for evolution. Drag each pair of body parts into the right group, then press Check.')),
        bins,
        el('h4', { class: 'tray-title' }, 'Evidence cards'),
        tray,
        el('div', { class: 'row-center' }, btn),
        fb);
    }

    // ---------------- Stage 4: whale ancestor timeline ----------------
    function stageTimeline() {
      const FOSSILS = [
        { id: 'pakicetus', name: 'Pakicetus', desc: 'Wolf-sized. Lived on land and waded in shallow water. Its ear bones were shaped like a whale\'s.', date: 'about 50 million years ago' },
        { id: 'ambulocetus', name: 'Ambulocetus', desc: 'The "walking whale". Hunted like a crocodile, half in the water and half on land.', date: 'about 49 million years ago' },
        { id: 'rodhocetus', name: 'Rodhocetus', desc: 'Spent most of its time in the sea. Short legs with big feet for paddling.', date: 'about 47 million years ago' },
        { id: 'basilosaurus', name: 'Basilosaurus', desc: 'Lived only in the ocean. Long body with tiny back legs it could not walk on.', date: 'about 40 million years ago' },
        { id: 'modern', name: 'Modern whale', desc: 'No back legs at all. Flippers, a fluke and a blowhole on top of its head.', date: 'today' },
      ];
      const task = ER.matchTask({
        layout: 'row',
        checkText: '✔ Check my timeline',
        slots: FOSSILS.map((f, i) => ({ label: i === 0 ? '1 · Oldest' : i === 4 ? '5 · Newest' : String(i + 1), accept: f.id })),
        cards: FOSSILS.map((f) => ({ id: f.id, content: [el('b', {}, f.name), el('span', {}, f.desc), el('span', { class: 'date' }, '🕰️ ' + f.date)] })),
        onSolved: () => finish('🎉 Timeline complete! Over millions of years, whale ancestors slowly moved from land into the sea.'),
      });
      host.append(
        el('div', { class: 'card intro-card' },
          el('p', {}, el('b', {}, 'Stage 4: '), '🦕 Fossils show that whales evolved from land mammals. Put these whale ancestors in order from ', el('b', {}, 'OLDEST'), ' (most land-living) to ', el('b', {}, 'NEWEST'), ' (most ocean-living).')),
        el('div', { class: 'card' }, task));
    }

    show(0);
    return null;
  },
});
