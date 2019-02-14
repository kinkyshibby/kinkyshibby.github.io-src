const fs = require('fs')
const fsPromises = fs.promises
const https = require('https')

const webpage_url = 'https://www.soundgasm.net/u/kinkyshibby'
const cache_file_path = 'cache.html'

// Native fetch does not support https
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, result => {
      if (result.statusCode !== 200) {
        console.error(`Failed to get ${url} with status code ${result.statusCode}.`, result)
        return
      }
      result.setEncoding('utf8')
      let data = ''
      result.on('data', chunk => data += chunk)
      result.on('end', () => resolve(data))
    })
  })
}

async function download_webpage(url, file_path) {
  const page_content = await fetch(url)

  const file = await fsPromises.open(file_path, 'w')
  await file.writeFile(page_content, 'utf8')
  file.close()

  return file_path
}

async function scrape_webpage(file_path) {
  const file_content = await new Promise((resolve, reject) => {
    fs.readFile(file_path, (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })

  const audio_regex = /<div class="sound-details"><a href="([^"]+)">([^<>]*)<\/a><\/br><span class="soundDescription">([^<>]*)<\/span><\/br><span class="playCount">Play Count: (\d+)<\/span><\/div>/g
  const audio_list = []
  for (let groups = []; groups = audio_regex.exec(file_content);) {
    const link = groups[1]
    let title = groups[2].replace(/,/g, '')
    const description = groups[3]
    const play_count = groups[4]
    const tags = (title.match(/\[[^\[\]]+\]/g) || []).map(t => t.slice(1, -1))
    title = title.replace(/\[[^\[\]]*\]/g, '').replace(/\s+/g, ' ').trim()
    audio_list.push({ link, title, description, play_count, tags })
  }
  return audio_list
}

function build_audio_list_markup() {
  fs.writeFile('audio_list.html', require('./audio_list.json').reduce((lhs, audio, i) =>
    lhs + `<div class="search-result" data-title="${audio.title.toLowerCase() + ' ' + audio.tags.join(' ').toLowerCase()}" data-release-order="${i}" data-play-count="${audio.play_count}<">
             <a class="title" href="${audio.link}" title="${audio.link}" target="_blank">${audio.title}</a>
             <div class="play-count"><i class="fas fa-eye"></i> ${audio.play_count}</div>
             <div class="description">${audio.description}</div>
             <div class="tag-container">${audio.tags.map(t => `<div class="tag" onclick="append_tag(event)">${t}</div>`).join('&nbsp;&nbsp;&middot;&nbsp; ')}</div>
           </div>`, ''), 'utf8', err => { if (err) throw err })
}

(async () => {
  if (!fs.existsSync(cache_file_path))
    await download_webpage(webpage_url, cache_file_path)

  const audio_list = await scrape_webpage(cache_file_path)

  if (fs.existsSync('audio_list.json')) {
    const file = await fsPromises.open('audio_list.json', 'r')
    const res = JSON.parse(await file.readFile('utf8'))
    file.close()
    if (res.length === audio_list.length) {
      console.log('No new audios.')
    } else {
      console.log('New audio found!')
      const file = await fsPromises.open('.new_audio', 'w')
      await file.writeFile('', 'utf8')
      file.close()
    }
  }

  fs.writeFile('audio_list.json', JSON.stringify(audio_list, null, 2), 'utf8', err => {
    if (err) throw err
    build_audio_list_markup()
  })
})()
