---
layout: post
title: "Kin Kitchen: Beyond the Capstone — Building a Real Product"
product: kin-kitchen
author: Greg Hudler
date: 2026-11-01T15:07:00.000-05:00
description: Kin Kitchen has officially moved beyond its Full Sail University
  capstone and into independent product development. Recent updates include
  importing recipes from websites, photos, and files; introducing subscription
  tiers with usage limits; and adding event chat and co-hosting features to make
  gatherings more collaborative.
image: /development-blog/assets/uploads/nov1banner.png
---


Finishing my capstone at Full Sail University didn't mean development on Kin Kitchen was finished. In fact, it gave me the opportunity to start building the application into something much closer to what I originally envisioned.

Throughout my capstone, I was working against an accelerated academic schedule. Every feature had to be weighed against the time remaining before the next deadline. Now that I'm developing independently, I can spend more time thinking about the bigger picture.

How do I make Kin Kitchen easier to use? How do I bring people together through the application? And perhaps most importantly, how do I turn something I've spent months building into a sustainable product?

Over the past several days, I've made significant progress toward answering those questions.

## Making Recipe Collection Easier

One of the first things I wanted to improve was how users add recipes to Kin Kitchen.

Originally, creating a recipe meant entering the information manually. That works when you're documenting something you've created yourself, but what about the recipes people already have?

Some are bookmarked on websites. Others are saved as photographs, stored in files, or handwritten on recipe cards that have been passed down through generations.

I wanted Kin Kitchen to accommodate all of them.

### Importing Recipes From Websites

Users can now import recipes directly from websites by providing a URL.

Rather than manually copying every ingredient, measurement, and instruction, Kin Kitchen brings the recipe information into an editable form where users can review it before saving.

I also integrated Kin Kitchen into the iOS Share Sheet. This means someone browsing a recipe in Safari can use the Share button and send it directly to Kin Kitchen.

That's an important improvement because it allows the application to fit naturally into something people are already doing.

![](/development-blog/assets/uploads/share-from-safari.png)

*Kin Kitchen appears in the iOS Share Sheet, allowing recipes to be sent directly from Safari.*



![](/development-blog/assets/uploads/import-from-website.png)

*Users can also paste a recipe URL directly into the application.*

### Reviewing Imported Recipes

I didn't want importing a recipe to mean blindly accepting whatever information was retrieved.

After importing, users can review the recipe title, photograph, serving size, preparation time, cooking time, ingredients, and other details before saving.

The original website can also be retained as part of the recipe information.



![](/development-blog/assets/uploads/safari-import.png)

*An imported pancake recipe is presented for review before being added to the user's collection.*



![](/development-blog/assets/uploads/original-site-saved.png)

*The recipe editor retains the original source URL and provides space for additional information and the story behind the recipe.*

That last part is particularly important to me. A recipe is often more than a list of ingredients. Sometimes the story behind it is what makes it worth preserving.

### Capturing Recipes From Photos

Another addition is the ability to capture recipes using the camera or select an existing photograph.



![](/development-blog/assets/uploads/scan-from-camera-or-from-photos.png)

*Users can photograph a recipe card or cookbook page, or choose an image already stored on their device.*

This brings Kin Kitchen closer to one of my original goals: preserving the recipes that might otherwise be lost.

A handwritten recipe from a grandparent shouldn't have to remain tucked away in a drawer where only one person can access it.

The same goal is driving the addition of file-based recipe importing, giving users more ways to bring their existing collections into Kin Kitchen.

## Introducing Table Talk

Another major addition is **Table Talk**, Kin Kitchen's social cooking space.

I've said from the beginning that Kin Kitchen isn't supposed to be just another recipe application. The goal is to bring people together through food.

Table Talk is one of the features that makes that vision more tangible.

It provides a place where users can share what they're cooking and see what their friends and family are preparing.



![](/development-blog/assets/uploads/table-talk.png)

*Table Talk provides a dedicated space for sharing cooking updates and discovering what friends and family are making.*

I like the idea of someone opening Kin Kitchen and discovering that a friend is trying a new recipe, preparing a family favorite, or experimenting with something completely different.

Those small interactions can start conversations, encourage people to try something new, and create opportunities to connect.

## Building the Friends System

Of course, a social feature needs people to connect with.

I've added a Friends system that allows users to manage their connections, view friend requests, discover other users, and follow cooking profiles.



![](/development-blog/assets/uploads/friends-list.png)

*The Friends interface includes separate sections for existing connections, requests, discovery, and following.*

The distinction between friends and following is intentional.

Not every connection needs to be a personal friendship. Someone might want to stay connected with family members while also following cooks whose recipes or cooking styles interest them.

This creates room for Kin Kitchen to support both personal relationships and a broader cooking community.

## Chef Pages: Giving Cooks Their Own Identity

One of the more interesting additions has been the introduction of **Chef Pages**.

These allow cooks to establish a separate cooking identity within Kin Kitchen, complete with a page name, photograph, banner, description, and YouTube content.



![](/development-blog/assets/uploads/chef-page.png)

*The Chef Page editor allows users to customize how their cooking content is presented.*

This is where the application begins to move beyond personal recipe collections.

Someone who enjoys sharing recipes or creating cooking videos can develop a recognizable presence without separating that identity from the rest of their Kin Kitchen experience.

It's also a feature that fits naturally into the membership system I've been building.

## Turning Kin Kitchen Into a Sustainable Product

Developing an application is one challenge. Maintaining it as the number of users grows is another.

As Kin Kitchen expands, I need to account for database operations, file storage, infrastructure, and the ongoing cost of supporting additional features.

To prepare for that, I've introduced three membership tiers.

### Home Cook — Free

The Home Cook tier provides an entry point for people who want to manage recipes, participate in events, and use Table Talk.

It includes one cookbook, with advertising in Table Talk.



![](/development-blog/assets/uploads/home-cook.png)

*Home Cook provides access to Kin Kitchen's core experience without requiring a paid membership.*

### Sous Chef — $29.99 per Year

Sous Chef is designed for people who want more flexibility with their recipe collections and cooking activity.

It includes unlimited cookbooks, an ad-free Table Talk experience, and the ability to display a family rating regardless of rating count.



![](/development-blog/assets/uploads/sous-chef.png)

*Sous Chef expands cookbook access and removes advertising from Table Talk.*

### Head Chef — $79.99 per Year

Head Chef builds on Sous Chef by adding features for cooks who want to establish a following.

This tier includes a Chef Page with YouTube videos, followers, and the ability to publish posts under the Chef Page identity.



![](/development-blog/assets/uploads/head-chef.png)

*Head Chef introduces creator-focused functionality for cooks who want to grow an audience.*

The application also includes monthly and yearly membership options.

Introducing these tiers required me to think beyond the screens users see.

The backend needs to recognize membership levels, enforce feature limits, and provide the correct permissions based on a user's subscription.

This has been an important part of preparing Kin Kitchen for a future where it may need to support far more users than it does today.

## More Ways to Bring People Together

I've also continued expanding the event-management side of Kin Kitchen.

Two additions are event chat and co-hosting.

Event chat is intended to make communication easier for people participating in the same gathering. Instead of coordinating every detail through separate text conversations, participants can communicate within the event experience.

Co-hosting addresses another practical problem: not every gathering is organized by one person.

Whether it's a holiday dinner, a family celebration, a church gathering, or a community potluck, organizing an event often involves several people sharing responsibilities.

Allowing multiple hosts to participate in managing an event makes Kin Kitchen better suited to how gatherings actually work.

These features are important because they reinforce the reason I started developing the application in the first place.

## Watching the Application Evolve

One of the most rewarding parts of this development cycle has been seeing the different pieces of Kin Kitchen begin to connect.

The home screen now provides access to recipe creation, event creation, website importing, and recipe scanning. Table Talk has its own place in the main navigation, and the profile experience has expanded to include social connections and membership features.



![](/development-blog/assets/uploads/nov1home.png)

*The updated home screen brings recipe importing and scanning directly into the primary workflow.*



![](/development-blog/assets/uploads/nov1-profile.png)

*The expanded profile brings together a user's cooking identity, recipe collections, sharing activity, and social connections.*

Each addition has created new technical questions.

How should recipe information be structured so that imported content and manually created recipes behave consistently? How should subscription limits be enforced? How do personal profiles, Chef Pages, friendships, and followers relate to one another?

These are the kinds of problems that become more important as an application grows.

I've also had to continue thinking about how much functionality belongs in the iOS application and how much should be handled by Supabase.

Because I eventually want Kin Kitchen to expand beyond iOS, I'm working toward keeping important business rules and shared functionality on the backend wherever practical.

That means more planning and sometimes more development work today, but it should make future platform expansion easier to manage.

## What's Next for Kin Kitchen?

There's still plenty of work ahead.

I want to continue testing the recipe import experience across different websites and source formats, refining the social features, validating membership restrictions, and expanding real-world user testing.

I also want to keep improving the overall experience without losing sight of what Kin Kitchen is supposed to accomplish.

During my deployments to Afghanistan, I saw firsthand how sharing a meal could bring people together despite vastly different backgrounds and circumstances.

That experience helped shape my belief that **food is the universal language**.

Kin Kitchen is my attempt to take that belief and turn it into something useful.

Whether it's preserving a handwritten family recipe, sharing what you've cooked, following someone whose food inspires you, or organizing a meal with people you care about, I want Kin Kitchen to make those connections easier.

The capstone was about proving I could build the application.

**This next chapter is about proving I can turn it into a product people want to use.**

And I've only just gotten started.

**Build. Test. Commit. Push to Main.**
