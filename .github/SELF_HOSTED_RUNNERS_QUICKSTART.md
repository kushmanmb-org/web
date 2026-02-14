# Quick Start: Self-Hosted Runners

This is a quick reference guide for setting up self-hosted runners. For complete documentation, see [SELF_HOSTED_RUNNERS.md](SELF_HOSTED_RUNNERS.md).

## Prerequisites

- Repository admin access
- Linux/macOS/Windows machine with:
  - 4+ GB RAM
  - 20+ GB disk space
  - Network connectivity to GitHub

## Setup Steps

### 1. Navigate to Runner Settings

**For Repository:**
1. Go to repository → Settings → Actions → Runners
2. Click "New self-hosted runner"

**For Organization:**
1. Go to organization → Settings → Actions → Runners
2. Click "New runner" → "New self-hosted runner"

### 2. Download and Configure (Linux/macOS)

```bash
# Create directory
mkdir actions-runner && cd actions-runner

# Download (check GitHub UI for latest version)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure (use token from GitHub UI)
./config.sh --url https://github.com/YOUR-ORG/YOUR-REPO --token YOUR-TOKEN

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

### 3. Install Required Software

```bash
# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 24
nvm use 24

# Yarn (via Corepack)
corepack enable

# Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 4. Add Labels

Configure labels during setup or add later:
```bash
./config.sh --url ... --token ... --labels linux,x64,docker
```

### 5. Use in Workflows

Update workflow files to use your runner:

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, x64]
    steps:
      - uses: actions/checkout@v4
      - run: yarn build
```

## Testing

Use the provided workflows to test your setup:

```bash
# Manual test via GitHub UI:
# Actions → Self-Hosted Runner Setup → Run workflow → Select "health-check"
```

## Security Checklist

- [ ] **Never use on public repositories**
- [ ] Run as non-root user
- [ ] Use runner groups for access control
- [ ] Keep runner software updated
- [ ] Monitor runner logs
- [ ] Use ephemeral runners for sensitive workloads

## Monitoring

The repository includes automated monitoring:

- **Weekly health checks**: `self-hosted-runner-health.yml` (Mondays 9 AM UTC)
- **Manual checks**: `self-hosted-runner-setup.yml` (on-demand)

## Common Issues

**Runner offline:**
```bash
sudo systemctl status actions.runner.*.service
sudo systemctl restart actions.runner.*.service
```

**Out of disk space:**
```bash
# Clean Docker
docker system prune -af --volumes

# Clean old builds
rm -rf _work/_tool/*
rm -rf _work/_temp/*
```

**Permission errors:**
```bash
sudo chown -R $USER:$USER /path/to/actions-runner
chmod +x run.sh config.sh
```

## Resources

- [Complete documentation](SELF_HOSTED_RUNNERS.md)
- [Best practices](WORKFLOWS_BEST_PRACTICES.md)
- [GitHub docs](https://docs.github.com/en/actions/hosting-your-own-runners)

## Need Help?

- Check logs: `journalctl -u actions.runner.*.service -f`
- Review runner status in GitHub UI
- See troubleshooting in [SELF_HOSTED_RUNNERS.md](SELF_HOSTED_RUNNERS.md)
