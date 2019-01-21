const fs = require('fs')
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
  return await new Promise((resolve, reject) => {
    fs.writeFile(file_path, page_content, 'utf8', err => {
      if (err) reject(err)
      resolve(file_path)
    })
  })
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
    audio_list.push({
      link: groups[1],
      title: groups[2].replace(/,/g, ''),
      description: groups[3],
      play_count: groups[4]
    })
  }
  return audio_list
}

function build_audio_list_markup() {
  fs.writeFile('audio_list.html', require('./audio_list.json').reduce((lhs, audio) =>
    lhs + `<div class="search-result" data-title="${audio.title.toLowerCase()}">
            <a class="title" href="${audio.link}" title="${audio.link}" target="_blank">${audio.title}</a>
            <div class="play-count"><i class="fas fa-eye"></i> ${audio.play_count}</div>
            <div class="description">${audio.description}</div>
          </div>`, ''), 'utf8', err => { if (err) throw err })
}

(async () => {
  if (!fs.existsSync(cache_file_path))
    await download_webpage(webpage_url, cache_file_path)

  fs.writeFile('audio_list.json', JSON.stringify(await scrape_webpage(cache_file_path), null, 2), 'utf8', err => {
    if (err) throw err
    build_audio_list_markup()
  })
})()