const setNotation = (link) => {
  document.querySelector('#notation').setAttribute('src', link.dataset.image);
};

const setPointing = (link) => {
  const ds = link.dataset;

  let classes = ['psalm'];
  classes.push('pointing-first-accents-' + ds.firstAccents);
  classes.push('pointing-first-preparatory-' + ds.firstPreparatory);
  if (ds.firstSliding) {
    classes.push('pointing-first-accent-sliding');
  }
  classes.push('pointing-second-accents-' + ds.secondAccents);
  classes.push('pointing-second-preparatory-' + ds.secondPreparatory);
  if (ds.secondSliding) {
    classes.push('pointing-second-accent-sliding');
  }

  document.querySelector('.psalm').setAttribute('class', classes.join(' '));
};

const setUrl = (link) => {
  const ds = link.dataset;
  window.location.hash = '#!' + ds.tone + ':' + ds.differentia;
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

    randomElement(pointingLinks).click();
  } else {
    pointingLink.click();
  }
};

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

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
      setUrl(el);
      markSelected(el);
      event.preventDefault();
    });
  });

  selectInitialPsalmTone(pointingLinks);
};
