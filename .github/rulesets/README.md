# Branch Protection Rulesets

This directory contains GitHub repository rulesets that define branch protection rules and access controls for the repository.

## Overview

Rulesets provide a comprehensive way to protect branches, tags, and specific file paths in the repository. They enforce quality standards, require reviews, and ensure proper testing before changes are merged.

## Rulesets

### 1. Main Branch Protection (`branch-protection.json`)

Protects the `main` and `master` branches with the following rules:

- **Deletion Prevention**: Prevents the branch from being deleted
- **Non-Fast-Forward Prevention**: Prevents force pushes that rewrite history
- **Required Linear History**: Enforces a linear commit history
- **Required Signatures**: Requires commits to be signed
- **Pull Request Requirements**:
  - At least 1 approving review required
  - Stale reviews are dismissed on new pushes
  - Code owner review required (when CODEOWNERS file exists)
  - All review threads must be resolved
- **Required Status Checks**:
  - Build must pass (`build` job)
  - Unit tests must pass (`Jest` job)
  - E2E tests must pass (`e2e` job)
  - Status checks must be up-to-date with the base branch

**Applies to**: `main`, `master` branches

### 2. Critical Paths Protection (`critical-paths-protection.json`)

Provides additional protection for critical configuration files and directories:

- **File Path Restrictions**: Restricts changes to:
  - Root package.json and yarn.lock
  - `.github/` directory (workflows, rulesets, etc.)
  - All package.json files in apps and libs
  - TypeScript configuration files
- **Enhanced Pull Request Requirements**:
  - At least 2 approving reviews required
  - Code owner review required
  - All review threads must be resolved

**Applies to**: `main`, `master`, and `release/*` branches

### 3. Release Branches Protection (`release-branches-protection.json`)

Protects release and hotfix branches with strict requirements:

- **Deletion Prevention**: Prevents branch deletion
- **Non-Fast-Forward Prevention**: Prevents force pushes
- **Pull Request Requirements**:
  - At least 2 approving reviews required
  - Code owner review required
  - All review threads must be resolved
- **Required Status Checks**:
  - Build must pass (`build` job)
  - Unit tests must pass (`Jest` job)
  - E2E tests must pass (`e2e` job)
  - All checks must be up-to-date

**Applies to**: `release/*`, `hotfix/*` branches

### 4. Tag Protection (`tag-protection.json`)

Protects version tags from unauthorized changes:

- **Deletion Prevention**: Prevents tag deletion
- **Non-Fast-Forward Prevention**: Prevents tag updates
- **Required Signatures**: Requires tags to be signed

**Applies to**: `v*`, `release-*` tags

## Bypass Actors

All rulesets include bypass permissions for repository administrators (actor_id: 5, RepositoryRole). This allows administrators to bypass rules in emergency situations.

## Enforcement

All rulesets are set to `"enforcement": "active"`, meaning they are actively enforced. To test changes without enforcement, you can temporarily set this to `"evaluate"` mode.

## How to Use

These rulesets are automatically applied by GitHub when:
1. They are present in the `.github/rulesets/` directory
2. The repository has rulesets enabled (requires GitHub Team or Enterprise)
3. The conditions match (branch names, tag names, etc.)

## Customization

To customize these rulesets:

1. Edit the JSON files in this directory
2. Modify the `conditions` to match different branches
3. Add or remove rules as needed
4. Adjust `required_approving_review_count` based on team size
5. Update `required_status_checks` to match your CI/CD workflow

## Best Practices

1. **Start with evaluate mode**: Test rulesets in `"evaluate"` mode before enforcing
2. **Review bypass actors**: Ensure only trusted users can bypass rules
3. **Keep status checks updated**: Ensure required status checks match your CI/CD pipeline
4. **Use CODEOWNERS**: Combine rulesets with a CODEOWNERS file for fine-grained control
5. **Document changes**: Update this README when modifying rulesets

## References

- [GitHub Repository Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Creating Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
- [Available Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
