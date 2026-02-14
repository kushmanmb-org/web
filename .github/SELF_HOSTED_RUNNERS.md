# Self-Hosted Runners Guide

This guide provides comprehensive instructions for setting up, configuring, and managing self-hosted GitHub Actions runners for the repository.

## Table of Contents

- [Overview](#overview)
- [When to Use Self-Hosted Runners](#when-to-use-self-hosted-runners)
- [Prerequisites](#prerequisites)
- [Setting Up Self-Hosted Runners](#setting-up-self-hosted-runners)
- [Runner Configuration](#runner-configuration)
- [Security Best Practices](#security-best-practices)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Scaling Runners](#scaling-runners)
- [Troubleshooting](#troubleshooting)

## Overview

Self-hosted runners give you more control over the hardware, operating system, and software tools used in your CI/CD workflows. They're particularly useful for:

- Resource-intensive builds
- Access to specific hardware or software
- Network restrictions requiring on-premises execution
- Cost optimization for high-volume workflows
- Custom security requirements

## When to Use Self-Hosted Runners

### Use Self-Hosted Runners For:

- **Long-running jobs** that exceed GitHub-hosted runner time limits
- **Large builds** requiring more CPU, memory, or disk space
- **Private network access** when workflows need internal resources
- **Custom software/hardware** not available on GitHub-hosted runners
- **Cost optimization** when running many workflows
- **GPU workloads** or specialized hardware requirements

### Use GitHub-Hosted Runners For:

- **Standard builds** with common requirements
- **Public repositories** to reduce maintenance burden
- **Occasional workflows** with low resource usage
- **Security-sensitive operations** benefiting from GitHub's isolation

## Prerequisites

Before setting up self-hosted runners, ensure you have:

- [ ] Repository admin access or organization owner permissions
- [ ] A dedicated machine (physical or virtual) for the runner
- [ ] Supported operating system (Linux, macOS, or Windows)
- [ ] Minimum hardware requirements:
  - 2 CPU cores (4+ recommended)
  - 4 GB RAM (8+ GB recommended for builds)
  - 20 GB free disk space (50+ GB recommended)
- [ ] Stable network connectivity
- [ ] Administrative access to install software

## Setting Up Self-Hosted Runners

### Step 1: Add a Self-Hosted Runner

#### For Repository-Level Runners:

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **Runners**
3. Click **New self-hosted runner**
4. Select the operating system and architecture
5. Follow the provided installation commands

#### For Organization-Level Runners:

1. Go to your organization on GitHub
2. Click **Settings** → **Actions** → **Runners**
3. Click **New runner** → **New self-hosted runner**
4. Select the operating system and architecture
5. Follow the provided installation commands

### Step 2: Download and Configure

#### Linux/macOS

```bash
# Create a folder for the runner
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure the runner
./config.sh --url https://github.com/YOUR-ORG/YOUR-REPO \
  --token YOUR-REGISTRATION-TOKEN

# Optional: Configure runner as a service
sudo ./svc.sh install
sudo ./svc.sh start
```

#### Windows

```powershell
# Create a folder under the drive root
mkdir actions-runner; cd actions-runner

# Download the latest runner package
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip -OutFile actions-runner-win-x64-2.311.0.zip

# Extract the installer
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.311.0.zip", "$PWD")

# Configure the runner
./config.cmd --url https://github.com/YOUR-ORG/YOUR-REPO --token YOUR-REGISTRATION-TOKEN

# Install and start the service
./svc.cmd install
./svc.cmd start
```

### Step 3: Install Dependencies

Install required software for your workflows:

```bash
# Example for Node.js project
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 24
nvm use 24

# Enable Corepack for Yarn
corepack enable

# Install Docker (if needed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add runner user to docker group
sudo usermod -aG docker $USER
```

## Runner Configuration

### Runner Labels

Labels help route jobs to specific runners. Configure labels during setup:

```bash
./config.sh --url https://github.com/YOUR-ORG/YOUR-REPO \
  --token YOUR-TOKEN \
  --labels linux,x64,gpu,high-memory
```

Common label patterns:
- OS: `linux`, `windows`, `macos`
- Architecture: `x64`, `arm64`
- Capabilities: `gpu`, `docker`, `kubernetes`
- Environment: `prod`, `staging`, `dev`
- Performance: `high-memory`, `high-cpu`

### Runner Groups (Organization Only)

Organize runners into groups for access control:

1. Go to **Organization Settings** → **Actions** → **Runner groups**
2. Create groups (e.g., `Production`, `Development`, `GPU`)
3. Add runners to appropriate groups
4. Configure repository access per group

### Environment Variables

Set environment variables for all jobs:

```bash
# Create .env file in runner directory
cat > .env << EOF
RUNNER_ALLOW_RUNASROOT=1
RUNNER_NAME=my-runner-01
CUSTOM_ENV_VAR=value
EOF

# Load in config
./config.sh --url ... --token ... --env .env
```

## Security Best Practices

### Critical Security Measures

1. **Never use self-hosted runners for public repositories**
   - Malicious code in forks can compromise runners
   - GitHub-hosted runners are isolated for public repos

2. **Run runners as unprivileged users**
   ```bash
   # Create dedicated user
   sudo useradd -m -s /bin/bash github-runner
   sudo su - github-runner
   # Continue setup as this user
   ```

3. **Restrict network access**
   - Use firewall rules to limit outbound connections
   - Whitelist only required domains
   - Consider using a proxy

4. **Keep runners updated**
   ```bash
   # Check for updates
   ./run.sh --check
   
   # The runner auto-updates, but verify manually:
   ./config.sh --check
   ```

5. **Use secrets securely**
   - Store secrets in GitHub Secrets, not in runner config
   - Limit secret access to specific runners via runner groups
   - Regularly rotate secrets

6. **Monitor runner activity**
   - Enable audit logs
   - Monitor for suspicious activity
   - Review job logs regularly

7. **Isolate runners**
   - Use containers or VMs for job execution
   - Don't share runners across trust boundaries
   - Consider ephemeral runners for sensitive operations

### Runner Isolation with Docker

Run jobs in containers for isolation:

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux]
    container:
      image: node:24
      options: --cpus 2 --memory 4g
    steps:
      - uses: actions/checkout@v4
      - run: yarn install
      - run: yarn build
```

### Ephemeral Runners

For maximum security, use ephemeral runners that are destroyed after each job:

```bash
# Start runner in ephemeral mode
./run.sh --once

# Or configure as service with auto-deregistration
./config.sh --url ... --token ... --ephemeral
```

## Monitoring and Maintenance

### Health Monitoring

Use the provided workflows to monitor runner health:

1. **Self-Hosted Runner Health Monitor** (`self-hosted-runner-health.yml`)
   - Scheduled weekly checks
   - Monitors disk space, memory, CPU
   - Alerts on issues

2. **Self-Hosted Runner Setup** (`self-hosted-runner-setup.yml`)
   - Manual health checks
   - Runner information display
   - On-demand diagnostics

### Maintenance Tasks

#### Weekly Tasks

- [ ] Check runner status in GitHub UI
- [ ] Review workflow run times
- [ ] Check disk space usage
- [ ] Review security logs

#### Monthly Tasks

- [ ] Update runner version
- [ ] Update dependencies (Node.js, Docker, etc.)
- [ ] Review and update runner labels
- [ ] Clean up old caches and artifacts

#### Quarterly Tasks

- [ ] Review security configurations
- [ ] Update OS and security patches
- [ ] Review runner group assignments
- [ ] Audit runner access logs

### Automated Cleanup

Add cleanup to workflows:

```yaml
jobs:
  cleanup:
    runs-on: [self-hosted, linux]
    steps:
      - name: Clean workspace
        run: |
          rm -rf _work/*
          docker system prune -af --volumes
```

Or run periodic cleanup:

```bash
# Crontab entry for nightly cleanup
0 2 * * * /home/github-runner/cleanup.sh

# cleanup.sh
#!/bin/bash
find /home/github-runner/_work -type f -mtime +7 -delete
docker system prune -af --filter "until=168h"
```

## Scaling Runners

### Horizontal Scaling

Add multiple runners for increased capacity:

```bash
# Runner 1
./config.sh --name runner-01 --labels linux,x64,pool-1
./svc.sh install runner-01
./svc.sh start runner-01

# Runner 2
./config.sh --name runner-02 --labels linux,x64,pool-1
./svc.sh install runner-02
./svc.sh start runner-02
```

### Auto-Scaling

Use auto-scaling solutions for dynamic capacity:

#### Using Kubernetes

- **Actions Runner Controller (ARC)**
  - https://github.com/actions/actions-runner-controller
  - Kubernetes-native auto-scaling

```bash
helm repo add actions-runner-controller https://actions-runner-controller.github.io/actions-runner-controller
helm install actions-runner-controller/actions-runner-controller \
  --namespace actions-runner-system \
  --create-namespace \
  --set authSecret.github_token=YOUR_GITHUB_TOKEN
```

#### Using Cloud Providers

- **AWS**: Use Auto Scaling Groups with custom AMIs
- **Azure**: Use Scale Sets with runner images
- **GCP**: Use Managed Instance Groups

### Load Balancing

Distribute work across runners:

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, pool-1]  # Multiple runners with same labels
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: yarn test --shard=${{ matrix.shard }}/4
```

## Troubleshooting

### Common Issues

#### Runner Not Connecting

```bash
# Check runner status
./run.sh --check

# View logs
journalctl -u actions.runner.*.service -f

# Check network connectivity
curl -I https://api.github.com
```

#### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -af --volumes

# Clean old workflows
rm -rf _work/_tool/*
rm -rf _work/_temp/*
```

#### Permission Issues

```bash
# Fix ownership
sudo chown -R github-runner:github-runner /home/github-runner/actions-runner

# Fix permissions
chmod +x run.sh config.sh
```

#### Runner Service Won't Start

```bash
# Check service status
sudo systemctl status actions.runner.*.service

# View service logs
sudo journalctl -u actions.runner.*.service -n 100

# Restart service
sudo systemctl restart actions.runner.*.service
```

### Debug Mode

Enable debug logging:

```bash
# Set environment variable
export ACTIONS_RUNNER_DEBUG=true
export ACTIONS_STEP_DEBUG=true

# Or in workflow
env:
  ACTIONS_RUNNER_DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

### Getting Help

- GitHub Actions documentation: https://docs.github.com/en/actions
- Runner repository: https://github.com/actions/runner
- Community forum: https://github.community/c/code-to-cloud/52

## Workflow Examples

### Using Self-Hosted Runners

```yaml
name: Build on Self-Hosted

on: [push, pull_request]

jobs:
  build:
    # Use self-hosted runner
    runs-on: [self-hosted, linux, x64]
    
    steps:
      - uses: actions/checkout@v4
      - run: yarn install
      - run: yarn build
```

### Mixed Runners

```yaml
jobs:
  # Fast check on GitHub-hosted
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn lint

  # Heavy build on self-hosted
  build:
    runs-on: [self-hosted, linux, high-cpu]
    steps:
      - uses: actions/checkout@v4
      - run: yarn build

  # Tests on self-hosted with GPU
  test-gpu:
    runs-on: [self-hosted, linux, gpu]
    steps:
      - uses: actions/checkout@v4
      - run: yarn test:gpu
```

### Fallback to GitHub-Hosted

```yaml
jobs:
  build:
    # Try self-hosted, fallback to GitHub-hosted
    runs-on: ${{ contains(github.event.pull_request.labels.*.name, 'use-self-hosted') && 'self-hosted' || 'ubuntu-latest' }}
    steps:
      - uses: actions/checkout@v4
      - run: yarn build
```

## Conclusion

Self-hosted runners provide flexibility and control but require careful setup and maintenance. Follow this guide to ensure your runners are secure, reliable, and efficient.

For questions or issues, refer to the [GitHub Actions documentation](https://docs.github.com/en/actions) or contact your repository administrators.
