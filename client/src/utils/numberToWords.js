const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']

function convertHundreds(n) {
  if (n === 0) return ''
  if (n < 20)  return ones[n] + ' '
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '') + ' '
  return ones[Math.floor(n/100)] + ' Hundred ' + convertHundreds(n % 100)
}

function convert(n) {
  if (n === 0) return 'Zero'
  let r = ''
  if (n >= 10000000) { r += convertHundreds(Math.floor(n/10000000)) + 'Crore '; n %= 10000000 }
  if (n >= 100000)   { r += convertHundreds(Math.floor(n/100000))   + 'Lakh ';  n %= 100000   }
  if (n >= 1000)     { r += convertHundreds(Math.floor(n/1000))     + 'Thousand '; n %= 1000   }
  r += convertHundreds(n)
  return r.trim()
}

export function numberToWords(amount) {
  const n     = Math.floor(parseFloat(amount) || 0)
  const paise = Math.round((parseFloat(amount) - n) * 100)
  let result  = 'Rupees ' + convert(n)
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise'
  return result + ' Only'
}
