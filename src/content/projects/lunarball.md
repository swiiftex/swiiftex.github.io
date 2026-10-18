---
title: LUNARBALL
category: games
date: 2024-06-04
kicker: Multiplayer sports game
studio: Final Guard Studios
role: Solo developer
when: "2024–2026"
status: Free to play — released Jun 2024, 1.5 update Oct 2026
platforms: [PC (Steam)]
summary: Kick, punch and dribble your way to success — a 3v3 physics sports game I built and shipped on Steam.
cover: ../../assets/projects/lunarball/stadium-attack.jpg
coverAlt: Players running at the far goal in the LUNARBALL stadium, in front of a packed crowd.
hero: ../../assets/projects/lunarball/zero-g-goal.jpg
gallery:
  - src: ../../assets/projects/lunarball/stadium-overview.jpg
    alt: A high view down the length of the stadium, with players spread across the pitch.
  - src: ../../assets/projects/lunarball/zero-g-goal.jpg
    alt: A player flying through space after the ball, towards a glowing Zero G goal.
  - src: ../../assets/projects/lunarball/wall-ball.jpg
    alt: A player in a pink checked vest running at the ball as it rolls along the curved wall, with an opponent close behind.
  - src: ../../assets/projects/lunarball/zero-g-flight.jpg
    alt: A player in blue armour floating through space as the ball streaks past.
  - src: ../../assets/projects/lunarball/stadium-attack.jpg
    alt: Players running at the far goal in front of a packed crowd.
  - src: ../../assets/projects/lunarball/zero-g-explosion.jpg
    alt: A green particle goal explosion bursting out of the Zero G goal.
  - src: ../../assets/projects/lunarball/desert-stadium.jpg
    alt: The desert stadium in daylight, seen from the corner of the pitch.
  - src: ../../assets/projects/lunarball/zero-g-duel.jpg
    alt: Two players floating beside the glowing ball against a starry sky.
  - src: ../../assets/projects/lunarball/night-stadium.jpg
    alt: Players running down the pitch towards the goal and stands.
  - src: ../../assets/projects/lunarball/zero-g-tunnel.jpg
    alt: Looking down a glowing tunnel in the Zero G arena as the ball flies through it.
  - src: ../../assets/projects/lunarball/goal-explosion.jpg
    alt: A green particle goal explosion pouring across the front of the stadium goal.
highlightsTitle: Under the hood
highlights:
  - Steamworks integration, including the Steam Inventory Service for cosmetics and items
  - Replicated physics with lag compensation — the server rewinds the ball to confirm each hit
  - Quick Play matchmaking over Steam P2P, with bots filling empty slots and host migration
  - Bots that share a team "coach" handing out striker, goalie, defender and winger roles
  - Several stadiums and game modes, including Zero G
stack: [Unreal Engine 5, C++, Steamworks, Steam Inventory Service]
steamAppId: '2012590'
updates:
  steam: true
links:
  - label: Play free on Steam
    href: https://store.steampowered.com/app/2012590/
  - label: Discord
    href: https://discord.gg/qtVWsUeRUf
featured: true
tint: '#7cf06b'
---

Kick, punch and dribble your way to success in LUNARBALL, your next favourite sport! It's built around 3v3 team-based play: jump into Quickplay with random queued players, or organise a custom match in the server browser.

LUNARBALL uses Steam to host a P2P matchmaking system, plus a server browser for custom matches. It also uses Steam's inventory service for in-game cosmetics, including a few helmets based on [VENATOR](/venator/).

I released it on Steam as a free-to-play game in June 2024, followed by patches through the summer.

In October 2026 I released the 1.5 Comeback Update, which rebuilt the game's foundations. It moved the game to Unreal Engine 5.8, rewrote the netcode with lag compensation, and added bots, wall riding, air dashing, instant replays, bigger stadiums and a new Zero G mode. The full patch notes are below.
