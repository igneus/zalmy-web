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

// psalms/canticles with hardcoded default tones
// (normally a random tone is picked if none is specified)

const defaultTones = {
  'kantikum/nuncdimittis': {tone: 'III', differentia: 'a'},
};

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

  psalm
    .querySelectorAll('.title a')
    .forEach(i => i.href = i.href.replace(/(#.*)?$/, `#!${ds.tone}:${ds.differentia}`));
};

const markSelected = (link) => {
  const cls = 'selected';
  wrapperForLink(link).querySelectorAll('.'+cls).forEach(i => i.classList.remove(cls));
  link.classList.add(cls);
  link.parentElement.classList.add(cls);
};

const effectPointingLink = (link) => {
  if (link.classList.contains('selected')) {
    return;
  }

  setNotation(link);
  setPointing(link);
  markSelected(link);
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

  buildHash: () => {
    const ds = document.querySelector('.psalm').dataset;
    return ds.tone + ':' + ds.differentia;
  },

  // hash contains single psalm tone and differentia, e.g. "#!VIII:G"
  onHashChange: () => {
    const hash = window.location.hash;
    const tones = parseHash(hash);
    const tone = tones.length > 0 ? tones[0] : {};
    applyPsalmTone(tone, document.querySelector('.psalm'));

    return Promise.resolve(true);
  },
};

const multiplePsalmsPage = {
  // the clicked link's href contains just a psalm tone,
  // we intercept URL fragment update to keep account of all psalms on the page
  onLinkClick: function (event) {
    event.preventDefault();
    window.location.hash = '#!' + this.buildHash();
  },

  buildHash: () => {
    return Array
      .from(document.querySelectorAll('.psalm:not(.skipped)'))
      .map((ps) => {
        const ds = ps.dataset;
        return [ds.path, ds.tone, ds.differentia].join(':');
      })
      .join(';');
  },

  // hash contains a list of one or more psalms/canticles and corresponding
  // psalm tones
  // e.g. "#!zalm/110:VIII:G;kantikum/magnificat:VII:a"
  onHashChange: () => {
    const hash = window.location.hash;
    const entries = parseHash(hash);

    // Compline: handle varying number of psalms
    if (window.location.pathname.endsWith('kompletar.html')) {
      const wrapper = Array.from(document.querySelectorAll('.psalm-wrapper'))[1];
      const op = entries.filter(i => (i.psalm != 'kantikum/nuncdimittis')).length >= 2 ? 'remove' : 'add';
      const toggleSkip = (el) => el.classList[op]('skipped');
      toggleSkip(wrapper);
      toggleSkip(wrapper.querySelector('.psalm'));
    }

    // match hash entries to DOM nodes
    return Promise.all(
      Array
        .from(document.querySelectorAll('.psalm:not(.skipped)'))
        .map((node, i) => {
          if (i >= entries.length) {
            return Promise.resolve(applyPsalmTone({}, node));
          }

          const entry = entries[i];
          if (entry.psalm != undefined && node.dataset.path != entry.psalm) {
            if (!isValidPsalmPath(entry.psalm)) {
              $(node).replaceWith('<p class="error">URL obsahuje neplatnou referenci na žalm, žalm nebylo možné načíst</p>');
              return Promise.resolve(true);
            }

            node.classList.add('loading');
            return (entry.psalm.includes('+') ?
                    loadJoinedPsalms(entry.psalm, entry, node) :
                    loadPsalm(entry.psalm, entry, node));
          } else {
            return Promise.resolve(applyPsalmTone(entry, node));
          }
        })
    );
  },
};

// functions used by hash handling strategies

// parses URL hash (both the single-psalm and multiple-psalms form),
// returns an array of objects
const parseHash = (hash) => {
  const props = ['psalm', 'tone', 'differentia'];

  return decodeURIComponent(hash)
    .substr(2)
    .split(';')
    .map((str) => {
      let r = {};
      const parts = str.split(':');
      for (let i = 1; i <= Math.min(parts.length, props.length); i++) {
        r[props[props.length - i]] = parts[parts.length - i];
      }
      r.name = `${r.tone}.${r.differentia}`;

      return r;
    });
};

const isValidPsalmPath =
      (path) => /^((zalm|kantikum)\/[a-z0-9]+\+?)*$/.test(path);

const applyPsalmTone = (tone, psalmNode) => {
  const wrapper = psalmNode.parentElement;
  let pointingLink = wrapper.querySelector('a[data-tone="' + tone.tone + '"][data-differentia = "' + tone.differentia + '"]');

  if (pointingLink == null) {
    if (tone.tone != undefined) {
      console.log(`Psalm tone "${tone.name}" not found.`)
    }

    const dt = defaultTones[psalmNode.dataset.path];
    if (dt != undefined) {
      return applyPsalmTone(dt, psalmNode);
    }

    const allPointingLinks = wrapper.querySelectorAll('.psalm-tone-selector a');
    pointingLink = randomElement(
      Array.from(allPointingLinks).filter((link) => !link.dataset.differentia.endsWith('*'))
    );
  }

  effectPointingLink(pointingLink);
};

// Accepts a single psalm reference (the format used in data-path
// and the URL hash) and a .psalm node, loads the specified psalm
// into the node.
const loadPsalm = (dataPath, psalmTone, node) => {
  const wrapper = node.parentElement;
  return $.get(`/${dataPath}.html`).then(
    // success
    (data) => {
      $(node).replaceWith($('.psalm', $(data)));
      applyPsalmTone(psalmTone, wrapper.querySelector('.psalm'));
    },
    // failure
    () => { $(node).replaceWith(`<p class="error">Žalm/kantikum se nepodařilo stáhnout (${dataPath})</p>`) }
  );
};

// Like the above, but loads multiple psalms and joins them into one.
const loadJoinedPsalms = (dataPaths, psalmTone, node) => {
  const wrapper = node.parentElement;
  return Promise.all(
    dataPaths
      .split('+')
      .map((dp) => $.get(`/${dp}.html`))
  ).then(
    // success
    (data) => {
      const psalms = data.map(i => $('.psalm', $(i)));
      const joined = psalms[0];
      const title = $('.title', joined);
      for (let i = 1; i < psalms.length; i++) {
        title
          .append(' + ')
          .append($('.title a', psalms[i]));
        joined.append(psalms[i].children());
        console.log($('.title a', psalms[i]));
      }
      $(node).replaceWith(joined);
      joined[0].dataset.path = dataPaths;
      applyPsalmTone(psalmTone, wrapper.querySelector('.psalm'));
    },
    // failure
    () => { $(node).replaceWith(`<p class="error">Žalm/kantikum se nepodařilo stáhnout (${dataPaths})</p>`) }
  );
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
      effectPointingLink(el);
      urlHashStrategy.onLinkClick(event);
    });
  });

  // changing window.location.hash adds a new entry to the browser history,
  // which is undesirable when loading the initial contents and
  // setting the initial hash => replace current history entry instead
  const initHash =
        () => window.history.replaceState(
          null, '',
          window.location.href.replace(/(#!.*)?$/, '#!' + urlHashStrategy.buildHash())
        );

  urlHashStrategy
    .onHashChange() // apply initial hash contents
    .then(initHash, initHash);
  window.onhashchange = urlHashStrategy.onHashChange;

  const newlinesCheckbox = document.getElementById('newlines');
  newlinesCheckbox.addEventListener('change', (event) => setVersePartNewlines(event.target));
  setVersePartNewlines(newlinesCheckbox);
};
