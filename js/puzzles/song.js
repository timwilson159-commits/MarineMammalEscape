/* Puzzle: Whale Song Code (pencil & paper cipher) - communication and ocean noise. */
ER.register({
  id: 'song',
  title: 'Whale Song Code',
  icon: '🎶',
  kind: 'paper',
  tagline: 'A humpback left a message in its song. Decode it!',
  code: { letter: 'L', number: 7 },
  printable: true,
  fact: 'Male humpback whales sing long, complex songs that can last up to 20 minutes and travel many kilometres underwater. Loud noise from ships can drown out whale calls, so scientists want quieter ships and quieter seas.',
  hints: [
    'Each group of notes is ONE letter. A small round dot is a short CHIRP. A long wavy bar is a long MOAN. Find the group that matches exactly in the Song Key below.',
    'The first group is MOAN, MOAN, CHIRP, MOAN. In the key that is Q. The message is two words about making the ocean less noisy for whales.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
    const WORDS = ['QUIET', 'SEAS'];
    const ANSWER = WORDS.join('');

    const notesFor = (pattern) => el('span', { class: 'notes-row' },
      pattern.split('').map((c) => el('i', { class: c === '.' ? 'chirp' : 'moan', title: c === '.' ? 'short chirp' : 'long moan' })));

    const boxes = ER.letterBoxes(ANSWER.length, { label: 'Message letter', onChange: check });
    const groups = [];
    let n = 0;
    const score = el('div', { class: 'song-score' });
    WORDS.forEach((w, wi) => {
      const wordEl = el('div', { class: 'song-word' });
      w.split('').forEach((ch) => {
        const g = el('div', { class: 'song-group' }, el('span', { class: 'group-num' }, String(n + 1)), notesFor(MORSE[ch]), boxes.inputs[n]);
        groups.push({ el: g, pattern: MORSE[ch] });
        wordEl.append(g);
        n++;
      });
      score.append(wordEl);
      if (wi < WORDS.length - 1) score.append(el('div', { class: 'word-gap', title: 'new word' }, el('i', { class: 'gap-mark' })));
    });

    const key = el('div', { class: 'song-key' },
      Object.entries(MORSE).map(([L, p]) => el('div', { class: 'key-card' }, el('b', {}, L), notesFor(p))));

    const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    const playBtn = el('button', { class: 'btn btn-aqua no-print' }, '▶ Play the whale song');
    let timers = [];
    const stop = () => { timers.forEach(clearTimeout); timers = []; groups.forEach((g) => g.el.classList.remove('playing')); playBtn.textContent = '▶ Play the whale song'; };
    playBtn.addEventListener('click', () => {
      if (timers.length) { stop(); return; }
      sfx.unlock();
      playBtn.textContent = '⏹ Stop';
      let t = 0;
      groups.forEach((g, gi) => {
        timers.push(setTimeout(() => { groups.forEach((x) => x.el.classList.remove('playing')); g.el.classList.add('playing'); }, t));
        g.pattern.split('').forEach((c) => {
          timers.push(setTimeout(() => sfx.songNote(c === '-'), t));
          t += c === '-' ? 620 : 260;
        });
        t += gi === WORDS[0].length - 1 ? 1100 : 500;
      });
      timers.push(setTimeout(stop, t));
    });

    body.append(
      el('div', { class: 'card intro-card printable' },
        el('h3', { class: 'print-only' }, '🎶 Whale Song Code'),
        el('p', {}, '🐋 Our hydrophone (underwater microphone) recorded a humpback song with a hidden message. Each ', el('b', {}, 'group of notes'), ' is one letter.'),
        el('div', { class: 'note-legend' },
          el('span', {}, el('i', { class: 'chirp' }), ' = short chirp'),
          el('span', {}, el('i', { class: 'moan' }), ' = long moan'),
          el('span', {}, el('i', { class: 'gap-mark' }), ' = new word')),
        el('p', {}, '✏️ Write each letter on paper using the ', el('b', {}, 'Song Key'), ', then type the message in the boxes.'),
        playBtn),
      el('div', { class: 'card printable' }, el('h4', {}, '📜 The recorded song'), score, fb),
      el('div', { class: 'card printable' }, el('h4', {}, '🔑 Song Key'), key));

    function check() {
      if (!boxes.full()) { boxes.inputs.forEach((i) => i.classList.remove('ok', 'no')); fb.textContent = ''; return; }
      const v = boxes.value();
      if (v === ANSWER) {
        boxes.lock();
        boxes.inputs.forEach((i) => { i.classList.remove('no'); i.classList.add('ok'); });
        sfx.good();
        ER.say(fb, '🎉 "QUIET SEAS"! Ship noise makes it hard for whales to hear each other\'s songs.', 'good');
        api.solve();
      } else {
        let right = 0;
        boxes.inputs.forEach((inp, i) => { const ok = inp.value === ANSWER[i]; inp.classList.toggle('ok', ok); inp.classList.toggle('no', !ok); if (ok) right++; });
        sfx.bad();
        ER.say(fb, `${right} of ${ANSWER.length} letters are right (green). Check the red ones against the Song Key.`, 'bad');
      }
    }
    return stop;
  },
});
