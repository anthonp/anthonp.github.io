---
title: Obsidian Threat Heat Map
date: 2024-12-09
excerpt: Using an Obsidian workflow to visualize incident relationships and identify recurring threat patterns.
tags:
  - Threat Modeling
  - Obsidian
  - SOC Workflow
---

## Obsidian Threat Heat Map

Having a repeatable way to track incidents is critical if you want to derive trends, improve triage, and predict risk over time. This workflow repurposes Obsidian graph features as a lightweight threat relationship map.

> **No real incident data is used in this example.**
> All data is fake and intentionally defanged.

![A beautiful heatmap in Obsidian](/images/obsidian-heatmap.png)

### 1) Defang your IOCs before anything else

Use CyberChef (or equivalent) to neutralize indicators such as IPs, domains, URLs, and email addresses before storing or sharing.

![Defanging fake IOCs](/images/cyberchef.png)

### 2) Bulk-tag indicators to speed up linking

After you prepare a list of IOCs in a text editor, wrap each IOC in Obsidian wiki-link syntax (`[[...]]`). This causes each IOC to become a linked object in the graph.

![Performing mass text manipulation](/images/textmanipulation.png)

### 3) Use a consistent incident template

A consistent template prevents missing fields and keeps your graph meaningful as your data set grows.

![Template incident report](/images/obsidiantemplate.png)

### 4) Build relationships across incidents

Load your tagged IOCs into multiple incidents. Shared artifacts automatically create graph relationships.

![Tagged and defanged IOCs loaded](/images/taggediocs.png)

As your case volume grows, linked artifacts make it easier to identify recurring campaigns, repeated targets, and hotspot clusters.

![Observing links in graph view](/images/furtherlinks.png)

### Why this helps

- Visualizes incident overlap over time.
- Highlights repeated attacker infrastructure.
- Surfaces frequent target groups/departments.
- Makes trend communication easier for leadership.

### Closing thoughts

This is not a replacement for full-scale threat intelligence platforms. It is a practical and low-friction workflow for teams already using Obsidian that want better visibility with minimal overhead.
