/* Puzzle: Food Web Builder (drag and drop + check) - ecology, energy flow, seagrass loss. */
ER.register({
  id: 'foodweb',
  title: 'Food Web Builder',
  icon: '🕸️',
  kind: 'digital',
  tagline: 'Rebuild the ocean food web, then predict what happens',
  code: { letter: 'R', number: 8 },
  printable: false,
  fact: 'In 2011, floods and cyclones in Queensland smothered huge areas of seagrass. Many dugongs and green turtles starved. Protecting seagrass meadows protects the whole food web.',
  hints: [
    'Arrows point FROM the food TO the animal that eats it. So producers (plants) have NO arrows pointing into them, and apex predators have NO arrows pointing out.',
    'Start at the bottom left: seagrass → dugong → tiger shark. On the right, phytoplankton → krill. Krill has TWO arrows out (to the sardine and the humpback). The box with two arrows in and nothing out at the very top is the orca.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const VW = 800, VH = 520, BW = 150, BH = 62;

    const ORGS = {
      seagrass: { name: 'Seagrass', icon: '🌿', x: 130, y: 480 },
      phyto: { name: 'Phytoplankton', icon: '🦠', x: 560, y: 480 },
      dugong: { name: 'Dugong', svg: ER.art.dugong, x: 130, y: 340 },
      krill: { name: 'Krill', icon: '🦐', x: 560, y: 360 },
      shark: { name: 'Tiger shark', icon: '🦈', x: 130, y: 190 },
      sardine: { name: 'Sardine', icon: '🐟', x: 380, y: 250 },
      humpback: { name: 'Humpback whale', svg: ER.art.humpback, x: 680, y: 215 },
      dolphin: { name: 'Dolphin', icon: '🐬', x: 380, y: 110 },
      orca: { name: 'Orca', svg: ER.art.orca, x: 620, y: 60 },
    };
    const EDGES = [['seagrass', 'dugong'], ['phyto', 'krill'], ['dugong', 'shark'], ['krill', 'sardine'], ['krill', 'humpback'], ['sardine', 'humpback'], ['sardine', 'dolphin'], ['humpback', 'orca'], ['dolphin', 'orca']];

    const edgePt = (ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay;
      const t = Math.min((BW / 2 + 8) / Math.abs(dx || 1e-6), (BH / 2 + 8) / Math.abs(dy || 1e-6));
      return [ax + dx * t, ay + dy * t];
    };
    const lines = EDGES.map(([a, b]) => {
      const A = ORGS[a], B = ORGS[b];
      const [x1, y1] = edgePt(A.x, A.y, B.x, B.y);
      const [x2, y2] = edgePt(B.x, B.y, A.x, A.y);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ff7b39" stroke-width="5" marker-end="url(#arrow)" stroke-linecap="round"/>`;
    }).join('');
    const svg = `<svg viewBox="0 0 ${VW} ${VH}" class="web-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#ff7b39"/></marker></defs>
      <rect x="0" y="0" width="${VW}" height="${VH}" rx="24" fill="url(#seaGrad)"/>
      <defs><linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff0ff"/><stop offset="1" stop-color="#e9fff4"/></linearGradient></defs>
      ${lines}
    </svg>`;

    const stage = el('div', { class: 'web-stage', html: svg });
    const slots = Object.entries(ORGS).map(([id, o]) => {
      const s = el('div', { class: 'web-slot', 'data-accept': id, style: {
        left: ((o.x - BW / 2) / VW) * 100 + '%', top: ((o.y - BH / 2) / VH) * 100 + '%',
        width: (BW / VW) * 100 + '%', height: (BH / VH) * 100 + '%',
      } });
      stage.append(s);
      return s;
    });

    const tray = el('div', { class: 'tray web-tray' });
    const cards = ER.shuffle(Object.entries(ORGS)).map(([id, o]) => {
      const c = el('button', { class: 'web-card', 'data-org': id },
        o.svg ? el('span', { class: 'card-art', html: o.svg }) : el('span', { class: 'card-emoji' }, o.icon),
        el('span', { class: 'card-name' }, o.name));
      tray.append(c);
      return c;
    });

    const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    const checkBtn = el('button', { class: 'btn btn-sun btn-big' }, '✔ Check my food web');
    const questions = el('div', { class: 'card quiz', hidden: true });

    body.append(
      el('div', { class: 'card intro-card' },
        el('p', {}, '🕸️ A food web shows ', el('b', {}, 'who eats who'), '. The arrows show which way the ', el('b', {}, 'energy flows'),
          ': from the food to the animal that eats it. Drag the 9 living things into the boxes, then press ', el('b', {}, 'Check'), '.')),
      el('div', { class: 'web-layout' },
        stage,
        el('div', { class: 'card clues' },
          el('h4', {}, '🔎 Field guide clues'),
          el('ul', {},
            el('li', {}, '🌿 ', el('b', {}, 'Producers'), ' make food from sunlight. No arrows point into them.'),
            el('li', {}, 'Dugongs are herbivores. They only eat ', el('b', {}, 'seagrass'), '.'),
            el('li', {}, 'Tiger sharks hunt ', el('b', {}, 'dugongs'), '.'),
            el('li', {}, 'Krill are tiny animals that eat ', el('b', {}, 'phytoplankton'), '.'),
            el('li', {}, 'Sardines eat krill. Dolphins hunt sardines.'),
            el('li', {}, 'Humpback whales use their baleen to filter ', el('b', {}, 'krill and small fish'), '.'),
            el('li', {}, 'Orcas are ', el('b', {}, 'apex predators'), ': nothing hunts them. They eat dolphins and even humpback calves.')))),
      el('h4', { class: 'tray-title' }, 'Living things'),
      tray,
      el('div', { class: 'row-center' }, checkBtn),
      fb, questions);

    ER.dnd({
      pieces: cards, zones: slots, tray,
      onDrop(card, slot) {
        sfx.tap();
        if (!slot) { tray.append(card); return; }
        if (slot.classList.contains('locked')) return;
        const existing = slot.querySelector('.web-card');
        if (existing && existing !== card) tray.append(existing);
        slot.append(card);
        fb.textContent = '';
      },
    });

    let done = false;
    checkBtn.addEventListener('click', () => {
      if (done) return;
      const filled = slots.filter((s) => s.querySelector('.web-card'));
      if (filled.length < slots.length) {
        sfx.bad();
        ER.say(fb, `Place all 9 living things first (${filled.length} of 9 placed).`, 'bad');
        return;
      }
      let right = 0, wrong = 0;
      slots.forEach((s) => {
        const c = s.querySelector('.web-card');
        if (s.classList.contains('locked')) { right++; return; }
        if (c.dataset.org === s.dataset.accept) {
          right++;
          s.classList.add('locked');
          c.classList.add('locked');
        } else {
          wrong++;
          tray.append(c);
          ER.shake(c);
        }
      });
      if (!wrong) {
        done = true;
        sfx.good();
        checkBtn.hidden = true;
        ER.say(fb, '✅ Perfect food web! Now use it to predict what happens next...', 'good');
        askQuestions();
      } else {
        sfx.bad();
        ER.say(fb, `${right} correct and locked in 🔒. ${wrong} went back to the tray. Use the arrows and clues to try again.`, 'bad');
      }
    });

    function askQuestions() {
      const QS = [
        { q: '🌧️ Big floods cover the seagrass meadows in mud and the seagrass dies. Which animal goes hungry FIRST?', opts: ['Dugong', 'Orca', 'Krill', 'Sardine'], a: 'Dugong', why: 'Look at the arrow coming OUT of the seagrass box. Which animal does it point to?' },
        { q: '🦈 With fewer dugongs, which predator could lose some of its food NEXT?', opts: ['Tiger shark', 'Humpback whale', 'Dolphin', 'Phytoplankton'], a: 'Tiger shark', why: 'Follow the arrow coming OUT of the dugong box.' },
      ];
      let i = 0;
      questions.hidden = false;
      const render = () => {
        questions.innerHTML = '';
        const q = QS[i];
        const qfb = el('p', { class: 'feedback' });
        questions.append(
          el('h4', {}, `🧠 Question ${i + 1} of ${QS.length}`),
          el('p', {}, q.q),
          el('div', { class: 'quiz-opts' }, ER.shuffle(q.opts).map((o) => el('button', {
            class: 'btn quiz-opt',
            onclick: (e) => {
              if (o === q.a) {
                e.currentTarget.classList.add('right');
                questions.querySelectorAll('button').forEach((b) => (b.disabled = true));
                sfx.good();
                i++;
                if (i < QS.length) { ER.say(qfb, '✅ Correct!', 'good'); setTimeout(render, 900); }
                else { ER.say(qfb, '🎉 Correct! Losing one producer can affect the whole food web.', 'good'); api.solve(); }
              } else {
                sfx.bad();
                e.currentTarget.classList.add('wrong');
                ER.say(qfb, 'Not quite. ' + q.why, 'bad');
              }
            },
          }, o))),
          qfb);
      };
      render();
      questions.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return null;
  },
});
