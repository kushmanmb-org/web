# GitHub Actions Workflows

This directory contains all GitHub Actions workflows for the repository. Each workflow is designed with best practices including proper permissions, timeouts, and concurrency control.

## Core Workflows

### CI/CD Workflows

#### `node.js.yml` - Node.js CI
**Triggers:** Push and Pull Requests to master  
**Purpose:** Builds and lints the codebase  
**Runner:** GitHub-hosted (ubuntu-latest)  
**Timeout:** 30 minutes

Runs on every push and PR to ensure code quality through linting and building.

#### `main.yml` - Unit Tests
**Triggers:** Push and Pull Requests to master  
**Purpose:** Runs Jest unit tests  
**Runner:** GitHub-hosted (ubuntu-latest)  
**Timeout:** 20 minutes

Executes the test suite to validate code changes.

#### `e2e-tests.yml` - E2E Tests
**Triggers:** Push and Pull Requests to master  
**Purpose:** Runs end-to-end tests with Playwright  
**Runner:** GitHub-hosted (ubuntu-latest)  
**Timeout:** 60 minutes

Comprehensive E2E testing including:
- MetaMask extension preparation
- Foundry installation for smart contract testing
- Playwright browser installation
- Full application build and test

### Quality & Security Workflows

#### `bearer.yml` - Bearer Security Scanning
**Triggers:** Push, Pull Requests, and Weekly Schedule (Thursday 4:41 AM)  
**Purpose:** Scans code for security vulnerabilities  
**Runner:** GitHub-hosted (ubuntu-latest)  
**Timeout:** 15 minutes  
**Permissions:** `contents: read`, `security-events: write`, `actions: read`

Uses Bearer CLI to scan for security issues and uploads results to GitHub Security.

#### `file-size-checker.yml` - File Size Checker
**Triggers:** Pull Request opened or synchronized  
**Purpose:** Validates file sizes to prevent large files in git  
**Runner:** GitHub-hosted (ubuntu-latest)  
**Timeout:** 10 minutes  
**Permissions:** `contents: read`, `pull-requests: write`, `statuses: write`

Checks for:
- Files over 40MB (blocks merge)
- Files over 10MB (warns)

### Maintenance Workflows

#### `update-algolia.yml` - Update Algolia Search
**Triggers:** Manual dispatch and Weekday Schedule (8:05 AM)  
**Purpose:** Updates Algolia search indices  
**Runner:** GitHub-hosted (ubuntu-latest)  
**Timeout:** 20 minutes

Keeps search functionality up to date with latest content.

## Self-Hosted Runner Workflows

### `self-hosted-runner-setup.yml` - Self-Hosted Runner Setup
**Triggers:** Manual dispatch  
**Purpose:** Manages and checks self-hosted runners  
**Runner:** GitHub-hosted (ubuntu-latest)  
**Timeout:** 10 minutes

Provides tools for:
- Health checks
- Runner information display
- Runner list viewing

**Usage:**
```bash
# Trigger via GitHub UI: Actions → Self-Hosted Runner Setup → Run workflow
# Select action: health-check, list-runners, or runner-info
```

### `self-hosted-runner-health.yml` - Self-Hosted Runner Health Monitor
**Triggers:** Manual dispatch and Weekly Schedule (Monday 9 AM)  
**Purpose:** Automated health monitoring for runners  
**Runner:** GitHub-hosted (ubuntu-latest)  
**Timeout:** 5-10 minutes

Monitors:
- Disk space usage
- Memory availability
- CPU resources
- Docker status
- Runner processes

**Note:** Self-hosted jobs are commented out. Uncomment when self-hosted runners are configured.

### `self-hosted-example.yml` - Build with Self-Hosted (Example)
**Triggers:** Manual dispatch  
**Purpose:** Demonstrates self-hosted runner usage patterns  
**Runner:** Configurable (GitHub-hosted by default)  
**Timeout:** 10-30 minutes

Shows:
- Dynamic runner selection
- Mixed runner strategies (GitHub-hosted for quick checks, self-hosted for heavy builds)
- GPU job examples
- Integration test patterns

**Usage:**
```bash
# Trigger via GitHub UI: Actions → Build with Self-Hosted (Example) → Run workflow
# Check "Use self-hosted runners" to test with self-hosted runners
```

## Workflow Features

### Best Practices Implemented

All workflows include:

1. **Explicit Permissions**: Minimal permissions following principle of least privilege
2. **Concurrency Control**: Prevents multiple simultaneous runs on same branch
3. **Timeouts**: Prevents runaway jobs from consuming resources
4. **Latest Actions**: Uses latest stable versions (checkout@v4, setup-node@v4)
5. **Caching**: Optimized dependency caching with Yarn

### Composite Actions

#### `setup-node-yarn`
**Location:** `.github/actions/setup-node-yarn/action.yml`  
**Purpose:** Reusable Node.js and Yarn setup

Features:
- Node.js installation with specified version
- Yarn caching
- Corepack enablement
- Dependency installation

Usage:
```yaml
- name: Setup Node.js with Yarn
  uses: ./.github/actions/setup-node-yarn
  with:
    node-version: 24.x
```

## Adding New Workflows

When creating new workflows, follow these guidelines:

1. **Use the template structure:**
   ```yaml
   name: Workflow Name
   
   on:
     push:
       branches: [master]
   
   permissions:
     contents: read
   
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true
   
   jobs:
     job-name:
       runs-on: ubuntu-latest
       timeout-minutes: 30
       steps:
         - uses: actions/checkout@v4
         - name: Step name
           run: command
   ```

2. **Choose appropriate runners:**
   - GitHub-hosted: For standard builds, public repos, occasional jobs
   - Self-hosted: For resource-intensive, long-running, or specialized jobs

3. **Set reasonable timeouts:**
   - Lint/Type checks: 10 minutes
   - Unit tests: 20 minutes
   - Builds: 30 minutes
   - E2E tests: 60 minutes

4. **Use proper permissions:**
   - Start with `contents: read`
   - Add only required permissions

5. **Document the workflow:**
   - Add clear name and comments
   - Update this README
   - Update WORKFLOWS_BEST_PRACTICES.md if introducing new patterns

## Documentation

For detailed information, see:

- [WORKFLOWS_BEST_PRACTICES.md](../WORKFLOWS_BEST_PRACTICES.md) - Comprehensive best practices guide
- [SELF_HOSTED_RUNNERS.md](../SELF_HOSTED_RUNNERS.md) - Self-hosted runner setup and management
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Workflow Status

Check workflow status:
- **GitHub UI**: Actions tab in repository
- **Badge**: Add to README:
  ```markdown
  ![CI](https://github.com/YOUR-ORG/YOUR-REPO/workflows/Node.js%20CI/badge.svg)
  ```

## Troubleshooting

### Common Issues

**Workflow not triggering:**
- Check branch names in trigger configuration
- Verify file paths don't have syntax errors
- Check repository settings for Actions enablement

**Job timeouts:**
- Review timeout values
- Check for hanging processes
- Consider breaking into smaller jobs

**Permission errors:**
- Review required permissions in workflow
- Check repository/organization settings
- Verify token scopes for external actions

**Self-hosted runner not found:**
- Verify runner is online and connected
- Check runner labels match workflow configuration
- Review runner group access for repository

### Getting Help

- Review workflow run logs in GitHub UI
- Check [GitHub Community Forums](https://github.community/)
- See [GitHub Actions Documentation](https://docs.github.com/en/actions)
- For self-hosted runner issues, see [SELF_HOSTED_RUNNERS.md](../SELF_HOSTED_RUNNERS.md)
