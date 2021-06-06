// calc86 by Dylan Sharhon, 2021
const $  = id  => document.getElementById(id)
const $$ = css => document.querySelectorAll(css)

// Isomorphic touch and mouse event handlers (Dylan Sharhon)
const addHandlers = (element, handlers) => {
  const { onPress, onRelease, onHold, holdDelay = 750 } = handlers

  let holdTimeout = null

  const release = event => {
    event.preventDefault()
    if (onHold) clearTimeout(holdTimeout)
    if (onRelease) onRelease(element)
  }

  const press = event => {
    event.preventDefault()
    if (onHold) {
      clearTimeout(holdTimeout)
      holdTimeout = setTimeout(() => onHold(element), holdDelay)
    }
    if (onPress) onPress(element)
  }

  element.addEventListener('touchstart', press)
  element.addEventListener('mousedown', press)
  element.addEventListener('touchend', release)
  element.addEventListener('mouseup', release)
}

// History and input caret display
const display = {
  clear () {
    $('a').innerText = $('b').innerText = $('c').innerText = ''
  },
  reset () {
    $('a').innerText = $('b').innerText = $('c').innerText = ''
    const h = $('scrollable')
    while (h.firstChild) h.removeChild(h.lastChild)
    display.resetScroll()
  },
  insert (text) {
    $('a').innerText += text
  },
  delete () {
    $('a').innerText = $('a').innerText.slice(0, -1)
  },
  left () {
    const a = $('a').innerText
    const b = $('b').innerText
    const c = $('c').innerText
    if (!a) return display.up()
    $('a').innerText = a.slice(0, -1)
    $('b').innerText = a.slice(-1)
    $('c').innerText = b + c
  },
  right () {
    const a = $('a').innerText
    const b = $('b').innerText
    const c = $('c').innerText
    if (!b) return display.down()
    $('a').innerText = a + b
    $('b').innerText = c.slice(0, 1)
    $('c').innerText = c.slice(1)
  },
  home () {
    const a = $('a').innerText
    const b = $('b').innerText
    const c = $('c').innerText
    if (!a) return
    $('a').innerText = ''
    $('b').innerText = a.slice(0, 1)
    $('c').innerText = a.slice(1) + b + c
  },
  end () {
    const a = $('a').innerText
    const b = $('b').innerText
    const c = $('c').innerText
    if (!b) return
    $('a').innerText = a + b + c
    $('b').innerText = ''
    $('c').innerText = ''
  },
  scroll: -1,
  resetScroll: () => display.scroll = -1,
  up () {
    const history = [...$$('#scrollable > div')].reverse()
    if (history.length === 0) return
    if (display.scroll < history.length - 1) display.scroll++
    $('a').innerText = $('b').innerText = $('c').innerText = ''
    $('a').innerText = history[display.scroll].innerText
    display.home()
  },
  down () {
    const history = [...$$('#scrollable > div')].reverse()
    if (history.length === 0) return
    if (display.scroll === -1) return
    display.scroll--
    $('a').innerText = $('b').innerText = $('c').innerText = ''
    if (display.scroll === -1) return
    $('a').innerText = history[display.scroll].innerText
  },
  bottom () {
    const lastElementChild = $('scrollable').lastElementChild
    if (lastElementChild) lastElementChild.scrollIntoView(true)
    display.resetScroll()
  },
  print (equation, result) {
    const history0 = document.createElement('div')
    history0.className = 'input'
    history0.innerText = equation
    $('scrollable').appendChild(history0)

    const history1 = document.createElement('div')
    history1.className = 'output'
    history1.innerText = result
    $('scrollable').appendChild(history1)
  }
}

// Text insertion (any button without an ID)
const insert = element => {
  let text = element.innerText
  if (text.length > 1 && !text.includes('_')) text += '(' // function convenience
  display.insert(text)
}
$$('.no, .op, .fn, .co, .exp').forEach(button => {
  if (!button.id) addHandlers(button, { onPress: insert })
})

// Paging navigation
const pages = [$('page0'), $('page1'), $('page2')]
const goToPage = n => pages.forEach((page, i) => page.hidden = n !== i)
$$('#page2-0, #page1-0').forEach(b => addHandlers(b, { onPress: () => goToPage(0) }))
$$('#page0-1, #page2-1').forEach(b => addHandlers(b, { onPress: () => goToPage(1) }))
$$('#page1-2, #page0-2').forEach(b => addHandlers(b, { onPress: () => goToPage(2) }))
$$('#page1 .fn').forEach(button => addHandlers(button, { onPress: () => goToPage(0) }))
$$('#page2 .co').forEach(button => addHandlers(button, { onPress: () => goToPage(0) }))

// Cursor navigation
addHandlers($('left'),   { onPress: display.left,   onHold: display.home  })
addHandlers($('right'),  { onPress: display.right,  onHold: display.end   })
addHandlers($('delete'), { onPress: display.delete, onHold: display.clear })

// Clipboard (HTTPS and onclick required on iOS)
const copy = () => {
  const text = $('input').innerText
  if (!navigator.clipboard || !navigator.clipboard.writeText)
  return alert('Your browser has no clipboard support.')
  navigator.clipboard.writeText(text)
  .then(() => alert('Copied "' + text + '"'))
  .catch(e => alert(e))
}
const paste = () => {
  if (!navigator.clipboard || !navigator.clipboard.readText)
  return alert('Your browser has no clipboard support.')
  navigator.clipboard.readText()
  .then(text => display.insert(text || ''))
  .catch(() => setTimeout(() => display.insert))
}
$('copy1').onclick = copy
$('copy2').onclick = copy
$('paste1').onclick = paste
$('paste2').onclick = paste

// Reset
$('cls1').onclick = () => location = location
$('cls2').onclick = () => location = location

// Formats the output as decimal from 0.1 thou <= x < 10 billion, engineering from 1 nanometer <= x < 1 quintillion, and otherwise scientific
math.config({ number: 'BigNumber', precision: 128 })
const prettyBig = big => {
  if (math.evaluate(`abs(bignumber(${big})) < 1e-100`)) return '0'
  if (math.evaluate(`abs(bignumber(${big})) < 1e-9  `)) return math.format(big,  { precision:  9, notation: 'exponential' })
  if (math.evaluate(`abs(bignumber(${big})) < 1e-8  `)) return math.format(big,  { precision:  7, notation: 'engineering' })
  if (math.evaluate(`abs(bignumber(${big})) < 1e-7  `)) return math.format(big,  { precision:  8, notation: 'engineering' })
  if (math.evaluate(`abs(bignumber(${big})) < 1e-6  `)) return math.format(big,  { precision:  9, notation: 'engineering' })
  if (math.evaluate(`abs(bignumber(${big})) < 1e-5  `)) return math.format(big,  { precision:  7, notation: 'engineering' })
  if (math.evaluate(`abs(bignumber(${big})) < 1e-4  `)) return math.format(big,  { precision:  8, notation: 'engineering' })
  if (math.evaluate(`abs(bignumber(${big})) < 1e-3  `)) return math.format(big,  { precision:  9, lowerExp: -4 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e-2  `)) return math.format(big,  { precision:  7, lowerExp: -3 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e-1  `)) return math.format(big,  { precision:  8, lowerExp: -2 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+0  `)) return math.format(big,  { precision:  9, lowerExp: -1 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+1  `)) return math.format(big,  { precision:  7 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+2  `)) return math.format(big,  { precision:  8 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+3  `)) return math.format(big,  { precision:  9 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+4  `)) return math.format(big,  { precision:  7 }) // keep only 3 decimal digits
  if (math.evaluate(`abs(bignumber(${big})) < 1e+5  `)) return math.format(big,  { precision:  8, upperExp:  6 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+6  `)) return math.format(big,  { precision:  9, upperExp:  7 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+7  `)) return math.format(big,  { precision: 10, upperExp:  8 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+8  `)) return math.format(big,  { precision: 11, upperExp:  9 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+9  `)) return math.format(big,  { precision: 12, upperExp: 10 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+10 `)) return math.format(big,  { precision: 10, upperExp: 11 })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+11 `)) return math.format(big,  { precision: 11, notation: 'engineering'  })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+12 `)) return math.format(big,  { precision: 12, notation: 'engineering'  })
  if (math.evaluate(`abs(bignumber(${big})) < 1e+12 `)) return math.format(big,  { precision: 13, notation: 'engineering'  })
  if (math.evaluate(`abs(bignumber(${big})) > 1e+100`)) return 'overflow'
  return math.format(big, 5)
}
function evaluate () {

  // Move the cursor to the end
  display.end()

  // Insert any closing brackets necessary
  const raw = $('input').innerText
  if (!raw) return
  const closers = raw.split('(').length - raw.split(')').length
  for (let i = 0; i < closers; i++) display.insert(')')

  const equation = $('input').innerText
  .split('log').join(' log10 ')
  .split('ln' ).join(' log ')
  .split('fact').join('factorial')

  .split('π').join(' PI ')
  .split('m_e').join(' L ')
  .split('m_p').join(' M ')
  .split('m_n').join(' N ')
  .split('q_e').join(' Q ')
  .split('f_Cs').join(' F ')
  .split('ε_0').join(' V ')
  .split('µ_0').join(' U ')
  .split('¢').join(' C ')
  .split('G').join(' G ')
  .split('ħ').join(' H ')
  .split('N_A').join(' A ')
  .split('k_B').join(' B ')

  const scope = {
    'C': math.bignumber('299792458'),
    'G': math.bignumber('6.67430E-11'),
    'H': math.bignumber('1.054571817E-34'),
    'F': math.bignumber('9192631770'),
    'Q': math.bignumber('1.602176634E-19'),
    'L': math.bignumber('9.1093837015E-31'),
    'M': math.bignumber('1.6726231E-27'),
    'N': math.bignumber('1.6749286E-27'),
    'A': math.bignumber('6.02214076E23'),
    'V': math.bignumber('8.8541878128E-12'),
    'B': math.bignumber('1.380649E-23'),
    'U': math.bignumber('1.25663706212E-6')
  }

  try {
    console.log('===\nEvaluating:', equation)
    const result = math.evaluate(equation, scope)
    console.log('Raw result:', ''+result, result)

    // The result can be a BigNumber object (high precision) or a Complex object (float precision)
    let out
    if (!result.im) {
      out = math.format(result, prettyBig)
      console.log('Formatted bignumber:', out)
    } else {
      // https://github.com/josdejong/mathjs/issues/550#issuecomment-220121867
      const complex = result.format(7)
      console.log('Formatted complex:', complex)

      const result2 = math.evaluate(complex)
      console.log('Reevaluated result:', ''+result2, result2)
      out = result2.toString()

      // TODO The rounded result might just be a bignumber now
      /*if (!result2.im) {
        const bignumber = result2
        out = math.format(bignumber, prettyBig)
      } else {
        console.log('Components:', result2.re, result2.im)
        let re = math.format(result2.re, prettyBig)
        let im = math.format(result2.im, prettyBig)
        if (re === '0') re = ''
        if (im ===  '0') im =   '' else
        if (im ===  '1') im =  'j' else
        if (im === '-1') im = '-j' else
        else
        if (im.startsWith

        if (re && im) out = re + ' ' +
      }*/
    }

    //out = out.split('i').join('j')
    display.print($('input').innerText, out)
    display.bottom()
    display.clear()
  } catch (error) {
    console.error(error)
    alert(error)
  }
}
addHandlers($('enter'), { onPress: evaluate })

$('help-button').onclick = () => {
  $$('#history-row, #input-row, #keypad-row').forEach(e => e.hidden = true)
  $('help-row').hidden = false
}
$('help').onclick = () => {
  $$('#history-row, #input-row, #keypad-row').forEach(e => e.hidden = false)
  $('help-row').hidden = true
}

display.reset()
