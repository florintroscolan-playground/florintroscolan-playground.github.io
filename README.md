# Florin Troscolan, portfolio

Source of [florintroscolan-playground.github.io](https://florintroscolan-playground.github.io/), the portfolio of Florin Troscolan, product designer. Seven case studies, a page on process and a set of shorter projects.

The site is plain HTML, CSS and JavaScript. Nothing is compiled or bundled: what is in this repository is what GitHub Pages serves.

## Structure

```
.
├── index.html                  Home: hero, numbers, selected work
├── financial-education.html    Case studies (seven pages, same template)
├── …
├── process.html                How I work
├── small-bites.html            Shorter projects and explorations
├── 404.html
├── assets/
│   ├── css/site.css            One stylesheet, sectioned, with a table of contents at the top
│   ├── js/site.js              Progressive enhancements, sectioned, no dependencies
│   ├── fonts/                  Licensed heading font (see below)
│   ├── icons/                  Favicons, touch icon, logo
│   ├── img/<page>/             Images grouped by page, each in 800, 1400 and 2000 px widths
│   └── Florin-Troscolan-Resume.pdf
├── site.webmanifest, robots.txt
└── NOTICE
```

## Technical choices

- **No framework, no build step.** Pages are static HTML. The JavaScript adds behaviour on top (menus, scroll reveal, count-up numbers, the table of contents, the lightbox, copy-to-clipboard), and every page works without it.
- **CSS** uses custom properties for tokens and is organised in sections: tokens, base, typography, layout, components, utilities, motion. Components use a short prefix (`.case-*`, `.mega-*`, `.timeline-*`), states use `.is-*`.
- **Typography:** PP Neue Montreal Medium for headings, Schibsted Grotesk for text and IBM Plex Mono for labels.
- **Images** are WebP with `srcset` and `sizes`, so phones load the 800 px versions. Every image has `width` and `height` set, and only the first image on a page loads eagerly.

## Accessibility

- Semantic landmarks, one `h1` per page and a skip link.
- Visible focus states, and full keyboard support for the navigation and the work menu (arrow keys, Tab, Escape).
- Alt text on every image, and colour contrast that meets WCAG AA.
- With `prefers-reduced-motion`, all animation stops and content is shown at once.
- No single word is left alone on the last line of a text block (`text-wrap` plus a no-break space between the last two words).

## SEO

The site is intentionally not indexed: it is shared only in job applications. Every page, including 404, carries `<meta name="robots" content="noindex, nofollow">`. `robots.txt` still allows crawling so search engines can read that tag, and there is no sitemap or structured data. Canonical and Open Graph tags stay, so links pasted into messages still get a preview.

## Analytics

Umami Cloud (EU), cookieless, so there is no consent banner. No other trackers, and no personal data in events. The script only counts on the live domain (`data-domains`), and the site works the same if it is blocked.

Events: `Resume download`, `Email click`, `Email copy`, `LinkedIn click`, `Dribbble click`, `Open case study`, `Open Small Bites`, `Open How I work` (click events set with `data-umami-event` attributes, with a `location` and, for case studies, a `project` property) `Read depth` (50% and 90% on case pages, Small Bites and How I work), `Scroll depth` (home, 25/50/75/100%, with `page` and `depth`) and `Glance seen` (case pages, once 60% of the "At a glance" row has been visible for one second, with `page`). The last three are sent from `site.js`, once per page view.

**Owner opt-out.** Open any page with `?owner=1` to stop counting your own visits on that device: it sets `localStorage["umami.disabled"] = "1"`, which the Umami script honours, and shows a short "Analytics off on this device" note once. `?owner=0` removes it. Do it once per browser (and per in-app browser).

## Checks

```
npm install
npm run lint      # stylelint (stylelint-config-standard), eslint (recommended), Nu HTML Checker
```

`no-descending-specificity` is turned off in the stylelint config. It reports selectors from unrelated components that never style the same element.

## Rights

© Florin Troscolan, all rights reserved. Content and images may not be reused. The code is public so the site can be served and read. It is not open source. See `NOTICE`.

The heading font, PP Neue Montreal, is licensed from Pangram Pangram Foundry for use on this website only. The font file in `assets/fonts/` must not be copied, reused or redistributed.

Client work is shown with client names and brand marks removed.
