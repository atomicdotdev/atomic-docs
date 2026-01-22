import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: "doc",
      id: "intro",
      label: "Introduction",
    },
    {
      type: "html",
      value: '<div class="sidebar-section-label">GETTING STARTED</div>',
      defaultStyle: true,
    },
    "getting-started/installation",
    "getting-started/first-repository",
    "getting-started/migrating-from-git",
    "getting-started/ai-agent-workflows",
    {
      type: "html",
      value: '<div class="sidebar-section-label">CONCEPTS</div>',
      defaultStyle: true,
    },
    {
      type: "doc",
      id: "concepts/the-lego-story",
      label: "🧱 The Lego Story",
    },
    "concepts/change-identity",
    "concepts/hunks-edit-replacement",
    {
      type: "doc",
      id: "concepts/performance-at-scale",
      label: "⚡ Performance at Scale",
    },
    {
      type: "html",
      value: '<div class="sidebar-section-label">PROPOSALS</div>',
      defaultStyle: true,
    },
    "proposals/manifest-nodes",
    "proposals/virtual-working-copies",
    "proposals/performance-benchmarking-strategy",
    {
      type: "html",
      value: '<div class="sidebar-section-label">COMMANDS</div>',
      defaultStyle: true,
    },
    {
      type: "doc",
      id: "commands/overview",
      label: "Overview",
    },
    {
      type: "category",
      label: "Repository Management",
      collapsed: true,
      link: {
        type: "doc",
        id: "commands/repository-management",
      },
      items: ["commands/init", "commands/clone", "commands/split"],
    },
    {
      type: "category",
      label: "Working with Changes",
      collapsed: true,
      link: {
        type: "doc",
        id: "commands/working-with-changes",
      },
      items: [
        "commands/record",
        "commands/apply",
        "commands/unrecord",
        "commands/diff",
        "commands/status",
        "commands/log",
      ],
    },
    {
      type: "category",
      label: "Stacks",
      collapsed: true,
      link: {
        type: "doc",
        id: "commands/stacks",
      },
      items: ["commands/stack"],
    },
    {
      type: "category",
      label: "Remote Operations",
      collapsed: true,
      link: {
        type: "doc",
        id: "commands/remote-operations",
      },
      items: ["commands/push", "commands/pull"],
    },
    {
      type: "category",
      label: "Tags",
      collapsed: true,
      link: {
        type: "doc",
        id: "commands/tags",
      },
      items: ["commands/tag"],
    },
    {
      type: "category",
      label: "File Operations",
      collapsed: true,
      link: {
        type: "doc",
        id: "commands/file-operations",
      },
      items: ["commands/add", "commands/remove", "commands/move"],
    },
    {
      type: "category",
      label: "Identity & Attribution",
      collapsed: true,
      link: {
        type: "doc",
        id: "commands/identity-attribution",
      },
      items: ["commands/identity", "commands/credit", "commands/attribution"],
    },
    {
      type: "category",
      label: "Utilities",
      collapsed: true,
      items: [
        "commands/git",
        "commands/archive",
        "commands/reset",
        "commands/change",
        "commands/dependents",
        "commands/completions",
      ],
    },
  ],
};

export default sidebars;
