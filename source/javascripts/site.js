// general utility functions

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const selectorRange = (template, iEnd) => {
  let r = [];
  for (var i = 1; i <= iEnd; i++) {
    r.push(template.replace('{}', i));
  }
  return r.join(', ');
};

// pointing
//
// (inline styles are used in order not to lose the styling
// when copy-pasting to rich text editors)

const unpoint =
      (node) => node.style = null;
const pointAccent =
      (node) => node.style = 'font-weight: bold;';
const pointSlidingAccent =
      (node) => node.style = 'font-weight: bold; text-decoration: underline;';
const pointPreparatory =
      (node) => node.style = 'font-style: italic';

// main UI actions

// find a .psalm-wrapper relative to the specified pointing link.
const wrapperForLink = (link) => link.parentElement.parentElement.parentElement;

const setNotation = (link) => {
  wrapperForLink(link).querySelector('.notation').setAttribute('src', link.dataset.image);
};

const setPointing = (link) => {
  const ds = link.dataset;
  const wrapper = wrapperForLink(link);
  const qsa =
        (selector) => selector == '' ? [] : wrapper.querySelectorAll(selector);

  [
    qsa(selectorRange('.accent-{}', 2)),
    qsa('.accent-sliding'),
    qsa(selectorRange('.preparatory-{}', 3))
  ].forEach(list => list.forEach(unpoint));

  qsa('.flex .accent-1').forEach(pointAccent);

  const psalm = wrapper.querySelector('.psalm');
  let classes =
      Array.from(psalm.classList)
      .filter((cls) => !cls.startsWith('pointing-'));

  const verseParts = ['first', 'second'];
  verseParts.forEach(vp => {
    qsa(selectorRange(`.${vp} .accent-{}`, parseInt(ds[`${vp}Accents`]))).forEach(pointAccent);
    qsa(selectorRange(`.${vp} .preparatory-{}`, parseInt(ds[`${vp}Preparatory`]))).forEach(pointPreparatory);
    if (ds[`${vp}Sliding`]) {
      qsa(`.${vp} .accent-sliding`).forEach(pointSlidingAccent);
    }

    classes.push(`pointing-${vp}-accents-` + ds[`${vp}Accents`]);
    classes.push(`pointing-${vp}-preparatory-` + ds[`${vp}Preparatory`]);
  });

  psalm.setAttribute('class', classes.join(' '));

  psalm.dataset.tone = ds.tone;
  psalm.dataset.differentia = ds.differentia;
};

const markSelected = (link) => {
  const cls = 'selected';
  wrapperForLink(link).querySelectorAll('.'+cls).forEach(i => i.classList.remove(cls));
  link.classList.add(cls);
  link.parentElement.classList.add(cls);
};

/* URL hash handling strategies govern hash update when a pointing link
   is clicked and applying settings from the URL hash to the page content
   when the hash is changed.

   There are two kinds of pages:
   1. page with a single psalm/canticle, containing everything in static HTML
   2. page with multiple psalms/canticles, loading psalms and canticles
   via AJAX according to a specification in the URL hash
*/

const singlePsalmPage = {
  // no need to do anything, the plain HTML link changes URL hash as needed
  onLinkClick: (event) => {},

  // hash contains single psalm tone and differentia, e.g. "#!VIII:G"
  onHashChange: () => {
    const hash = window.location.hash;
    const tone = decodeURIComponent(hash).substr(2)
    const parts = tone.split(':');
    const pointingLink = document.querySelector('a[data-tone="' + parts[0] + '"][data-differentia = "' + parts[1] + '"]');
    const allPointingLinks = document.querySelectorAll('.psalm-tone-selector a');

    if (pointingLink == null) {
      if (hash.length > 0) {
        console.log('Psalm tone "' + tone + '" not found.')
      }

      randomElement(
        Array.from(allPointingLinks).filter((link) => !link.dataset.differentia.endsWith('*'))
      ).click();
    } else {
      pointingLink.click();
    }
  },
};

const multiplePsalmsPage = {
  // the clicked link's href contains just a psalm tone,
  // we intercept URL fragment update to keep account of all psalms on the page
  onLinkClick: (event) => {
    event.preventDefault();
    window.location.hash = '#!' +
      Array.from(document.querySelectorAll('.psalm')).map((ps) => {
        const ds = ps.dataset;
        return [ds.path, ds.tone, ds.differentia].join(':');
      }).join(';')
  },

  // hash contains a list of one or more psalms/canticles and corresponding
  // psalm tones
  // e.g. "#!zalm/110:VIII:G;kantikum/magnificat:VII:a"
  onHashChange: () => {
    // match hash entries to DOM nodes

    // for each psalm: load if necessary, apply psalm tone
  },
};

// settings UI actions

const setVersePartNewlines =
      (checkbox) =>
      document.querySelectorAll('.psalm').forEach(
        (ps) => ps.classList[checkbox.checked ? 'add' : 'remove'](
          'verse-part-newlines'
        )
      );

// main

window.onload = () => {
  const pointingLinks = document.querySelectorAll('.psalm-tone-selector a');
  if (pointingLinks.length == 0) {
    // not a psalm page
    return;
  }

  const urlHashStrategy =
        document.querySelectorAll('.psalm').length > 1 ? multiplePsalmsPage : singlePsalmPage;

  pointingLinks.forEach(el => {
    el.addEventListener('click', (event) => {
      setNotation(el);
      setPointing(el);
      markSelected(el);
      urlHashStrategy.onLinkClick(event);
    });
  });

  urlHashStrategy.onHashChange(); // apply the initial hash contents
  window.onhashchange = urlHashStrategy.onHashChange;

  const newlinesCheckbox = document.getElementById('newlines');
  newlinesCheckbox.addEventListener('change', (event) => setVersePartNewlines(event.target));
  setVersePartNewlines(newlinesCheckbox);
};
