require 'json'

require 'dotenv/load'

IAP = IN_ADIUTORIUM_PATH = ENV['IN_ADIUTORIUM_PATH'] || raise('please set environment variable IN_ADIUTORIUM_PATH')
LILYPOND = ENV['LILYPOND'] || 'lilypond'

def tmpfile(path)
  File.join 'build', 'tmp', path
end

def iafile(path)
  File.join IN_ADIUTORIUM_PATH, path
end

def iafiles(*paths)
  paths.collect(&method(:iafile))
end

require iafile('nastroje/psalmtone.rb')



task default: %i[tones_json notated_tones]

desc 'delete all build files'
task(:clean) { sh 'rm -rf build/*/*' }

task tones_json: 'build/tones.json'

file 'build/tones.json' => [iafile('psalmodie/zakladni.yml')] do |task|
  r = PsalmToneGroup.from_file(task.prerequisites[0]).each_pair.collect do |name,tone|
    t = tone.all.first.quantities
    {
      name: tone.name,
      mediation: {
        accents: t.first_accents,
        preparatory: t.first_preparatory,
        sliding: t.first_sliding_accent,
      },
      differentiae: tone.all.collect do |i|
        d = i.quantities
        {
          name: i.diff,
          image: "build/images/psalmodie_#{i.score_id}.svg",

          accents: d.second_accents,
          preparatory: d.second_preparatory,
          sliding: d.second_sliding_accent,
        }
      end
    }
  end

  File.write task.name, JSON.dump(r)
end

task notated_tones: [iafile('nastroje/splitscores.rb'), tmpfile('psalmodie.ly')] do |t|
  ruby *t.prerequisites.dup.tap {|pre| pre.insert(1, '--ids', '--prepend-text', '\version "2.19.0"   \include "src/lilypond/psalmtone.ly"') }
  Dir['build/tmp/*.ly'].each do |f|
    next if f == t.prerequisites.last

    output = File.join('build', 'images', File.basename(f).sub(/\.ly$/, ''))

    sh LILYPOND, '--svg', '-o', output, f

    # crop svg
    sh 'inkscape',
       '--actions', 'select-all;fit-canvas-to-selection;export-overwrite;export-do',
       output + '.svg'
  end
end

file tmpfile('psalmodie.ly') => iafiles('nastroje/psalmtone.rb', 'psalmodie/zakladni.yml') do |t|
  sh "ruby #{t.prerequisites[0]} #{t.prerequisites[1]} > #{t.name}"
end
