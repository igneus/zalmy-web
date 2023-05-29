require 'json'

require 'dotenv/load'

IAP = IN_ADIUTORIUM_PATH = 'IN_ADIUTORIUM_PATH'.yield_self do |name|
  ENV[name] || raise("please set environment variable #{name}")
end
LILYPOND = ENV['LILYPOND'] || 'lilypond'

def tmpfile(path)
  File.join 'tmp', path
end

def iafile(path)
  File.join IN_ADIUTORIUM_PATH, path
end

def iafiles(*paths)
  paths.collect(&method(:iafile))
end

require iafile('nastroje/psalmtone.rb')



desc 'generated files not managed by Middleman'
task generated_files: %i[tones_json notated_tones psalter proper]

desc 'delete all build files'
task(:clean) { sh 'rm -rf build/*/*' }

desc 'JSON with metadata of psalm tones'
task tones_json: 'data/psalm_tones.json'

file 'data/psalm_tones.json' => [iafile('psalmodie/zakladni.yml'), __FILE__] do |task|
  r = PsalmToneGroup.from_file(task.prerequisites[0]).each_pair.collect do |name,tone|
    t = tone.all.first.quantities
    {
      name: tone.name.sub(/^_/, ''),
      mediation: {
        accents: t.first_accents,
        preparatory: t.first_preparatory,
        sliding: t.first_sliding_accent,
      },
      differentiae: tone.all.collect do |i|
        d = i.quantities
        {
          name: i.diff,
          image: "/images/psalmodie_#{i.score_id}.svg",

          accents: d.second_accents,
          preparatory: d.second_preparatory,
          sliding: d.second_sliding_accent,
        }
      end
    }
  end

  File.write task.name, JSON.dump(r)
end

desc 'psalm tone notation'
task notated_tones: 'source/images/psalmodie_I-a.svg'

file 'source/images/psalmodie_I-a.svg' => [iafile('nastroje/splitscores.rb'), tmpfile('psalmodie.ly'), __FILE__] do |t|
  ruby *t.prerequisites[0..-2].tap {|pre| pre.insert(1, '--ids', '--prepend-text', '\version "2.19.0"   \include "src/lilypond/psalmtone.ly"') }

  Dir[tmpfile('*_*.ly')].each do |f|
    # add the respective symbol as a mark to each divisio
    sh 'sed', '-i', 's/\\\\barMin/\\\\mark\\\\mFlexa &/', f
    sh 'sed', '-i', 's/\\\\barMaior/\\\\mark\\\\mAsterisk &/', f

    output = File.join('source', 'images', File.basename(f).sub(/\.ly$/, ''))
    sh LILYPOND, '--svg', '-o', output, f

    # crop svg
    sh 'inkscape',
       '--actions', 'select-all;fit-canvas-to-selection;export-overwrite;export-do',
       output + '.svg'
  end
end

file tmpfile('psalmodie.ly') => iafiles('nastroje/psalmtone.rb', 'psalmodie/zakladni.yml') do |t|
  FileUtils.mkdir_p 'tmp'
  sh "ruby #{t.prerequisites[0]} #{t.prerequisites[1]} > #{t.name}"
end

desc 'YAML with the psalter distribution'
task psalter: 'data/psalter.yaml'

file 'data/psalter.yaml' => [iafile('antifonar/antifonar_zaltar.ltex'), __FILE__] do |t|
  skip = true
  File.open(t.name, 'w') do |f|
    f.puts '---'
    File.read(t.prerequisites[0]).each_line do |line|
      line.gsub! '\\\\', '' # double backslash, LaTeX line break
      line.gsub! '~', ' '

      r =
        case line
        when /\\nadpisTyden\{(.+?)\}\{(.+?)\}/
          skip = true if $1.include?('Sváteční')
          "#{$1}:"
            .yield_self do |x|
            if $2 =~ /žaltáře|cyklus|kompletář/i
              skip = false
              x
            end
          end
        when /\\nadpisDen\{(.+?)\}/
          "  #{$1}:"
        when /\\((nespory|modlitba|ranni).*?)$/, /\\nadpisHodinka\{(.+?)\}/
          "    #{$1}:"
        when /\\zalm(div)?\{(.+?)\}/
          "      - zalm#{$2}"
        when /\\kantikum\{(.+?)\}/
          "      - kantikum_#{$1}" unless $1 == 'nuncdimittis'
        when /\\input{kantikum_zj19.tex}/
          "      - kantikum_zj19"
        end
      f.puts r if r && !skip
    end
  end
end

desc 'table of proper psalms for feasts'
task proper: 'data/proper_psalms.yaml'

file 'data/proper_psalms.yaml' => [iafile('antifonar/svatecnizaltar_index.yml')] do |t|
  cp t.prerequisites[0], t.name
end

desc 'build static website for deployment'
task build: [:generated_files] do
  sh 'middleman', 'build'
end

desc 'start local server'
task server: [:generated_files] do
  sh 'middleman', 'server'
end

task default: :build
