const input_element = document.getElementById('search_input')
input_element.focus()

const search_term = decodeURI(location.search).match(/s=([^&]*)/)
if (search_term) input_element.value = search_term[1].trim()

const get_keyword_selector = keyword => (keyword = keyword.trim()).length === 0 ? '' : `[data-title*="${keyword}"]`
const get_multikeyword_selector = value => `.search-result${value.length === 0 ? '' : value.split(',').reduce((lhs, term) => lhs + get_keyword_selector(term), '')} { display: grid !important; }`

const stylesheet = document.createElement('style')
stylesheet.type = 'text/css'
stylesheet.innerHTML = get_multikeyword_selector(input_element.value)
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

input_element.addEventListener('input', debounce(() => stylesheet.innerHTML = get_multikeyword_selector(input_element.value.trim().toLowerCase()), 10))
document.getElementById('button_random').addEventListener('click', () => stylesheet.innerHTML = `.search-result:nth-child(${Math.trunc(Math.random() * document.getElementsByClassName('search-result').length) + 1}) { display: grid !important; }`)

window.append_tag = ev => {
  input_element.value += `${input_element.value.trim().length === 0 ? '' : ', '}${(ev.target || ev.srcElement).innerHTML}`
  input_element.dispatchEvent(new Event('input'), { 'bubbles': true })
}