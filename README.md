# PushToMainDev Development Blog

Complete GitHub Pages/Jekyll development blog with a browser-based Decap CMS editor,
GitHub OAuth authentication, and Giscus-ready comments.

## Public site

After GitHub Pages is enabled:

https://pushtomaindev.github.io/development-blog/

## Admin

https://pushtomaindev.github.io/development-blog/admin/

The admin interface requires the OAuth backend to be configured first.

## Initial setup

### 1. Put these files in the development-blog repository

Copy the contents of this project into your cloned `development-blog` repository.

### 2. Push the project

git add .
git commit -m "Build PushToMainDev development blog"
git push

### 3. Enable GitHub Pages

Repository -> Settings -> Pages

Source: Deploy from a branch
Branch: main
Folder: / (root)

### 4. Enable GitHub Discussions

Repository -> Settings -> General -> Features -> Discussions

This is required for Giscus comments.

### 5. Configure Giscus

Install/configure Giscus for `PushToMainDev/development-blog` and obtain the
repository ID and category ID.

Add these values to `_config.yml`:

giscus_repo_id: "YOUR_REPO_ID"
giscus_category_id: "YOUR_CATEGORY_ID"

### 6. Create a GitHub OAuth App

GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App

Homepage:
https://pushtomaindev.github.io/development-blog/

Callback:
https://YOUR-OAUTH-BACKEND.vercel.app/api/callback

Save the Client ID and Client Secret.

### 7. Deploy oauth-backend to Vercel

Deploy the `oauth-backend` directory as its own Vercel project.

Add environment variables:

GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET

Never commit the secret.

### 8. Connect the CMS

Edit `admin/config.yml` and replace:

https://YOUR-OAUTH-BACKEND.vercel.app

with the actual Vercel deployment URL.

Commit and push.

### 9. Write from the website

Open:

https://pushtomaindev.github.io/development-blog/admin/

Log in with GitHub and create a Blog Post. The editor writes Markdown posts into
`_posts`, and Jekyll automatically generates the public post pages and blog archive.

## First post

A starter `2026-08-07-my-development-journey.md` is included. Replace its placeholder
sections with your own introduction, journey, and goals before submitting the assignment.
