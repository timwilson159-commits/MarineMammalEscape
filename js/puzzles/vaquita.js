/* Puzzle: Vaquita Countdown (pencil & paper data analysis) - conservation of the world's rarest porpoise. */
ER.register({
  id: 'vaquita',
  title: 'Vaquita Countdown',
  icon: '📉',
  kind: 'paper',
  tagline: 'Read the graph to unlock the research box',
  code: { letter: 'S', number: 6 },
  printable: true,
  fact: 'The vaquita is the world\'s rarest marine mammal: only about 10 are left. Mexico has banned gillnets in the vaquita\'s home, and scientists say the species can still recover if the nets are kept out of the water.',
  hints: [
    'The number on top of each bar is how many vaquitas scientists estimated that year. "Fell below 100" means the first bar with a number SMALLER than 100.',
    'To find how many were lost, take the LATER number away from the EARLIER number (question 2 is 567 − 245). For "most disappeared", work out the drop between each pair of surveys and pick the biggest. Half of 59 is about 30. The fish answer is in the yellow info box.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const DATA = [[1997, 567], [2008, 245], [2013, 97], [2015, 59], [2016, 30], [2018, 19], [2023, 10]];

    // bar chart
    const VW = 660, VH = 380, L = 60, R = 20, T = 30, B = 50;
    const plotW = VW - L - R, plotH = VH - T - B, max = 600;
    const bw = plotW / DATA.length;
    let s = `<svg viewBox="0 0 ${VW} ${VH}" class="chart" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bar chart of vaquita numbers from 1997 to 2023">`;
    for (let v = 0; v <= max; v += 100) {
      const y = T + plotH - (v / max) * plotH;
      s += `<line x1="${L}" x2="${VW - R}" y1="${y}" y2="${y}" stroke="#d6e4f0" stroke-width="1.5"/><text x="${L - 10}" y="${y + 5}" text-anchor="end" font-size="14" fill="#5a6a8f">${v}</text>`;
    }
    DATA.forEach(([yr, v], i) => {
      const h = (v / max) * plotH;
      const x = L + i * bw + bw * 0.18, w = bw * 0.64, y = T + plotH - h;
      const col = v > 200 ? '#19c3e6' : v > 50 ? '#ffb627' : '#ff5d73';
      s += `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(h, 2)}" rx="6" fill="${col}"/>`;
      s += `<text x="${x + w / 2}" y="${y - 8}" text-anchor="middle" font-size="17" font-weight="700" fill="#10204a">${yr === 2023 ? '~10' : v}</text>`;
      s += `<text x="${x + w / 2}" y="${VH - B + 24}" text-anchor="middle" font-size="15" font-weight="600" fill="#10204a">${yr}</text>`;
    });
    s += `<line x1="${L}" x2="${L}" y1="${T}" y2="${T + plotH}" stroke="#10204a" stroke-width="2"/><line x1="${L}" x2="${VW - R}" y1="${T + plotH}" y2="${T + plotH}" stroke="#10204a" stroke-width="2"/>`;
    s += `<text x="16" y="${T + plotH / 2}" transform="rotate(-90 16 ${T + plotH / 2})" text-anchor="middle" font-size="14" fill="#5a6a8f">Number of vaquitas</text>`;
    s += `<text x="${L + plotW / 2}" y="${VH - 4}" text-anchor="middle" font-size="14" fill="#5a6a8f">Survey year</text></svg>`;

    body.append(
      el('div', { class: 'card intro-card vaquita-intro printable' },
        el('h3', { class: 'print-only' }, '📉 Vaquita Countdown'),
        el('div', { class: 'vaquita-art', html: ER.art.vaquita }),
        el('div', {},
          el('p', {}, 'The ', el('b', {}, 'vaquita'), ' ("little cow" in Spanish) is the world\'s smallest porpoise, a type of cetacean. It lives in only one place: the northern Gulf of California in Mexico.'),
          el('div', { class: 'info-box' }, '⚠️ Fishers set illegal ', el('b', {}, 'gillnets'), ' to catch a big fish called the ', el('b', {}, 'totoaba'), '. Its swim bladder sells for a lot of money. Vaquitas get tangled in these nets and drown.'))),
      el('div', { class: 'card printable' }, el('h4', {}, '📊 Vaquita population estimates'), el('div', { class: 'chart-wrap', html: s })));

    const Q = [
      { q: 'In which year did the number of vaquitas first fall below 100?', a: '2013', type: 'num', ph: 'year' },
      { q: 'How many vaquitas were lost between 1997 and 2008?', a: '322', type: 'num', ph: 'number' },
      { q: 'How many vaquitas were lost between 2016 and 2018?', a: '11', type: 'num', ph: 'number' },
      { q: 'How many vaquitas were lost altogether between 1997 and 2023?', a: '557', type: 'num', ph: 'number' },
      { q: 'Between which two surveys in a row did the MOST vaquitas disappear?', a: '1997 to 2008', type: 'sel', opts: ['1997 to 2008', '2008 to 2013', '2013 to 2015', '2015 to 2016'] },
      { q: 'From 2015 to 2016, about how much of the vaquita population was lost?', a: 'About half', type: 'sel', opts: ['About a quarter', 'About half', 'About three quarters', 'Almost all of it'] },
      { q: 'Illegal gillnets are set to catch which fish?', a: 'Totoaba', type: 'sel', opts: ['Tuna', 'Totoaba', 'Salmon', 'Sardine'] },
    ];
    const inputs = Q.map((q) => {
      if (q.type === 'sel') {
        return el('select', { 'aria-label': q.q }, el('option', { value: '' }, 'choose...'), q.opts.map((o) => el('option', { value: o }, o)));
      }
      return el('input', { type: 'text', inputmode: 'numeric', placeholder: q.ph, 'aria-label': q.q, maxlength: '5', autocomplete: 'off' });
    });
    inputs.forEach((inp) => {
      inp.addEventListener('input', () => { inp.classList.remove('ok', 'no'); if (inp.tagName === 'INPUT') inp.value = inp.value.replace(/[^0-9]/g, ''); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkBtn.click(); });
    });

    const lock = el('div', { class: 'padlock' }, el('span', { class: 'padlock-icon' }, '🔒'), ...inputs.map((_, i) => el('span', { class: 'dial', 'data-i': i }, '?')));
    const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    const checkBtn = el('button', { class: 'btn btn-sun btn-big no-print' }, '🔓 Try to unlock');

    checkBtn.addEventListener('click', () => {
      let right = 0;
      Q.forEach((q, i) => {
        const v = inputs[i].value.trim();
        const ok = v === q.a;
        inputs[i].classList.toggle('ok', ok);
        inputs[i].classList.toggle('no', !ok && v !== '');
        lock.querySelector(`[data-i="${i}"]`).textContent = ok ? '✔' : '?';
        lock.querySelector(`[data-i="${i}"]`).classList.toggle('ok', ok);
        if (ok) right++;
      });
      if (right === Q.length) {
        sfx.good();
        lock.classList.add('open');
        lock.querySelector('.padlock-icon').textContent = '🔓';
        inputs.forEach((i) => (i.disabled = true));
        checkBtn.disabled = true;
        ER.say(fb, '🎉 The research box is open! Every vaquita counts.', 'good');
        api.solve();
      } else {
        sfx.bad();
        ER.shake(lock);
        ER.say(fb, `${right} of ${Q.length} answers are correct (green). Use the graph and a pencil to work out the others.`, 'bad');
      }
    });

    body.append(el('div', { class: 'card printable' },
      el('h4', {}, '🧰 Research box lock'),
      el('p', { class: 'muted small' }, '✏️ Show your working on paper.'),
      el('ol', { class: 'q-list' }, Q.map((q, i) => el('li', { class: 'q-row' }, el('span', {}, q.q), inputs[i]))),
      lock,
      el('div', { class: 'row-center' }, checkBtn),
      fb));
    return null;
  },
});
