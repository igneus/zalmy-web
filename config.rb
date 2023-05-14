# Activate and configure extensions
# https://middlemanapp.com/advanced/configuration/#configuring-extensions

require 'dotenv/load'
require 'pslm'

IN_ADIUTORIUM_PATH = ENV['IN_ADIUTORIUM_PATH'] || raise('envvar required')

module Psalms
  extend self

  Psalm = Struct.new(:title, :path, :path_name, :is_canticle) do
    def web_path
      "/#{is_canticle ? 'kantikum' : 'zalm'}/#{path_name.sub(/zalm|kantikum_/, '')}.html"
    end
  end

  def all
    reader = Pslm::PslmReader.new

    Dir[File.join(IN_ADIUTORIUM_PATH, 'antifonar', 'zalmy', '*.zalm')]
      .reject {|i| i =~ /doxologie|responsorialni|pascha/ }
      .sort
      .collect do |i|
      Psalm.new(
        reader.read_str(File.read(i)).header.title,
        i,
        File.basename(i).sub(/\.zalm$/, ''),
        File.basename(i).start_with?('kantikum')
      )
    end
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

# Helpers
# Methods defined in the helpers block are available in templates
# https://middlemanapp.com/basics/helper-methods/

helpers do
  def all_psalms
    Psalms.all
  end
end

# Build-specific configuration
# https://middlemanapp.com/advanced/configuration/#environment-specific-settings

# configure :build do
#   activate :minify_css
#   activate :minify_javascript
# end
