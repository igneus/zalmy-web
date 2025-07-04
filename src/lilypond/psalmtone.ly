\version "2.22.0"

\header {
  tagline = ##f
}

\layout {
  ragged-last = ##t
  indent = 0\cm
  short-indent = 0\cm

  \context {
    \Score

    \remove "Bar_number_engraver"

    \override RehearsalMark.direction = #DOWN
    \override RehearsalMark.color = "darkred"
  }

  system-count = 1

  \context {
    \Voice
    % zavorky nad osnovou pro vyznaceni klouzavych akcentu
    \consists "Horizontal_bracket_engraver"
    \override HorizontalBracket.direction = #UP
    \override HorizontalBracket.bracket-flare = #'(0.0 . 0.0)

    \override Script.rotation = #'(-25 0 -0.5)
    \override HorizontalBracketText.rotation = #'(-25 0 -0.5)
  }
}

myStaffSize = #16
#(set-global-staff-size myStaffSize)

\paper {
  #(define fonts
    (make-pango-font-tree
                          "Charis SIL"
                          "Helvetica"
                          "Courier"
     (/ myStaffSize 20)))

}

% choral --------------------------------------------------------

choralniRezim = {
  % nepsat predznamenani tempa (neni tempo)
  \override Score.TimeSignature.stencil = ##f

  % breve hranate
  \override Staff.NoteHead.style = #'baroque

  % noty bez nozicek
  \override Stem.length = #0

  % nedelat taktove cary
  \cadenzaOn

  % vzdycky vypsat becka
  \accidentalStyle forget
}

choralniRezimPsalmodie = {
  \choralniRezim
  \slurDown
  \override Score.BarLine.extra-spacing-width = #'(-2 . 2)

  \stemDown % stems are neutralized, but this still affects horizontal position of the accent signs above notes
}

% Divisiones

barMin = {
  \once \override Staff.BarLine.bar-extent = #'(1.5 . 2.5)
  \bar "|"
}
barMaior = {
  \once \override Staff.BarLine.bar-extent = #'(-1.5 . 1.5)
  \bar "|"
}
barMax = { \bar "|" }
barFinalis = { \bar "||" }

% Verse part symbols

mFlexa = \markup "†"
mAsterisk = \markup "*"

% unused variables for compatibility with the In adiutorium code

layoutPsalmodie = \layout {}
sestavTitulekBezZalmu = \markup {}
