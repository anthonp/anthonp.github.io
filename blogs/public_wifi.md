---
title: Public and Untrusted WiFi Networks
date: 2025-04-08
excerpt: A practical breakdown of why public WiFi still carries risk even with HTTPS, and how to reduce exposure.
tags:
  - Network Security
  - Risk Management
  - Privacy
---

## Public and Untrusted WiFi Networks

Public WiFi is convenient, but convenience often means reduced trust. Even with HTTPS everywhere, there are still privacy, interception, and misconfiguration risks that can expose users and organizations.

![Public WiFi warning visual](/images/disclaimer.png)

### Common risks on untrusted networks

- **Evil twin access points:** attacker-controlled hotspots that mimic legitimate SSIDs.
- **Traffic interception attempts:** DNS manipulation, captive portal abuse, and downgrade attempts.
- **Device exposure:** accidental sharing services and stale local trust settings.
- **Session hijacking opportunities:** especially with weakly protected web sessions.

### Practical hardening steps (iOS and Android)

1. **Prefer cellular data** for sensitive sessions.
2. **Use a trusted VPN** when WiFi is unavoidable.
3. **Disable auto-join** for unknown or open networks.
4. **Use randomized/private MAC addresses** on every network.
5. **Enable private DNS / encrypted DNS** where possible.
6. **Keep OS and apps updated** to reduce exploitability.
7. **Restrict app permissions** to minimum required access.
8. **Avoid high-risk actions** (banking, corporate admin portals) on public WiFi.
9. **Use MFA** for all critical accounts.
10. **Turn off nearby sharing services** when not needed.

### Defensive operating habits

- Verify the hotspot name with staff before connecting.
- Treat captive portals as untrusted input.
- Log out after completing sessions.
- Restart your device after disconnecting from risky networks.

### Disclaimer

This material is educational and informational only. It is not legal advice and does not guarantee security outcomes. Always align controls with your organization’s policies and legal obligations.

### References

- https://www.fox5vegas.com/2024/08/08/las-vegas-police-issues-cyber-advisory-with-cybersecurity-hacker-conventions-town/
- https://en.wikipedia.org/wiki/Kazakhstan_man-in-the-middle_attack
