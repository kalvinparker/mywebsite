# mywebsite

This repository contains a small personal website for Kalvin Parker. The site was rebuilt using the `zirafa/simple-website-template` layout, with the original content merged into the template.

Local files of interest:
- `index.html` — site entry, uses local assets in `assets/`.
- `assets/style.css` — local CSS adapted from the template.
- `assets/script.js` — fragment navigation script.
- `assets/logo.svg`, `assets/background.svg` — local placeholder images.
- `scripts/validate_assets.ps1` — checks local asset references.

To view locally, open `index.html` in your browser or run:

```powershell
Start-Process index.html
```

Credits: template based on https://github.com/zirafa/simple-website-template
# mywebsite — personal project site

This folder contains a minimal personal website. The `index.html` is automatically populated with your public GitHub repositories by `scripts/update_projects.ps1`.

Local usage
-----------

- Run the update script from PowerShell in the `mywebsite` folder:

```powershell
Set-Location mywebsite
.\scripts\update_projects.ps1
```

- Open `index.html` in your browser to preview the site.

GitHub Actions
--------------

A scheduled GitHub Action (`.github/workflows/update-projects.yml`) runs daily and proposes a pull request with updates to `index.html` using the repository's `GITHUB_TOKEN`.

Profile image
-------------

Place a `profile.jpg` or `profile.png` file in `mywebsite/assets/`. The site will use the local image if present and otherwise fall back to your GitHub avatar.

Security
--------

The update script queries the public GitHub API and does not require authentication for public repositories. If you change it to use authenticated endpoints, keep tokens secret.