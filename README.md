# MOSPHATE

Interactive 3D chrome-dino universe. Plain HTML, CSS and JavaScript with Three.js loaded from a CDN. No build step.

## Run locally
Open `index.html` through any static server (opening the file directly also works, but `.glb` models need a server):

    python3 -m http.server 8000
    # then visit http://localhost:8000

## Host on GitHub Pages
1. Create a new GitHub repository and push this folder to the `main` branch.
2. In the repository open Settings > Pages.
3. Under "Build and deployment" choose Source: Deploy from a branch, Branch: `main`, Folder: `/ (root)`, then Save.
4. After a minute the site is live at `https://<username>.github.io/<repo>/`.

## Edit content
Everything editable is in `js/config.js`: headings, story text, spec rows, timeline steps, team members, contact email and social links.

## Add your own assets
Drop files into `assets/` and set their paths in `js/config.js`. Missing files fall back to the procedural 3D version.

| Folder | Example files | Config key |
|---|---|---|
| `assets/mascot/` | `mascot.glb`, `mascot-front.webp` | `mascot.model`, `mascot.gallery` |
| `assets/product/` | `product-turntable.mp4` | `mascot.video` |
| `assets/packaging/` | `box-front.png`, `box-back.png`, `packaging.glb` | `packaging.front`, `.back`, `.model` |
| `assets/journey/` | `sketch-01.png`, `cad-02.png` | `journey.steps[i].media` |
| `assets/team/` | `member-01.webp` | `team.members[i].photo` |

## Files
- `index.html` page markup and library scripts
- `css/style.css` styles
- `js/voxel.js` procedural dino, cacti, clouds, pixel font
- `js/world.js` fixed background world, boot intro, runner game, finale emblem
- `js/stage.js` mascot studio and packaging stage
- `js/audio.js` 8-bit sound synth (muted by default)
- `js/app.js` content rendering, scroll choreography, controls
