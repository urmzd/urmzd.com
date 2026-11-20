# Project documentation

This directory is the account site at [docs.urmzd.com](https://docs.urmzd.com/), which helps readers find a project guide. The [Documentation site workflow](../.github/workflows/docs-site.yml) publishes `public/` (the index, 404, styles and shared brand assets) together with each project guide, built from the `main` branch of its own repository.

| To update | Change the source in | Published address |
| --- | --- | --- |
| Agent SDK guide | [urmzd/saige](https://github.com/urmzd/saige) | [Saige](https://docs.urmzd.com/saige/) |
| Agent orchestration guide | [urmzd/orchagent](https://github.com/urmzd/orchagent) | [Orchagent](https://docs.urmzd.com/orchagent/) |
| Workspace guide | [urmzd/humagen](https://github.com/urmzd/humagen) | [Humagen](https://docs.urmzd.com/humagen/) |

## Change the landing page

Edit `public/index.html`, `public/style.css` or `public/404.html`. From the repository root, use Python 3 to check the links and preview the account site locally.

```sh
python3 docs-site/scripts/check_site.py
python3 docs-site/scripts/serve.py --directory docs-site/public
```

Open [the local preview](http://127.0.0.1:8000/). Check the three guide links and try a missing URL to verify its link back to the index. The local server serves the account site's files. To preview the full site with all three guides, build it first:

```sh
python3 -m pip install zensical==0.1.2
docs-site/scripts/build_site.sh docs-site/_site
python3 docs-site/scripts/serve.py --directory docs-site/_site
```

Open a pull request for the landing page change. The workflow checks the HTML on pull requests and publishes `docs-site/public/` and the guides through the `github-pages` environment on `main`. Changes outside `docs-site/` do not run it.

## Shared appearance

The index uses the logo, Elza Text and neutral surfaces from [the portfolio’s project directory](https://urmzd.com/projects/). Theme selection starts with the system setting. The header control saves an explicit light or dark choice for the account index and its 404 page.

Books can load `/brand/zensical.css`, `/brand/logo-mark.svg` and `/brand/favicon.svg` from this account site. The stylesheet imports `/brand/fonts.css`, which references the portfolio’s Adobe Fonts kit and two local IBM Plex Mono weights. Publish compatible changes to these paths before deploying a book that uses them. See the [asset credits and licenses](public/brand/CREDITS.txt).

## Preview a guide with the shared brand

Build the guide in its product repository. Keep a checkout of [urmzd.com](https://github.com/urmzd/urmzd.com) beside that repository. From the product root, mount its generated `site/` and the account’s brand assets under the same paths that Pages serves.

```sh
project=saige  # or orchagent or humagen
preview_dir=$(mktemp -d)
ln -s "$PWD/site" "$preview_dir/$project"
ln -s "$PWD/../urmzd.com/docs-site/public/brand" "$preview_dir/brand"
python3 -m http.server 8000 --bind 127.0.0.1 --directory "$preview_dir"
```

For `project=saige`, open [the local Saige guide](http://127.0.0.1:8000/saige/). Use `/orchagent/` or `/humagen/` for the other guides. Stop with Ctrl+C. The temporary directory contains only links to the guide and shared assets.

## Publish a project guide

Change the Markdown and `zensical.toml` in the product repository and merge to `main`. The product repository checks the build on pull requests but does not deploy. This repository's workflow rebuilds every guide on its own pushes, on manual runs and every 30 minutes; the scheduled run deploys only when a book's `main` differs from the commit recorded in [`versions.json`](https://docs.urmzd.com/versions.json). Run the Documentation workflow manually to publish a guide sooner. To roll back a guide, revert its source change there.

## How URLs resolve

`docs.urmzd.com` is the Pages custom domain of the `urmzd/urmzd.com` repository, which otherwise deploys `urmzd.com` to S3. The docs subdomain has a Route 53 CNAME to `urmzd.github.io` managed in `urmzd/infra`. Every guide is a directory of this one Pages artifact, so the product repositories need no Pages site of their own. Each book's `site_url` in `zensical.toml` must match its published address above.
