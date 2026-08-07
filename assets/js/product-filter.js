document.addEventListener("DOMContentLoaded", () => {
  const productFilter = document.getElementById("product-filter");
  const posts = document.querySelectorAll(".post-row[data-product]");
  const emptyMessage = document.getElementById("filter-empty");

  if (!productFilter) return;

  function filterPosts() {
    const selectedProduct = productFilter.value.trim().toLowerCase();
    let visiblePosts = 0;

    posts.forEach((post) => {
      const postProduct =
        (post.dataset.product || "")
          .trim()
          .toLowerCase();

      const shouldShow =
        selectedProduct === "all" ||
        postProduct === selectedProduct;

      if (shouldShow) {
        post.removeAttribute("hidden");
        visiblePosts++;
      } else {
        post.setAttribute("hidden", "");
      }
    });

    if (emptyMessage) {
      emptyMessage.hidden = visiblePosts > 0;
    }

    const url = new URL(window.location.href);

    if (selectedProduct === "all") {
      url.searchParams.delete("product");
    } else {
      url.searchParams.set("product", selectedProduct);
    }

    window.history.replaceState({}, "", url);
  }

  productFilter.addEventListener("change", filterPosts);

  const requestedProduct =
    new URLSearchParams(window.location.search)
      .get("product");

  if (requestedProduct) {
    const matchingOption =
      [...productFilter.options].find(
        (option) =>
          option.value.toLowerCase() ===
          requestedProduct.toLowerCase()
      );

    if (matchingOption) {
      productFilter.value = matchingOption.value;
    }
  }

  filterPosts();
});