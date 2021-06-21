const bud = require('./budget-snapshot.json')

const ts = bud.transactions

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

const names = Object.keys(chart)
// names.sort((a, b) => a.localeCompare(b, undefined, {'sensitivity': 'base'}))
for (const name of names) {
  let buf = ''
  
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
    if (month === '2021-05') keyMonthTotal[name] = total/1000
    
    buf += '  ' + month + '   $' + total/1000 + '\n'
    for (const t of thisMonth) {
      buf += `         -${t.date.slice(8)} ${-1 * t.amount / 1000} ${rawPayeeName[t.payee_id]} ${t.memo || ''} ${t.id}\n`
    }
  }

  report[name] = buf
}


names.sort((a, b) => a.localeCompare(b, undefined, {'sensitivity': 'base'}))
for (const name of names) {
  if (keyMonthTotal[name] > 100) {
    console.log(report[name])
  }
}
