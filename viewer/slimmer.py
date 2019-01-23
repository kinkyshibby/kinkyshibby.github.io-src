#!/usr/bin/env python3
import re

file_path = './dist/index.html'
file_content = ''

with open(file_path, 'rt', encoding="utf8") as f:
  file_content = f.read()

with open(file_path, 'wt', encoding="utf8") as f:
  f.write(re.sub(r'>\s+<', '><', file_content))
