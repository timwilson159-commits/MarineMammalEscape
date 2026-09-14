/* Puzzle: Flipper Bones (drag and drop) - homologous structures / evolution. */
ER.register({
  id: 'bones',
  title: 'Flipper Bones',
  icon: '🦴',
  kind: 'digital',
  tagline: 'Rebuild a whale flipper. Why does it look like your arm?',
  code: { letter: 'D', number: 1 },
  printable: false,
  fact: 'Whales evolved from four-legged land mammals about 50 million years ago. Their flippers still have the same bones as our arms (humerus, radius, ulna, wrist and finger bones). Same bones, different job = homologous structures.',
  hints: [
    'Use the labelled human arm as your guide. The bone at the TOP (near the shoulder) is the humerus. The two bones in the middle are the radius and ulna. Then come the small wrist bones, then the long finger bones.',
    'The ulna has a round bump at its top, like your elbow. It sits on the pinky side (right). The radius is the plain bone on the thumb side (left). The finger bones are the long chains of little pieces.',
  ],
  build(body, api) {
    const { el, sfx } = ER;

    const BONES = [
      { id: 'humerus', name: 'Humerus (upper arm)', color: '#ff6b6b' },
      { id: 'radius', name: 'Radius', color: '#4d9fff' },
      { id: 'ulna', name: 'Ulna', color: '#2ecc71' },
      { id: 'carpals', name: 'Wrist bones (carpals)', color: '#a970ff' },
      { id: 'phalanges', name: 'Finger bones (phalanges)', color: '#ffa53d' },
    ];
    const C = Object.fromEntries(BONES.map((b) => [b.id, b.color]));

    // --- Human arm (labelled) ---
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

    // --- Whale flipper (bones hidden until placed) ---
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

    const ZONES = {
      humerus: [62, 12, 76, 80],
      radius: [56, 94, 44, 72],
      ulna: [100, 92, 44, 74],
      carpals: [58, 168, 86, 40],
      phalanges: [52, 208, 96, 210],
    };

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
    const quiz = el('div', { class: 'card quiz', hidden: true });

    body.append(
      el('div', { class: 'card intro-card' },
        el('p', {}, '🦴 A museum\'s whale flipper skeleton has fallen apart! Use the ', el('b', {}, 'human arm'), ' as a guide to put the ', el('b', {}, '5 bone groups'), ' back into the flipper.')),
      el('div', { class: 'bones-layout' },
        el('figure', { class: 'bone-fig' }, el('figcaption', {}, '🙋 Human arm'), el('div', { html: human })),
        el('div', { class: 'bones-arrow', 'aria-hidden': 'true' }, '➜'),
        el('figure', { class: 'bone-fig' }, el('figcaption', {}, '🐋 Whale flipper'), stage)),
      el('h4', { class: 'tray-title' }, 'Mystery bones'),
      tray, fb, quiz);

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
          z.append(el('span', { class: 'zone-label' }, BONES.find((b) => b.id === have).name.split(' (')[0]));
          stage.querySelector(`.fbone[data-bone="${have}"]`).classList.add('show');
          placed++;
          ER.say(fb, placed < 5 ? `✅ Correct! ${5 - placed} bone group${5 - placed === 1 ? '' : 's'} to go.` : '✅ The flipper is complete!', 'good');
          if (placed === 5) showQuiz();
        } else {
          sfx.bad();
          ER.shake(p);
          ER.say(fb, 'Not quite! Compare the shape and position with the human arm.', 'bad');
        }
      },
    });

    function showQuiz() {
      const qfb = el('p', { class: 'feedback' });
      const opts = [
        { t: 'Homologous structures', ok: true },
        { t: 'Analogous structures', why: 'Not quite. Analogous structures do the SAME job but have DIFFERENT bones, like a bird wing and an insect wing.' },
        { t: 'Vestigial structures', why: 'Not quite. Vestigial structures have lost their use, like the tiny hip bones inside a whale.' },
      ];
      quiz.hidden = false;
      quiz.append(
        el('h4', {}, '🧠 Final question'),
        el('p', {}, 'A whale flipper and a human arm have the ', el('b', {}, 'same bones in the same order'), ', but they do ', el('b', {}, 'different jobs'), ' (swimming and grabbing). What are they called?'),
        el('p', { class: 'muted small' }, 'Word clue: "homo" means SAME.'),
        el('div', { class: 'quiz-opts' }, ER.shuffle(opts).map((o) => el('button', {
          class: 'btn quiz-opt',
          onclick: (e) => {
            if (o.ok) {
              e.currentTarget.classList.add('right');
              quiz.querySelectorAll('button').forEach((b) => (b.disabled = true));
              ER.say(qfb, '🎉 Yes! Homologous structures show that whales and humans share a common ancestor.', 'good');
              api.solve();
            } else {
              sfx.bad();
              e.currentTarget.classList.add('wrong');
              ER.say(qfb, o.why, 'bad');
            }
          },
        }, o.t))),
        qfb);
      quiz.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return null;
  },
});
