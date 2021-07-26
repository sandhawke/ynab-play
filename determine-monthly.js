const bud = require('./budget-snapshot.json')
const columnify = require('columnify')

const ts = bud.transactions

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

const prefixes = [
  'ACTBLUE',
  'AMAZON.COM',
  'AMERICAN GEN LIF DES:INS PAYMT',
  'BKOFAMERICA MOBILE',
  'CAPITAL ONE',
  'CASTELLO SOLAR',
  'CITI CARD ONLINE DES:PAYMENT',
  'GGSERVERS',
  'GUARDIAN NEWS',
  'IRS',
  'KINDLE SVCS',
  'MA DUA',
  'PRUDENTIAL',
  'WHATBOX',
  'ZELLE',
]

const payeeName = {}
const rawPayeeName = {}
for (const p of bud.payees) {
  let name = p.name
  for (const pre of prefixes) {
    if (name.toUpperCase().startsWith(pre)) name = pre
  }
  payeeName[p.id] = name
  rawPayeeName[p.id] = p.name
}
// okay to add some aliases....



const chart = {}

function add (dt, nm, t) {
  if (t.transfer_account_id) return
  
  const month = dt.substr(0, 7)
  let thisPayee = chart[nm]
  if (!thisPayee) {
    thisPayee = {}
    chart[nm] = thisPayee
  }
  let thisMonth = thisPayee[month]
  if (!thisMonth) {
    thisMonth = []
    thisPayee[month] = thisMonth
  }
  thisMonth.push(t)
}

for (const t of ts) {
  add(t.date, payeeName[t.payee_id], t)
}

const keyMonthTotal = {}
const report = {}
const row = {}

const names = Object.keys(chart)
// names.sort((a, b) => a.localeCompare(b, undefined, {'sensitivity': 'base'}))
for (const name of names) {
  let buf = ''
  const r = {
    name,
    total: 0,
    months: [],
    min: null,
    max: null,
  }
  
  const thisPayee = chart[name]
  buf += name + '\n'

  const months = Object.keys(thisPayee)

  months.sort()
  for (const month of months) {
    const thisMonth = thisPayee[month]

    let total = 0
    for (const t of thisMonth) {
      total -= t.amount
    }

    const t = total / 1000
    if (t < r.min || r.min === null) r.min = t
    if (t > r.max || r.max === null) r.max = t
    r.total += t
    r.months.push([month, t])
    
    if (month === '2021-05') keyMonthTotal[name] = total/1000
    
    buf += '  ' + month + '   $' + total/1000 + '\n'
    for (const t of thisMonth) {
      buf += `         -${t.date.slice(8)} ${-1 * t.amount / 1000} ${rawPayeeName[t.payee_id]} ${t.memo || ''} ${t.id}\n`
    }
  }

  report[name] = buf
  r.buf = buf
  row[name] = r
}


names.sort((a, b) => a.localeCompare(b, undefined, {'sensitivity': 'base'}))
for (const name of names) {
  if (keyMonthTotal[name] > 100) {
    // console.log(report[name])
  }
}

const rows = Object.values(row)
for (const r of rows) r.avg = r.total / r.months.length
for (const r of rows) delete r.buf

// console.log(row)

rows.sort((a, b) => {
  const m = b.months.length - a.months.length
  if (m !== 0) return m
  return b.avg - a.avg
})


// console.log(rows)
// process.stdout.write(JSON.stringify(rows.slice(0,10), null, 2))

for (const r of rows) {
  for (const [month, amt] of r.months) {
    r[month] = money.format(amt)
  }
  delete r.months
  r.name = r.name.slice(0,20)
  r.total = money.format(r.total)
  r.range = money.format(r.max - r.min)
  r.min = money.format(r.min)
  r.max = money.format(r.max)
  r.avg = money.format(r.avg)
}
// console.table(rows)

process.stdout.write(columnify(rows, {
  align: 'right',
  config: {
    name: { align: 'left'}
  }
}))
