---
title: DesktopSplitter
category: software
date: 2026-10-04
kicker: Windows driver · C++
role: Solo developer
when: "2026"
status: In development
platforms: [Windows]
summary: Split one physical monitor into 2–4 virtual monitors that Windows treats as real displays.
cover: ../../assets/projects/desktopsplitter/app.png
coverAlt: The DesktopSplitter window, showing a 5120×1440 240 Hz monitor and layout options including side by side, columns and a 16:9 centre split.
highlightsTitle: Under the hood
highlights:
  - IddCx (UMDF) virtual display driver — no test-signing required
  - Each virtual monitor carries its own EDID serial, so segments never swap places
  - Direct3D / DXGI compositor that draws the virtual monitors onto the real one, measured at 240 Hz
  - A "16:9 Center" layout for gaming on ultrawides
  - "Experimental: hide the physical monitor from Windows, with a 10-second keep/revert safety countdown"
stack: [C++, IddCx / UMDF, Direct3D 11, DXGI, C#, WPF]
links:
  - label: Source on GitHub
    href: https://github.com/swiiftex/DesktopSplitter
featured: true
tint: '#a970ff'
---

DesktopSplitter lets Windows treat parts of one monitor as separate displays — useful for window snapping, full-screen apps, or streaming one region of an ultrawide.

It works at driver level. An Indirect Display (IddCx) driver creates virtual monitors, so Windows, games and capture software all see them as real displays. A Direct3D compositor then draws those virtual monitors back onto the physical monitor at a high refresh rate.

It's still in development — the installer isn't published yet.
