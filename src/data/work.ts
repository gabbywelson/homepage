import type { BrandName } from '../components/BrandLogo.astro';

interface WorkRole {
  title: string;
  period?: string;
  highlights: string[];
}

interface WorkExperience {
  company: string;
  summary: string;
  period?: string;
  location?: string;
  href?: string;
  brand: BrandName;
  roles: WorkRole[];
}

// Handshake / LinkedIn dates and accomplishments: Gabby's supplied résumé.
// Teaching and earlier experience: Gabby's homepage copy; dates were not supplied.
// The compact periods cover employment at each company, including promotions.
export const work: WorkExperience[] = [
  {
    company: 'Handshake',
    summary: 'Senior → Founding Engineer',
    period: '2024 — now',
    location: 'San Francisco, CA',
    href: 'https://joinhandshake.com/ai',
    brand: 'handshake',
    roles: [
      {
        title: 'Founding Engineer, Handshake AI',
        period: 'February 2025 — present',
        highlights: [
          'Rewrote the onboarding flow for our data annotation platform, reducing churn by over 60%; continue to own its development.',
          'Own the integration between Handshake AI and the company’s legacy Rails-based Careers platform, spanning authentication, identity, phone verification, user profiles, and top-of-funnel user acquisition.',
          'Led major trust and safety features, integrating automated fraud-prevention tooling and supporting internationalization efforts while maintaining platform integrity standards.',
          'Built and shipped LLM-powered features across multiple product surfaces, including automated résumé parsing and analysis.',
          'Drove platform-wide developer experience improvements, including leading the adoption of Biome, which cut linting time by over 40%.',
          'Built and centralized a shared Radix UI-based component library adopted by 4+ product engineering teams; partnered closely with design to establish the foundations of our design system.',
          'Serve as co-lead of our LGBTQ+ employee resource group, organizing guest speakers, advocating for more inclusive HR policies, and hosting monthly meetups.',
        ],
      },
      {
        title: 'Senior Software Engineer, Handshake Plus',
        period: 'October 2024 — February 2025',
        highlights: [
          'Redesigned key upsell flows for our SMB revenue product, using LaunchDarkly, Eppo, and Hex to drive data-informed refinements through A/B testing.',
          'Architected and implemented the initial data model for a screening questions feature now core to the platform’s job application flow, used by hundreds of enterprise and SMB customers.',
        ],
      },
    ],
  },
  {
    company: 'LinkedIn',
    summary: 'Apprentice → Senior Software Engineer',
    period: '2019 — 2024',
    location: 'Mountain View, CA',
    href: 'https://en.wikipedia.org/wiki/LinkedIn',
    brand: 'linkedin',
    roles: [
      {
        title: 'Senior Software Engineer, Feed',
        period: 'September 2022 — September 2024',
        highlights: [
          'Led web platform efforts for a major UI/UX redesign of the core LinkedIn Feed, impacting tens of millions of daily active users.',
          'Served as technical lead for a pivotal trust and safety feature in the Feed, architecting the web implementation across diverse product surfaces while maintaining a high bar for quality and accessibility.',
          'Served as technical architect and project lead for numerous cross-platform Feed features, including context-appropriate network-building buttons such as “Follow” versus “Connect,” based on the likelihood of knowing a given poster.',
          'Mentored dozens of junior engineers, formally and informally; served on the Apprenticeship hiring committee and reviewed hundreds of program applications.',
        ],
      },
      {
        title: 'Software Engineer, Feed',
        period: 'March 2021 — September 2022',
        highlights: [
          'Drove organization-wide accessibility compliance for the core Feed product across web and mobile, orchestrating 20+ engineers and contractors, overhauling the accessibility process, and bringing the organization into ongoing compliance with industry standards.',
          'Served as technical lead on a major frontend framework upgrade with breaking changes across virtually every component; refactored hundreds of files and tests while preserving full functionality.',
        ],
      },
      {
        title: 'Apprentice Software Engineer, Feed',
        period: 'December 2019 — March 2021',
        highlights: [
          'Delivered over a dozen engagement-driving features, directly contributing to a seven-figure revenue increase and substantial improvements in key user metrics.',
        ],
      },
    ],
  },
  {
    company: 'Hack Reactor',
    summary: 'Software Engineer in Residence',
    href: 'https://en.wikipedia.org/wiki/Hack_Reactor',
    brand: 'hack-reactor',
    roles: [
      { title: 'Software Engineer in Residence', highlights: ['Taught software engineering at the coding bootcamp where I learned to code.'] },
    ],
  },
];

interface Education {
  school: string;
  qualification: string;
  period: string;
  location: string;
  href: string;
  brand: BrandName;
}

export const education: Education[] = [
  { school: 'Hack Reactor', qualification: 'Full-Stack Software Engineering Program', period: 'June 2019 — August 2019', location: 'Austin, Texas', href: 'https://en.wikipedia.org/wiki/Hack_Reactor', brand: 'hack-reactor' },
  { school: 'Williams College', qualification: 'B.A., Political Science & Leadership Studies, cum laude', period: 'September 2011 — September 2015', location: 'Williamstown, Massachusetts', href: 'https://www.williams.edu/', brand: 'williams' },
  { school: 'Exeter College, University of Oxford', qualification: 'Visiting Student, Williams-Exeter Programme', period: 'September 2013 — September 2014', location: 'Oxford, England, United Kingdom', href: 'https://www.exeter.ox.ac.uk/', brand: 'exeter' },
];

export const skills = [
  { label: 'Technologies', items: 'JavaScript, TypeScript, React, Next.js, React Native, GraphQL, tRPC, PostgreSQL, Ruby on Rails, Python, Ember.js, HTML, CSS, Tailwind CSS, LaunchDarkly, Datadog, Puppeteer, Jest' },
  { label: 'AI-assisted development', items: 'Claude Code, Codex, Cursor' },
  { label: 'Languages', items: 'English (native), Spanish (intermediate proficiency)' },
];
