export function createFilmNavigation({ entry, films, elementForFilm, onActive, onSelect, onClear }) {
  let activeIndex = 0;
  let hasActivated = false;

  function activate(index, { announce = true } = {}) {
    hasActivated = true;
    activeIndex = (index + films.length) % films.length;
    const film = films[activeIndex];
    const element = elementForFilm(film.film_id);
    if (!element) return;
    entry.setAttribute("aria-activedescendant", element.id);
    element.scrollIntoView({ block: "nearest", inline: "nearest" });
    onActive(film, element, announce);
  }

  function handleKeydown(event) {
    if (["ArrowRight", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      activate(activeIndex + 1);
    } else if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      activate(activeIndex - 1);
    } else if (["Enter", " "].includes(event.key)) {
      event.preventDefault();
      const film = films[activeIndex];
      onSelect(film, elementForFilm(film.film_id));
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClear();
    }
  }

  function handleFocus() {
    activate(activeIndex);
  }

  entry.addEventListener("keydown", handleKeydown);
  entry.addEventListener("focus", handleFocus);
  return Object.freeze({
    activateFilm(filmId, options) {
      const index = films.findIndex((film) => film.film_id === filmId);
      if (index >= 0) activate(index, options);
    },
    restore() { if (hasActivated) activate(activeIndex, { announce: false }); },
    clearActiveDescendant() { hasActivated = false; entry.removeAttribute("aria-activedescendant"); },
    destroy() {
      entry.removeEventListener("keydown", handleKeydown);
      entry.removeEventListener("focus", handleFocus);
    }
  });
}
