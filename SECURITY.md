# Security Policy

## Reporting Security Issues

The Base team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing security@base.org. You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

We recommend always using the latest version of the Base Web codebase.

## Security Best Practices

When contributing to or using Base Web, please follow these security best practices:

### For Contributors

- **Never commit secrets**: Do not commit API keys, passwords, private keys, or other sensitive information to the repository.
- **Review dependencies**: Be cautious when adding new dependencies. Check for known vulnerabilities using tools like `npm audit` or `yarn audit`.
- **Validate input**: Always validate and sanitize user input to prevent injection attacks.
- **Follow secure coding practices**: Use parameterized queries, avoid eval(), and follow OWASP guidelines.
- **Keep dependencies updated**: Regularly update dependencies to patch known vulnerabilities.

### For Users

- **Use HTTPS**: Always access Base Web applications over HTTPS.
- **Keep software updated**: Use the latest version of the Base Web applications.
- **Protect your keys**: Never share your private keys or seed phrases with anyone.
- **Verify contracts**: Always verify smart contract addresses before interacting with them.
- **Use hardware wallets**: When possible, use hardware wallets for additional security.

## Bug Bounty Program

Base has a bug bounty program for security researchers. For more information about our bug bounty program and eligibility, please visit [base.org/bug-bounty](https://base.org/bug-bounty) or contact security@base.org.

## Security Audits

Base undergoes regular security audits. Audit reports are available in the [BLOCKCHAIN_AUDIT_REPORT.md](BLOCKCHAIN_AUDIT_REPORT.md) file.

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions.
2. Audit code to find any similar problems.
3. Prepare fixes for all releases still under maintenance.
4. Release patches as soon as possible.

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue to discuss.

## Contact

For any security-related questions or concerns, please contact:

- Email: security@base.org
- Discord: [Base Discord #security](https://base.org/discord)

## Additional Resources

- [Base Documentation](https://docs.base.org/)
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Web3 Security Best Practices](https://ethereum.org/en/developers/docs/security/)
