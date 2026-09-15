# 🐋 Marine Mammal Escape: Station Nautilus

An educational escape room about **marine mammals**, especially **cetaceans** (whales, dolphins and porpoises) and **sirenians** (dugongs and manatees). It's built for Stage 5 science students.

Students walk a scientist around a pixel-art underwater research station. There are 8 puzzle stations and they can be solved in any order. Each solved station gives a **letter and a number**, which are saved automatically in the **Field Notes**. With all 8 codes, students crack the cypher on the EXIT hatch using the key word **CETACEAN**.

## Play

Open `index.html` in a browser, or host it on GitHub Pages (below). It needs no install and no build step.

- **Move:** WASD / arrow keys, or click the floor
- **Open a station:** walk up to it and press **E** / Space, or just click it
- Students should have **pencil and paper** ready
- Progress lasts only while the tab is open. Refreshing starts a new game (the page warns before leaving).

## The stations

| Station | Type | Science focus |
|---|---|---|
| 📡 Sonar Hunt | Arcade game + lab report | How echolocation works (diagram, step order, echo distance maths) |
| 🥅 Bycatch Escape | Arcade game | Air breathing, ghost nets, boat strike |
| 🦴 Flipper Bones | 4-stage drag & drop | Homologous, analogous and vestigial structures, whale evolution |
| 🕸️ Food Web Builder | Drag & drop | Energy flow, seagrass loss and dugongs |
| 🖼️ Picture Puzzles | Pencil & paper | Marine mammal vocabulary (10 rebuses) |
| 🎶 Whale Song Code | Pencil & paper | Whale communication, ocean noise |
| 🧩 Who Am I? Logic Grid | Pencil & paper | Diet, habitat and threats of 6 species |
| 📉 Vaquita Countdown | Pencil & paper | Reading population data (7 questions), conservation |
| 🚪 Escape Hatch | Pencil & paper | Vigenère cypher (key: CETACEAN) |

Every station has two tiered hints and sound effects (with a mute button). The paper puzzles and the hatch also have a **🖨️ Print sheet** button.

## Publish with GitHub Pages

1. On GitHub, open the repo and go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Pick branch **main** and folder **/ (root)**, then **Save**.
4. After a minute the game is live at `https://<your-username>.github.io/MarineMammalEscape/`.

## Files

```
index.html          page shell
css/style.css       all styling (and print styles)
js/core.js          shared helpers (DOM, drag & drop, letter boxes)
js/audio.js         generated sound effects (Web Audio, no files)
js/art.js           SVG animal drawings + canvas dolphin
js/main.js          the room, movement, Field Notes, modals
js/door.js          the final Vigenère hatch
js/puzzles/*.js     one file per station
```

Everything is plain HTML/CSS/JavaScript. The only external resource is Google Fonts, and the page falls back to system fonts if that's blocked.
