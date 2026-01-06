# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, **do not** open a public GitHub issue. Instead, please email the maintainers privately.

We take security seriously and will investigate all reported vulnerabilities.

## Supported Versions

Only the latest release is currently supported with security updates. We recommend upgrading to the latest version as soon as possible.

## Security scanning

The project uses the following tools to detect vulnerabilities:

- **bandit** — Python code security scanner (checks for common unsafe patterns)
- **safety** — Python dependency vulnerability checker
- **npm audit** — JavaScript dependency vulnerability checker
- **Dependabot** — Automated dependency update PRs and security alerts

Scans run weekly and on all PRs to `main`/`master`.

## Dependencies

- Keep dependencies up to date by reviewing Dependabot PRs and merging them promptly.
- Monitor GitHub security advisories for your language ecosystems.
- For critical vulnerabilities, apply patches immediately and release a new version.

## Environment & secrets

- Never commit secrets, keys, or credentials to the repository.
- Use environment variables (injected at runtime) for sensitive configuration.
- Rotate credentials regularly in production.
- For local development, use a `.env` file and ensure it is in `.gitignore`.
