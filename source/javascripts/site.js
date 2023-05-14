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

window.onload = () => {
  const pointingLinks = document.querySelectorAll('.psalm-tone-selector a');
  pointingLinks.forEach(el => {
    el.addEventListener('click', (event) => {
      setNotation(el);
      setPointing(el);
      event.preventDefault();
    });
  });

  // select initial psalm tone
  pointingLinks[0].click();
};
