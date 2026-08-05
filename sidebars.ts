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
    "getting-started/quickstart",
    "getting-started/installation",
    "getting-started/first-repository",
    "getting-started/migrating-from-git",
    "getting-started/git-shadow-sync",
    "getting-started/querying-the-graph",
    "getting-started/ai-agent-workflows",
    {
      type: "html",
      value: '<div class="sidebar-section-label">AGENTS</div>',
      defaultStyle: true,
    },
    {
      type: "doc",
      id: "agents/overview",
      label: "Overview",
    },
    {
      type: "doc",
      id: "agents/installing-agent-integrations",
      label: "Installing Integrations",
    },
    {
      type: "doc",
      id: "agents/provenance",
      label: "Provenance Graphs",
    },
    {
      type: "doc",
      id: "agents/attestations",
      label: "Attestations",
    },
    {
      type: "html",
      value: '<div class="sidebar-section-label">CONCEPTS</div>',
      defaultStyle: true,
    },
    {
      type: "doc",
      id: "concepts/the-lego-story",
      label: "The Lego Story",
    },
    {
      type: "doc",
      id: "concepts/graph-model-explained",
      label: "Graph Model & AI Attribution",
    },
    "concepts/change-identity",
    "concepts/hunks-edit-replacement",
    {
      type: "doc",
      id: "concepts/dual-layer-diff",
      label: "Dual-Layer Diff & Semantic Merge",
    },
    {
      type: "doc",
      id: "concepts/performance-at-scale",
      label: "Performance at Scale",
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
      value: '<div class="sidebar-section-label">TEAMS & STORAGE</div>',
      defaultStyle: true,
    },
    {
      type: "doc",
      id: "teams/overview",
      label: "Team Collaboration",
    },
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
      type: "doc",
      id: "commands/completions",
      label: "Shell Completions",
    },
    {
      type: "category",
      label: "Repository Management",
      collapsed: true,
      link: {
        type: "doc",
        id: "commands/repository-management",
      },
      items: [
        "commands/init",
        "commands/clone",
        "commands/restore",
        "commands/split",
      ],
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
        "commands/add",
        "commands/remove",
        "commands/move",
        "commands/status",
        "commands/diff",
        "commands/record",
        "commands/revise",
        "commands/log",
        "commands/change",
        "commands/insert",
      ],
    },
    {
      type: "category",
      label: "Views & Tags",
      collapsed: true,
      items: ["commands/view", "commands/stash", "commands/tag"],
    },
    {
      type: "category",
      label: "Intent & Memory",
      collapsed: true,
      items: ["commands/intent", "commands/memory"],
    },
    {
      type: "category",
      label: "Remote Operations",
      collapsed: true,
      link: {
        type: "doc",
        id: "commands/remote-operations",
      },
      items: [
        "commands/org",
        "commands/workspace",
        "commands/project",
        "commands/team",
        "commands/server",
        "commands/remote",
        "commands/push",
        "commands/pull",
        "commands/clone",
      ],
    },
    {
      type: "category",
      label: "Identity",
      collapsed: true,
      items: ["commands/identity"],
    },
    {
      type: "category",
      label: "AI Agents",
      collapsed: true,
      items: ["commands/agent"],
    },
  ],
};

export default sidebars;
