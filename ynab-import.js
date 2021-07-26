const fetch = require('node-fetch')
const { writeFile } = require('fs/promises')
const fs = require('fs')

const accessToken = process.env.TOKEN || fs.readFileSync('/home/sandro/.ynab-secret')
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

async function main () {
  const b = await getBudget()
  await writeFile('./budget-snapshot.json', JSON.stringify(b, null, 2))
  console.log('' + b.transactions.length + ' transactions downloaded')
}

main()
