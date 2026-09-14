/* Small reusable drawings: SVG animal icons and a canvas dolphin. */
(function () {
  const svg = (inner, vb = '0 0 100 50') =>
    `<svg class="animal-svg" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  ER.art = {
    dugong: svg(`
      <path d="M16,27 L3,17 Q7,27 3,38 Z" fill="#8d7f76"/>
      <path d="M12,27 C20,13 58,11 76,19 C85,23 93,28 91,34 C89,39 82,38 76,37 C57,41 30,40 16,31 Z" fill="#a99a90"/>
      <path d="M30,34 C45,39 62,38 76,36 C62,41 42,41 30,34 Z" fill="#c9bcb2"/>
      <path d="M58,34 Q54,44 47,45 Q51,38 52,33 Z" fill="#8d7f76"/>
      <circle cx="80" cy="24" r="1.8" fill="#1b1b3a"/>
      <path d="M86,31 Q91,33 90,36" stroke="#6d6058" stroke-width="1.5" fill="none"/>`),
    manatee: svg(`
      <ellipse cx="13" cy="30" rx="11" ry="9" fill="#7d8a93"/>
      <path d="M18,28 C22,12 60,10 79,19 C88,23 93,29 90,34 C86,40 44,42 24,36 Z" fill="#96a3ab"/>
      <path d="M62,33 Q58,43 51,44 Q55,37 55,32 Z" fill="#7d8a93"/>
      <circle cx="80" cy="24" r="1.8" fill="#1b1b3a"/>
      <circle cx="88" cy="29" r="3" fill="#a9b5bc"/>`),
    orca: svg(`
      <path d="M13,28 L1,19 Q6,28 1,38 Z" fill="#161a2e"/>
      <path d="M9,28 C22,16 60,14 84,21 C94,25 97,30 92,33 C80,40 42,42 18,34 Z" fill="#161a2e"/>
      <path d="M47,19 L53,1 L60,18 Z" fill="#161a2e"/>
      <path d="M40,20 Q50,17 58,20 Q50,24 40,20 Z" fill="#9aa3b5"/>
      <ellipse cx="76" cy="23" rx="6" ry="2.4" fill="#fff"/>
      <path d="M52,35 C66,37 82,35 91,32 C82,39 64,40 52,35 Z" fill="#fff"/>
      <path d="M62,35 Q58,44 51,46 Q55,39 55,34 Z" fill="#161a2e"/>`),
    humpback: svg(`
      <path d="M11,27 L0,18 Q5,27 0,37 Z" fill="#2c4466"/>
      <path d="M7,27 C22,19 70,16 92,24 C97,26 97,30 92,31 C70,38 30,38 12,32 Z" fill="#3a5a86"/>
      <path d="M35,21 L40,15 L44,20 Z" fill="#2c4466"/>
      <path d="M58,32 L40,47 Q46,47 64,34 Z" fill="#dce8f5"/>
      <path d="M50,33 C66,35 84,33 92,31 C80,36 64,37 50,33 Z" fill="#8fa9c8"/>
      <circle cx="84" cy="26" r="1.6" fill="#0d1a2e"/>`),
    vaquita: svg(`
      <path d="M15,28 L4,20 Q8,28 4,37 Z" fill="#6f7f8f"/>
      <path d="M11,28 C22,17 60,15 80,22 C88,25 92,29 89,32 C80,38 42,40 18,33 Z" fill="#8a9aab"/>
      <path d="M44,19 L49,9 L54,19 Z" fill="#6f7f8f"/>
      <path d="M36,33 C55,37 75,35 88,31 C76,38 54,39 36,33 Z" fill="#d9e2ea"/>
      <ellipse cx="79" cy="25" rx="4" ry="3" fill="#1b1b3a"/>
      <circle cx="79" cy="25" r="1.2" fill="#fff"/>
      <path d="M85,30 Q89,31 90,29" stroke="#1b1b3a" stroke-width="2" fill="none"/>`),
  };

  // Cartoon dolphin facing right. face = 1 (right) or -1 (left)
  ER.drawDolphin = function (ctx, x, y, s, face, tilt, col) {
    col = col || { body: '#7fb8e6', belly: '#e6f4ff', dark: '#5b93c4' };
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt || 0);
    ctx.scale((face < 0 ? -1 : 1) * s, s);
    ctx.fillStyle = col.body;
    ctx.beginPath();
    ctx.moveTo(-38, 0); ctx.lineTo(-53, -11); ctx.quadraticCurveTo(-48, 0, -53, 11); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(42, 1);
    ctx.quadraticCurveTo(34, -5, 24, -8);
    ctx.quadraticCurveTo(0, -17, -26, -8);
    ctx.quadraticCurveTo(-36, -4, -42, -1);
    ctx.lineTo(-42, 1);
    ctx.quadraticCurveTo(-30, 9, -8, 11);
    ctx.quadraticCurveTo(16, 12, 30, 5);
    ctx.lineTo(42, 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, -13); ctx.quadraticCurveTo(-8, -27, -15, -25); ctx.quadraticCurveTo(-12, -17, -15, -10);
    ctx.fill();
    ctx.fillStyle = col.belly;
    ctx.beginPath();
    ctx.moveTo(34, 3); ctx.quadraticCurveTo(10, 12, -16, 8); ctx.quadraticCurveTo(6, 6, 34, 3);
    ctx.fill();
    ctx.fillStyle = col.dark;
    ctx.beginPath();
    ctx.moveTo(10, 6); ctx.quadraticCurveTo(4, 17, -3, 18); ctx.quadraticCurveTo(1, 10, 1, 6);
    ctx.fill();
    ctx.fillStyle = '#10204a';
    ctx.beginPath(); ctx.arc(25, -3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(25.6, -3.6, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
})();
