---
title: Duckman LAN 2023
category: events
date: 2023-04-07
kicker: Echo VR's final hurrah
when: Apr 2023
location: Southampton, UK
role: Broadcast producer
summary: A broadcast package rebuilt from the ground up — automated scores, team graphics, goal animations and replays, all driven from a Stream Deck.
cover: ../../assets/projects/duckman-lan-2023/vrlan-stage.jpg
coverAlt: The Duckman LAN 2023 stage under a lighting rig, flanked by giant Duckman cutouts.
gallery:
  - src: ../../assets/projects/duckman-lan-2023/holding-screen.jpg
    alt: The "Duckman 2 LAN — show starting in" holding screen from the broadcast package.
  - src: ../../assets/projects/duckman-lan-2023/scorebug.jpg
    alt: An Echo Arena match on stream with the scorebug overlay showing team names, score and clock.
  - src: ../../assets/projects/duckman-lan-2023/vrlan-players.jpg
    alt: Players in headsets on play mats in front of the stage screen.
  - src: ../../assets/projects/duckman-lan-2023/play-floor.jpg
    alt: Players competing in VR on the floor, with Duckman cutouts at the edge of the stage.
  - src: ../../assets/projects/duckman-lan-2023/vrlan-celebrate.jpg
    alt: Players celebrating with the crowd under purple stage lights.
  - src: ../../assets/projects/duckman-lan-2023/stage-wide.jpg
    alt: A team celebrating on stage with their arms in the air.
highlightsTitle: What was automated
highlights:
  - Round score input straight from Echo Arena's API
  - Team name and logo display from Google Sheets
  - Goal animations
  - Replay saving and transitions
stack: [OBS, Stream Deck, Bitfocus Companion, Python, Echo Arena API, Google Sheets API]
youtube:
  - id: 7ZGMp1kXAgc
    title: VR LAN 2023 — Echo Arena after-video
links:
  - label: VRLAN website
    href: https://vr-lan.com/event
tint: '#ffb020'
---

During the 2022 event I created and ran the broadcast package live for the VR Master League Twitch channel. But I spent a lot of that event on repetitive tasks — saving replays, changing scenes and team names, juggling too many applications — to the point where it made far more sense to combine them all into one tool.

So for Duckman LAN 2, I rebuilt the package from the ground up. Scenes now follow naming conventions much closer to standard practice in programming (an image for the scoreboard is `Image.Scoreboard.X`), which makes reusing assets and reorganising scenes in OBS far easier.

Previously I'd used the Echo Arena API mostly to trigger animations, alongside a modified version of my [Broadcast Tool](/broadcast-tool/) to save scores and select teams. This year I moved all of that into **Stream Deck**, using Bitfocus Companion and Python scripting — building my own API hub to read Echo Arena's score values and list team names from the Google Sheets API.
