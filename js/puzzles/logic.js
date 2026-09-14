/* Puzzle: Who Am I? Logic Grid (pencil & paper) - sirenian/cetacean diet, habitat, threats. */
ER.register({
  id: 'logic',
  title: 'Who Am I? Logic Grid',
  icon: '🧩',
  kind: 'paper',
  tagline: 'Use the clues to match each animal to its food, home and threat',
  code: { letter: 'P', number: 2 },
  printable: true,
  fact: 'Dugongs and manatees are sirenians, the only marine mammals that eat just plants. Their closest living relatives on land are elephants!',
  hints: [
    'Start with clue 2. It tells you exactly what the humpback eats. Put a ✓ in that square, then put ✗ in every other square in that row AND that column.',
    'Clue 1 says dugongs and manatees only eat plants, so the seal-eater must be the orca. Clue 5 says the dugong is never in rivers, and clue 6 says it never goes to Antarctica. So where does the dugong live?',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const ANIMALS = [
      { id: 'dugong', name: 'Dugong', art: ER.art.dugong },
      { id: 'humpback', name: 'Humpback whale', art: ER.art.humpback },
      { id: 'orca', name: 'Orca', art: ER.art.orca },
      { id: 'manatee', name: 'Manatee', art: ER.art.manatee },
    ];
    const CATS = [
      { id: 'diet', title: '🍽️ Main food', opts: ['Krill', 'Freshwater plants', 'Seagrass', 'Seals'] },
      { id: 'home', title: '🗺️ Home', opts: ['Every ocean', 'Queensland coast', 'Florida rivers', 'Antarctica ↔ Queensland'] },
      { id: 'threat', title: '⚠️ Biggest threat', opts: ['Boat strikes', 'Toxic chemicals', 'Fishing gear', 'Seagrass loss'] },
    ];
    const SOLUTION = {
      dugong: { diet: 'Seagrass', home: 'Queensland coast', threat: 'Seagrass loss' },
      humpback: { diet: 'Krill', home: 'Antarctica ↔ Queensland', threat: 'Fishing gear' },
      orca: { diet: 'Seals', home: 'Every ocean', threat: 'Toxic chemicals' },
      manatee: { diet: 'Freshwater plants', home: 'Florida rivers', threat: 'Boat strikes' },
    };
    const CLUES = [
      'Sirenians (dugongs and manatees) are herbivores. They only eat plants.',
      'The humpback whale has baleen plates to strain tiny shrimp-like animals called krill from the water.',
      'Orcas are found in every ocean on Earth, from the icy poles to warm tropical seas.',
      'The animal that eats seals is a top predator. Toxic chemicals from its prey build up in its body.',
      'Dugongs only live in salty sea water. They are never found in rivers.',
      'Both sirenians need warm water all year round, so neither of them swims to Antarctica.',
      'The animal that lives in Florida\'s rivers eats mostly freshwater plants. It is often hit by speeding boats.',
      'The whale that swims from Antarctica to Queensland every year often gets tangled in fishing gear.',
    ];

    body.append(el('div', { class: 'card intro-card printable' },
      el('h3', { class: 'print-only' }, '🧩 Who Am I? Logic Grid'),
      el('p', {}, '🔍 Four animals, four foods, four homes and four threats. Each one matches ', el('b', {}, 'exactly one'), ' animal. Read the clues and fill in the grids: tap a square once for ', el('b', {}, '✗ (no)'), ' and twice for ', el('b', {}, '✓ (yes)'), '.'),
      el('div', { class: 'animal-row' }, ANIMALS.map((a) => el('div', { class: 'animal-chip' }, el('span', { html: a.art }), a.name)))));

    body.append(el('div', { class: 'card printable' },
      el('h4', {}, '📋 Clues'),
      el('ol', { class: 'clue-list' }, CLUES.map((c) => el('li', {}, c)))));

    const grids = el('div', { class: 'logic-grids' });
    CATS.forEach((cat) => {
      const tbl = el('table', { class: 'lgrid' });
      tbl.append(el('tr', {}, el('th', { class: 'lcorner' }, cat.title), cat.opts.map((o) => el('th', { class: 'lhead' }, el('span', {}, o)))));
      ANIMALS.forEach((a) => {
        tbl.append(el('tr', {}, el('th', { class: 'lrow' }, a.name),
          cat.opts.map(() => {
            const td = el('td', { class: 'lcell', tabindex: '0', role: 'button', 'aria-label': 'blank' });
            const cycle = () => {
              const s = td.dataset.s === 'x' ? 'y' : td.dataset.s === 'y' ? '' : 'x';
              td.dataset.s = s;
              td.textContent = s === 'x' ? '✗' : s === 'y' ? '✓' : '';
              td.setAttribute('aria-label', s === 'x' ? 'no' : s === 'y' ? 'yes' : 'blank');
              sfx.tap();
            };
            td.addEventListener('click', cycle);
            td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(); } });
            return td;
          })));
      });
      grids.append(el('div', { class: 'lgrid-wrap' }, tbl));
    });
    body.append(el('div', { class: 'card printable' }, el('h4', {}, '✏️ Working grids'), grids));

    // answer table
    const selects = {};
    const ans = el('table', { class: 'answer-table' });
    ans.append(el('tr', {}, el('th', {}, 'Animal'), CATS.map((c) => el('th', {}, c.title))));
    ANIMALS.forEach((a) => {
      selects[a.id] = {};
      ans.append(el('tr', {},
        el('th', {}, el('span', { class: 'mini-art', html: a.art }), a.name),
        CATS.map((c) => {
          const s = el('select', { 'aria-label': `${a.name} ${c.id}` },
            el('option', { value: '' }, 'choose...'),
            c.opts.map((o) => el('option', { value: o }, o)));
          s.addEventListener('change', () => s.classList.remove('ok', 'no'));
          selects[a.id][c.id] = s;
          return el('td', {}, s);
        })));
    });
    const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    let tries = 0;
    const checkBtn = el('button', { class: 'btn btn-sun btn-big no-print' }, '✔ Check my answers');
    checkBtn.addEventListener('click', () => {
      let right = 0, blank = 0;
      ANIMALS.forEach((a) => CATS.forEach((c) => {
        const s = selects[a.id][c.id];
        if (!s.value) blank++;
        if (s.value === SOLUTION[a.id][c.id]) right++;
      }));
      if (blank) { sfx.bad(); ER.say(fb, `Fill in all 12 answers first (${blank} still blank).`, 'bad'); return; }
      tries++;
      if (right === 12) {
        ANIMALS.forEach((a) => CATS.forEach((c) => { selects[a.id][c.id].classList.add('ok'); selects[a.id][c.id].disabled = true; }));
        checkBtn.disabled = true;
        sfx.good();
        ER.say(fb, '🎉 All 12 correct! You are a logic legend.', 'good');
        api.solve();
      } else {
        sfx.bad();
        if (tries >= 3) {
          ANIMALS.forEach((a) => CATS.forEach((c) => {
            const s = selects[a.id][c.id];
            s.classList.toggle('ok', s.value === SOLUTION[a.id][c.id]);
            s.classList.toggle('no', s.value !== SOLUTION[a.id][c.id]);
          }));
          ER.say(fb, `${right} of 12 correct. Correct answers are now green and wrong ones are red.`, 'bad');
        } else {
          ER.say(fb, `${right} of 12 correct. Go back to the clues and your grid, then check again.`, 'bad');
        }
      }
    });
    body.append(el('div', { class: 'card printable' }, el('h4', {}, '🏁 Final answers'), el('div', { class: 'table-scroll' }, ans), el('div', { class: 'row-center' }, checkBtn), fb));
    return null;
  },
});
