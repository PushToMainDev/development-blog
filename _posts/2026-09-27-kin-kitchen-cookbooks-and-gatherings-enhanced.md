---
layout: post
title: "Kin Kitchen: CookBooks and Gatherings Enhanced"
product: kin-kitchen
author: Greg Hudler
date: 2026-09-27T17:28:00.000-04:00
description: Sprint 4 Updates to features and what we are planning on hitting up next.
image: /development-blog/assets/uploads/sprint-4-banner.png
---
## Sprint 4 — Building Better Ways to Plan and Preserve

Sprint 4 was a big expansion of what Kin Kitchen can actually do.

Previous sprints established the core recipe, gathering, sharing, and notification systems. This sprint focused on building on top of those systems and making Kin Kitchen more useful both **before a gathering happens** and **long after a recipe has been created**.

The major additions this sprint were:

* Private Cookbooks
* Recipe Stories and Legacy
* Gathering Food Categories
* Equipment and Supply Needs
* Claiming Gathering Needs
* Duplicate Dish Detection

Rather than introducing completely separate systems, much of this sprint was about connecting features we had already built into a more complete experience.

## Private Cookbooks

One of the largest additions this sprint was **Private Cookbooks**.

![](/development-blog/assets/uploads/add-cook-book.png)

Recipes no longer have to exist as one large collection. Users can now create their own cookbooks and organize recipes into collections that actually mean something to them.

A cookbook can include:

* A custom name
* A description
* A cover image
* Multiple recipes

Recipes can be added to a cookbook without changing or duplicating the original recipe.

![](/development-blog/assets/uploads/cook-book-detail-view.png)

This gives us the foundation for collections like:

* Family Favorites
* Holiday Recipes
* Grandma's Recipes
* Beach Trip Meals
* Desserts
* Weeknight Dinners

The goal is for cookbooks to eventually feel less like folders and more like actual digital family cookbooks.

This sprint established the data structure and interface needed to continue expanding that idea in later development.

## Recipe Stories and Legacy

Recipes are more than ingredient lists.

Some recipes matter because of **who made them, where they came from, and the memories connected to them**.

Sprint 4 expanded the recipe model with two new pieces of information:

* **Story**
* **Original Contributor**

![](/development-blog/assets/uploads/legacy.png)

The Story field gives users a place to preserve the history or memory behind a recipe.

The Original Contributor field allows the recipe to identify the person it originally came from, even if that person is not a Kin Kitchen user.

These fields are optional, so they do not add unnecessary work when somebody simply wants to save a recipe.

But for recipes that have been passed through a family for years, they give Kin Kitchen a way to preserve something that a normal recipe manager usually loses: **the story behind the food.**

## Better Gathering Planning

Gatherings also received a major upgrade during Sprint 4.

Previously, Kin Kitchen could coordinate dishes and participants. This sprint expanded that system so a host can communicate much more clearly about what a gathering actually needs.

### Food Categories

Gathering dishes now use a controlled set of food categories:

* Appetizer
* Entrée
* Side
* Salad
* Bread
* Dessert
* Drink
* Condiment / Sauce
* Other

This creates more consistency when dishes are added and gives us structured information that can be used for organization and filtering later.

## Equipment Needs

Sometimes bringing the food isn't enough.

A dish might also require something at the gathering.

For example:

* Keep Warm
* Keep Cold
* Refrigeration
* Freezer
* Oven
* Stovetop
* Microwave
* Grill
* Prep Space

We also added an **Other** option for equipment that does not fit one of the predefined choices.

Selecting Other provides a description field so the user can explain exactly what equipment is required.

This gives participants more information before they volunteer to bring something and helps prevent the host from discovering missing equipment after everyone arrives.

## Gathering Supplies

We also expanded gathering planning beyond individual dishes.

Hosts can now create standalone supply needs for the entire gathering.

![](/development-blog/assets/uploads/add-supplies.png)

Examples include:

* Serving Spoons
* Serving Forks
* Serving Tongs
* Serving Knives
* Ladles
* Plates
* Bowls
* Cups
* Napkins
* Utensils
* Ice
* Extension Cords
* Power Strips

Hosts can specify how many of each item are needed.

Participants can then volunteer to bring some or all of that quantity.

For example, if a gathering needs **250 plates**, one person might volunteer to bring 100. Kin Kitchen can then show that **150 are still needed**.

This makes the system much more useful for larger gatherings where responsibility needs to be distributed between several people.

## Claiming and Releasing Needs

The gathering need system also became interactive this sprint.

Participants can claim available needs and indicate that they are bringing them.

Kin Kitchen tracks:

* What is needed
* How many are needed
* How many remain
* Who has volunteered
* Whether the need is still available

Users can also release something they previously claimed if their plans change.

![](/development-blog/assets/uploads/supplies-listed.png)

Importantly, users cannot remove another participant's contribution.

That gives the gathering a shared planning system without allowing one participant to accidentally change another person's commitment.

## Duplicate Dish Detection

One of the more interesting features added this sprint was **Duplicate Dish Detection**.

When someone adds a dish to a gathering, Kin Kitchen now compares the proposed dish name against dishes that are already part of that gathering.

![](/development-blog/assets/uploads/duplicate-match.png)

If the application finds a likely match, the dish is **not automatically rejected**.

Instead, Kin Kitchen displays a warning showing the potential duplicate.

The user can then choose:

**Go Back**

or

**Add Anyway**

This distinction was important.

Duplicate detection is meant to be a **planning aid, not a restriction**.

Sometimes two trays of macaroni and cheese are exactly what a gathering needs. The application should make the user aware of the possible duplication without deciding for them.

## What's Next

With Sprint 4 complete, development moves into **Sprint 5 — Discovery and History**.

The next sprint will focus on making the information already inside Kin Kitchen easier to find, revisit, and understand.

Planned work includes:

* Recipe Search and Advanced Filtering
* Shared and Saved Recipes
* Gathering History
* Notification improvements identified during user testing
* Additional regression testing

At this point, the foundation is largely in place.

The next challenge is making all of that information easier to discover and making the application feel increasingly connected as a whole.

**Every sprint is moving Kin Kitchen closer to the original goal: helping people preserve their food, plan together, and keep the stories around the table alive.**
