# Activate and configure extensions
# https://middlemanapp.com/advanced/configuration/#configuring-extensions

require 'dotenv/load'
require 'pslm'
require 'markaby'
require 'rack/offline'

IN_ADIUTORIUM_PATH = ENV['IN_ADIUTORIUM_PATH'] || raise('envvar required')

module Psalms
  extend self

  # order of books in the Bible
  # (copied from In-adiutorium/antifonar/indexstyle_bible.xdy)
  BIBLE_BOOKS = [
    "Ex",
    "Dt",
    "1 Sam",
    "1 Kron",
    "Tob",
    "Jdt",
    "Žalm",
    "Př",
    "Mdr",
    "Sir",
    "Iz",
    "Jer",
    "Pláč",
    "Ez",
    "Dan",
    "Oz",
    "Hab",
    "Sof",
    "Lk",
    "Ef",
    "Flp",
    "Kol",
    "1 Tim",
    "1 Petr",
    "Zj",
  ].freeze
  BIBLE_BOOK_RE = Regexp.new BIBLE_BOOKS.join('|')

  Psalm = Struct.new(:title, :path, :path_name, :is_canticle, :incipit) do
    # psalm/canticle path used in the data-path attribute and in URL hash
    def data_path
      "#{is_canticle ? 'kantikum' : 'zalm'}/#{path_name.sub(/zalm|kantikum_/, '')}"
    end

    def web_path
      "/#{data_path}.html"
    end

    def sort_key
      [BIBLE_BOOK_RE.match(title).yield_self {|x| BIBLE_BOOKS.index(x && x[0]) } ] + title.scan(/\d+/).collect(&:to_i)
    end
  end

  def all
    @all ||=
      begin
        reader = Pslm::PslmReader.new

        Dir[File.join(IN_ADIUTORIUM_PATH, 'antifonar', 'zalmy', '*.zalm')]
          .reject {|i| i =~ /doxologie|responsorialni|pascha|tedeum/ }
          .collect do |i|
          parsed = reader.read_str(File.read(i))

          Psalm.new(
            parsed.header.title,
            i,
            File.basename(i).sub(/\.zalm$/, ''),
            File.basename(i).start_with?('kantikum'),
            parsed
              .verses[0]
              .parts[0]
              .words
              .collect {|w| w.syllables.join '' }
              .join(' ')
              .strip
              .gsub('"', '')
              .sub(/[,;:.]$/, '')
          )
        end
          .sort_by(&:sort_key)
      end
  end

  def [](path_name)
    @by_path_name ||=
      begin
        Hash.new.tap {|r| all.each {|i| r[i.path_name] = i } }
      end

    @by_path_name[path_name] || raise(KeyError.new("psalm #{path_name.inspect} not found"))
  end
end

class PsalmMarkup
  def self.call(psalm)
    new(psalm).call
  end

  def initialize(psalm)
    @psalm = psalm

    path = psalm.path
    STDERR.puts "pointing #{path}"

    doxology =
      if File.basename(path) =~ /dan3iii/
        ''
      else
        "\n" + File.read(File.join(File.dirname(path), 'doxologie.zalm'))
      end

    @pslm_parsed = Pslm::PslmReader.new.read_str(
      File.read(path)
        .strip
        .gsub('\zalmVersUpozorneni{2}', '') # get rid of hardcoded LaTeX markup in Benedictus
        .gsub('\textit{', '')
        .gsub('}', '') +
      doxology
    )
  end

  def call
    vpm = method(:verse_part_markup)

    # because instance variables from the outside are not visible
    # from within the Markaby DSL
    psalm = @psalm
    pslm_parsed = @pslm_parsed

    Markaby::Builder.new do
      div.psalm('data-path': psalm.data_path) do
        div.title do
          a(href: psalm.web_path) { psalm.title }
        end
        pslm_parsed.strophes.each do |s|
          div.strophe do
            s.verses.each do |v|
              div.verse do
                v.parts
                  .collect {|vp| vpm.(vp.pos, vp, v == s.verses.last && vp == v.parts.last) }
                  .join("\n")
              end
            end
          end
        end
      end
    end
  end

  APPEND = {
    flex: '&nbsp;<span class="r">†</span> ',
    first: '&nbsp;<span class="r">*</span> ',
    second: ''
  }

  def verse_part_markup(part_name, part, is_strophe_end=false)
    accent_i = 0
    before_last_accent = 0
    si = 0

    part_short_classes =
      1.upto(2).collect {|i| "accent-#{i}" } +
      1.upto(3).collect {|i| "preparatory-#{i}" }
    last_syl_classes = []

    out = part.words.reverse.collect do |w|
      w.syllables.reverse.collect do |s|
        if s =~ /^[^[:word:]]*$/ # "syllables" consisting e.g. of punctuation only
          STDERR.puts "skipping syllable #{s.to_s.inspect}"
          next s
        end

        classes = []

        if accent_i > 0
          before_last_accent += 1
        end

        if s.accent?
          accent_i += 1
          classes << "accent-#{accent_i}"
        elsif accent_i == 0 && si > 0
          classes << 'accent-sliding'
        end

        if part.pos != :flex && (1..3).include?(before_last_accent)
          classes << "preparatory-#{before_last_accent}"
        end

        # verse part is long enough if it has the given amount
        # of accented/preparatory syllables + at least one
        # syllable sung on the reciting tone
        last_syl_classes.each {|c| part_short_classes.delete c }
        last_syl_classes = classes

        si += 1

        r = s.sub(' ', '&nbsp;') # space within a rythmic unit is always non-breaking
        unless classes.empty?
          if s.size > 5
            STDERR.puts "suspiciously long marked syllable #{s.to_s.inspect}"
          end
          r = "<span class=\"#{classes.join(' ')}\">#{r}</span>"
        end
        r
      end.reverse.join('')
    end.reverse.join(' ')

    part_classes =
      ['verse_part', part_name] +
      part_short_classes.collect {|i| "short-#{i}" }

    "<span class=\"#{part_classes.join(' ')}\"><span class=\"verse_part_content\">" +
      out +
      '</span>' +
      APPEND[part.pos] +
      (is_strophe_end ? ' <span class="r">—</span>' : '') +
      '</span>'
  end
end



activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

activate :asset_hash

# Layouts
# https://middlemanapp.com/basics/layouts/

# Per-page layout changes
page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false

# With alternative layout
# page '/path/to/file.html', layout: 'other_layout'

# Proxy pages
# https://middlemanapp.com/advanced/dynamic-pages/

Psalms.all.each do |ps|
  proxy(
    ps.web_path,
    '/psalm.html',
    locals: {psalm: ps},
    ignore: true
  )
end

proxy(
  '/tedeum.html',
  '/psalm.html',
  locals: {
    psalm:
      File.join(IN_ADIUTORIUM_PATH, 'antifonar', 'zalmy', 'tedeum.zalm').yield_self do |i|
      Psalms::Psalm.new(
        Pslm::PslmReader.new.read_str(File.read(i)).header.title,
        i,
        File.basename(i).sub(/\.zalm$/, ''),
        false
      )
    end
  },
  ignore: true
)

# Helpers
# Methods defined in the helpers block are available in templates
# https://middlemanapp.com/basics/helper-methods/

helpers do
  def psalms
    Psalms
  end

  def psalm_markup(psalm)
    PsalmMarkup.(psalm)
  end

  def psalm_link(ps)
    return psalm_link(psalms[ps]) if ps.is_a? String

    link_to ps.title, ps.web_path
  end

  def in_adiutorium_sheet_link(sheet_symbol)
    "http://www.inadiutorium.cz/noty##{sheet_symbol}"
  end

  def zj19_tone_link
    partial 'proper_tone_link', locals: {name: 'srov. Zj 19', link: in_adiutorium_sheet_link('kantZj19')}
  end

  def hour_link(label, psalms)
    page =
      case label
      when /nešpory/
        'nespory'
      when /ranní/
        'ranni'
      when /uprostřed/, /poledne/
        'uprostred'
      when /(neděle|pondělí|úterý|středa|čtvrtek|pátek)/i
        'kompletar'
      else
        'cteni'
      end

    if psalms == 'rchne1t'
      psalms = %w(zalm63 kantikum_dan3iii zalm149)
    end

    unless psalms.is_a? Array
      # rubric, no hour link
      return label
    end

    psalms_hash = psalms.collect do |i|
      case i.to_s # TODO partial duplicate of code block from _proper_psalms_listing.html.slim
      when /kantikum_(1tim3|zj19)$/
        nil # TODO
      when /^(zalm|kantikum)/
        i
      else
        nil
      end
    end.compact.collect {|path_name| (path_name ? Psalms[path_name].data_path : '') + '::' }.join(';')

    link_to label, "hodinka/#{page}.html#!" + psalms_hash
  end
end

# Build-specific configuration
# https://middlemanapp.com/advanced/configuration/#environment-specific-settings

# configure :build do
#   activate :minify_css
#   activate :minify_javascript
# end

# declare resources cached by the browser for offline use
offline = ::Rack::Offline.configure do
  Dir['source/images/psalmodie_*.svg'].each do |f|
    cache f.sub('source/', '')
  end
end
map("/offline.appcache") { run offline }
