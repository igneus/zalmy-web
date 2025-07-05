# Tasks generating notation

notation_images =
PsalmToneGroup
  .from_file(iafile('psalmodie/zakladni.yml'))
  .each_pair
  .flat_map {|_, tone| tone.all.collect(&:score_id) }
  .each
  .with_index(1)
  .collect do |score_id, i|
  # LilyPond produces numbered pages, we pair them to psalm tone names
  svg_page = tmpfile("psalmodie-#{i}.svg")
  output = File.join('source', 'images', normalize_psalm_tone_fname("psalmodie_#{score_id}") + '.svg')

  file svg_page => [tmpfile('psalmodie.ly'), 'src/lilypond/psalmtone.ly', __FILE__] do |t|
    Dir.chdir('tmp') do
      sh LILYPOND, '-dno-point-and-click', '--svg', File.basename(t.prerequisites[0])
    end
  end

  # the hardcoded fake dependency of all output files on
  # psalmodie-1.svg is intentional, it prevents lilypond to be started
  # in several parallel instances, while it only really needs to run once
  file output => [tmpfile("psalmodie-1.svg"), __FILE__] do |t|
    # crop svg
    sh 'inkscape',
       '--actions', 'select-all;fit-canvas-to-selection;export-overwrite;export-do',
       svg_page

    cp svg_page, output
  end

  output
end

desc 'psalm tone notation'
multitask notated_tones: notation_images

file tmpfile('psalmodie.ly') => iafiles('nastroje/psalmtone.rb', 'psalmodie/zakladni.yml') + [__FILE__] do |t|
  FileUtils.mkdir_p 'tmp'
  preamble = '\\version "2.19.0"   \\include "../src/lilypond/psalmtone.ly"'
  sh "ruby #{t.prerequisites[0]} --preamble #{preamble.inspect} #{t.prerequisites[1]} > #{t.name}"

  # each score on a separate page
  script = <<~'EOS'
  $_.gsub!(/^\}/, "}\n\\pageBreak")
  EOS
  ruby '-p', '-i', '-e', script, t.name

  # add the respective symbol as a mark to each divisio
  script = <<~'EOS'
  $_.gsub!('\\barMin', '\\mark\\mFlexa \0')
  $_.gsub!('\\barMaior', '\\mark\\mAsterisk \0')
  EOS
  ruby '-p', '-i.bak', '-e', script, t.name
end
