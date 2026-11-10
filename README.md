# Robo-Portfolio 🤖

Portfolio-Website, auf der man per **Pick-and-Place** navigiert: Klick auf einen Block → ein **SO-101-Roboterarm** (echte URDF) greift ihn per Inverser Kinematik und legt ihn in die Drop-Zone → die Seite öffnet sich.

**Stack:** Vite · React · React Three Fiber · drei · urdf-loader · zustand

---

## 1. Lokal starten

Voraussetzung: [Node.js](https://nodejs.org) (Version 20 oder neuer).

```bash
npm install
npm run dev
```

Dann im Browser `http://localhost:5173` öffnen. Änderungen am Code erscheinen sofort.

## 2. Auf GitHub hochladen & veröffentlichen

1. Auf GitHub ein **leeres** Repo anlegen (https://github.com/new), am besten mit dem Namen
   `DEINUSERNAME.github.io` → dann ist die Seite unter `https://DEINUSERNAME.github.io` erreichbar.
   (Jeder andere Name geht auch, dann lautet die Adresse `https://DEINUSERNAME.github.io/REPONAME/`.)
2. In diesem Ordner im Terminal:

   ```bash
   git init
   git add .
   git commit -m "Robo-Portfolio"
   git branch -M main
   git remote add origin https://github.com/DEINUSERNAME/REPONAME.git
   git push -u origin main
   ```

3. Im Repo auf GitHub: **Settings → Pages → Build and deployment → Source: „GitHub Actions“** auswählen.
4. Unter dem Tab **Actions** läuft jetzt „Deploy to GitHub Pages“. Nach ca. 1 Minute ist die Seite online.

Ab dann gilt: **jeder `git push` auf `main` aktualisiert die Website automatisch.**

## 3. Inhalte anpassen

Alles Textliche steht in **`src/content.ts`**: Name, Untertitel und die 4 Seiten (About, Projects, CV, Contact) mit Überschrift, Text, Tags und Links.
Einen Lebenslauf als PDF einfach nach `public/cv.pdf` legen und in `content.ts` mit `href: './cv.pdf'` verlinken.

Direktlinks funktionieren auch: `…github.io/#/projects` öffnet die Projekte sofort (ohne Animation) – praktisch für Bewerbungen.

## 4. Wie es funktioniert

| Datei | Aufgabe |
|---|---|
| `public/so101/` | SO-101 URDF + STL-Meshes (TheRobotStudio, Apache 2.0 – siehe `LICENSE` dort) |
| `src/robot/setup.ts` | Dreht den Roboter von URDF (Z-oben) in three.js (Y-oben) |
| `src/robot/ik.ts` | **Inverse Kinematik**: Damped Least Squares, Jacobi-Matrix per finiten Differenzen direkt aus der URDF. Löst 4 Gelenke für Position + „Greifer zeigt nach unten“ |
| `src/robot/motion.ts` | Plant den Pick-and-Place-Ablauf (anfahren → absenken → greifen → heben → ablegen) und die Ruhepose `HOME` |
| `src/robot/Robot.tsx` | Lädt die URDF, spielt die geplanten Schritte ab (Interpolation im Gelenkraum), hängt Blöcke an den Greifer |
| `src/scene/layout.ts` | Positionen von Blöcken und Drop-Zone, Blockgröße, Höhen |
| `src/scene/*.tsx` | 3D-Szene: Kamera, Licht, Blöcke, Drop-Zone |
| `src/ui/Ui.tsx` | HTML-Oberfläche: Navigation, Gelenk-Telemetrie, Seiten-Panel |
| `src/store.ts` | Globaler Zustand (zustand) |
| `src/navigation.ts` | URL-Hash ↔ Seiten (Zurück-Button, Direktlinks) |

Gelenke des SO-101: `shoulder_pan`, `shoulder_lift`, `elbow_flex`, `wrist_flex`, `wrist_roll`, `gripper`.
In der Browser-Konsole kannst du live spielen:

```js
const r = __robo.getState().robot
r.joints.elbow_flex.setJointValue(0.5)
```

## 5. Ideen für die nächsten Schritte

- **Selbst steuern:** Greifer mit WASD/Maus bewegen (IK-Ziel folgt der Eingabe), Leertaste = greifen
- **Physik** mit `@react-three/rapier` – Blöcke fallen und kippen echt
- **Post-Processing** (`@react-three/postprocessing`): Bloom oder ASCII-Effekt
- **Schneller laden:** STL → komprimiertes GLB (z. B. mit Blender + `gltf-transform`)
- Sound beim Greifen, Idle-Animationen, Projekt-Detailseiten
