import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Atomic",
  tagline:
    "Mathematically sound distributed version control for AI-scale development",
  favicon: "img/atomic-favicon.png",

  future: {
    v4: true,
  },

  url: "https://docs.atomic.dev/",
  baseUrl: "/",

  organizationName: "atomicdotdev",
  projectName: "atomic-docs",
  trailingSlash: false,

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
          // Docusaurus appends the site-relative source path (which already
          // starts with `docs/`), so this base must be the REPO ROOT of this
          // repo — not the atomic repo, and not a path ending in `docs/`.
          editUrl: "https://github.com/atomicdotdev/atomic-docs/tree/release/",
        },
        blog: false,
        // Shared GA4 property with atomic.dev. Because both sites live under
        // the atomic.dev root domain, GA4 unifies sessions across the
        // subdomain automatically; split by the `hostname` dimension.
        gtag: {
          trackingID: "G-THEHP80942",
          anonymizeIP: true,
        },
        theme: {
          customCss: ["./src/css/fonts.css", "./src/css/custom.css"],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/atomic-logo.png",
    colorMode: {
      defaultMode: "dark",
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: "",
      logo: {
        alt: "Atomic",
        src: "img/atomic-logo-horizontal.png",
        srcDark: "img/atomic-logo-horizontal.png",
        style: { height: "50px" },
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "right",
          label: "Documentation",
        },
        {
          href: "https://atomic.dev",
          label: "Platform",
          position: "right",
        },
        {
          href: "https://github.com/atomicdotdev/atomic",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Introduction",
              to: "/",
            },
            {
              label: "Installation",
              to: "/getting-started/installation",
            },
            {
              label: "First Repository",
              to: "/getting-started/first-repository",
            },
            {
              label: "Migrating from Git",
              to: "/getting-started/migrating-from-git",
            },
          ],
        },
        {
          title: "Resources",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/atomicdotdev/atomic",
            },
            {
              label: "Contributing",
              href: "https://github.com/atomicdotdev/atomic/blob/main/CONTRIBUTING.md",
            },
            {
              label: "Changelog",
              href: "https://github.com/atomicdotdev/atomic/blob/main/CHANGELOG.md",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Discord",
              href: "https://discord.gg/atomicdotdev",
            },
            {
              label: "Twitter / X",
              href: "https://x.com/atomicdotdev",
            },
            {
              label: "LinkedIn",
              href: "https://www.linkedin.com/company/atomic-software-co",
            },
          ],
        },
        {
          title: "Company",
          items: [
            {
              label: "Platform",
              href: "https://atomic.dev",
            },
            {
              label: "Careers",
              href: "https://atomic.dev/careers",
            },
            {
              label: "About",
              href: "https://atomic.dev/about",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Atomic Software, Co. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["rust", "toml", "bash", "json", "typescript"],
      magicComments: [
        {
          className: "theme-code-block-highlighted-line",
          line: "highlight-next-line",
          block: { start: "highlight-start", end: "highlight-end" },
        },
      ],
    },
    algolia: {
      appId: "YOUR_APP_ID",
      apiKey: "YOUR_SEARCH_API_KEY",
      indexName: "atomic-vcs",
      contextualSearch: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
