import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Atomic",
  tagline:
    "Mathematically sound distributed version control for AI-scale development",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://docs.beatomic.dev",
  baseUrl: "/",

  organizationName: "castingclouds",
  projectName: "atomic",

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
          editUrl: "https://github.com/atomic-vcs/atomic/tree/main/docs/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/atomic-social-card.jpg",
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "",
      logo: {
        alt: "Atomic Logo",
        src: "img/swag@2x.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "right",
          label: "Documentation",
        },
        {
          href: "https://github.com/castingclouds/atomic",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
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
          ],
        },
        {
          title: "Resources",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/atomic-vcs/atomic",
            },
            {
              label: "Contributing",
              href: "https://github.com/atomic-vcs/atomic/blob/main/CONTRIBUTING.md",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/atomic-vcs/atomic",
            },
            {
              label: "Discord",
              href: "https://discord.gg/atomic-vcs",
            },
            {
              label: "Twitter",
              href: "https://twitter.com/atomic_vcs",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Atomic VCS. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["rust", "toml", "bash"],
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
