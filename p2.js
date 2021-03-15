const fetch = require('node-fetch')
var columnify = require('columnify')

const accessToken = process.env.TOKEN
if (!accessToken) throw Error('set TOKEN first')

async function getBudget () {
  const res = await fetch('https://api.youneedabudget.com/v1/budgets/865be22a-ba1f-49c4-a429-e380c9d4885f', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })
  if (!res.ok) throw Error(res)
  return (await res.json()).data.budget
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'})

function money (a) {
  return formatter.format(a).replace('$', '')
  // return Math.round(a * 100) / 100
}
    

/*{
  id: '1057bb3d-b487-43af-b10a-5521a4e6757c',
  category_group_id: '8315832b-356b-44ad-9775-643ff2882c6f',
  name: 'To be Budgeted',
  hidden: false,
  original_category_group_id: null,
  note: null,
  budgeted: 0,
  activity: -1599500,
  balance: -1599500,
  goal_type: null,
  goal_creation_month: null,
  goal_target: 0,
  goal_target_month: null,
  goal_percentage_complete: null,
  deleted: false
}
{
  id: '73efc533-0dcf-4b95-90c5-f4db3ebc7437',
  date: '2021-01-02',
  amount: -6627590,
  memo: null,
  cleared: 'cleared',
  approved: true,
  flag_color: null,
  account_id: '5f077712-fc13-4d27-916c-a95d8da9bb84',
  payee_id: '4fe79f61-7857-4fff-8785-20cd309eddef',
  category_id: '1057bb3d-b487-43af-b10a-5521a4e6757c',
  transfer_account_id: null,
  transfer_transaction_id: null,
  matched_transaction_id: null,
  import_id: null,
  deleted: false
}
*/

async function main () {
  const b = await getBudget()
  //   console.log(b)
  const ts = b.transactions
  // ts.sort((a,b) => a.date.localeCompare(b.date))
  ts.sort((a,b) => a.amount - b.amount)

  let data
  
  const show = (t) => {
    // console.log(t.date, t.amount / 1000, '(', t.memo??'', ')', t.categoryGroup?.name + ':' + t.category?.name, t.payee?.name)
    data.push({
      date:t.date,
      raw_amount: t.amount / 1000,
      amt: money(t.amount / 1000),
      payee: (t.payee?.name ?? '').slice(0,20),
      category: t.categoryGroup?.name + ':' + t.category?.name,
      memo: t.memo??''
    })
  }

  // replace the ids with actual object references
  const lookup = (id, table) => {
    for (const c of b[table]) if (c.id === id) return c
    return null
  }
  for (const t of ts) {
    t.category = lookup(t.category_id, 'categories')
    t.categoryGroup = lookup(t.category?.category_group_id, 'category_groups')
    t.payee = lookup(t.payee_id, 'payees')
  }

  const report = (month, title, filter) => {
    console.log(`\n${title}\n`)
    data = []
    let sum = 0
    for (const t of ts) {
      if (!filter(t)) continue
      if (!t.date.startsWith(month)) continue
      if (t.category?.name === 'To be Budgeted') continue
      sum += t.amount
      show(t)
    }
    data.push({date:'TOTAL', amt: money(sum/1000)})
    let tot = 0
    for (const d of data) {
      d.pct = Math.round(1000000 * d.raw_amount / sum) / 10
      tot += d.raw_amount
      d.Run_Tot = money(tot)
      d.pctl = Math.round(100000 * tot / sum)
      delete d.raw_amount
    }
    console.log(columnify(data, {
      minWidth: 10,
      config: {
        amt: { align: 'right'}
      }
    }))
  }

  const month = '2021-02'
  
  report(month, 'Not Approved',
         t => !t.approved)

  report(month, 'Approved, "Ignore" as transitional or workaround',
         t => t.approved && t.category?.name === 'Ignore')

  report(month, 'Approved, Not "Ignore"',
         t => t.approved && t.category?.name !== 'Ignore')

}

main()
