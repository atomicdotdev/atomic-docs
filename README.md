# Atomic VCS Documentation

Official documentation site for Atomic VCS - a mathematically sound distributed version control system.

Built with [Docusaurus](https://docusaurus.io/), a modern static website generator.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## 📁 Project Structure

```
atomic-docs/
├── docs/                       # Documentation markdown files
│   ├── intro.md               # Introduction page
│   ├── getting-started/       # Getting started guides
│   │   ├── installation.md
│   │   ├── first-repository.md
│   │   ├── basic-workflow.md
│   │   └── configuration.md
│   ├── concepts/              # Core concepts
│   ├── commands/              # Command reference
│   ├── remote/                # Remote operations
│   ├── advanced/              # Advanced topics
│   ├── guides/                # How-to guides
│   └── api/                   # API reference
├── src/                       # Custom React components
│   ├── css/                   # Custom CSS
│   └── pages/                 # Custom pages
├── static/                    # Static assets (images, etc.)
├── docusaurus.config.ts       # Site configuration
├── sidebars.ts                # Sidebar structure
└── package.json               # Dependencies
```

## 📝 Writing Documentation

### Creating a New Page

1. Create a new markdown file in the appropriate directory under `docs/`
2. Add frontmatter at the top:

```markdown
---
sidebar_position: 1
title: Your Page Title
---

# Your Page Title

Content goes here...
```

3. The page will automatically appear in the sidebar based on the directory structure

### Markdown Features

Docusaurus supports extended markdown features:

#### Code Blocks

```bash
atomic init
atomic add .
atomic record -m "Initial commit"
```

#### Admonitions

```markdown
:::tip
This is a tip!
:::

:::warning
This is a warning!
:::

:::info
This is info!
:::
```

#### Tabs

```markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="linux" label="Linux">
    Instructions for Linux
  </TabItem>
  <TabItem value="mac" label="macOS">
    Instructions for macOS
  </TabItem>
</Tabs>
```

## 🚢 Deployment

### Deploy to Fly.io

1. Install the Fly.io CLI:

```bash
curl -L https://fly.io/install.sh | sh
```

2. Login to Fly.io:

```bash
fly auth login
```

3. Launch your app (first time):

```bash
fly launch
```

This will:
- Create a new Fly.io app
- Set up the configuration
- Deploy your app

4. Deploy updates:

```bash
fly deploy
```

5. Open your deployed site:

```bash
fly open
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

1. Build the site:

```bash
npm run build
```

2. Deploy the `build` directory to Netlify:

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

### Deploy to GitHub Pages

1. Update `docusaurus.config.ts`:

```typescript
url: 'https://username.github.io',
baseUrl: '/repo-name/',
organizationName: 'username',
projectName: 'repo-name',
```

2. Deploy:

```bash
GIT_USER=<your-username> npm run deploy
```

## 🎨 Customization

### Theme Configuration

Edit `docusaurus.config.ts` to customize:

- Site title and tagline
- Color mode (light/dark)
- Navbar items
- Footer links
- Logo and favicon

### Custom CSS

Edit `src/css/custom.css` to add custom styles:

```css
:root {
  --ifm-color-primary: #0ea5e9;
  --ifm-color-primary-dark: #0284c7;
  --ifm-color-primary-darker: #0369a1;
}
```

### Custom Components

Create React components in `src/components/` and import them in your markdown:

```markdown
import MyComponent from '@site/src/components/MyComponent';

<MyComponent />
```

## 🔍 Search

### Algolia DocSearch (Recommended)

1. Apply for Algolia DocSearch at https://docsearch.algolia.com/apply/
2. Once approved, add to `docusaurus.config.ts`:

```typescript
algolia: {
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_SEARCH_API_KEY',
  indexName: 'atomic-vcs',
  contextualSearch: true,
}
```

### Local Search

Install a local search plugin:

```bash
npm install --save @docusaurus/theme-search-algolia
```

## 📊 Analytics

### Google Analytics

Add to `docusaurus.config.ts`:

```typescript
gtag: {
  trackingID: 'G-XXXXXXXXXX',
  anonymizeIP: true,
}
```

## 🧪 Testing

### Check for Broken Links

```bash
npm run build
npm run serve
```

Then test all links manually or use a link checker.

### Lighthouse Audit

Run Lighthouse audit on your deployed site:

```bash
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage
```

## 🤝 Contributing

### Documentation Guidelines

1. **Be Clear**: Write for users who are new to Atomic
2. **Be Concise**: Get to the point quickly
3. **Use Examples**: Show code examples for commands
4. **Add Context**: Explain why, not just how
5. **Cross-Reference**: Link to related topics

### Style Guide

- Use present tense ("Atomic creates" not "Atomic will create")
- Use second person ("you can" not "the user can")
- Use active voice ("run the command" not "the command should be run")
- Keep paragraphs short (3-4 sentences max)
- Use code formatting for commands, file names, and code

### Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm start`
5. Build to verify: `npm run build`
6. Submit a pull request

## 📚 Resources

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [Markdown Guide](https://www.markdownguide.org/)
- [Atomic VCS GitHub](https://github.com/atomic-vcs/atomic)
- [Fly.io Documentation](https://fly.io/docs/)

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .docusaurus build node_modules
npm install
npm run build
```

### Deployment Issues

Check the build logs:

```bash
fly logs
```

## 📄 License

This documentation is licensed under the MIT License. See the main Atomic VCS repository for the software license.

---

**Need help?** Join our [Discord community](https://discord.gg/atomic-vcs) or [open an issue](https://github.com/atomic-vcs/atomic/issues).