const { google } = require('googleapis')
const api_key = require('./api_key.json').key
const sheets = google.sheets({ version: 'v4', auth: api_key })
const fs = require('fs')

sheets.spreadsheets.values.get({
  spreadsheetId: '1OgHy3c5Zed7N7JPu6elRwkyQStVDed-ESEqu-pmOfS8',
  range: 'A2:S',
}, (err, res) => {
  if (err) return console.log('The API returned an error: ' + err)
  const rows = res.data.values.filter(r => r.length)
  if (rows.length) {
    first_row = rows.shift()
    headers = {}
    for (let i = 0; i < first_row.length; ++i) {
      title = first_row[i].toUpperCase().replace(/\s|\-/g, '')
      if (title === '#') title = 'ID'
      else title = title.replace(/#/g, '')
      headers[title] = i
    }
    fs.writeFile('sheet-data.json', JSON.stringify({ headers, rows }, null, 2), 'utf8', () => {
      if (err) console.error(err)
      else console.log('Done.')
    })
  } else {
    console.log('No data found.')
  }
})

