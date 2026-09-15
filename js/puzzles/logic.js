/* Puzzle: Who Am I? Logic Grid (pencil & paper) - diet, habitat and threats of 6 marine mammals. */
ER.register({
  id: 'logic',
  title: 'Who Am I? Logic Grid',
  icon: '🧩',
  kind: 'paper',
  tagline: 'Use the clues to match each animal to its food, home and threat',
  code: { letter: 'P', number: 2 },
  printable: true,
  fact: 'Marine mammals are not one family. They include cetaceans (whales and dolphins), sirenians (dugongs and manatees), pinnipeds (seals and sea lions), and even sea otters and polar bears. All of them breathe air and feed their young milk.',
  hints: [
    'Start with the clues that name one animal and one thing, like the humpback\'s food or the orca\'s home. Put a ✓ in that square, then fill the rest of that row AND column with ✗. Clues that link two things (for example a food and a home) help you later.',
    'The orca lives in every ocean, so it cannot be the penguin-eater that lives on sea ice. So the orca must eat seals, and the penguin-eater must be the leopard seal. Then use the dugong clue to rule out every home except one.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const ANIMALS = [
      { id: 'dugong', name: 'Dugong', art: ER.art.dugong },
      { id: 'humpback', name: 'Humpback whale', art: ER.art.humpback },
      { id: 'orca', name: 'Orca', art: ER.art.orca },
      { id: 'manatee', name: 'Manatee', art: ER.art.manatee },
      { id: 'leopard', name: 'Leopard seal', art: ER.art.leopardSeal },
      { id: 'otter', name: 'Sea otter', art: ER.art.seaOtter },
    ];
    const CATS = [
      { id: 'diet', title: '🍽️ Main food', opts: ['Krill', 'Penguins', 'Freshwater plants', 'Sea urchins', 'Seagrass', 'Seals'] },
      { id: 'home', title: '🗺️ Home', opts: ['Every ocean', 'Cold kelp forests', 'Queensland coast', 'Antarctic sea ice', 'Florida rivers', 'Antarctica ↔ Queensland'] },
      { id: 'threat', title: '⚠️ Biggest threat', opts: ['Boat strikes', 'Melting sea ice', 'Toxic chemicals', 'Oil spills', 'Fishing gear', 'Seagrass loss'] },
    ];
    const SOLUTION = {
      dugong: { diet: 'Seagrass', home: 'Queensland coast', threat: 'Seagrass loss' },
      humpback: { diet: 'Krill', home: 'Antarctica ↔ Queensland', threat: 'Fishing gear' },
      orca: { diet: 'Seals', home: 'Every ocean', threat: 'Toxic chemicals' },
      manatee: { diet: 'Freshwater plants', home: 'Florida rivers', threat: 'Boat strikes' },
      leopard: { diet: 'Penguins', home: 'Antarctic sea ice', threat: 'Melting sea ice' },
      otter: { diet: 'Sea urchins', home: 'Cold kelp forests', threat: 'Oil spills' },
    };
    // Checked by brute force: these 10 clues give exactly one solution.
    const CLUES = [
      'The animal that eats penguins lives on Antarctic sea ice, so its biggest threat is that ice melting away.',
      'Dugongs only live in warm, salty water. You will never find one in a river, in icy water or in a cold kelp forest.',
      'Sirenians (dugongs and manatees) are herbivores. They only eat plants.',
      'The whale that migrates between Antarctica and Queensland often gets tangled in fishing gear.',
      'Orcas are found in every ocean on Earth.',
      'The animal threatened by oil spills lives in cold kelp forests.',
      'The humpback whale has baleen plates to strain tiny shrimp-like krill from the water.',
      'Unlike whales and seals, the sea otter has no blubber. It relies on thick fur to stay warm, so an oil spill that clogs its fur is deadly.',
      'The top predator that eats seals has toxic chemicals building up in its body.',
      'The animal that lives in Florida\'s rivers eats mostly freshwater plants and is often hit by speeding boats.',
    ];

    body.append(el('div', { class: 'card intro-card printable' },
      el('h3', { class: 'print-only' }, '🧩 Who Am I? Logic Grid'),
      el('p', {}, '🔍 Six animals, six foods, six homes and six threats. Each one matches ', el('b', {}, 'exactly one'), ' animal. Read the clues and fill in the grids: tap a square once for ', el('b', {}, '✗ (no)'), ' and twice for ', el('b', {}, '✓ (yes)'), '.'),
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
    const TOTAL = ANIMALS.length * CATS.length;
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
      if (blank) { sfx.bad(); ER.say(fb, `Fill in all ${TOTAL} answers first (${blank} still blank).`, 'bad'); return; }
      tries++;
      if (right === TOTAL) {
        ANIMALS.forEach((a) => CATS.forEach((c) => { selects[a.id][c.id].classList.add('ok'); selects[a.id][c.id].disabled = true; }));
        checkBtn.disabled = true;
        sfx.good();
        ER.say(fb, `🎉 All ${TOTAL} correct! You are a logic legend.`, 'good');
        api.solve();
      } else {
        sfx.bad();
        if (tries >= 3) {
          ANIMALS.forEach((a) => CATS.forEach((c) => {
            const s = selects[a.id][c.id];
            s.classList.toggle('ok', s.value === SOLUTION[a.id][c.id]);
            s.classList.toggle('no', s.value !== SOLUTION[a.id][c.id]);
          }));
          ER.say(fb, `${right} of ${TOTAL} correct. Correct answers are now green and wrong ones are red.`, 'bad');
        } else {
          ER.say(fb, `${right} of ${TOTAL} correct. Go back to the clues and your grids, then check again.`, 'bad');
        }
      }
    });
    body.append(el('div', { class: 'card printable' }, el('h4', {}, '🏁 Final answers'), el('div', { class: 'table-scroll' }, ans), el('div', { class: 'row-center' }, checkBtn), fb));
    return null;
  },
});
