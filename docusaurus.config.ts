import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import glossaryTermsPlugin from './src/remark/glossaryTerms';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'ITSF Standard Matchplay Rules (V3)',
  tagline: 'The official rules of table soccer, browsable',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://maxifoos.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/itsf-rules-site-v3/',

  // GitHub pages deployment config.
  organizationName: 'maxifoos', // Usually your GitHub org/user name.
  projectName: 'itsf-rules-site-v3', // Usually your repo name.
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: '/',
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          // Docs-only mode: the docs plugin owns the site root, so the
          // "Standard Matchplay Rules" category index (see its
          // _category_.json) can be the actual homepage without a redirect.
          // Individual chapters get an explicit /rules/* slug (see each
          // chapter's frontmatter) to keep their own URLs unchanged.
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          remarkPlugins: [glossaryTermsPlugin],
          // No editUrl: this is a public read-only site, so no "Edit this page" link.
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'ITSF Standard Matchplay Rules (V3)',
      logo: {
        alt: 'ITSF Logo',
        src: 'img/itsf-logo.png',
      },
      items: [
        {
          href: 'https://www.tablesoccer.org',
          label: 'ITSF Website',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Rules',
          items: [
            {
              label: 'Introduction',
              to: '/rules/introduction',
            },
            {
              label: 'Definitions',
              to: '/rules/definitions',
            },
            {
              label: 'Awards and Sanctions',
              to: '/rules/awards-and-sanctions',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'ITSF Website',
              href: 'https://www.tablesoccer.org',
            },
          ],
        },
      ],
      copyright: `Unofficial rendering of the ITSF Standard Matchplay Rules (Version 3.0). Built with Docusaurus. © ${new Date().getFullYear()}.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
