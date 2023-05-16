# Activate and configure extensions
# https://middlemanapp.com/advanced/configuration/#configuring-extensions

require 'dotenv/load'
require 'pslm'
require 'markaby'

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

  Psalm = Struct.new(:title, :path, :path_name, :is_canticle) do
    def web_path
      "/#{is_canticle ? 'kantikum' : 'zalm'}/#{path_name.sub(/zalm|kantikum_/, '')}.html"
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
          Psalm.new(
            reader.read_str(File.read(i)).header.title,
            i,
            File.basename(i).sub(/\.zalm$/, ''),
            File.basename(i).start_with?('kantikum')
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

    @by_path_name[path_name]
  end
end

class PsalmMarkup
  def self.call(path)
    new(Pslm::PslmReader.new.read_str(
          File.read(path).strip
            .gsub('\zalmVersUpozorneni{2}', '').gsub('\textit{', '').gsub('}', '') + # hardcoded LaTeX markup in Benedictus
          if File.basename(path) =~ /dan3iii/
            ''
          else
            "\n" +
              File.read(File.join(File.dirname(path), 'doxologie.zalm'))
          end
        )).call
  end

  def initialize(psalm)
    @psalm = psalm
  end

  def call
    psalm = @psalm

    vpm = method(:verse_part_markup)

    Markaby::Builder.new do
      div.psalm do
        psalm.strophes.each do |s|
          div.strophe do
            s.verses.each do |v|
              div.verse do
                v.parts.each do |vp|
                  span.verse_part.public_send(vp.pos) { vpm.(vp) }
                end
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

  def verse_part_markup(part)
    accent_i = 0
    before_last_accent = 0
    si = 0

    part.words.reverse.collect do |w|
      w.syllables.reverse.collect do |s|
        next s if s =~ /^[^\w]*$/ # "syllables" consisting e.g. of punctuation only

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

        if (1..3).include? before_last_accent
          classes << "preparatory-#{before_last_accent}"
        end

        si += 1

        r = s
        r = "<span class=\"#{classes.join(' ')}\">#{s}</span>" unless classes.empty?
        r
      end.reverse.join('')
    end.reverse.join(' ') + APPEND[part.pos]
  end
end



activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

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
    PsalmMarkup.(psalm.path)
  end

  def psalm_link(ps)
    return psalm_link(psalms[ps]) if ps.is_a? String

    link_to ps.title, ps.web_path
  end

  def in_adiutorium_sheet_link(sheet_symbol)
    "http://www.inadiutorium.cz/noty##{sheet_symbol}"
  end
end

# Build-specific configuration
# https://middlemanapp.com/advanced/configuration/#environment-specific-settings

# configure :build do
#   activate :minify_css
#   activate :minify_javascript
# end
