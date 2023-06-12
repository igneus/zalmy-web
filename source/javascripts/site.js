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

  const psalm = document.querySelector('.psalm');
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
};

const markSelected = (link) => {
  const cls = 'selected';
  document.querySelectorAll('.'+cls).forEach(i => i.classList.remove(cls));
  link.classList.add(cls);
  link.parentElement.classList.add(cls);
};

const selectPsalmToneByUrlHash = (pointingLinks) => {
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

const setVersePartNewlines =
      (checkbox) =>
      document.querySelector('.psalm')
      .classList[checkbox.checked ? 'add' : 'remove'](
        'verse-part-newlines'
      );

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

  selectPsalmToneByUrlHash(pointingLinks);

  const newlinesCheckbox = document.getElementById('newlines');
  newlinesCheckbox.addEventListener('change', (event) => setVersePartNewlines(event.target));
  setVersePartNewlines(newlinesCheckbox);
};

window.onhashchange = selectPsalmToneByUrlHash;
