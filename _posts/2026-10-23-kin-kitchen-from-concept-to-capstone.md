---
layout: post
title: "Kin Kitchen: From Concept to Capstone"
product: kin-kitchen
author: Greg Hudler
date: 2026-10-22T20:48:00.000-04:00
description: The Final Week of school.
image: /development-blog/assets/uploads/bannercap.png
---
Over the past several months, I've been developing Kin Kitchen, an iOS application built around something I hold near and dear to my heart: **food.**

Not simply because I enjoy eating or cooking, but because of something I've learned through my life experiences, something that has proven itself to me time and time again.

**Food is the universal language.**

Sharing a meal with someone has a remarkable way of bringing out our humanity. It allows people to relax, put aside their differences, and feel welcomed and appreciated. Sometimes, sitting down together over a meal can accomplish more than hours of conversation ever could.

During my deployments to Afghanistan, I had the opportunity to share many meals with our Afghan National Interpreters. These weren't just meals to satisfy our hunger. They were meals prepared with the flavors, traditions, and soul of Afghanistan. For an hour, we weren't focused on the fact that we were in the middle of a war. We were simply people sitting together, sharing food, stories, and a moment of normalcy in an otherwise extraordinary environment.

Those experiences stayed with me. For the months that followed, I found myself looking at the people and the world around me differently. It was a reminder that beneath our cultural differences, backgrounds, and circumstances, we have far more in common than we sometimes realize.

**That is the power of a shared meal.**

So I began asking myself a question: Why couldn't we harness that same power to help bring people together here at home? At a time when America feels increasingly divided, perhaps something as simple as sharing a meal could help us rediscover the humanity in one another.

That belief became the foundation of Kin Kitchen.

I wanted to build more than another recipe application. I wanted to create something that helps people gather around a table, accommodate one another's needs, preserve family traditions, and create opportunities for meaningful connections.

As I reach the end of my capstone project at Full Sail University, I want to reflect on the development process, the challenges I encountered, the lessons I've learned, and where Kin Kitchen goes from here.  Please enjoy my final presentation as well as my insight on the build process.

{% include youtube.html id="0lNCHldaPmM" %}

## Building More Than a Recipe App

The inspiration behind Kin Kitchen came from my own experiences cooking for friends and family.

Preparing food for a group isn't always straightforward. Between allergies, dietary restrictions, and personal preferences, making sure everyone has something they can enjoy takes planning.

At the same time, family recipes have a way of getting scattered across handwritten cards, cookbooks, websites, and text messages.

I wanted to create an application that addressed both problems.

Kin Kitchen brings recipe organization, personal digital cookbooks, and gathering coordination into a single experience. The goal is to help people spend less time managing the logistics of sharing food and more time enjoying the experience.

## Turning the Concept Into an Application

Kin Kitchen was developed using **SwiftUI** for the iOS application and **Supabase** for backend services.

Some of the primary areas of development included:

* **Recipe Management:** Creating, organizing, and accessing recipes.
* **Digital Cookbooks:** Organizing recipes into collections with an interface inspired by physical cookbooks.
* **Gathering Coordination:** Managing events and planning shared meals.
* **Dietary Profiles:** Providing a place to manage food preferences and restrictions.
* **Backend Architecture:** Building reusable database functions, managing relationships, and implementing security policies.

One of my favorite aspects of the project has been designing the cookbook interface.

Instead of treating a cookbook as another folder or list, I wanted the experience to resemble selecting a book from a shelf. It's a small design decision, but it reflects the larger goal of making Kin Kitchen feel personal rather than purely functional.

![](/development-blog/assets/uploads/new-cookbook-list.png)

## Designing for More Than One Platform

One of the more significant technical decisions I made was to plan for Kin Kitchen's eventual expansion beyond iOS.  Although the current application is built with SwiftUI, I didn't want its core functionality to depend entirely on Swift-specific implementations.  To address that, I began centralizing more business logic within Supabase.

The intention is to allow future applications, whether Android or web-based, to interact with the same backend functionality instead of rebuilding that logic separately for each platform.  This approach introduced additional complexity during development, particularly around database functions, data relationships, and security.  However, it also encouraged me to think beyond the immediate requirements of the capstone and consider how the application could grow.

## The Challenge of Changing Requirements

One of the biggest lessons from this project involved upfront planning.  As development progressed, my vision for how users would interact with certain features evolved.  Those changes weren't limited to the user interface. They also affected the information the application needed to store and how different data entities related to one another. As a result, I had to revise portions of the Supabase database structure multiple times.

Looking back, I would spend more time mapping user journeys and defining data requirements before beginning implementation.  That wouldn't eliminate changes entirely. Requirements naturally evolve as an application takes shape. But a more detailed initial plan could have reduced unnecessary rework and made development more efficient.

## User Testing: My Biggest Takeaway

If there's one area I would approach differently, it's **user testing.**

As a solo developer, I had a limited pool of people available to evaluate Kin Kitchen. That made it difficult to gather feedback from users with different cooking habits, dietary requirements, and levels of technical experience.  I also hadn't explored Apple's TestFlight platform during development.  Understanding how to distribute an application to external testers on their personal devices would have made it easier to recruit participants and gather meaningful feedback.

For an application like Kin Kitchen, that feedback is particularly important.  The way someone organizes family recipes may be very different from how another person manages a church potluck or accommodates food allergies.  Those differences are exactly what real-world testing needs to uncover.

Moving forward, I intend to make external testing part of the development process rather than something addressed near the end.

## What's Next for Kin Kitchen?

Although my capstone is coming to an end, I don't consider Kin Kitchen finished.

My next priorities include expanding user testing, refining the existing experience, and continuing development toward a public release.

I also plan to explore additional functionality, including social features, recipe scanning, and support for other platforms.

The foundation is there, but there is still plenty of work ahead. Here is our current milestone.

{% include youtube.html id="gsC5gFGGKJs" title="App Walk Through" %}

## Final Thoughts

This project has reinforced something I've come to appreciate about software development: writing code is only one part of building an application.  Understanding users, designing a sustainable architecture, managing changing requirements, and knowing when to seek feedback are equally important.

Kin Kitchen challenged me to take responsibility for the entire development process, from defining the original problem to implementing the interface, backend, and supporting functionality.  The accellerated degree program gave me little time to come up with a solution for the isues that arrised with them.  This lead me to push myself further having some very late nights to build test and rebuild parts of the application.  While i will appriciate the ability to think with a clear mind and some sleep to not have to make a deadline I will always be greatful for the time that i spent building under this crunched deadline style which forced me to come up with some solutions and look for tools to help me out of a sticky situation more then once.

There are decisions I would make differently if I were starting over, but that's part of the value of building something from the ground up.

The capstone may be ending, but the development process isn't.

**Build. Test. Commit. Push to Main.**
