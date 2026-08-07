document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("product-filter");
  const posts = [...document.querySelectorAll(".post-row[data-product]")];
  const empty = document.getElementById("filter-empty");

  if (!select || !posts.length) return;

  const applyFilter = (filter) => {
    let visibleCount = 0;

    posts.forEach((post) => {
      const show =
        filter === "all" ||
        post.dataset.product === filter;

      post.hidden = !show;

      if (show) {
        visibleCount += 1;
      }
    });

    if (empty) {
      empty.hidden = visibleCount !== 0;
    }

    const url = new URL(window.location.href);

    if (filter === "all") {
      url.searchParams.delete("product");
    } else {
      url.searchParams.set("product", filter);
    }

    history.replaceState({}, "", url);
  };

  select.addEventListener("change", () => {
    applyFilter(select.value);
  });

  const requested =
    new URLSearchParams(window.location.search).get("product");

  const validOption =
    [...select.options].some(
      (option) => option.value === requested
    );

  if (requested && validOption) {
    select.value = requested;
  }

  applyFilter(select.value);
});