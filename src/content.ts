/**
 * ===============================================================
 *  HIER TRÄGST DU DEINE INHALTE EIN.
 *  Jede Seite = ein Block auf dem Tisch (max. 4, mehr passen nicht in den Arbeitsraum).
 *  Reihenfolge = Reihenfolge der Blöcke von links nach rechts.
 * ===============================================================
 */

export const SITE = {
  name: 'Jafer',
  tagline: 'Computer Science @ KIT · Robotics · Machine Learning',
}

export type PageId = 'about' | 'projects' | 'cv' | 'contact'

export interface Section {
  title: string
  meta?: string
  text?: string
  tags?: string[]
  link?: { label: string; href: string }
}

export interface Page {
  id: PageId
  label: string
  color: string // Akzentfarbe des Blocks
  heading: string
  intro: string
  sections: Section[]
}

export const PAGES: Page[] = [
  {
    id: 'about',
    label: 'ABOUT',
    color: '#ffd21f',
    heading: 'Hi, I build robots that learn.',
    intro:
      'Placeholder: a short paragraph about you – what you study, what drives you, what you want to work on next.',
    sections: [
      { title: 'Currently', text: 'B.Sc./M.Sc. Computer Science at Karlsruhe Institute of Technology (KIT).' },
      { title: 'Interests', tags: ['Robotics', 'Reinforcement Learning', 'NLP', 'Simulation'] },
    ],
  },
  {
    id: 'projects',
    label: 'PROJECTS',
    color: '#3ee6c4',
    heading: 'Selected projects',
    intro: 'Placeholder: a few projects with a short description, tech stack and link.',
    sections: [
      {
        title: 'RL with Unity ML-Agents',
        meta: '2026',
        text: 'Pole balancer in 2D/3D and a sumo environment trained with PPO.',
        tags: ['Unity', 'ML-Agents', 'PPO'],
      },
      {
        title: 'This website',
        meta: '2026',
        text: 'SO-101 arm loaded from URDF, numerical inverse kinematics in the browser, pick-and-place navigation.',
        tags: ['React Three Fiber', 'URDF', 'IK'],
        link: { label: 'Source on GitHub', href: 'https://github.com/' },
      },
    ],
  },
  {
    id: 'cv',
    label: 'CV',
    color: '#ff5d73',
    heading: 'Curriculum vitae',
    intro: 'Placeholder: education, experience, skills. You can also link a PDF.',
    sections: [
      { title: 'Education', meta: 'since 20XX', text: 'Computer Science, KIT' },
      { title: 'Skills', tags: ['Python', 'C#', 'TypeScript', 'PyTorch', 'ROS 2'] },
      // { title: 'Download', link: { label: 'CV as PDF', href: './cv.pdf' } },  // PDF in public/ legen
    ],
  },
  {
    id: 'contact',
    label: 'CONTACT',
    color: '#7c8cff',
    heading: 'Get in touch',
    intro: 'Placeholder: how people can reach you.',
    sections: [
      { title: 'E-Mail', link: { label: 'you@example.com', href: 'mailto:you@example.com' } },
      { title: 'GitHub', link: { label: 'github.com/your-name', href: 'https://github.com/' } },
      { title: 'LinkedIn', link: { label: 'linkedin.com/in/your-name', href: 'https://linkedin.com/' } },
    ],
  },
]
