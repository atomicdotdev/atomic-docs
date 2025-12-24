# Deployment Guide

This guide covers deploying the Atomic VCS documentation site to various platforms.

## 🚀 Quick Deploy to Fly.io (Recommended)

Fly.io is recommended for its simplicity, global CDN, and generous free tier.

### Prerequisites

- [Fly.io account](https://fly.io/app/sign-up) (free tier available)
- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed

### Step 1: Install Fly CLI

**macOS/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

### Step 2: Login to Fly.io

```bash
fly auth login
```

This opens your browser for authentication.

### Step 3: Launch Your App

From the `atomic-docs` directory:

```bash
fly launch
```

You'll be prompted with:
- **App name**: Choose a unique name (e.g., `atomic-docs` or `my-atomic-docs`)
- **Region**: Select closest to your users (e.g., `sjc` for San Jose)
- **PostgreSQL**: No (not needed for static site)
- **Redis**: No (not needed for static site)

The CLI will detect the Dockerfile and configure automatically.

### Step 4: Deploy

```bash
fly deploy
```

This will:
1. Build the Docker image
2. Push to Fly.io registry
3. Deploy to production
4. Provide a URL (e.g., `https://atomic-docs.fly.dev`)

### Step 5: Open Your Site

```bash
fly open
```

### Subsequent Deployments

After making changes to documentation:

```bash
# Build locally to test (optional)
npm run build

# Deploy to Fly.io
fly deploy
```

### Custom Domain

To use a custom domain:

```bash
# Add certificate
fly certs add docs.youratomic.com

# Add DNS records (from Fly.io dashboard or CLI)
fly ips list
```

Then configure your DNS:
- **A record**: `@` → Fly.io IPv4
- **AAAA record**: `@` → Fly.io IPv6

## 📦 Alternative: Deploy to Vercel

Vercel offers zero-config deployments with automatic HTTPS.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
vercel
```

Follow the prompts:
- Link to existing project or create new
- Configure build settings (auto-detected)
- Deploy

### Production Deployment

```bash
vercel --prod
```

### Custom Domain

Configure in Vercel dashboard: **Settings → Domains**

## 🌐 Alternative: Deploy to Netlify

Netlify provides continuous deployment from Git.

### Option A: Git-based Deployment

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
6. Click "Deploy site"

### Option B: CLI Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the site
npm run build

# Deploy
netlify deploy --prod --dir=build
```

## 🐙 Alternative: GitHub Pages

Deploy to GitHub Pages for free hosting.

### Step 1: Configure Repository

Update `docusaurus.config.ts`:

```typescript
url: 'https://yourusername.github.io',
baseUrl: '/atomic-docs/', // Your repo name
organizationName: 'yourusername',
projectName: 'atomic-docs',
```

### Step 2: Deploy

```bash
# Set GitHub username
GIT_USER=yourusername npm run deploy
```

This builds and pushes to the `gh-pages` branch.

### Step 3: Enable GitHub Pages

1. Go to repository **Settings → Pages**
2. Source: Deploy from `gh-pages` branch
3. Save

Your site will be at `https://yourusername.github.io/atomic-docs/`

## 🐳 Docker Deployment

Deploy the Docker container to any platform.

### Build Docker Image

```bash
docker build -t atomic-docs .
```

### Run Locally

```bash
docker run -p 8080:8080 atomic-docs
```

Visit http://localhost:8080

### Push to Registry

```bash
# Docker Hub
docker tag atomic-docs yourusername/atomic-docs
docker push yourusername/atomic-docs

# GitHub Container Registry
docker tag atomic-docs ghcr.io/yourusername/atomic-docs
docker push ghcr.io/yourusername/atomic-docs
```

### Deploy to Any Cloud

Once pushed to a registry, deploy to:
- AWS ECS/EKS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Railway

## 🔧 Environment Configuration

### Build-time Environment Variables

Add to `fly.toml`:

```toml
[env]
  NODE_ENV = "production"
  DOCUSAURUS_CUSTOM_VAR = "value"
```

Or pass during build:

```bash
CUSTOM_VAR=value npm run build
```

## 🔍 Monitoring & Analytics

### Fly.io Monitoring

```bash
# View logs
fly logs

# Check status
fly status

# View metrics
fly dashboard
```

### Add Analytics

Update `docusaurus.config.ts`:

```typescript
gtag: {
  trackingID: 'G-XXXXXXXXXX',
  anonymizeIP: true,
},
```

Or for Plausible:

```typescript
scripts: [
  {
    src: 'https://plausible.io/js/script.js',
    defer: true,
    'data-domain': 'your-domain.com',
  },
],
```

## 🚨 Troubleshooting

### Build Fails on Fly.io

Check build logs:
```bash
fly logs
```

Common issues:
- **Out of memory**: Increase VM size in `fly.toml`
- **Node version**: Specify in `package.json` engines
- **Build timeout**: Optimize dependencies

### Port Issues

Ensure Dockerfile exposes port 8080 (Fly.io default):
```dockerfile
EXPOSE 8080
```

And nginx listens on 8080:
```nginx
listen 8080;
```

### Broken Links After Deploy

Run link check:
```bash
npm run build
npm run serve
```

Then test all navigation.

## 📊 Performance Optimization

### Enable Compression

Already configured in `nginx.conf`:
- Gzip compression for text assets
- Cache headers for static files

### CDN Configuration

Fly.io provides global CDN automatically.

For custom CDN (Cloudflare):
1. Point domain to Fly.io
2. Enable Cloudflare proxy
3. Configure caching rules

### Optimize Images

Use WebP format and lazy loading:

```markdown
![Alt text](./image.webp)
```

### Build Optimization

Reduce build time:
```bash
# Use npm ci instead of npm install
npm ci

# Parallel builds
npm run build -- --bundleAnalyzer
```

## 🔐 Security

### HTTPS

All platforms provide free HTTPS certificates automatically.

### Security Headers

Already configured in `nginx.conf`:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### Rate Limiting

Add to Fly.io configuration:

```toml
[[services.http_checks]]
  interval = 10000
  timeout = 2000
  grace_period = "5s"
  method = "GET"
  path = "/health"
```

## 🔄 CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Get your token:
```bash
fly auth token
```

Add to GitHub: **Settings → Secrets → Actions → New repository secret**

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
deploy:
  image: flyio/flyctl
  script:
    - flyctl deploy
  only:
    - main
```

## 💰 Cost Estimation

### Fly.io Free Tier
- 3 shared-cpu-1x VMs
- 3GB persistent storage
- 160GB outbound transfer/month
- **Perfect for documentation sites**

### Paid Plans (if needed)
- Scale up: ~$2-10/month for basic needs
- Custom domains: Free
- SSL certificates: Free

### Vercel/Netlify Free Tier
- 100GB bandwidth/month
- Unlimited sites
- **More than enough for docs**

## 📝 Deployment Checklist

Before deploying:

- [ ] Test build locally: `npm run build`
- [ ] Check for broken links
- [ ] Test navigation and search
- [ ] Verify mobile responsiveness
- [ ] Update environment variables
- [ ] Configure custom domain (if applicable)
- [ ] Set up analytics (optional)
- [ ] Enable monitoring
- [ ] Test deployment on staging (optional)
- [ ] Deploy to production
- [ ] Verify live site
- [ ] Set up CI/CD (optional)

## 🎉 Post-Deployment

### Update DNS

If using custom domain, update DNS records.

### Monitor Performance

Check site speed:
```bash
# Using Lighthouse
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage
```

### Share the Docs

Your Atomic VCS documentation is now live! Share it with:
- Development team
- Community forums
- Social media
- Documentation aggregators

---

**Need Help?**

- Fly.io Docs: https://fly.io/docs/
- Docusaurus Deploy Guide: https://docusaurus.io/docs/deployment
- Community: Discord/GitHub Discussions

Happy deploying! 🚀