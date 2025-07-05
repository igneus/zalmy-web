require 'json'

require 'dotenv/load'

IAP = IN_ADIUTORIUM_PATH = 'IN_ADIUTORIUM_PATH'.yield_self do |name|
  ENV[name] || raise("please set environment variable #{name}")
end
LILYPOND = ENV['LILYPOND'] || 'lilypond'

def tmpfile(path)
  File.join 'tmp', path
end

# expand path relative to the In adiutorium sources root to an absolute path
def iafile(path)
  File.join IN_ADIUTORIUM_PATH, path
end

def iafiles(*paths)
  paths.collect(&method(:iafile))
end

# accepts a psalm tone representation as defined in psalmtone.rb,
# returns a file name of the tone's image
def psalm_tone_filename(tone)
  'psalmodie_' +
    tone.score_id.sub(/[^\w]$/, 'x') + # differentiae like "D'" or "G*" are not file-name-friendly
    '.svg'
end

require iafile('nastroje/psalmtone.rb')

import *Dir['rake/*.rake']

desc 'generated files not managed by Middleman'
task generated_files: %i[data_files notated_tones]

desc 'delete all build files'
task(:clean) { sh 'rm -rf build/*/*' }

desc 'build static website for deployment'
task build: [:generated_files] do
  sh 'middleman', 'build'
end

desc 'start local server'
task server: [:generated_files] do
  sh 'middleman', 'server'
end

task default: :build
