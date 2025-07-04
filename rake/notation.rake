# Tasks generating notation

desc 'psalm tone notation'
task notated_tones: 'source/images/psalmodie_I-a.svg'

file 'source/images/psalmodie_I-a.svg' => [iafile('nastroje/splitscores.rb'), tmpfile('psalmodie.ly'), __FILE__] do |t|
  splitscores_options = ['--ids', '--prepend-text', '\version "2.19.0"   \include "src/lilypond/psalmtone.ly"']
  ruby *t.prerequisites[0..-2].tap {|pre| pre.insert(1, *splitscores_options) }

  Dir[tmpfile('*_*.ly')].each do |f|
    # add the respective symbol as a mark to each divisio
    script = <<~'EOS'
    puts $_
      &.gsub('\\barMin', '\\mark\\mFlexa \0')
      &.gsub('\\barMaior', '\\mark\\mAsterisk \0')
    EOS
    sh 'ruby', '-n', '-i.bak', '-e', script, f

    output = File.join('source', 'images', normalize_psalm_tone_fname(File.basename(f).sub(/\.ly$/, '')))
    sh LILYPOND, '-dno-point-and-click', '--svg', '-o', output, f

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
