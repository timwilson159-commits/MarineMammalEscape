/* The final escape hatch: a Vigenère cypher with the key word CETACEAN. */
(function () {
  const { el, sfx } = ER;
  const KEY = 'CETACEAN';
  const CODE = 'DPHWJSLR';
  const ANSWER = 'BLOWHOLE';
  const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  ER.door = {
    id: 'door',
    title: 'Escape Hatch',
    icon: '🚪',
    kind: 'door',
    tagline: 'Crack the Vigenère cypher to open the hatch',
    printable: true,
    hints: [
      'Step 1: look at the NUMBER on each code in your Field Notes. The letter with number 1 goes in box 1, the letter with number 2 goes in box 2, and so on.',
      'Step 2, box 2: the key letter is E and the code letter is P. Find row E on the left side of the table. Slide along row E until you reach P. Look straight up to the yellow top row. You land on L, so box 2 is L. Do the same for every box.',
    ],
    build(body, api) {
      if (!api.allDone) return buildLocked(body, api);
      return buildCypher(body, api);
    },
  };

  function buildLocked(body, api) {
    const have = api.codes().length;
    const missing = api.missing();
    body.append(
      el('div', { class: 'card door-locked' },
        el('div', { class: 'big-lock' }, '🔒'),
        el('h3', {}, `The hatch computer needs all 8 codes. You have ${have}.`),
        el('div', { class: 'lock-lights' }, ...Array.from({ length: 8 }, (_, i) => el('span', { class: i < have ? 'on' : '' }))),
        el('p', {}, 'Stations still to solve:'),
        el('ul', { class: 'missing-list' }, missing.map((d) => el('li', {}, el('span', {}, d.icon), ' ', d.title))),
        el('p', { class: 'muted' }, 'Explore the lab and solve each station. Your codes will appear in your Field Notes. When you have all 8, come back here.')));
    return null;
  }

  function buildCypher(body, api) {
    const codes = api.codes();

    body.append(el('div', { class: 'card door-intro' },
      el('div', { class: 'door-intro-icon' }, '🔐'),
      el('div', {},
        el('h3', {}, 'The hatch is locked with a Vigenère cypher'),
        el('p', {}, 'A Vigenère cypher uses a ', el('b', {}, 'key word'), ' to scramble each letter of a password. The key word is ',
          el('b', { class: 'kw' }, 'CETACEAN'),
          ' (the scientific group for whales, dolphins and porpoises). Unscramble your 8 code letters to find the password.'))));

    // codes collected
    body.append(el('div', { class: 'card' },
      el('h4', {}, '📓 Your codes'),
      el('div', { class: 'code-chips' }, codes.map((d) => el('div', { class: 'code-chip' }, el('span', {}, d.icon), ER.codeTiles(d.code))))));

    // the board
    const codeFb = el('p', { class: 'feedback' });
    const ansFb = el('p', { class: 'feedback' });
    const board = el('div', { class: 'door-board printable' });
    const header = el('div', { class: 'board-row head' }, el('div', { class: 'board-label' }, 'Box'), ...Array.from({ length: 8 }, (_, i) => el('div', { class: 'board-cell num' }, String(i + 1))));

    const codeBoxes = ER.letterBoxes(8, { label: 'Code letter', onChange: checkCode });
    const ansBoxes = ER.letterBoxes(8, { label: 'Password letter', prefill: 'B', onChange: checkAnswer });

    const codeRow = el('div', { class: 'board-row' }, el('div', { class: 'board-label' }, el('span', { class: 'step' }, '1'), 'Code letter (in number order)'),
      ...codeBoxes.inputs.map((inp) => el('div', { class: 'board-cell' }, inp)));
    const keyRow = el('div', { class: 'board-row key' }, el('div', { class: 'board-label' }, el('span', { class: 'step' }, '2'), 'Key letter'),
      ...KEY.split('').map((c) => el('div', { class: 'board-cell' }, el('span', { class: 'key-letter' }, c))));
    const ansRow = el('div', { class: 'board-row answer waiting' }, el('div', { class: 'board-label' }, el('span', { class: 'step' }, '3'), 'Password letter'),
      ...ansBoxes.inputs.map((inp) => el('div', { class: 'board-cell' }, inp)));
    ansBoxes.inputs.forEach((inp) => { if (!inp.readOnly) inp.disabled = true; });

    board.append(el('div', { class: 'board-scroll' }, header, codeRow, keyRow, ansRow));
    body.append(el('div', { class: 'card' }, el('h4', {}, '🧮 Cypher board'), board, codeFb, ansFb));

    function checkCode() {
      if (!codeBoxes.full()) { codeFb.textContent = ''; codeBoxes.inputs.forEach((i) => i.classList.remove('ok', 'no')); return; }
      const v = codeBoxes.value();
      let right = 0;
      codeBoxes.inputs.forEach((inp, i) => {
        const ok = inp.value === CODE[i];
        inp.classList.toggle('ok', ok);
        inp.classList.toggle('no', !ok);
        if (ok) right++;
      });
      if (v === CODE) {
        sfx.good();
        ER.say(codeFb, '✅ Code row correct! Now use the table below to decode each letter into the password.', 'good');
        codeBoxes.lock();
        ansRow.classList.remove('waiting');
        ansBoxes.inputs.forEach((inp) => { inp.disabled = false; });
        setTimeout(() => ansBoxes.focus(), 50);
      } else {
        sfx.bad();
        ER.say(codeFb, `${right} of 8 letters are in the right box. Check the numbers in your Field Notes: number 1 goes in box 1.`, 'bad');
      }
    }

    function checkAnswer() {
      if (!ansBoxes.full()) { ansFb.textContent = ''; ansBoxes.inputs.forEach((i) => i.classList.remove('ok', 'no')); return; }
      const v = ansBoxes.value();
      let right = 0;
      ansBoxes.inputs.forEach((inp, i) => {
        const ok = inp.value === ANSWER[i];
        if (!inp.readOnly) { inp.classList.toggle('ok', ok); inp.classList.toggle('no', !ok); }
        if (ok) right++;
      });
      if (v === ANSWER) {
        ansBoxes.lock();
        ER.say(ansFb, '🔓 ACCESS GRANTED! The hatch is opening...', 'good');
        board.classList.add('unlocked');
        sfx.solve();
        setTimeout(() => api.escape(), 1400);
      } else {
        sfx.bad();
        ER.say(ansFb, `${right} of 8 letters are correct (green). Fix the red ones using the table and the key letter above each box.`, 'bad');
      }
    }

    // worked example
    const table = buildTable();
    const exampleBtn = el('button', { class: 'btn btn-aqua no-print' }, '👀 Show me on the table');
    exampleBtn.addEventListener('click', () => {
      sfx.tap();
      table.showExample();
      table.node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    body.append(el('div', { class: 'card worked printable' },
      el('h4', {}, '✏️ Worked example: box 1'),
      el('ol', { class: 'worked-steps' },
        el('li', {}, 'The ', el('b', {}, 'key letter'), ' in box 1 is ', el('span', { class: 'key-letter' }, 'C'), '. Find ', el('b', {}, 'row C'), ' down the left side of the table.'),
        el('li', {}, 'The ', el('b', {}, 'code letter'), ' in box 1 is ', el('span', { class: 'code-letter' }, 'D'), '. Slide along row C until you find ', el('b', {}, 'D'), '.'),
        el('li', {}, 'Look straight ', el('b', {}, 'up'), ' to the yellow top row. You land on ', el('span', { class: 'answer-letter' }, 'B'), '. So box 1 of the password is B!'),
        el('li', {}, 'Now do the same for boxes 2 to 8. Tip: tick off each box on paper as you go.')),
      exampleBtn));

    body.append(el('div', { class: 'card printable' },
      el('h4', {}, '🔠 Vigenère table'),
      el('p', { class: 'muted small no-print' }, 'Hover or tap a square to light up its row and column. Tap it again to clear.'),
      el('div', { class: 'tabula-scroll' }, table.node)));

    return null;
  }

  function buildTable() {
    const tbl = el('table', { class: 'tabula' });
    const cells = [];
    const thead = el('tr', {}, el('th', { class: 'corner' }, 'row ↓'));
    for (let c = 0; c < 26; c++) thead.append(el('th', { class: 'top', 'data-c': c }, AZ[c]));
    tbl.append(thead);
    for (let r = 0; r < 26; r++) {
      const tr = el('tr', {}, el('th', { class: 'side', 'data-r': r }, AZ[r]));
      cells[r] = [];
      for (let c = 0; c < 26; c++) {
        const td = el('td', { 'data-r': r, 'data-c': c }, AZ[(r + c) % 26]);
        cells[r][c] = td;
        tr.append(td);
      }
      tbl.append(tr);
    }
    const heads = tbl.querySelectorAll('th.top');
    const sides = tbl.querySelectorAll('th.side');
    let pinned = null;

    function clear() {
      tbl.querySelectorAll('.hl-row, .hl-col, .hl-hit, .hl-ans, .hl-key').forEach((n) => n.classList.remove('hl-row', 'hl-col', 'hl-hit', 'hl-ans', 'hl-key'));
    }
    function light(r, c, trail) {
      clear();
      if (r == null) return;
      for (let i = 0; i < 26; i++) {
        if (!trail || i <= c) cells[r][i].classList.add('hl-row');
        if (!trail || i <= r) cells[i][c].classList.add('hl-col');
      }
      cells[r][c].classList.add('hl-hit');
      heads[c].classList.add('hl-ans');
      sides[r].classList.add('hl-key');
    }
    tbl.addEventListener('mouseover', (e) => {
      if (pinned) return;
      const td = e.target.closest('td');
      if (td) light(+td.dataset.r, +td.dataset.c);
    });
    tbl.addEventListener('mouseleave', () => { if (!pinned) clear(); });
    tbl.addEventListener('click', (e) => {
      const td = e.target.closest('td');
      if (!td) return;
      const key = td.dataset.r + ',' + td.dataset.c;
      if (pinned === key) { pinned = null; clear(); }
      else { pinned = key; light(+td.dataset.r, +td.dataset.c); }
    });
    return {
      node: tbl,
      showExample() { pinned = '2,1'; light(2, 1, true); },
    };
  }
})();
