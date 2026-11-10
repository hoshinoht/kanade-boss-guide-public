# Kanade Boss Guide

A static MapleSEA boss reference generated from the curated guide data and media in the [Kanade bot project](https://github.com/hoshinoht/kanade-bot).

## Build and preview

Run from the Kanade bot checkout with Bun 1.4.4. This snapshot was generated from [Kanade bot revision `f9e1893`](https://github.com/hoshinoht/kanade-bot/tree/f9e189383bb017c8ba0ab1f019b151b558d2740b). Extract [the exporter source](exporter-source.zip) at the root of that checkout and use a new output directory each time.

```sh
bun --no-env-file scripts/boss_guide/build.ts /tmp/kanade-boss-guide
python3 -m http.server 4175 --bind 127.0.0.1 --directory /tmp/kanade-boss-guide
```

The exporter reads the boss catalog and knowledge YAML and copies the matching PNGs and processed MP4s from the curated art directories. The output contains pre-rendered HTML, a shared stylesheet, and local media. Update the guides and artwork in the bot checkout, then rebuild.

## GitHub Pages

Publish the generated files from the root of [kanade-boss-guide-public](https://github.com/hoshinoht/kanade-boss-guide-public). In Settings → Pages, choose **Deploy from a branch** and select that branch and `/(root)`. Keep `.nojekyll` with the files. For `bosses.hoshinoht.dev`, set the custom domain in Pages and point the Cloudflare DNS-only CNAME for `bosses` at `hoshinoht.github.io`. [GitHub Pages setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

The exporter follows [Kanade's GPL-3.0-only license](LICENSE). Source credits appear on each boss page. Game artwork remains subject to its own rights.
