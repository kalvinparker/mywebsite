# Security Policy

## Supported Versions

Security support depends on the project's branch or release strategy. Repository maintainers should keep their project's dependencies and CI/CD configurations up to date.

| Version | Supported |
| ------- | --------- |
| `main` (or `master`) branch | :white_check_mark: |
| Releases (Tags) | :white_check_mark: |
| Older commits | :x: |

Users are responsible for pulling the latest changes and rebuilding any artifacts to receive security updates.

## Reporting a Vulnerability

We take security vulnerabilities seriously and prefer coordinated disclosure. Please do not file security reports as public issues.

### Preferred Reporting Methods

1. Use GitHub's private vulnerability reporting feature (the "Security" tab) when available.
2. Contact the maintainer directly through GitHub.

### What to Expect

1. Acknowledge receipt within 72 hours.
2. Provide an initial assessment of impact and validity.
3. Work with you on a fix and disclosure timeline.

## Security Scanning

This repository uses automated security scanning tools including:
- Dependabot for dependency updates
- GitHub Code Scanning
- SAST and container image scanning
- SonarCloud for code quality and security analysis

Please review the GitHub Actions workflows in `.github/workflows/` for more details.
