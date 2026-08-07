document.addEventListener("DOMContentLoaded", () => {
  const buttons = [...document.querySelectorAll(".filter-button")];
  const posts = [...document.querySelectorAll(".post-row[data-product]")];
  const empty = document.getElementById("filter-empty");

  if (!buttons.length || !posts.length) return;

  const applyFilter = (filter) => {
    let visibleCount = 0;

    posts.forEach((post) => {
      const show = filter === "all" || post.dataset.product === filter;
      post.hidden = !show;
      if (show) visibleCount += 1;
    });

    buttons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (empty) empty.hidden = visibleCount !== 0;

    const url = new URL(window.location.href);
    if (filter === "all") {
      url.searchParams.delete("product");
    } else {
      url.searchParams.set("product", filter);
    }
    history.replaceState({}, "", url);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  });

  const requested = new URLSearchParams(window.location.search).get("product");
  const valid = buttons.some((button) => button.dataset.filter === requested);
  applyFilter(valid ? requested : "all");
});
