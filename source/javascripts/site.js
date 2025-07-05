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
    const tones = parseHash(hash);
    const tone = tones.length > 0 ? tones[0] : {};
    applyPsalmTone(tone, document.querySelector('.psalm'));
  },
};

const multiplePsalmsPage = {
  // the clicked link's href contains just a psalm tone,
  // we intercept URL fragment update to keep account of all psalms on the page
  onLinkClick: (event) => {
    event.preventDefault();
    window.location.hash = '#!' +
      Array.from(document.querySelectorAll('.psalm:not(.skipped)')).map((ps) => {
        const ds = ps.dataset;
        return [ds.path, ds.tone, ds.differentia].join(':');
      }).join(';')
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
    Array.from(document.querySelectorAll('.psalm:not(.skipped)')).map((node, i) => {
      if (i >= entries.length) {
        return;
      }

      const entry = entries[i];
      const wrapper = node.parentElement;
      if (entry.psalm != undefined && node.dataset.path != entry.psalm) {
        if (!isValidPsalmPath(entry.psalm)) {
          $(node).replaceWith('<p class="error">URL obsahuje neplatnou referenci na žalm, žalm nebylo možné načíst</p>');
          return;
        }

        // load the specified psalm
        node.classList.add('loading');
        $.ajax({
          url: `/${entry.psalm}.html`,
          error: () => { $(node).replaceWith(`<p class="error">Žalm/kantikum se nepodařilo stáhnout (${entry.psalm})</p>`) },
          success: (data) => {
            $(node).replaceWith($('.psalm', $(data)));
            applyPsalmTone(entry, wrapper.querySelector('.psalm'));
          }
        });
      } else {
        applyPsalmTone(entry, node);
      }
    });
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
      (path) => /^(zalm|kantikum)\/[a-z0-9]+$/.test(path);

const applyPsalmTone = (tone, psalmNode) => {
  const wrapper = psalmNode.parentElement;
  const pointingLink = wrapper.querySelector('a[data-tone="' + tone.tone + '"][data-differentia = "' + tone.differentia + '"]');

  if (pointingLink == null) {
    if (tone.tone != undefined) {
      console.log(`Psalm tone "${tone.name}" not found.`)
    }

    const dt = defaultTones[psalmNode.dataset.path];
    if (dt != undefined) {
      return applyPsalmTone(dt, psalmNode);
    }

    const allPointingLinks = wrapper.querySelectorAll('.psalm-tone-selector a');
    randomElement(
      Array.from(allPointingLinks).filter((link) => !link.dataset.differentia.endsWith('*'))
    ).click();
  } else {
    pointingLink.click();
  }
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

  urlHashStrategy.onHashChange(); // apply initial hash contents
  window.onhashchange = urlHashStrategy.onHashChange;

  const newlinesCheckbox = document.getElementById('newlines');
  newlinesCheckbox.addEventListener('change', (event) => setVersePartNewlines(event.target));
  setVersePartNewlines(newlinesCheckbox);
};
