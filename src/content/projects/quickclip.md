---
title: QuickClip
category: software
date: 2026-10-08
kicker: Windows app · C# / C++
role: Solo developer
when: "2026"
status: Free and open source (GPL-3.0)
platforms: [Windows]
summary: A lightweight instant-replay clipper — it keeps the last few minutes of your screen in memory and saves a clip on a hotkey, with a built-in editor.
cover: ../../assets/projects/quickclip/editor.png
coverAlt: The QuickClip editor with a Deadlock clip loaded, showing the trim timeline, audio waveform, crop and export settings.
gallery:
  - src: ../../assets/projects/quickclip/gallery.png
    alt: The QuickClip gallery, with recent clips sorted into Deadlock, Gears of War and Night Crew folders, and the instant-replay status bar.
  - src: ../../assets/projects/quickclip/editor.png
    alt: The QuickClip editor with a Deadlock clip loaded, showing the trim timeline, audio waveform, crop and export settings.
highlightsTitle: Features
highlights:
  - Keeps the last 10 seconds to 5 minutes in a RAM ring buffer and saves on a hotkey
  - GPU encoding through FFmpeg (AV1, HEVC or H.264), captured via DXGI Desktop Duplication or Windows Graphics Capture
  - Separate Desktop, Chat, Music and Mic audio tracks using WASAPI per-process loopback
  - Clips sorted into per-game folders, with a gallery
  - Editor with waveforms, frame-accurate trimming, cropping, per-track volume and montage projects
  - Explorer "Edit with QuickClip" menu, an installer and an auto-updater
stack: [C#, WPF, .NET 10, C++, FFmpeg, libmpv, WASAPI]
links:
  - label: Download installer
    href: https://github.com/swiiftex/QuickClip/releases/latest
    release:
      repo: swiiftex/QuickClip
      asset: '-setup\.exe$'
  - label: Source on GitHub
    href: https://github.com/swiiftex/QuickClip
featured: true
tint: '#ff3b4e'
---

QuickClip keeps a rolling buffer of your screen in memory and saves it as a clip when you press a hotkey, so you don't need to record everything all the time.

Capture runs through a native C++ engine, so recording costs very little: frames come from DXGI Desktop Duplication or Windows Graphics Capture and are encoded on the GPU. Audio is captured per application, so game, voice chat, music and microphone land on separate tracks you can balance later.

Clips go into per-game folders, and the built-in editor (powered by libmpv) handles trimming, cropping, per-track volume and stitching clips into montages.
