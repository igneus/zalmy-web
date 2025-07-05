# Tasks generating files in the data/ directory

desc 'YAML with metadata of psalm tones'
task tones_data: 'data/psalm_tones.yaml'

file 'data/psalm_tones.yaml' => [iafile('psalmodie/zakladni.yml'), __FILE__] do |task|
  r = PsalmToneGroup.from_file(task.prerequisites[0]).each_pair.collect do |name,tone|
    t = tone.all.first.quantities
    {
      'name' => tone.name.sub(/^_/, ''),
      'mediation' => {
        'accents' => t.first_accents,
        'preparatory' => t.first_preparatory,
        'sliding' => t.first_sliding_accent,
      },
      'differentiae' => tone.all.collect do |i|
        d = i.quantities
        {
          'name' => i.diff,
          'image' => '/images/' + psalm_tone_filename(i),

          'accents' => d.second_accents,
          'preparatory' => d.second_preparatory,
          'sliding' => d.second_sliding_accent,
        }
      end
    }
  end

  File.write task.name, YAML.dump(r)
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
