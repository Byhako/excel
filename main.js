import './style.css'

const $ = el => document.querySelector(el)
const $$ = el => document.querySelectorAll(el)

const table = $('table')
const thead = table.querySelector('thead')
const tbody = table.querySelector('tbody')

const ROWS = 10
const COLUMNS = 4
let selectedColumn = null

const range = length => Array.from({ length }, (_, i) => i)

let state = range(COLUMNS)
  .map(() => range(ROWS)
    .map(() => ({ computedValue: 0, value: 0 }))
  )

const updateCell = (x, y, value) => {
  const newState = structuredClone(state)
  const constants = generateCellsConstast(state)

  const cell = newState[x][y]
  cell.value = value
  cell.computedValue = computedValue(value, constants)

  newState[x][y] = cell

  computedAllCells(newState, generateCellsConstast(newState))

  state = newState

  renderSpreadsheet()
}

const generateCellsConstast = (cells) => {
  return cells.map((rows, x) => {
    return rows.map((row, y) => {
      const letter = String.fromCharCode(65 + x)
      const cellId = `${letter}${y + 1}`
      return `const ${cellId} = ${row.computedValue};`
    }).join('\n')
  }).join('\n')
}

const computedValue = (value, constants) => {
  if (typeof value === 'number') return value
  if (!value.startsWith('=')) return value

  const formula = value.slice(1)
  let result = 0
  try {
    result = eval(`( () => {
      ${constants}
      return ${formula}
      })()`
    )
  } catch (error) {
    result = `Error: ${error.message}`
  }

  return result
}

const computedAllCells = (cells, constants) => {
  cells.forEach((cell) => {
    cell.forEach((row) => {
      row.computedValue = computedValue(row.value, constants)
    })
  })
}

const renderSpreadsheet = () => {

  const headerHtml = `
    <tr>
      <th></th>
      ${range(COLUMNS).map(i => `<th>${String.fromCharCode(65 + i)}</th>`).join('')}
    </tr>
  `

  thead.innerHTML = headerHtml

  const rows = range(ROWS).map(row => `
    <tr>
      <td>${row + 1}</td>
      ${range(COLUMNS).map(col => `
        <td data-x='${col}' data-y='${row}'>
          <span>${state[col][row].computedValue}</span>
          <input type='text' value='${state[col][row].value}' />
        </td>`
      ).join('')}
    </tr>
  `).join('')

  tbody.innerHTML = rows
}

tbody.addEventListener('click', e => {
  const td = e.target.closest('td')
  if (!td) return

  const { x, y } = td.dataset
  const input = td.querySelector('input')
  const end = input.value.length

  input.setSelectionRange(end, end)

  input.focus()

  $$('.selected').forEach(td => {
    td.classList.remove('selected')
  })
  selectedColumn = null

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      input.blur()
    }
  })

  input.addEventListener('blur', () => {
    if (input.value === state[x][y].value) return

    updateCell(x, y, input.value)
  }, { once: true })
})

thead.addEventListener('click', e => {
  const th = e.target.closest('th')
  if (!th) return

  const x = [...th.parentNode.children].indexOf(th)

  if (x <= 0) return

  selectedColumn = x - 1

  $$('.selected').forEach(td => {
    td.classList.remove('selected')
  })

  th.classList.add('selected')
  $$(`tr td:nth-child(${x+1})`).forEach(td => {
    td.classList.add('selected')
  })
})

document.addEventListener('keydown', e => {
  if (e.key === 'Delete' && selectedColumn !== null) {
    range(ROWS).forEach(row => {
      updateCell(selectedColumn, row, 0)
    })

    selectedColumn = null
    renderSpreadsheet()
  }
})

document.addEventListener('copy', e => {
  if (selectedColumn !== null) {
    const columnsValues = range(ROWS).map(row => (
      state[selectedColumn][row].computedValue
    ))

    e.clipboardData.setData('text/plain', columnsValues.join('\n'))
    e.preventDefault()
  }
})

document.addEventListener('click', e => {
  const { target } = e

  const isThClicked = target.closest('th')
  const isTdClicked = target.closest('td')

  if (!isThClicked && !isTdClicked) {
    $$('.selected').forEach(td => {
      td.classList.remove('selected')
    })
    selectedColumn = null
  }
})

renderSpreadsheet()
