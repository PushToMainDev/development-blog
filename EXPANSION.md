# PushToMain Blog Expansion System

This update preserves the existing site and adds a scalable product system.

## Add a new product

Use Decap CMS -> Products -> New Product.

Each product automatically receives:
- a blog filter button
- a product archive page
- availability in the Blog Post "Product" selector

No changes to `blog.html` are required when adding products.

## Product IDs

Use a stable lowercase ID with hyphens, such as:

restaurant-rally
jobsite-sync
new-product-name

Once posts reference a Product ID, do not rename that ID unless you also update those posts.

## Posts

Every new post now requires a Product selection.

Product identifies which application/project the post belongs to.
Tags remain available for technical topics such as:
- react-native
- authentication
- ui
- database
- testing

## Existing functionality preserved

- Home page
- Blog page and current wording
- About page
- Existing post
- Existing CSS/theme
- Decap CMS
- GitHub OAuth backend configuration
- Featured images
- Tags
- Giscus comments include

## Added files

- `_products/` product records
- `_layouts/product.html`
- `_includes/post-row.html`
- `assets/js/product-filter.js`
- `EXPANSION.md`
