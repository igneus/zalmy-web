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

const selectInitialPsalmTone = (pointingLinks) => {
  const hash = window.location.hash;
  if (hash.length == 0) {
    randomElement(pointingLinks).click();
  } else {
    const parts = hash.substr(2).split(':');
    document.querySelector('a[data-tone="' + parts[0] + '"][data-differentia = "' + parts[1] + '"]').click();
  }
};

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

window.onload = () => {
  const pointingLinks = document.querySelectorAll('.psalm-tone-selector a');
  pointingLinks.forEach(el => {
    el.addEventListener('click', (event) => {
      setNotation(el);
      setPointing(el);
      setUrl(el);
      event.preventDefault();
    });
  });

  selectInitialPsalmTone(pointingLinks);
};
