/* Puzzle: Rebus Pictograms (pencil & paper) - marine mammal vocabulary. */
ER.register({
  id: 'rebus',
  title: 'Picture Puzzles',
  icon: '🖼️',
  kind: 'paper',
  tagline: 'Pictures + letters = secret marine mammal words',
  code: { letter: 'H', number: 3 },
  printable: true,
  fact: 'Sirenians (dugongs and manatees) and cetaceans (whales, dolphins and porpoises) spend their whole lives in water. Seals are different: they are pinnipeds and haul out onto land or ice to rest and have pups.',
  hints: [
    'Say each picture as a word, then add (+) or take away (−) letters. Example: 🌊 is SEA, so SEA + L = SEAL. For puzzle 2, say "eight" out loud. What other word sounds the same?',
    'The pictures are: 🐶 PUPPY, 🍲 POT, 👨 MAN, 8️⃣ EIGHT (sounds like ATE), 🤧 FLU, 🔑 KEY, 🔥 HOT, 👑 KING, 💊 PILL, 🔵 BLUE, 🐻 BEAR, 🦆 DUCK, 🎵 SONG, 🏀 BALL, 👀 SEE. Write each word down, cross out the letters you take away, and read what is left.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const ROWS = [
      { answer: 'SEAL', parts: [['pic', '🌊'], ['op', '+'], ['txt', 'L']],
        fact: 'Seals can hold their breath for a long time, but must come up to breathe.' },
      { answer: 'PUP', parts: [['pic', '🐶'], ['op', '−'], ['txt', 'PY']],
        fact: 'Baby seals are called pups. A mother seal finds her own pup on a crowded beach by its call and smell.' },
      { answer: 'POD', parts: [['pic', '🍲'], ['op', '−'], ['txt', 'T'], ['op', '+'], ['txt', 'D']],
        fact: 'A group of whales or dolphins is called a pod. Orca pods are family groups led by the older females.' },
      { answer: 'MANATEE', parts: [['pic', '👨'], ['op', '+'], ['pic', '8️⃣'], ['op', '+'], ['txt', 'E']],
        fact: 'Manatees are gentle plant-eaters that can live in rivers AND the sea.' },
      { answer: 'FLUKE', parts: [['pic', '🤧'], ['op', '+'], ['pic', '🔑'], ['op', '−'], ['txt', 'Y']],
        fact: 'A whale\'s tail fins are called flukes. Every humpback\'s fluke pattern is different, like a fingerprint.' },
      { answer: 'OTTER', parts: [['pic', '🔥'], ['op', '−'], ['txt', 'H'], ['op', '+'], ['txt', 'T'], ['op', '+'], ['txt', 'ER']],
        fact: 'Sea otters have no blubber. Instead they have the thickest fur of any animal to keep warm.' },
      { answer: 'KRILL', parts: [['pic', '👑'], ['op', '−'], ['txt', 'ING'], ['op', '+'], ['txt', 'R'], ['op', '+'], ['pic', '💊'], ['op', '−'], ['txt', 'P']],
        fact: 'Krill are tiny shrimp-like animals. A blue whale can eat millions of them in one day.' },
      { answer: 'BLUBBER', parts: [['pic', '🔵'], ['op', '−'], ['txt', 'E'], ['op', '+'], ['txt', 'B'], ['op', '+'], ['pic', '🐻'], ['op', '−'], ['txt', 'A']],
        fact: 'Blubber is a thick layer of fat under a whale\'s skin. It keeps it warm and stores energy for long migrations.' },
      { answer: 'DUGONG', parts: [['pic', '🦆'], ['op', '−'], ['txt', 'CK'], ['op', '+'], ['txt', 'G'], ['op', '+'], ['pic', '🎵'], ['op', '−'], ['txt', 'S']],
        fact: 'Dugongs graze on seagrass like underwater cows and can live for 70 years.' },
      { answer: 'BALEEN', parts: [['pic', '🏀'], ['op', '−'], ['txt', 'L'], ['op', '+'], ['pic', '👀'], ['op', '+'], ['txt', 'N'], ['op', '−'], ['txt', 'S']],
        fact: 'Baleen plates are made of keratin, the same stuff as your fingernails. Baleen whales use them to filter krill from the water.' },
    ];

    const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    const sheet = el('div', { class: 'rebus-sheet printable' });
    body.append(
      el('div', { class: 'card intro-card printable' },
        el('h3', { class: 'print-only' }, '🖼️ Picture Puzzles'),
        el('p', {}, '✏️ Each picture stands for a word. ', el('b', {}, 'Add (+)'), ' or ', el('b', {}, 'take away (−)'),
          ' letters to spell a marine mammal word. Some pictures ', el('b', {}, 'sound like'), ' other words! Work them out on paper, then type your answers.'),
        el('p', { class: 'muted small' }, 'The number of boxes tells you how many letters are in the answer.')),
      sheet, fb);

    let solvedCount = 0;
    ROWS.forEach((row, i) => {
      const factLine = el('p', { class: 'rebus-fact', hidden: true });
      const rowEl = el('div', { class: 'card rebus-row' });
      const boxes = ER.letterBoxes(row.answer.length, {
        label: `Puzzle ${i + 1} letter`,
        onChange: () => {
          if (!boxes.full()) { boxes.mark(null); return; }
          if (ER.norm(boxes.value()) === row.answer) {
            boxes.mark('good');
            boxes.lock();
            rowEl.classList.add('done');
            factLine.hidden = false;
            sfx.good();
            solvedCount++;
            ER.say(fb, solvedCount < ROWS.length ? `✅ ${row.answer}! ${ROWS.length - solvedCount} to go.` : '🎉 All picture puzzles solved!', 'good');
            if (solvedCount === ROWS.length) api.solve();
            const next = sheet.querySelector('.rebus-row:not(.done) .lbox');
            if (next) next.focus();
          } else {
            boxes.mark('bad');
            sfx.bad();
            ER.say(fb, `Puzzle ${i + 1} isn't right yet. Say the picture words out loud and try again.`, 'bad');
          }
        },
      });
      rowEl.append(
        el('div', { class: 'rebus-num' }, String(i + 1)),
        el('div', { class: 'rebus-main' },
          el('div', { class: 'rebus-eq' },
            row.parts.map(([k, v]) => el('span', { class: k }, v)),
            el('span', { class: 'op eq' }, '=')),
          boxes.node,
          factLine));
      factLine.textContent = '🐾 ' + row.fact;
      sheet.append(rowEl);
    });
    return null;
  },
});
