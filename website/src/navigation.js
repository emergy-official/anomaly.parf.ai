import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Real-time',
      href: getPermalink('/real-time-inference'),
    },
    {
      text: 'Dataset',
      href: getPermalink('/dataset'),
    },
    {
      text: 'Serverless',
      href: getPermalink('/serverless-inference'),
    },
  ],
  actions: [
    { text: 'Github', href: 'https://github.com/onwidget/astrowind', icon: 'tabler:brand-github', target: '_blank' },
  ],
};

export const footerData = {
  links: [],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],

  socialLinks: [
    {
      ariaLabel: 'LinkedIn',
      icon: 'tabler:brand-linkedin',
      href: 'https://www.linkedin.com/in/ml2/',
    },
  ],
};
