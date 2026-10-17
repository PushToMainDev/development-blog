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

## Project board

`/development/` is a private Jira-style board, separate from the blog (it has
its own layout and opens on a sign-in screen). It's for tracking work on the projects in
`_products`. Tickets have a title, description, project, assignee, status
(To Do, In Progress, Blocked, Done) and story points. A task can have
subtasks, and its total points are its own points plus all of its subtasks'
points. Data is stored in Supabase.

### Setup

1. Create a Supabase project (or reuse one).
2. Supabase -> SQL Editor: run `_supabase/board.sql`.
3. Authentication -> Users -> Add user: create your login with an email and password.
   You can also turn off "Allow new users to sign up" under Authentication -> Sign In / Providers.
4. SQL Editor: allow that login to use the board (lowercase email):

   insert into public.board_users (email) values ('you@example.com');

5. Project Settings -> API: copy the Project URL and the `anon` public key into
   `_config.yml`:

   board:
     supabase_url: "https://YOUR-PROJECT.supabase.co"
     supabase_anon_key: "YOUR-ANON-KEY"

6. Commit, push, and open https://pushtomaindev.github.io/development-blog/development/

People you assign tickets to are managed from the People button and don't
need their own logins. To give someone else edit access, create a user for them
and add their email to `board_users`.

### Importing tickets from Markdown

On the board, **Import .md** creates tickets from a Markdown file. **Copy AI prompt**
copies instructions for Claude or ChatGPT that include your project IDs and people;
paste it, describe the work, and save the reply as a `.md` file. The dialog previews
every ticket before anything is created.

    # Project: kin-kitchen

    ## Recipe import from URLs
    - Status: In Progress
    - Points: 0
    - Assignee: Greg Hudler

    Description in Markdown, as many paragraphs as needed.

    ### Parse schema.org recipe data
    - Points: 3

    ### Download recipe images
    - Points: 2
    - Blocked: Waiting on storage bucket permissions

- `# Project: <id or name>` applies to the tasks below it.
- `## ` is a task and `### ` is a subtask of the task above it.
- Fields (all optional): Status, Points, Assignee, Blocked, and Project on a task.
- New assignee names are added to People.
