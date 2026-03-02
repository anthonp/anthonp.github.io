---
title: Browser History Forensics
date: 2026-03-01
excerpt: Reconstructing a redirect-to-download chain with limited telemetry, using browser artifacts when SSL inspection and endpoint visibility are sparse.
tags:
  - DFIR
  - Browser Artifacts
  - Chrome
  - MITRE ATT&CK: Initial Access
  - T1189 Drive-by Compromise
---

## Browser History Forensics

Having repeatable browser forensics workflows lets the operator reconstruct “how did this file get here?” when the only strong signal is a detection on disk and your network/endpoint visibility is incomplete.

**No real incident data is used in this example.**  
All domains, URLs, and filenames are fake and intentionally defanged.

### Scenario (example)

A detection flags `SuspiciousPDFConverter.exe` as malware delivery via PUP, and your job is to reconstruct the redirect-to-download chain and capture defensible evidence for containment and user coaching.

### MITRE tactic tag (what this investigation maps to)

This workflow most often supports **Initial Access**, commonly aligning with **T1189 (Drive-by Compromise)** when a user is redirected through web infrastructure into a download.

### Tools (pick what you have)

- PowerShell — Rapid artifact discovery
- (Optional) KAPE (or Velociraptor) — Reliable collection at scale
- DB Browser for SQLite — Fast ad-hoc queries (sqlite3 is reliable)
- (Optional) Hindsight — Chrome history parsing and timelines
- (Optional) Plaso/log2timeline — Cross-artifact timeline building

### Known Windows history artifact paths (nuances matter)

**Chrome (what we’ll analyze):**
`C:\Users\JaneDoe\AppData\Local\Google\Chrome\User Data\<Profile>\History`
(Profiles are commonly `Default`, `Profile 1`, `Profile 2`, plus `Guest Profile`/`System Profile` in some environments.)

**Edge (not diving in, but here’s the path):**
`C:\Users\JaneDoe\AppData\Local\Microsoft\Edge\User Data\<Profile>\History`

**Firefox (history lives in places.sqlite):**
`C:\Users\JaneDoe\AppData\Roaming\Mozilla\Firefox\Profiles\<Profile>\places.sqlite`


### Evidence handling note

Chrome’s `History` SQLite file may be locked while Chrome is running, so plan to **copy** it with an IR-safe collector (or from a shadow copy) rather than querying it in-place. Be sure to calculate SHA256 hash before and after copying it to an investigation workstation. Before proceeding, typically the suspicious file has been remediated on the host by the operator.

## 0) Quick artifact triage (before you pivot)

The goal here is to confirm origin indicators (MOTW), generate a stable pivot (SHA256), and do OSINT/sandbox validation before you invest time in deep reconstruction.

### PowerShell one-liners (remote-response friendly)

> # Check Mark-of-the-Web (Zone Identifier) on the suspicious executable (downloads commonly carry MOTW)
> Get-Content "C:\Users\JaneDoe\Downloads\SuspiciousPDFConverter.exe" -Stream Zone.Identifier -ErrorAction SilentlyContinue


> # Compute SHA256 for OSINT pivots (static + behavioral analytics)
> (Get-FileHash "C:\Users\JaneDoe\Downloads\SuspiciousPDFConverter.exe" -Algorithm SHA256).Hash

### JaneDoe quick task notes:

- Confirm MOTW origin zone
- Create hash for OSINT

### OSINT + analysis note

Use the **SHA256** to pivot in your approved intel sources and sandboxes to collect static traits (signing, strings, imports) and behavioral indicators (network beacons, child processes, dropped files) that can validate the alert and inform containment. Before proceeding, ensure that the suspicious file has been remediated.

## 1) Find the right Chrome History file (profiles + recency)

The first goal is to identify which Chrome profile was active near the time `SuspiciousPDFConverter.exe` landed by selecting the most recently written `History` databases across profiles.

### PowerShell

> # All users on the host: find newest Chrome History DBs across profiles
> Get-ChildItem "C:\Users\*\AppData\Local\Google\Chrome\User Data\*\History" -File -ErrorAction SilentlyContinue |
>   Sort-Object LastWriteTime -Descending |
>   Select-Object -First 12 FullName, LastWriteTime, Length

> # Single target user: fastest if you already know the user context
> Get-ChildItem "C:\Users\JaneDoe\AppData\Local\Google\Chrome\User Data\*\History" -File -ErrorAction SilentlyContinue |
>   Sort-Object LastWriteTime -Descending |
>   Select-Object -First 8 FullName, LastWriteTime, Length

### JaneDoe quick explanations

- Find latest History files
- Confirm active Chrome profile
- Prioritize latest investigation window

### Copy the chosen History file for analysis

Copying the `History` DB to a working path reduces lock issues and preserves original evidence paths for reporting. Ideally, this is done with response tools to remotely extract the file.

## 2) Anchor the timeline on the suspected download

The next goal is to locate the download record for `SuspiciousPDFConverter.exe` so we can pivot from a **download timestamp** into the last ~15–20 navigations that likely led to it.

### Example “defanged” target you’re hunting

- Filename on disk: `SuspiciousPDFConverter.exe`
- Example download URL (fake/defanged): `hxxps://cdn[.]pdf-suspicious-tools[.]example/download/SuspiciousPDFConverter.exe`
- Example referrer (fake/defanged): `hxxps://viewer[.]docs-preview[.]example/redirect?id=123`

## 3) Chrome History SQLite: table nuances

Chrome’s `History` file is SQLite, and your interpretation depends on which tables are present in your Chrome version and enterprise policy set.

**Notes:** Chrome schema can shift between versions, so confirm table/column existence before assuming field names or meanings.

### Tables you’ll commonly use in this workflow

- `downloads` — What was downloaded and when (fields vary by version)
- `downloads_url_chains` — Redirect chain for a download (when present)
- `visits` — Individual navigation events with timestamps and transition types
- `urls` — URL strings, titles, visit counters, last_visit_time
- `visit_source` — May hint whether a visit was local vs synced (when present)

## 4) SQL: find the download record (then pivot to “what happened before it”)

Your first query anchors on the suspected executable name so you can capture the download ID and its timestamp fields for timeline pivots.

> -- Find the most recent download matching the filename (columns may differ by Chrome version).
> -- Notes: confirm whether your schema uses current_path, target_path, tab_url, referrer, etc.
> SELECT
>   id,
>   current_path,
>   target_path,
>   tab_url,
>   referrer,
>   mime_type,
>   received_bytes,
>   total_bytes,
>   danger_type,
>   state,
>   datetime((start_time/1000000)-11644473600,'unixepoch') AS start_utc,
>   datetime((end_time/1000000)-11644473600,'unixepoch')   AS end_utc
> FROM downloads
> WHERE (current_path LIKE '%SuspiciousPDFConverter.exe%'
>        OR target_path LIKE '%SuspiciousPDFConverter.exe%')
> ORDER BY start_time DESC
> LIMIT 5;

### Follow-up: pull the redirect chain for that download (if available)

This query shows the chain of URLs Chrome recorded for the download (often the cleanest way to show redirect-to-download behavior).

> -- Replace :download_id with the downloads.id you identified above.
> SELECT
>   chain_index,
>   url
> FROM downloads_url_chains
> WHERE id = :download_id
> ORDER BY chain_index ASC;

**Notes:** If `downloads_url_chains` is missing or empty, you’ll rely more heavily on `visits` + `urls` around the download time and any referrer/tab_url fields in `downloads`.

## 5) SQL: last 15–20 URL visits leading up to the download

Once you have a download start timestamp, you can pull the last 15–20 visits at or before that moment to reconstruct the likely navigation chain.

> -- Pivot: last 20 visits at/before the most recent matching download start_time.
> -- Notes: validate whether start_time is present and in WebKit microseconds.
> WITH d AS (
>   SELECT start_time AS dl_time
>   FROM downloads
>   WHERE (current_path LIKE '%SuspiciousPDFConverter.exe%'
>          OR target_path LIKE '%SuspiciousPDFConverter.exe%')
>   ORDER BY start_time DESC
>   LIMIT 1
> )
> SELECT
>   datetime((v.visit_time/1000000)-11644473600,'unixepoch') AS visit_utc,
>   u.url,
>   u.title,
>   v.transition,
>   v.from_visit
> FROM visits v
> JOIN urls u ON v.url = u.id
> JOIN d ON 1=1
> WHERE v.visit_time <= d.dl_time
> ORDER BY v.visit_time DESC
> LIMIT 20;

**Notes:** `transition` is a bitmask that can indicate typed, link, redirect, auto-subframe, etc., and decoding it can help you argue whether the chain looks user-driven or script-driven.

### Show the first visit after the download started (sanity check)

This helps confirm whether the user continued browsing into additional lure pages immediately after initiating the download.

> WITH d AS (
>   SELECT start_time AS dl_time
>   FROM downloads
>   WHERE (current_path LIKE '%SuspiciousPDFConverter.exe%'
>          OR target_path LIKE '%SuspiciousPDFConverter.exe%')
>   ORDER BY start_time DESC
>   LIMIT 1
> )
> SELECT
>   datetime((v.visit_time/1000000)-11644473600,'unixepoch') AS visit_utc,
>   u.url,
>   u.title
> FROM visits v
> JOIN urls u ON v.url = u.id
> JOIN d ON 1=1
> WHERE v.visit_time > d.dl_time
> ORDER BY v.visit_time ASC
> LIMIT 10;

## 6) How to turn these artifacts into a defensible conclusion

Your conclusion should tie together (1) the download record, (2) the redirect chain (if available), and (3) the surrounding visit timeline to show how the user arrived at the executable.

**Notes:** Add screenshots of the query output and highlight the pivot points (download start time, referrer/tab_url, chain_index ordering, and the last 15–20 visits).

### Example narrative scaffold:

- The host generated a detection for `SuspiciousPDFConverter.exe`, prompting a browser-artifact review to determine acquisition path.
- The most recently written Chrome `History` database identified the active profile during the suspected time window.
- A matching record in the `downloads` table provided an anchor timestamp and contextual fields (e.g., `tab_url`, `referrer`) for pivots.
- The `downloads_url_chains` table (when present) revealed a stepwise redirect chain from lure infrastructure to the final CDN-hosted payload.
- The `visits` + `urls` pivot showed the final 15–20 navigations preceding the download, supporting a drive-by/redirect delivery hypothesis.


## Closing thoughts

The goal of browser history forensics is not to “prove intent,” but to produce a clear, evidence-backed chain of events that explains how a suspicious payload was retrieved when traditional telemetry is incomplete.
