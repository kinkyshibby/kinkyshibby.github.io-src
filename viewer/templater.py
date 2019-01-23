#!/usr/bin/env python3
import re

input_file = './src/template.html'
output_file = './src/index.html'


def repl(m):
  name = m.group(1)
  path = in_file.name[:in_file.name.rindex('/') + 1] + name
  ext = name[name.rindex('.') + 1:]

  prefix = ''
  postfix = ''
  if ext == 'css':
    prefix = f'<style type="text/css" title="{name}">\n'
    postfix = '\n</style>'
  elif ext == 'js':
    prefix = f'<script type="text/javascript">\n'
    postfix = '\n</script>'

  with open(path, 'rt', encoding="utf8") as f:
    return prefix + f.read() + postfix


if __name__ == '__main__':
  with open(output_file, 'wt', encoding="utf8") as out_file:
    with open(input_file, 'rt', encoding="utf8") as in_file:
      out_file.write(re.sub(r'<!--import\s*([^<>]+)\s*-->', repl, in_file.read()))
