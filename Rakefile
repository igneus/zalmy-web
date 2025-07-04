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

# differentiae like "D'" or "G*" are not file-name-friendly
def normalize_psalm_tone_fname(fname)
  fname.sub(/[^\w]$/, 'x')
end

require iafile('nastroje/psalmtone.rb')

import *Dir['rake/*.rake']

desc 'generated files not managed by Middleman'
task generated_files: %i[tones_data notated_tones psalter proper]

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
