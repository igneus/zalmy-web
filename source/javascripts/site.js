// general utility functions

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const qsa =
      (selector) => selector == '' ? [] : document.querySelectorAll(selector);

const selectorRange = (template, iEnd) => {
  let r = [];
  for (var i = 1; i <= iEnd; i++) {
    r.push(template.replace('{}', i));
  }
  return r.join(', ');
};

// pointing

const unpoint =
      (node) => node.style = null;
const pointAccent =
      (node) => node.style = 'font-weight: bold;';
const pointSlidingAccent =
      (node) => node.style = 'font-weight: bold; text-decoration: underline;';
const pointPreparatory =
      (node) => node.style = 'font-style: italic';

// main UI actions

const setNotation = (link) => {
  document.querySelector('#notation').setAttribute('src', link.dataset.image);
};

const setPointing = (link) => {
  const ds = link.dataset;

  [
    qsa(selectorRange('.accent-{}', 2)),
    qsa('.accent-sliding'),
    qsa(selectorRange('.preparatory-{}', 3))
  ].forEach(list => list.forEach(unpoint));

  qsa('.flex .accent-1').forEach(pointAccent);

  qsa(selectorRange('.first .accent-{}', parseInt(ds.firstAccents))).forEach(pointAccent);
  qsa(selectorRange('.first .preparatory-{}', parseInt(ds.firstPreparatory))).forEach(pointPreparatory);
  if (ds.firstSliding) {
    qsa('.first .accent-sliding').forEach(pointSlidingAccent);
  }

  qsa(selectorRange('.second .accent-{}', parseInt(ds.secondAccents))).forEach(pointAccent);
  qsa(selectorRange('.second .preparatory-{}', parseInt(ds.secondPreparatory))).forEach(pointPreparatory);
  if (ds.secondSliding) {
    qsa('.second .accent-sliding').forEach(pointSlidingAccent);
  }
};

const markSelected = (link) => {
  const cls = 'selected';
  document.querySelectorAll('.'+cls).forEach(i => i.classList.remove(cls));
  link.classList.add(cls);
  link.parentElement.classList.add(cls);
};

const selectInitialPsalmTone = (pointingLinks) => {
  const hash = window.location.hash;
  const tone = decodeURIComponent(hash).substr(2)
  const parts = tone.split(':');
  const pointingLink = document.querySelector('a[data-tone="' + parts[0] + '"][data-differentia = "' + parts[1] + '"]');

  if (pointingLink == null) {
    if (hash.length > 0) {
      console.log('Psalm tone "' + tone + '" not found.')
    }

    randomElement(
      Array.from(pointingLinks).filter((link) => !link.dataset.differentia.endsWith('*'))
    ).click();
  } else {
    pointingLink.click();
  }
};

window.onload = () => {
  const pointingLinks = document.querySelectorAll('.psalm-tone-selector a');
  if (pointingLinks.length == 0) {
    // not a psalm page
    return;
  }

  pointingLinks.forEach(el => {
    el.addEventListener('click', (event) => {
      setNotation(el);
      setPointing(el);
      markSelected(el);
    });
  });

  selectInitialPsalmTone(pointingLinks);
};
