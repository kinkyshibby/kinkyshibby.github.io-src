addEventListener('DOMContentLoaded', () => {

let compact_mode = 'localStorage' in window && localStorage.compact || 0

const get_compact_css = () => (compact_mode == 0 ? '' : `
  .description, .tag-container {
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tag-container { padding: 0.2em 0.8em; }
  .play-count { display: none; }
  .search-result {
    margin: 0;
    padding: .5em;
    grid-template-columns: auto 1fr;
    grid-template-rows: 1.5em 1.5em;
    grid-template-areas:
      "title tags"
      "description description";
  }
  .search-result:nth-child(odd) {
    background-color: #3c3c3c;
  }
`)

let compact_css = get_compact_css()

const input_element = document.getElementById('search_input')
input_element.focus()

const search_term = location.search.match(/s=([^&]*)/)
if (search_term)
  input_element.value = decodeURIComponent(search_term[1]).trim()

const get_keyword_selector = keyword => (keyword = keyword.trim()).length === 0 ? '' : `[data-title*="${keyword}"]`
const get_multikeyword_selector = value => `.search-result${value.length === 0 ? '' : value.split(',').reduce((lhs, term) => lhs + get_keyword_selector(term), '')} { display: grid !important; }`

const stylesheet = document.createElement('style')
stylesheet.type = 'text/css'
stylesheet.innerHTML = compact_css + get_multikeyword_selector(input_element.value.trim().toLowerCase())
document.head.appendChild(stylesheet)

const debounce = (func, delay) => {
  let timeout = null;
  return (...args) => {
    if (timeout !== null) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.call(null, ...args)
      timeout = null
    }, delay)
  }
}

input_element.addEventListener('input', debounce(() => stylesheet.innerHTML = compact_css + get_multikeyword_selector(input_element.value.trim().toLowerCase()), 10))
document.getElementById('button_random').addEventListener('click', () => stylesheet.innerHTML = `.search-result:nth-child(${Math.trunc(Math.random() * document.getElementsByClassName('search-result').length) + 1}) { display: grid !important; }`)

document.getElementById('button_compact').addEventListener('click', () => {
  compact_mode ^= 1
  'localStorage' in window && (localStorage.compact = compact_mode)
  compact_css = get_compact_css()
  input_element.dispatchEvent(new Event('input'), {
    'bubbles': true
  })
})

document.getElementById('dropdown_sort').addEventListener('input', ev => {

  const df = new DocumentFragment()

  const results = Array.from(document.getElementsByClassName('search-result'))
  results.forEach(el => el.parentElement.removeChild(el))

  let sort_func
  switch (ev.target.value) {

    case 'recent':
      sort_func = (a, b) => parseInt(a.getAttribute('data-release-order'), 10) - parseInt(b.getAttribute('data-release-order'), 10)
      break

    case 'views':
      sort_func = (a, b) => parseInt(b.getAttribute('data-play-count'), 10) - parseInt(a.getAttribute('data-play-count'), 10)
      break

  }
  results.sort(sort_func).forEach(el => df.appendChild(el))
  document.getElementById('search_result_container').appendChild(df)
})

window.append_tag = ev => {
  input_element.value += `${input_element.value.trim().length === 0 ? '' : ', '}${(ev.target || ev.srcElement).innerHTML}`
  input_element.dispatchEvent(new Event('input'), {
    'bubbles': true
  })
}

})
