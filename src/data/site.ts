export const SITE = {
  name: 'swiift',
  author: 'Owen Bladen-Kay',
  title: 'swiift — Owen Bladen-Kay',
  description:
    'Owen Bladen-Kay (swiift): Unreal Engine programmer and MORDHAU modder. Games, mods, software and live events.',
  email: 'obladenkay@gmail.com',
  location: 'Manchester, UK',
  timezone: 'Europe/London',
};

export const NAV = [
  { label: 'Games & Mods', href: '/games/' },
  { label: 'Software', href: '/software/' },
  { label: 'Events', href: '/events/' },
  { label: 'About', href: '/about/' },
];

export type Social = { label: string; handle: string; href: string; icon: IconName };
export type IconName =
  | 'mail'
  | 'github'
  | 'linkedin'
  | 'instagram'
  | 'discord'
  | 'steam'
  | 'modio'
  | 'youtube'
  | 'arrow'
  | 'external'
  | 'download';

export const SOCIALS: Social[] = [
  { label: 'GitHub', handle: 'swiiftex', href: 'https://github.com/swiiftex', icon: 'github' },
  { label: 'LinkedIn', handle: 'in/swiift', href: 'https://www.linkedin.com/in/swiift/', icon: 'linkedin' },
  { label: 'Instagram', handle: '@swiiftex', href: 'https://www.instagram.com/swiiftex/', icon: 'instagram' },
  { label: 'Discord', handle: 'swiift.', href: 'https://discord.com/users/161191959149543424', icon: 'discord' },
  { label: 'mod.io', handle: 'swiift1', href: 'https://mod.io/u/swiift1/', icon: 'modio' },
];

/** mod.io snapshot (Oct 2026): total downloads across my own published mods. */
export const MODIO = {
  profile: 'https://mod.io/u/swiift1/',
  totalDownloads: 133_834,
  label: '130K+',
  /** Mods on mod.io that don't have their own page here. */
  more: [
    { title: "swiift's BR Extras", href: 'https://mod.io/g/mordhau/m/swiifts-br-extras', downloads: 17_816 },
    { title: 'ContingentLite (OCOM)', href: 'https://mod.io/g/mordhau/m/contingentlite-combat-mod', downloads: 7_780 },
    { title: 'SKM Spectator Overlay', href: 'https://mod.io/g/mordhau/m/skm-spectator-overlay', downloads: 5_446 },
    { title: 'PolygonMaps', href: 'https://mod.io/g/mordhau/m/polygonmaps', downloads: 643 },
  ],
};

/** Smaller or older repos, listed on the Software page. */
export const MORE_ON_GITHUB = [
  {
    title: 'echoFormsOverlay',
    href: 'https://github.com/swiiftex/echoFormsOverlay',
    year: '2021',
    tech: 'VB.NET',
    blurb: 'Polls the Echo VR local API and writes score and clock to text files for OBS, triggering UPDeck on goals. The seed of the Broadcast Tool.',
  },
  {
    title: 'ALevel-CS-Project',
    href: 'https://github.com/swiiftex/ALevel-CS-Project',
    year: '2022',
    tech: 'VB.NET · Access',
    blurb: 'My A Level project: an Echo Arena league scheduler with accounts, teams, fixtures, notifications and an admin panel.',
  },
  {
    title: 'DJHero-XInput',
    href: 'https://github.com/swiiftex/DJHero-XInput',
    year: '2023',
    tech: 'C++ · Arduino',
    blurb: 'An Arduino sketch that turns a DJ Hero turntable into an XInput controller, with a Dolphin profile.',
  },
];

export const CATEGORY_LABELS = {
  games: 'Games',
  mods: 'Mods',
  software: 'Software',
  events: 'Events',
} as const;
