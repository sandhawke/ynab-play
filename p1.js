const ynab = require('ynab')

const accessToken = process.env.TOKEN
if (!accessToken) throw Error('set TOKEN first')
const ynabAPI = new ynab.API(accessToken)

async function getBudget (name) {
  const budgetsResponse = await ynabAPI.budgets.getBudgets()
  const budgets = budgetsResponse.data.budgets
  for (const budget of budgets) {
    if (budget.name === name) return budget
    // console.log(`Budget Name: ${budget.name}`)
  }
  return null
}

// link?

async function main () {
  const b = await getBudget('5k')
  console.log(b)
  const ts = b.transactions

  const cat = (id) => {
    for (const c of b.categories) if (c.id === id) return c
    return null
  }

  for (const t of ts) {
    // t.category = cat(t.category_id)
    console.log(cat(t.category_id))
    console.log(t)
  }
}

main()
