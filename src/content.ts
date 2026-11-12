/**
 * ===============================================================
 *  HIER TRÄGST DU DEINE INHALTE EIN.
 *  Jede Seite = ein Block auf dem Tisch (max. 4, mehr passen nicht in den Arbeitsraum).
 *  Reihenfolge = Reihenfolge der Blöcke von links nach rechts.
 * ===============================================================
 */

export const SITE = {
  name: 'Jafer Sharfeddin',
  tagline: 'M.Sc. Informatics @ KIT · Robotics · Human-Robot Interaction',
}

export type PageId = 'about' | 'projects' | 'cv' | 'contact'

export interface Section {
  title: string
  meta?: string
  text?: string
  tags?: string[]
  /** Vorschaubild im Panel (Pfad relativ zu public/) */
  image?: string
  /** Externe URL oder interner Link wie '#/projects/mein-projekt' */
  link?: { label: string; href: string }
}

export interface Page {
  id: PageId
  label: string
  color: string // Akzentfarbe des Blocks
  heading: string
  intro: string
  /** Optionales Foto oben im Panel, z. B. ein Portrait (Pfad relativ zu public/) */
  photo?: { src: string; alt: string; caption?: string }
  sections: Section[]
}

/**
 * ===============================================================
 *  PROJEKTE – jedes Projekt bekommt eine eigene Detailseite (#/projects/<slug>).
 *  Das PROJECTS-Panel wird automatisch aus dieser Liste erzeugt.
 *
 *  Bilder: in public/projects/<slug>/ ablegen und hier relativ zu public/ eintragen,
 *          z. B. 'projects/haptic-giant/setup.jpg'.
 *  Videos: .mp4 aus public/ oder ein YouTube-Embed-Link (https://www.youtube.com/embed/<id>).
 *  Text:   eine Leerzeile im Text = neuer Absatz.
 * ===============================================================
 */

export interface Media {
  src: string
  caption?: string
  alt?: string
}

/** Bausteine für den Text einer Projektseite – frei kombinierbar, in dieser Reihenfolge angezeigt. */
export type ProjectBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'image'; image: Media }
  /** portrait: true für Hochformat-Bilder (z. B. Handy-Screenshots), werden dann ungeschnitten nebeneinander gezeigt */
  | { type: 'gallery'; images: Media[]; portrait?: boolean }
  /** poster: Standbild, das vor dem Abspielen angezeigt wird (nur für .mp4 aus public/) */
  | { type: 'video'; src: string; caption?: string; poster?: string }

export interface Project {
  /** Teil der URL – nur Kleinbuchstaben, Zahlen und Bindestriche */
  slug: string
  title: string
  /** Kurze Zeile über dem Titel, z. B. 'Robotics · KIT' */
  meta: string
  /** Kurzbeschreibung – erscheint im PROJECTS-Panel und oben auf der Detailseite */
  summary: string
  tags: string[]
  cover?: Media
  links?: { label: string; href: string }[]
  /** Ausführliche Beschreibung für die Detailseite */
  body: ProjectBlock[]
}

export const PROJECTS: Project[] = [
  {
    slug: 'haptic-giant',
    title: 'Haptic Giant',
    meta: 'Robotics · KIT',
    summary:
      'Sim-to-real calibration between a robot and Unity across Meta headsets. I used ICP to align the physical end-effector positions with Unity coordinates.',
    tags: ['Unity', 'ROS 2', 'C#', 'ICP', 'Mixed Reality'],
    cover: {
      src: 'projects/haptic-giant/headset-view-cover.jpg',
      alt: 'Headset passthrough view of a hand on the Haptic Giant end-effector, with a virtual sphere on it',
    },
    body: [
      { type: 'heading', text: 'The project' },
      {
        type: 'text',
        text: 'Haptic Giant is a large ceiling-mounted robot at KIT. You hold its end-effector while you see a mixed reality scene through a Meta headset, so virtual objects can push back with real force.\n\nThis only works if the virtual world and the real robot line up. If Unity thinks the end-effector is a few centimetres away from where your hand actually is, the illusion breaks. My job was to make the two match.',
      },
      { type: 'heading', text: 'Calibration with ICP' },
      {
        type: 'text',
        text: 'I moved the end-effector to a set of positions and recorded each one twice: in robot coordinates from ROS 2, and in Unity coordinates from the headset. Iterative Closest Point (ICP) then finds the rotation and translation that map one point set onto the other.\n\nUnity applies that transform to the virtual scene, so a virtual marker sits exactly on the real end-effector, as in the headset views below.',
      },
      {
        type: 'image',
        image: {
          src: 'projects/haptic-giant/headset-view.jpg',
          alt: 'Three headset passthrough views of a hand holding the robot end-effector, each with a coloured virtual sphere',
          caption: 'Through the headset: after calibration, the virtual sphere sits on the real end-effector',
        },
      },
      { type: 'heading', text: 'What I learned' },
      {
        type: 'text',
        text: 'Each Meta headset defines its own tracking origin, so a fixed offset is not enough. The calibration has to be quick to rerun whenever the headset or its origin changes. The project taught me how much sim-to-real work comes down to agreeing on coordinate frames.',
      },
    ],
  },
  {
    slug: 'pfeifer-langen-robot',
    title: 'Robot design project with Pfeifer & Langen',
    meta: 'Team of 6',
    summary:
      'Industry-sponsored robot built by six students. I led requirements, the electrical design (architecture, motors) and the AI pipeline: a two-stage computer-vision system with a fine-tuned YOLO model.',
    tags: ['YOLO', 'Computer vision', 'Electrical design', 'Fusion 360'],
    cover: {
      src: 'projects/pfeifer-langen-robot/robot-overview.jpg',
      alt: 'The finished gantry robot holding a lettuce head and picking off a leaf',
    },
    body: [
      { type: 'heading', text: 'The task' },
      {
        type: 'text',
        text: 'Pfeifer & Langen asked us to build a robot for vertical farming that removes single leaves from a lettuce head without damaging the rest of the plant. Lettuce is soft, and no two heads look the same, so the robot has to see each one before it grips.\n\nI worked out the requirements with the company and the team, from the size of the work area to how gently the gripper may squeeze.',
      },
      {
        type: 'video',
        src: 'projects/pfeifer-langen-robot/leaf-removal.mp4',
        poster: 'projects/pfeifer-langen-robot/leaf-removal-poster.jpg',
        caption: 'The robot grips a leaf at the top of the lettuce head and removes it',
      },
      {
        type: 'gallery',
        portrait: true,
        images: [
          {
            src: 'projects/pfeifer-langen-robot/whiteboard-sketches.jpg',
            caption: 'Early concept sketches: the gantry frame, the arm and the lettuce holder',
          },
          {
            src: 'projects/pfeifer-langen-robot/design-session.jpg',
            caption: 'Working out the mechanics with the team at the whiteboard',
          },
        ],
      },
      { type: 'heading', text: 'Electrical design' },
      {
        type: 'text',
        text: 'The robot combines a gantry with lead-screw axes, a small arm with a soft gripper, servo-driven clamps that hold the lettuce, and webcams. I designed the electrical architecture: the 24 V power supply, the motors and their drivers, the servos, and the link between the microcontroller and the computer that runs the vision model.',
      },
      {
        type: 'gallery',
        images: [
          {
            src: 'projects/pfeifer-langen-robot/gripper-closeup.jpg',
            caption: 'The gripper with soft silicone pads, holding a picked leaf',
          },
          {
            src: 'projects/pfeifer-langen-robot/lettuce-fixture.jpg',
            caption: 'Servo-driven clamps hold the lettuce head in place on the base',
          },
        ],
      },
      { type: 'heading', text: 'Two-stage vision pipeline' },
      {
        type: 'text',
        text: 'The webcams look at the lettuce from fixed positions. In the first stage, a YOLO model that I fine-tuned on our own lettuce images detects the leaves. In the second stage, the detections become a target the gripper can reach, so the robot knows which leaf to take and where to grip it.',
      },
      { type: 'heading', text: 'Teamwork' },
      {
        type: 'text',
        text: 'Six students, each owning a part: mechanics, electronics and software. Because I covered requirements, electronics and vision, I spent a lot of time at the interfaces, making sure what the camera saw, what the motors could do and what the mechanics allowed fit together.',
      },
      {
        type: 'image',
        image: {
          src: 'projects/pfeifer-langen-robot/me-with-robot.jpg',
          caption: 'Me with the finished robot, steering it with a gamepad',
        },
      },
    ],
  },
  {
    slug: 'checkpoint',
    title: 'Checkpoint',
    meta: 'Startup · since 2026',
    summary:
      'App that prepares learner drivers for the practical driving test, with instructor feedback on real photos, videos and quizzes of tricky spots in their area. Sold to driving schools (B2B2C).',
    tags: ['Flutter', 'Cloudflare', 'Co-founder'],
    cover: {
      src: 'projects/checkpoint/hero.jpg',
      alt: 'CheckPoint logo with the tagline "Confidently to your driving test" above an illustrated road',
    },
    links: [{ label: 'checkpoint-app.de', href: 'https://checkpoint-app.de' }],
    body: [
      { type: 'heading', text: 'The problem' },
      {
        type: 'text',
        text: 'Most mistakes in the practical driving test happen at a handful of local spots: a speed limit that changes mid-village, an unclear right of way, a tricky junction. Learners often see these places for the first time during the test. Checkpoint lets them study those spots in advance, with their own instructor.',
      },
      { type: 'heading', text: 'The product' },
      {
        type: 'text',
        text: 'Instructors film or photograph a tricky spot, explain it, rate its difficulty and add quiz questions. Learners find these checkpoints on a map and in a short-video feed, and can flag the ones they want to practise in their next lesson. Their profile shows how far they have come, from the first drive to being ready for the test.\n\nDriving schools buy Checkpoint and give it to their learners.',
      },
      {
        type: 'gallery',
        portrait: true,
        images: [
          {
            src: 'projects/checkpoint/login.jpg',
            caption: 'Learners join their driving school, or a school sets up its own account',
          },
          {
            src: 'projects/checkpoint/map.jpg',
            caption: 'Map: the checkpoints across the test area',
          },
          {
            src: 'projects/checkpoint/feed.jpg',
            caption: 'Feed: an instructor video of a tricky spot, with difficulty, questions and a practice flag',
          },
          {
            src: 'projects/checkpoint/stages.jpg',
            caption: 'Profile: practice wishes and the stages from first drive to driving test',
          },
        ],
      },
      { type: 'heading', text: 'My role' },
      {
        type: 'text',
        text: 'I founded Checkpoint with two friends in 2026. I build the app in Flutter, for iOS and Android from one codebase, and the backend on Cloudflare. As a co-founder I also talk to driving schools and turn their feedback into features.',
      },
    ],
  },
  {
    slug: 'rl-unity-ml-agents',
    title: 'Reinforcement learning with Unity ML-Agents',
    meta: 'Side project',
    summary:
      'Trained a 2D and 3D pole balancer, then a 1v1 sumo environment where two agents learn to push each other out of the ring.',
    tags: ['Unity', 'ML-Agents', 'PPO'],
    cover: {
      src: 'projects/rl-unity-ml-agents/sumo-ring.jpg',
      alt: 'Two capsule-shaped sumo agents pushing against each other in a round ring',
    },
    body: [
      { type: 'heading', text: 'Pole balancer' },
      {
        type: 'text',
        text: 'The agent sees the pole angle and how fast it is falling, moves its base, and gets a small reward for every step the pole stays upright. In 2D it only has to correct left and right. In 3D the pole can fall in any direction, so it has to balance two axes at once.',
      },
      { type: 'heading', text: 'Sumo' },
      {
        type: 'text',
        text: 'Two agents share a ring, and the one that pushes the other out wins. They train with self-play: each agent plays against earlier versions of itself, so the opponent gets stronger as it does.',
      },
      {
        type: 'video',
        src: 'projects/rl-unity-ml-agents/sumo.mp4',
        poster: 'projects/rl-unity-ml-agents/sumo-poster.jpg',
        caption: 'Two trained agents fighting in the sumo ring',
      },
      { type: 'heading', text: 'Results' },
      {
        type: 'text',
        text: 'The pole balancers learned reliably with PPO. The sumo task was harder: the reward has to encourage pushing without rewarding the agent for simply running out of the ring. The main lesson was that the reward design matters more than the network.',
      },
    ],
  },
  {
    slug: 'robot-portfolio',
    title: 'This website',
    meta: '2026',
    summary:
      'An SO-101 robot arm loaded from its URDF, with inverse kinematics running in the browser. You navigate by pick-and-place.',
    tags: ['React Three Fiber', 'URDF', 'Inverse kinematics'],
    cover: {
      src: 'projects/robot-portfolio/arm-and-blocks.jpg',
      alt: 'The yellow SO-101 arm on the portfolio table next to the four page blocks and the drop zone',
    },
    links: [{ label: 'github.com/JaferShar', href: 'https://github.com/JaferShar' }],
    body: [
      { type: 'heading', text: 'Idea' },
      {
        type: 'text',
        text: 'I want to work on robot arms, so I made the portfolio itself one. Each page is a block on the table. Click it, and the arm picks it up, puts it in the drop zone and opens the page. The direct menu at the top is still there if you are in a hurry.',
      },
      { type: 'heading', text: 'Inverse kinematics in the browser' },
      {
        type: 'text',
        text: 'The arm is the open-source SO-101, loaded from its real URDF. Inverse kinematics uses damped least squares, with the Jacobian computed by finite differences straight from the URDF, and solves four joints for a position with the gripper pointing down.\n\nWhile you move the mouse, the arm tracks the cursor every frame. For a pick-and-place, the whole sequence (approach, lower, grip, lift, place) is solved before the arm starts moving, so the motion stays smooth.',
      },
      {
        type: 'gallery',
        images: [
          {
            src: 'projects/robot-portfolio/cursor-control.jpg',
            caption: 'Cursor control: the gripper follows the mouse and the block under it lights up',
          },
          {
            src: 'projects/robot-portfolio/point-cloud.jpg',
            caption: 'Point cloud mode: the same arm drawn as points sampled from its meshes',
          },
        ],
      },
    ],
  },
]

export const PAGES: Page[] = [
  {
    id: 'about',
    label: 'ABOUT',
    color: '#ffd21f',
    heading: "Hi, I'm Jafer. I want to build robot arms that work with people.",
    intro:
      "I'm a Master's student in Informatics at the Karlsruhe Institute of Technology (KIT). I like projects where software meets the physical world: calibrating real robots to simulation, teaching agents with reinforcement learning, and making machines easier for humans to work with.",
    sections: [
      {
        title: 'Currently',
        text: 'Finishing my M.Sc. at KIT, working as a full-stack developer on WebCorC, and co-running my startup Checkpoint.',
      },
      {
        title: 'Looking for',
        text: 'A Master thesis or research internship in robotic manipulation.',
      },
      {
        title: 'Interests',
        tags: ['Robotic manipulation', 'Human-robot interaction', 'Reinforcement learning', 'Sim-to-real', 'NLP'],
      },
      {
        title: 'Languages',
        text: 'German & Arabic (native) · English (C1) · Japanese (3 years at KIT) · learning Turkish',
      },
    ],
  },
  {
    id: 'projects',
    label: 'PROJECTS',
    color: '#3ee6c4',
    heading: 'Selected projects',
    intro: 'Robotics, machine learning and products I have built. Open a project for the full story.',
    // Wird automatisch aus PROJECTS (oben) erzeugt – Projekte dort bearbeiten
    sections: PROJECTS.map((p) => ({
      title: p.title,
      meta: p.meta,
      text: p.summary,
      tags: p.tags,
      image: p.cover?.src,
      link: { label: 'Read more', href: `#/projects/${p.slug}` },
    })),
  },
  {
    id: 'cv',
    label: 'CV',
    color: '#ff5d73',
    heading: 'Curriculum vitae',
    intro: 'Education, experience and skills.',
    sections: [
      {
        title: 'M.Sc. Informatics',
        meta: '10/2024 - today',
        text: 'Karlsruhe Institute of Technology (KIT). Focus on robotics, machine learning and NLP.',
      },
      {
        title: 'B.Sc. Informatics',
        meta: '10/2019 - 09/2024',
        text: 'Karlsruhe Institute of Technology (KIT). Thesis at the HCI & Accessibility Lab (Prof. Kathrin Gerling): a project and field study on how reward and punishment affect rehabilitation.',
      },
      {
        title: 'Full-stack developer (working student)',
        meta: '05/2025 - today',
        text: 'WebCorC, TVA research group at KIT. Angular/TypeScript frontend, Java backend, MongoDB, Docker.',
      },
      {
        title: 'Co-founder, Checkpoint',
        meta: '07/2026 - today',
        text: 'Driving-test preparation app, founded with two friends.',
      },
      {
        title: 'Intern, Anomaly Detection in Manufacturing',
        meta: '05/2024 - 11/2024',
        text: 'Bosch, Bühl (hybrid). Worked on vision models that detect anomalies in manufacturing zero-shot, without needing examples of the defects first.',
      },
      {
        title: 'Skills',
        tags: ['Java', 'TypeScript', 'Python', 'C#', 'Angular', 'Unity', 'ROS 2', 'YOLO', 'Docker', 'MongoDB', 'Flutter', 'Git'],
      },
      {
        title: 'Languages',
        tags: ['German (native)', 'Arabic (native)', 'English (C1)', 'Japanese', 'Turkish (learning)'],
      },
    ],
  },
  {
    id: 'contact',
    label: 'CONTACT',
    color: '#7c8cff',
    heading: 'Get in touch',
    intro: 'Open to thesis, internship and research opportunities in robotics. Happy to hear from you.',
    // Eigenes Foto: z. B. public/me.jpg ablegen und hier src: 'me.jpg' eintragen
    photo: { src: 'ImageOfMe.jpeg', alt: 'Portrait of Jafer Sharfeddin' },
    sections: [
      { title: 'E-mail', link: { label: 'j.sharfeddin@gmail.com', href: 'mailto:j.sharfeddin@gmail.com' } },
      { title: 'LinkedIn', link: { label: 'Jafer Sharfeddin', href: 'https://www.linkedin.com/in/jafer-sharfeddin-3195682aa/' } },
      { title: 'GitHub', link: { label: 'github.com/JaferShar', href: 'https://github.com/JaferShar' } },
      { title: 'Location', text: 'Karlsruhe, Germany' },
    ],
  },
]
