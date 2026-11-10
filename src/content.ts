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
  | { type: 'gallery'; images: Media[] }
  | { type: 'video'; src: string; caption?: string }

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
    cover: { src: 'projects/haptic-giant/cover.svg', alt: 'Haptic Giant setup' },
    body: [
      { type: 'heading', text: 'The project' },
      { type: 'text', text: 'Placeholder: what Haptic Giant is, who it is for and what the calibration makes possible.' },
      { type: 'heading', text: 'Calibration with ICP' },
      {
        type: 'text',
        text: 'Placeholder: how you collected the end-effector positions, how ICP aligns them with Unity coordinates, and how accurate the result is.',
      },
      {
        type: 'gallery',
        images: [
          { src: 'projects/haptic-giant/1.svg', caption: 'Placeholder: the physical setup' },
          { src: 'projects/haptic-giant/2.svg', caption: 'Placeholder: the view in the headset' },
        ],
      },
      { type: 'heading', text: 'What I learned' },
      { type: 'text', text: 'Placeholder: challenges across different Meta headsets, and what you would improve next.' },
    ],
  },
  {
    slug: 'pfeifer-langen-robot',
    title: 'Robot design project with Pfeifer & Langen',
    meta: 'Team of 6',
    summary:
      'Industry-sponsored robot built by six students. I led requirements, the electrical design (architecture, motors) and the AI pipeline: a two-stage computer-vision system with a fine-tuned YOLO model.',
    tags: ['YOLO', 'Computer vision', 'Electrical design', 'Fusion 360'],
    cover: { src: 'projects/pfeifer-langen-robot/cover.svg', alt: 'The robot built for Pfeifer & Langen' },
    body: [
      { type: 'heading', text: 'The task' },
      { type: 'text', text: 'Placeholder: the problem Pfeifer & Langen wanted solved and the requirements you defined.' },
      { type: 'heading', text: 'Electrical design' },
      { type: 'text', text: 'Placeholder: the architecture, motor choice and how the pieces connect.' },
      { type: 'heading', text: 'Two-stage vision pipeline' },
      {
        type: 'text',
        text: 'Placeholder: what each stage does, how you collected data and fine-tuned YOLO, and how well it works.',
      },
      {
        type: 'gallery',
        images: [
          { src: 'projects/pfeifer-langen-robot/1.svg', caption: 'Placeholder: the finished robot' },
          { src: 'projects/pfeifer-langen-robot/2.svg', caption: 'Placeholder: detections from the vision pipeline' },
        ],
      },
      { type: 'heading', text: 'Teamwork' },
      { type: 'text', text: 'Placeholder: how the six of you split the work and what you took away from it.' },
    ],
  },
  {
    slug: 'checkpoint',
    title: 'Checkpoint',
    meta: 'Startup · since 2026',
    summary:
      'App that prepares learner drivers for the practical driving test, with instructor feedback on real photos, videos and quizzes of tricky spots in their area. Sold to driving schools (B2B2C).',
    tags: ['Flutter', 'Cloudflare', 'Co-founder'],
    cover: { src: 'projects/checkpoint/cover.svg', alt: 'The Checkpoint app' },
    links: [{ label: 'checkpoint-app.de', href: 'https://checkpoint-app.de' }],
    body: [
      { type: 'heading', text: 'The problem' },
      { type: 'text', text: 'Placeholder: why learner drivers struggle with the practical test and what Checkpoint changes.' },
      { type: 'heading', text: 'The product' },
      { type: 'text', text: 'Placeholder: how instructors add photos, videos and quizzes, and what learners see.' },
      {
        type: 'gallery',
        images: [
          { src: 'projects/checkpoint/1.svg', caption: 'Placeholder: app screenshot' },
          { src: 'projects/checkpoint/2.svg', caption: 'Placeholder: app screenshot' },
        ],
      },
      { type: 'heading', text: 'My role' },
      { type: 'text', text: 'Placeholder: what you build and own as co-founder, and the tech behind it.' },
    ],
  },
  {
    slug: 'rl-unity-ml-agents',
    title: 'Reinforcement learning with Unity ML-Agents',
    meta: 'Side project',
    summary:
      'Trained a 2D and 3D pole balancer, then a 1v1 sumo environment where two agents learn to push each other out of the ring.',
    tags: ['Unity', 'ML-Agents', 'PPO'],
    cover: { src: 'projects/rl-unity-ml-agents/cover.svg', alt: 'Trained agents in the sumo ring' },
    body: [
      { type: 'heading', text: 'Pole balancer' },
      { type: 'text', text: 'Placeholder: observations, actions and reward, and how the 3D version differs from the 2D one.' },
      { type: 'heading', text: 'Sumo' },
      { type: 'text', text: 'Placeholder: how the two agents are trained against each other and what strategies emerged.' },
      {
        type: 'gallery',
        images: [
          { src: 'projects/rl-unity-ml-agents/1.svg', caption: 'Placeholder: 2D pole balancer' },
          { src: 'projects/rl-unity-ml-agents/2.svg', caption: 'Placeholder: 3D pole balancer' },
          { src: 'projects/rl-unity-ml-agents/3.svg', caption: 'Placeholder: sumo ring' },
        ],
      },
      { type: 'heading', text: 'Results' },
      { type: 'text', text: 'Placeholder: training curves, what did not work at first, and what you learned about PPO.' },
    ],
  },
  {
    slug: 'robot-portfolio',
    title: 'This website',
    meta: '2026',
    summary:
      'An SO-101 robot arm loaded from its URDF, with inverse kinematics running in the browser. You navigate by pick-and-place.',
    tags: ['React Three Fiber', 'URDF', 'Inverse kinematics'],
    cover: { src: 'projects/robot-portfolio/cover.svg', alt: 'The SO-101 arm on the portfolio table' },
    links: [{ label: 'github.com/JaferShar', href: 'https://github.com/JaferShar' }],
    body: [
      { type: 'heading', text: 'Idea' },
      { type: 'text', text: 'Placeholder: why a portfolio you navigate by steering a robot arm.' },
      { type: 'heading', text: 'Inverse kinematics in the browser' },
      { type: 'text', text: 'Placeholder: how the arm follows the cursor and picks up blocks.' },
      {
        type: 'gallery',
        images: [
          { src: 'projects/robot-portfolio/1.svg', caption: 'Placeholder: cursor control' },
          { src: 'projects/robot-portfolio/2.svg', caption: 'Placeholder: point cloud mode' },
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
        meta: '10/2024 – today',
        text: 'Karlsruhe Institute of Technology (KIT). Focus on robotics, machine learning and NLP.',
      },
      {
        title: 'B.Sc. Informatics',
        meta: '10/2019 – 09/2024',
        text: 'Karlsruhe Institute of Technology (KIT). Thesis at the HCI & Accessibility Lab (Prof. Kathrin Gerling): a project and field study on how reward and punishment affect rehabilitation.',
      },
      {
        title: 'Full-stack developer (working student)',
        meta: '05/2025 – today',
        text: 'WebCorC, TVA research group at KIT. Angular/TypeScript frontend, Java backend, MongoDB, Docker.',
      },
      {
        title: 'Co-founder, Checkpoint',
        meta: '07/2026 – today',
        text: 'Driving-test preparation app, founded with two friends.',
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
