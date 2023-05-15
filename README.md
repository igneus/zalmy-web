# Žalmy

Code generating a static website with Czech psalms pointed for chant,
leveraging data and tools of the [In adiutorium][ia] project.

## Prerequisites

- ruby
- LilyPond
- Inkscape 1.2

## Building

- get [In adiutorium][ia] sources: `$ git clone https://github.com/igneus/In-adiutorium.git`
- set required paths in configuration - either copy `.env.template` to `.env` and edit as specified there, or use another way to set the same environment variable(s)
- `$ bundle install`
- `$ bundle exec rake`

## Developing

This is a static website built using [Middleman][middleman].

`$ bundle exec rake server` builds dependencies (those not managed
by Middleman) and starts local development server.

[ia]: https://github.com/igneus/In-adiutorium
[middleman]: https://middlemanapp.com/
