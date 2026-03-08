---
title: Email Header Analysis for Phishing Triage
date: 2026-03-08
excerpt: A practical raw-header workflow for separating spoofing, BEC, and broader phishing threats by validating SPF, DKIM, DMARC, and the surrounding .eml structure.
tags:
  - BEC
  - Header Analysis
  - MITRE ATT&CK: Initial Access
  - T1566 Phishing
  - T1672 Email Spoofing
  - T1656 Impersonation
---

## Email Header Analysis for Phishing Triage

A repeatable header-analysis workflow helps the investigator answer a simple question quickly: is this message a direct spoof, a business email compromise attempt, or another phishing pattern that only looks trustworthy on the surface?

**No real incident data is used in this example.**  
All domains, addresses, IPs, and URLs are fake and intentionally defanged.

### Scenario (example)

A user reports an “urgent payment update” email that appears to come from leadership, and your job is to decide whether the message is a spoofed impersonation, a BEC-style fraud attempt, or a more typical phishing lure.

### Investigation focus

This workflow is built to answer four things fast:

- What domain the sender **claims** to be
- What infrastructure actually **sent** the message
- Whether **SPF**, **DKIM**, and **DMARC** align with the visible sender
- Whether the overall pattern looks more like **BEC**, **spoofing**, or **other phishing**

### Tools

- Text editor that preserves raw line formatting
- Mail source export (`.eml`)
- Hash utility for evidence handling
- DNS lookup utility (optional)
- Offline parser or script (optional)

### Evidence handling note

Work from a copy of the original `.eml`, preserve raw bytes, and hash the file before deeper analysis. Avoid forwarding the message for review, because forwarding often strips or rewrites the exact header/body structure you need to preserve.

## 0) Quick triage (before you classify)

The first pass is about identity, alignment, and reply flow rather than content alone.

![Triage Decision Tree](/images/phishing-mermaid-diagram.png)

### Quick review targets

- `From:` — visible sender identity shown to the user
- `Return-Path:` / `smtp.mailfrom` — envelope sender used by SPF
- `Reply-To:` — where the conversation will actually go
- `Authentication-Results:` — recipient-side verdicts for SPF, DKIM, DMARC
- `Received:` — transit path, read **bottom-up**
- `Message-ID:` — hints at generating system or sending platform

### Decision notes

A message can be malicious even when SPF, DKIM, and DMARC all pass. That usually pushes the investigation toward **BEC**, a **compromised legitimate account**, or an **attacker-controlled lookalike domain** hypothesis rather than a simple spoof. When SPF, DMARC, and DKIM all pass, perform a WHOIS lookup on the domain to discover the registrar and when the domain was registered. A recently registered domain (< 1 year typically indicates a look-alike campaign that is more targeted).

## 1) Relationship map: what each control is actually checking

- **SPF** checks whether the sending host is allowed to send for the envelope sender domain.

- **DKIM** checks whether signed header/body content validates against the signer’s d= domain.

- **DMARC** checks whether the visible From: domain aligns with SPF and/or DKIM identifiers.

- DMARC pass is not a “safe” verdict; it only means the authenticated identifiers align with the displayed sender.

## 2) Fast patterns: BEC vs spoof vs other phishing

### BEC indicators:
- Financial or relationship-driven pretext: payment, payroll, gift cards, banking changes, urgent approvals
- Often low-volume and human-written (hands-on-keyboard)
- May use a real compromised mailbox, a thread hijack, or a lookalike domain
- Often includes a file invitation with little to no context
- SPF/DKIM/DMARC may all pass

### Spoof indicators:
- From: claims a trusted internal or partner domain
- Reply-To: points elsewhere
- SPF and/or DMARC fail against the claimed identity
- Message-ID and Received path do not match the brand being impersonated
- Domain is newly registered and/or resembles the context of the message body

### Other phishing indicators:
- Credential harvesting, attachment lures, HTML smuggling, or malware delivery
- Sender domain may be attacker-owned and fully authenticated
- Headers look “technically clean,” but the body, URLs, or attachment structure carry the risk

### Decision context:
The useful question is not “did auth pass,” but “what identity passed, and does it match the business story being told? Does it match the business use case? Has this sender communicated with the recipient previously? Is this a legitimate inquiry?”

## 3) Header Sample (note: simulated/fake data)

> Return-Path: <wire[.]instructions@secure-payments[.]example>
> Received: from mail[.]secure-payments[.]example (mail[.]secure-payments[.]example [203[.]0[.]113[.]24])
>         by mx1[.]recipient[.]example with ESMTPS id 12345ABCD
>         for <analyst@recipient[.]example>; Sat, 07 Mar 2026 13:14:29 +0000
> Received: from workstation7[.]secure-payments[.]example ([198[.]51[.]100[.]77])
>         by mail[.]secure-payments[.]example with ESMTP id 1234
>         Sat, 07 Mar 2026 13:14:22 +0000
> From: "Jane Example, CFO" <jane[.]example@recipient[.]example>
> To: analyst@recipient[.]example
> Reply-To: "AP Desk" <wire[.]instructions@secure-payments[.]example>
> Subject: RE: urgent payment update
> Date: Sat, 07 Mar 2026 08:14:22 -0500
> Message-ID: <20291234567.12345@mail[.]secure-payments[.]example>
> MIME-Version: 1.0
> Content-Type: multipart/alternative; boundary="b1_7f13"
> Authentication-Results: mx1[.]recipient[.]example;
>        spf=fail smtp[.]mailfrom=secure-payments[.]example;
>        dkim=none;
>        dmarc=fail header[.]from=recipient[.]example
> Received-SPF: fail (mx1[.]recipient[.]example: domain of secure-payments[.]example does not designate 203[.]0[.]113[.]24 as permitted sender)
> X-Originating-IP: [198[.]51[.]100[.]77]

### Why this fake header is useful
- From: claims recipient[.]example
- Reply-To: and Return-Path: point to secure-payments[.]example
- Message-ID also points to secure-payments[.]example
- SPF fails for the sending infrastructure
- DKIM is absent
- DMARC fails because the visible sender does not align

## 4) How to read the .eml in a text editor

The text editor view is where subtle mismatches usually become obvious.

### What to inspect at this point:
- Compare **From:**, **Reply-To:**, **Return-Path:**, and **Message-ID:** side by side
- Read **Received:** lines from the bottom up to reconstruct the path
- Review **Authentication-Results:** added by the recipient side, not anything inserted by the sender
- Compare the **Date:** header with **Received:** timestamps for odd delays or timezone mismatches
- MIME/body details worth checking
- **Content-Type:** tells you whether the message is plain text, HTML, multipart, calendar invite, or attachment-heavy
- **boundary=** markers show where each MIME part begins and ends
- **Content-Transfer-Encoding:** can hide links or text in base64 or quoted-printable
- **multipart/alternative** may contain a harmless-looking text part and a riskier HTML part
- Search the raw file for **href**, **src**, **filename**, **Content-Disposition:**, and **http**

A text editor often reveals the investigation pivot faster than a rendered mail client: the real reply path, the true authenticated identity, hidden HTML links, and MIME parts the user never saw on screen.

## 5) Nuanced features that help separate the threat type
Clues that favor spoofing
- Claimed internal sender, but no aligned auth
- No DKIM or broken DKIM
- Reply-To diverts to a separate domain
- Sending infrastructure does not fit the impersonated organization

Clues that favor BEC
- Message is short, urgent, and financially focused
- No obvious lure branding or malware attachment
- Sender may be legitimate and fully authenticated
- Thread subject, writing style, or timing looks “close enough” to prior business traffic

Clues that favor broader phishing
- HTML-only lure with credential link
- Attachment-first delivery (.html, .htm, archive, .svg, .eml, macro-bearing doc, disguised file)
- Domain is not impersonating the target exactly, but is close enough to fool a user
- SPF/DKIM/DMARC pass for an attacker-owned domain

### Caution

A technically valid message can still be malicious; authentication tells you whether a domain authorized the mail, not whether the business request is legitimate.

## 6) Putting the pieces together
Narrative scaffolding:

- Start with the visible sender in From:, then compare it to Reply-To:, Return-Path:, and Message-ID:.
- Validate whether SPF, DKIM, and DMARC align with the displayed sender rather than just passing in isolation.
- Reconstruct the transport path from the Received: chain and note whether the origin infrastructure fits the claimed identity.
- Review MIME structure and raw HTML for hidden links, alternate parts, and suspicious attachments.
- Classify the message by pattern: spoof when identity alignment breaks, BEC when business-pretext fraud survives authentication, and other phishing when the lure or delivery mechanism carries the malicious signal.

### Closing thoughts

Header analysis is less about finding one “smoking gun” than about reconciling identities: the sender the user saw, the sender the mail system authenticated, the infrastructure that actually transmitted the message, and the reply path the attacker wants the victim to follow.

Automated systems and solutions are key when dealing with organizational phishing email prevention and mitigation; it is impractical to place security personal on constant monitoring and mitigation of malicious emails where automated systems could reduce noise and only surface potential threats when manual response/mitigation is needed.

Hardening and Analytics Takeaways:
- Harden mail systems to drop unauthenticated email
- Analyze recipient phishing email counts to determine risk and correlate with email exposure/breach data
- Implement an engine/solution to remove confirmed campaigns from inboxes on the fly
- Foster and encourage a community of keeping business email separate from personal email usage
- Consider security controls aimed at prohibiting unsafe mail usage (personal email usage, personal application usage on business assets)
- Implement an analytics solution to identify, prevent, and mitigate phishing
- Consider security controls to prevent emails with specific inbound high-risk attachments
- Consider implementing policies and playbooks aimed at assessing third-party risks, communication protocols, outreach templates, and onboarding third-party security contacts in the case of a suspected BEC
- Consider implementing security outreach programs internally, and discourage use of placing emails and phone numbers publicly, and discourage over-providing information in "OOO" auto-reply notifications
- Ensure that there are automated systems in place to automatically detect account compromise via phishing, and implement systems designed to automatically contain an account to prevent spread of phishing campaigns
