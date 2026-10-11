---
title: Source2All Sensitivity Converter
category: software
date: 2026-06-29
kicker: Windows app · C# / WPF
role: Solo developer
when: "2026"
status: Free download
platforms: [Windows]
summary: Set your sensitivity once and apply it everywhere — 170+ games, auto-detected across Steam, Epic and GOG, written straight into their configs.
cover: ../../assets/projects/source2all-sensitivity-converter/auto-apply.png
coverAlt: The Source2All Auto-apply tab, listing games found across Steam and Epic with each game's converted sensitivity.
gallery:
  - src: ../../assets/projects/source2all-sensitivity-converter/auto-apply.png
    alt: The Auto-apply tab, listing games found across Steam and Epic with each game's converted sensitivity.
  - src: ../../assets/projects/source2all-sensitivity-converter/convert.png
    alt: The Convert tab, turning a Half-Life 2 sensitivity of 1.0 into 3.839723 for Rainbow Six Siege.
highlightsTitle: What it does
highlights:
  - Converts your sensitivity between 170+ games — or from cm/360 and DPI — using each engine's yaw constant
  - Finds installed games automatically across Steam, Epic and GOG, and guesses the engine for anything it doesn't recognise
  - Writes the converted value straight into 100+ games' configs in one click, with automatic backups
  - Safely edits binary Unreal Engine save files (GVAS), keeping the save valid
  - Add any game yourself — open its config, highlight the value, and the app works out its type
  - Portable settings and CI-built single-file releases
stack: [C#, .NET 9, WPF, MVVM, GitHub Actions]
links:
  - label: Download for Windows
    href: https://github.com/swiiftex/Source2AllSensitivityConverter/releases/latest
    release:
      repo: swiiftex/Source2AllSensitivityConverter
      asset: '\.exe$'
  - label: Source on GitHub
    href: https://github.com/swiiftex/Source2AllSensitivityConverter
tint: '#00b1ff'
---

There are loads of sensitivity calculators online, but most take ages to dial in, and many won't save your values unless you pay for a subscription. Then you still have to open every game and type the number in yourself.

Source2All does the whole job. Give it your sensitivity from a Source game (or a cm/360 and DPI), and it works out the equivalent for every supported game and writes it into their config files for you.

## How it works

Everything is converted with the **360-distance method**. Your input is reduced to how many mouse counts it takes to turn 360°, then rebuilt for each game from that game's yaw — the degrees turned per count at sensitivity 1. Source games use 0.022, VALORANT 0.07, Overwatch 2 0.0066, and so on.

To find games, the app reads Steam's library folders and app manifests (with its own VDF/KeyValues parser), Epic's manifests, GOG's registry entries and Minecraft's folder. For installs it doesn't know, it guesses the engine from tell-tale files like `engine2.dll`, `gameinfo.txt`, `*-Win64-Shipping.exe` or `UnityPlayer.dll`.

Then it writes the value in the format each game expects — `autoexec.cfg` and cvars for Source and GoldSrc, INI and axis configs for Unreal, every Call of Duty profile, Minecraft's `options.txt`, Rainbow Six Siege's multiplier, and even binary Unreal `.sav` files for games like The Finals. It makes a one-time backup before touching anything.

It replaces my older **Simple Sensitivity Converter** (2023), a WinForms tool that only converted cm/360 into 19 preset games.
