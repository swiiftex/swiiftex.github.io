---
title: Broadcast Tool
category: software
date: 2021-06-01
kicker: Echo Arena broadcast tool
role: Co-developer, with SputnikKobra
when: "2021"
platforms: [Windows, OBS Studio]
summary: The scoreboard and team-input tool behind the Redshift Contender and Champion Series and Duckman LAN broadcasts.
cover: ../../assets/projects/broadcast-tool/screenshot.png
coverAlt: The VRSN Broadcast Tool window, showing team names, scores and round score buttons.
highlightsTitle: Features
highlights:
  - Team names and logo URLs read from the Google Sheets API
  - Automatic score input from Echo Arena's in-game API
  - OBS scene collection and asset installer that rewrites file paths, so the package installs anywhere
  - Stream Deck support through Bitfocus Companion
stack: [Python, Google Sheets API, Echo Arena API, OBS, Bitfocus Companion]
links:
  - label: Bitfocus Companion
    href: https://bitfocus.io/companion
tint: '#ffb020'
---

I built the Broadcast Tool in 2021. I'd looked around for scoreboard and team-input solutions for OBS, and nothing was stable and smooth enough for a live broadcast — so I partnered with SputnikKobra to make one for the first Redshift Contender Series event.

It was designed specifically for Echo Arena tournaments, and we refined it for a few years until it was very robust. Eventually it ran entirely on localhost Python scripts, because ports and GET requests can be tricky at unorthodox in-person venues.

It went on to power the [Duckman LAN](/duckman-lan-2022/) broadcasts, and we later built [Revolt](/revolt/) to make the same idea more universal and user-friendly.
