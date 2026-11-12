# Toybox Tactics

A turn-based toy-soldier strategy game for phones, built as an installable web app (a PWA).
You can play online against friends, practice against a bot, or pass one phone back and forth.

The rules follow a classic territory-and-stacking design. Characters, names, art and maps are original.

## Rules in one minute

- Each player has 24 Troops: 3 copies each of strengths 1–7, plus the ★ joker. 4 are removed unseen at setup. The first player starts with 3 on their rack, the other with 4.
- On your turn, do **one** thing:
  - **Draw 2** Troops (your rack holds at most 8).
  - **Place 1 Troop.** Its effect applies first, then the special base's effect.
- **Where you can place:**
  - an empty base;
  - a base with your own Troop on top;
  - a base whose top enemy Troop is strictly weaker;
  - the enemy H.Q.

  The spot must be connected to your H.Q. through bases you occupy.
- **Medals:** occupy every base around a region and you take its medals.
- **Winning:**
  - Capture the enemy H.Q., or reach the map's medal objective.
  - If a player can neither draw nor place, the game ends. Most medals wins, and a tie goes against the player who couldn't act.

The full troop and terrain rules are in the app under **How to play**.

| ★/# | Troop | Effect |
|---|---|---|
| ★ | Bop (jack-in-the-box) | Joker: covers any enemy and can be covered by any enemy. |
| 1 | Rattles (skeleton warrior) | Draw 2 (only 1 if you already have 7). |
| 2 | Rumble (tin drummer) | Place 1 extra Troop and apply its effect. |
| 3 | Cosmo (toy astronaut) | Discard 1 adjacent visible enemy Troop. |
| 4 | Dusty (toy cowboy) | Ignore the connection rule when placing on a base. |
| 5 | Volt (combat robot) | Discard 1 random Troop from the opponent's rack. |
| 6 | Cuddles (teddy medic) | Draw 1. |
| 7 | Treads (wind-up tank) | No effect. |

The 8 maps are Backyard Fort, Candy Clouds, Lava Sandbox, Haunted Attic, Bathtub Bay, Sandpit Trenches, Kiddie Pool and Rocket Room. Each has its own special-base mechanic.

## Online setup (one time, about 10 minutes, free)

1. Go to <https://console.firebase.google.com> and click **Add project**. Analytics isn't needed.
2. Open **Build → Authentication → Get started**, then enable the **Anonymous** sign-in provider.
3. Open **Build → Firestore Database → Create database**. Production mode is fine; pick any region.
4. Open **Project settings (⚙) → Your apps → Web (`</>`)** and register an app. Copy the `firebaseConfig` object it shows.
5. Paste the config into `js/config.js`:
   ```js
   export const FIREBASE_CONFIG = { apiKey: '…', authDomain: '…', projectId: '…', storageBucket: '…', messagingSenderId: '…', appId: '…' };
   ```
6. Deploy the security rules and host the app. You need Node installed.
   ```sh
   npm install -g firebase-tools
   firebase login
   firebase use --add          # pick your project
   firebase deploy             # deploys firestore.rules + hosting
   ```
   This prints a URL like `https://your-project.web.app`.
7. Open that URL on your phone and add it to your home screen:
   - **iPhone:** Share → **Add to Home Screen**.
   - **Android:** ⋮ → **Install app**.

   Send your friends the same link.

### Playing online

- The first time you open **Play Online**, pick a player name.
- There are three ways to start a game:
  - **Quick match** joins any waiting public game on a random map, or opens one and waits.
  - **Challenge friend** sends a challenge by player name. The game shows up in their list with **Accept** and **Decline** buttons.
  - **Invite link / code** shares a link (or a 5-letter code) that drops your friend straight into the game.
- Turns are asynchronous. Play your turn and it is sent when you tap **Deploy**, or when your effects finish resolving. Your opponent sees a recap of your move ("placed Treads (7) on top of your Cosmo…") with the changed spots highlighted.
- Games update live while the app is open. There are no push notifications, so check the **Your games** list, where your-turn games are highlighted.

## Publishing as a home-screen app (GitHub Pages)

The repo includes `.github/workflows/pages.yml`, which publishes the game on every push.

1. Free GitHub accounts can only publish Pages from public repos: **Settings → General → Danger Zone → Change visibility → Public** (or use GitHub Pro).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Actions → Deploy to GitHub Pages → Run workflow** (or push any change).
4. Open `https://jlmtodd214-hue.github.io/Toy-Battle/` on your phone, then **Share → Add to Home Screen** (iPhone) or **⋮ → Install app** (Android).

Bot and pass & play work right away. Online play still needs the Firebase config in `js/config.js`.

## Running locally

No build step. Serve the folder with any static server:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Bot and pass & play work without Firebase. Run the rules tests with:

```sh
node tests/engine.test.mjs
```

## Project layout

| File | Contents |
|---|---|
| `js/engine.js` | Rules engine: pure functions over a JSON state. |
| `js/maps.js` | The 8 maps: nodes, paths, regions, special bases. |
| `js/board.js` | SVG board rendering and themes. |
| `js/troops.js` | Characters, card art, effect icons. |
| `js/game.js` | Game screen: hand, drag-to-deploy, effect prompts, recap. |
| `js/app.js` | Menus, lobby, bot and pass & play drivers. |
| `js/net.js` | Firebase auth, matchmaking and turn sync. |
| `js/bot.js` | Practice bot. |
| `firestore.rules` | Database security rules. |

## Notes and limits

- **Hidden information isn't enforced.** The full game state, including racks, is stored in the game record, so a tech-savvy friend could peek. This is fine for casual personal use.
- **Your account lives on your device.** Anonymous sign-in is tied to the browser. Clearing site data or switching phones creates a new account; you can claim the same name again once the old one is released.
- **Updating the app:** after changing files, bump `VERSION` in `sw.js` and redeploy so installed copies refresh.
