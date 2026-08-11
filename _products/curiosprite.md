---
layout: product
title: CurioSprite
product_id: curiosprite
status: Concept
order: 0
open_source: true
tagline: Question. Understand. Explore. Share. Test.
repo:
license:
description: >
  CurioSprite is a planned open-source handheld game-creation platform built
  around one idea: people should be able to learn how games work by making,
  testing, playing, and sharing their own.

  Draw a sprite, animate it, build a level, add simple behaviors, press Play,
  and share the result — all without ever leaving the device.
notice: >
  CurioSprite does not exist as a finished product yet. This page documents the
  direction of the project, the first prototype we want to build, and the
  hardware and software we plan to develop in the open.
tech:
  - Raspberry Pi 3B+
  - Linux
  - RetroArch / libretro
  - MCP3008 ADC
  - 3D-printed enclosure
  - Custom game runtime
image: /assets/uploads/curiosprite-concept.png
image_caption: >
  Early concept artwork only. Final dimensions, components, controls, and
  industrial design are not yet locked.
vision_label: the vision
vision_heading: A handheld built for curiosity.
vision: >
  The goal is not simply to build another retro emulation handheld. CurioSprite
  is intended to combine playing games with learning how games are made. A user
  should eventually be able to draw a sprite, animate it, build a level, add
  simple behaviors, press Play, test the result, improve it, and share the
  finished game without leaving the device.
plan_label: what we want to make
plan_heading: The CurioSprite plan.
plan:
  - title: CurioSprite One
    body: >
      A simple handheld reference device with a touchscreen, physical controls,
      Wi-Fi/Bluetooth, audio, and open hardware documentation.
  - title: CurioSprite Create
    body: >
      An on-device creator for sprites, animations, levels, behaviors, and
      eventually complete small games.
  - title: CurioSprite Play
    body: >
      A launcher for user-created games, CurioSprite-native games, and
      supported retro systems.
  - title: CurioSprite Share
    body: >
      A way to package and send games between devices or through a community
      workflow.
  - title: CurioSprite Runtime
    body: >
      The lightweight engine responsible for running games built with
      CurioSprite tools.
  - title: CurioSprite Hardware
    body: >
      STLs, editable CAD, wiring, PCB files, bill of materials, and assembly
      instructions for community builders.
hardware_label: hardware direction
hardware_heading: Prototype first. Custom hardware later.
hardware_intro: >
  Prototype 01 will use off-the-shelf hardware so we can validate the screen,
  controls, ergonomics, creator interface, and performance before designing
  expensive custom electronics.
hardware_now_title: Prototype 01
hardware_now:
  - Raspberry Pi 3B+ development board
  - 4–4.3-inch IPS capacitive touchscreen
  - D-pad
  - Analog thumbstick
  - A/B/X/Y face buttons
  - Start, Select, and Home
  - L and R shoulder buttons
  - Modular button boards and breadboard/perfboard wiring
  - ADC for analog controls
  - Speaker and small amplifier
  - External USB power during early development
  - 3D-printed enclosure
hardware_later_title: Later Hardware Goals
hardware_later:
  - Smaller purpose-selected processor or module
  - Custom controller/main PCB
  - Internal rechargeable battery
  - Safe charging and shutdown
  - USB-C charging/data
  - Integrated Wi-Fi and Bluetooth
  - Thinner and lighter enclosure
  - Refined production controls
  - Open-source CAD and PCB source
software_label: software direction
software_heading: Learn game development by making games.
software:
  - title: Sprite Editor
    body: >
      Pixel drawing with touch and physical controls, beginning with small
      sprite sizes and a simple palette.
  - title: Animation Editor
    body: >
      Frame-by-frame animation with timing, looping, copying, reordering, and
      previews.
  - title: Level Editor
    body: >
      Touch-assisted placement of tiles, characters, objects, enemies, and
      collision areas.
  - title: Visual Logic
    body: >
      Readable rules such as “When A is pressed → Jump” instead of requiring
      traditional code for beginners.
  - title: Preset Assets
    body: >
      Editable characters, environments, animations, and behaviors that make a
      first game possible quickly.
  - title: Game Runtime
    body: >
      A lightweight runtime that can immediately launch and test what the user
      has just created.
roadmap_label: development roadmap
roadmap_heading: What happens next.
roadmap:
  - title: Bench Prototype
    body: >
      Connect the Pi, touchscreen, controls, analog inputs, and audio on the desk.
  - title: Input Layer
    body: >
      Make every physical control and the touchscreen register reliably.
  - title: Sprite Editor v0.1
    body: >
      Draw, erase, fill, save, load, and test the experience of creating on a
      handheld.
  - title: Animation
    body: >
      Add frames, playback, looping, and editable preset animation sets.
  - title: First Runtime
    body: >
      Put a created sprite in a basic world and make it move, jump, collide, and
      collect something.
  - title: Logic & Behaviors
    body: >
      Add visual rules and beginner-friendly preset behaviors.
  - title: Level Editor
    body: >
      Build and test small game spaces directly on the touchscreen.
  - title: Functional Handheld
    body: >
      Move the working prototype into the first complete printed enclosure and
      test ergonomics.
  - title: Sharing
    body: >
      Package a user-created game and transfer it to another
      CurioSprite-compatible system.
  - title: Hardware Revision 2
    body: >
      Use everything learned from Prototype 01 to begin shrinking and refining
      the hardware.
not_locked: >
  Final processor, final PCB, production battery, exact screen model, final
  enclosure dimensions, final software stack, manufacturing method, pricing, or
  release date. Those decisions come after the prototype proves the core
  experience.
open_source_label: open source plan
open_source_heading: Build it. Study it. Change it.
open_source_summary: >
  The goal is to publish more than printable STLs. CurioSprite should eventually
  include the editable CAD source, printable parts, bills of materials, wiring
  diagrams, source code, PCB design files, software setup instructions, and
  build documentation so other people can reproduce the reference device and
  improve it.
---
