# adversarypath

Source for **[adversarypath.com](https://adversarypath.com)** - field notes on incident response, detection engineering, and adversary emulation.

HTML, CSS, and vanilla JavaScript. No framework, no build step at deploy, no dependencies at runtime, no third-party requests.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Markup | Static HTML, committed as output | Nothing to compile, nothing to break |
| Styling | One hand-written stylesheet (~29 KB) | No utility framework, no purge step |
| Behaviour | ~9 KB of vanilla JS, one IIFE | Scroll-spy, role rotator, chart tooltips |
| Fonts | Instrument Sans + IBM Plex Mono, self-hosted `.woff2` | No Google Fonts request, no third-party origin |
| Hosting | GitHub Pages | Free, static, TLS via Let's Encrypt |
| DNS | Cloudflare | CAA, DNSSEC, null MX, DMARC `p=reject` |

## Structure

```
.
├── index.html                  # home: proof, experience, writing, certs, contact
├── about/index.html            # background and method
├── writing/
│   ├── index.html              # post archive
│   ├── browser-history-forensics/
│   ├── email-header-triage/
│   ├── ipod_classic_flash_mod_rebuild/
│   ├── lumma-stealer-incident-response/
│   ├── obsidian_threat_heat_map/
│   └── public_wifi/
├── assets/
│   ├── css/site.css
│   ├── js/site.js
│   ├── fonts/                  # self-hosted woff2 + OFL licences
│   └── img/                    # post figures and screenshots
├── 404.html
├── CNAME                       # adversarypath.com
├── robots.txt
├── sitemap.xml
├── rss.xml
└── .nojekyll                   # serve files verbatim, no Jekyll pass
```

## Local preview

No toolchain required. Serve the directory and open it:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Design constraints

The site pins `cookies=0` and `storage=0`:

- **No cookies.** None set, none read.
- **No client storage.** No `localStorage`, `sessionStorage`, `IndexedDB`.
- **No third-party requests.** No analytics, no CDN, no external fonts, no embedded media. Fonts are self-hosted.
- **No forms, no backend.** There is no server-side component. Contact is outbound links only.
- **Progressive enhancement.** The scroll-spy degrades to a `:has(:target)` CSS fallback. The role rotator honors `prefers-reduced-motion` and leaves the static markup as the final state.

Accessibility: skip link, per-page `h1`, labelled landmarks, visible focus rings, `aria-current` on navigation, light and dark themes, and a print stylesheet.

## Writing

| Post | Topic |
|---|---|
| [Email Header Analysis for Phishing Triage](https://adversarypath.com/writing/email-header-triage/) | SPF/DKIM/DMARC alignment, BEC vs spoof classification |
| [Lumma Stealer in Incident Response](https://adversarypath.com/writing/lumma-stealer-incident-response/) | ClickFix delivery, host and identity containment |
| [Browser History Forensics](https://adversarypath.com/writing/browser-history-forensics/) | Chrome SQLite artifacts, redirect-to-download reconstruction |
| [Public and Untrusted WiFi Networks](https://adversarypath.com/writing/public_wifi/) | Interception risk, device hardening |
| [iPod Classic Flash Mod Rebuild](https://adversarypath.com/writing/ipod_classic_flash_mod_rebuild/) | iFlash Solo + 3000 mAh battery |
| [Obsidian Threat Heat Map](https://adversarypath.com/writing/obsidian_threat_heat_map/) | Graph-based IOC relationship mapping |

## License

MIT - see [LICENSE](LICENSE). The prose and figures are © Anthony Picciano; the license covers the code.

## Contact

- [LinkedIn](https://www.linkedin.com/in/anthony-picciano/)
- [adversarypath.com](https://adversarypath.com)

The site has no forms and no backend. If you find a genuine issue with the site itself, open an issue here.
