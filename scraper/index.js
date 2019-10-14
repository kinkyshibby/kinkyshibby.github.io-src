const fs = require('fs')
const fsPromises = fs.promises
const https = require('https')
const cheerio = require('cheerio')
const request = require('request-promise-native')

const webpage_url = 'https://www.soundgasm.net/u/kinkyshibby'
const cache_file_path = 'cache.html'

const patreon_post_url = 'https://www.reddit.com/r/ShibbySays/comments/ay0gaw/regularly_updated_list_of_currently_patreon_only/'
// const patreon_post_url = 'https://old.reddit.com/r/ShibbySays/comments/ay0gaw/regularly_updated_list_of_currently_patreon_only/'
const patreon_file_path = 'patreon_post.html'

function clean_title(str) {
  const regex = /\]?[ ]*([^\[\]]+)[ ]*\[/m
  let m = str.match(regex);
  if (m) return m[1].trim();
  return str.replace(/\[.*?\]/g, '').trim()
}

function extract_tags(str) {
  const unique_tags = new Set(str.match(/\[[^\[\]]+\]/g) || [])
  return Array.from(unique_tags).map(t => t.slice(1, -1))
}

// Native fetch does not support https
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, result => {
      if (result.statusCode !== 200) {
        reject(`Failed to get ${url} with status code ${result.statusCode}.`)
        return
      }
      result.setEncoding('utf8')
      let data = ''
      result.on('data', chunk => data += chunk)
      result.on('end', () => resolve(data))
    })
  })
}

async function download_webpage(url, file_path, cookie_str) {
  let options = { url }
  if (cookie_str) {
    options.jar = request.jar()
    options.jar.setCookie(request.cookie(cookie_str), url, { ignoreError: true })
  }

  try {
    const page_content = await request(options)
    // const page_content = await fetch(url)

    const file = await fsPromises.open(file_path, 'w')
    await file.writeFile(page_content, 'utf8')
    file.close()
  } catch (err) {
    throw new Error(`${err}: Failed to download webpage "${url}" to "${file_path}"`)
  }

  return file_path
}

function get_soundgasm_id(url) {
  url = url.toLowerCase()
  const delim = 'soundgasm.net/u/kinkyshibby/'
  return url.substr(url.indexOf(delim) + delim.length)
}

async function scrape_webpage(file_path) {
  const file_content = await new Promise((resolve, reject) => {
    fs.readFile(file_path, (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })

  const sheet_content = await new Promise((resolve, reject) => {
    fs.readFile('sheet-data.json', (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })

  const sheet_json = JSON.parse(sheet_content)
  const SOUNDGASMLINK = sheet_json.headers['SOUNDGASMLINK']
  const GWALINK = sheet_json.headers['GWALINK']
  const reddit_links = {}

  for (const row of sheet_json.rows)
    if (row.hasOwnProperty(GWALINK) && row[GWALINK].replace(/\?/g, '').trim().length > 0)
      reddit_links[get_soundgasm_id(row[SOUNDGASMLINK])] = row[GWALINK]

  const audio_regex = /<div class="sound-details"><a href="([^"]+)">([^<>]*)<\/a><\/br><span class="soundDescription">([^<>]*)<\/span><\/br><span class="playCount">Play Count: (\d+)<\/span><\/div>/g
  const audio_list = []
  for (let groups = []; groups = audio_regex.exec(file_content);) {
    const soundgasm_link = groups[1]
    const reddit_link = reddit_links[get_soundgasm_id(soundgasm_link)]
    let title = groups[2].replace(/,|"/g, '')
    const description = groups[3]
    const play_count = groups[4]
    const tags = extract_tags(`${title} ${description}`)
    // title = title.replace(/\[[^\[\]]*\]/g, '').replace(/\s+/g, ' ').trim()
    title = clean_title(title)
    audio_list.push({ link: soundgasm_link, title, description, play_count, tags, gwa: reddit_link })
  }
  return audio_list
}

async function scrape_patreon_post(file_path) {
  const file_content = await new Promise((resolve, reject) => {
    fs.readFile(file_path, 'utf8', (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
  const audio_list = []

  const doc = cheerio.load(file_content)
  let paragraph_list = []

  doc('p a')
    .filter((i, elm) => /https\:\/\/www\.patreon\.com\/posts\/.+/g.exec(doc(elm).attr('href')))
    .each((i, elm) => {
      let title = doc(elm).parent().text()
      if (title.includes('[')) {
        const link = doc(elm).attr('href')
        const description = doc(elm).parent().next().text()
        const tags = ['Patreon Only', ...extract_tags(`${title} ${description}`)]
        // title = title.replace(/\[[^\[\]]*\]/g, '').replace(/\s+/g, ' ').trim()
        title = clean_title(title)
        audio_list.push({
          title,
          link,
          description,
          tags,
          patreon_only: 1,
          gwa: 'https://www.reddit.com/r/ShibbySays/comments/ay0gaw/regularly_updated_list_of_currently_patreon_only/'
        })
      }
    })

  return audio_list
}

function build_audio_list_markup() {
  fs.writeFile('audio_list.html', require('./audio_list.json').reduce((lhs, audio, i) =>
    lhs + `<div class="search-result" data-title="${audio.title.toLowerCase().replace(/\./g, '') + ' ' + audio.tags.join(' ').toLowerCase()}" data-release-order="${i}" data-play-count="${audio.play_count}<">
             <a class="title" href="${audio.link}" title="${audio.link}" target="_blank">${audio.title}</a>
             <div class="gwa-link">${ audio.gwa !== undefined ? `<a href="${audio.gwa}" target="_blank"><i class="fab fa-reddit-alien"></i> Reddit</a>` : ''}</div>
             <div class="play-count">${(audio.patreon_only !== undefined) ? ('Patreon Only') : (`<i class="fas fa-eye"></i> ${audio.play_count}`) }</div>
             <div class="description">${audio.description}</div>
             <div class="tag-container">${audio.tags.map(t => `<div class="tag" onclick="append_tag(event)">${t}</div>`).join('&nbsp;&nbsp;&middot;&nbsp; ')}</div>
           </div>`, ''), 'utf8', err => { if (err) throw err })
}

(async () => {
  if (!fs.existsSync(cache_file_path)) {
    try {
      await download_webpage(webpage_url, cache_file_path)
    } catch (err) {
      console.error(err)
      return
    }
  }

  let audio_list = await scrape_webpage(cache_file_path)

  if (!fs.existsSync(patreon_file_path)) {
    try {
      await download_webpage(patreon_post_url, patreon_file_path, 'over18=1')
    } catch (err) {
      console.error(err)
      return
    }
  }

  const patreon_audios = await scrape_patreon_post(patreon_file_path)
  audio_list = [...audio_list, ...patreon_audios]

  let new_audio = true
  if (fs.existsSync('audio_list.json')) {
    const file = await fsPromises.open('audio_list.json', 'r')
    const res = JSON.parse(await file.readFile('utf8'))
    file.close()
    if (res.length === audio_list.length) {
      console.log('No new audios.')
      new_audio = false
    }
  }
  if (new_audio) {
    console.log('New audio found!')
    const file = await fsPromises.open('.new_audio', 'w')
    await file.writeFile('', 'utf8')
    file.close()
  }

  fs.writeFile('audio_list.json', JSON.stringify(audio_list, null, 2), 'utf8', err => {
    if (err) throw err
    build_audio_list_markup()
  })
})()
