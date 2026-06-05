const puppeteer = require('puppeteer')
const path = require('path')
const fs   = require('fs')

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt2 = n =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fmtDate(d) {
  if (!d) return ''
  try {
    const dt = new Date(d)
    return `${String(dt.getDate()).padStart(2,'0')}-${String(dt.getMonth()+1).padStart(2,'0')}-${dt.getFullYear()}`
  } catch { return String(d) }
}

// Indian number-to-words
const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
const tensW = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
function ch(n){if(n===0)return '';if(n<20)return ones[n]+' ';if(n<100)return tensW[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'')+' ';return ones[Math.floor(n/100)]+' Hundred '+ch(n%100)}
function nw(n){if(!n)return 'Zero';let r='';if(n>=10000000){r+=ch(Math.floor(n/10000000))+'Crore ';n%=10000000}if(n>=100000){r+=ch(Math.floor(n/100000))+'Lakh ';n%=100000}if(n>=1000){r+=ch(Math.floor(n/1000))+'Thousand ';n%=1000}r+=ch(n);return r.trim()}
function numberToWords(amount){const n=Math.floor(parseFloat(amount)||0);const p=Math.round((parseFloat(amount)-n)*100);let r='Rupees '+nw(n);if(p>0)r+=' and '+nw(p)+' Paise';return r+' Only'}

// Company config
const CO = {
  name:'GOYAL CAR CARRIER',gstin:'06BSNPA6680A1ZY',mobile:'+91-9050909027',
  website:'www.goyalcarcarrier.com',
  address:'2428 Ward No 13, Vikas Nagar, Near Telephone Exchange, Tosham - 127040',
  hsnCode:'9965',stateCode:'06',bank:'HDFC Bank',accNo:'50200106550709',
  ifsc:'HDFC0002923',swift:'HDFCINBB',
}


function getLogoBase64() {
  const paths = [
    path.resolve(__dirname,'../../client/public/logo.png'),
  ]
  for (const p of paths) {
    if (fs.existsSync(p)) return 'data:image/png;base64,'+fs.readFileSync(p).toString('base64')
  }
  return null
}

const TH = `<tr style="background:#111;color:#fff;">
  <th style="padding:6px 4px;border:1px solid #333;text-align:center;width:32px;font-size:10px;">S.No</th>
  <th style="padding:6px 4px;border:1px solid #333;text-align:left;width:86px;font-size:10px;">Vehicle No</th>
  <th style="padding:6px 4px;border:1px solid #333;text-align:left;font-size:10px;">Model</th>
  <th style="padding:6px 4px;border:1px solid #333;text-align:left;width:70px;font-size:10px;">From</th>
  <th style="padding:6px 4px;border:1px solid #333;text-align:left;width:70px;font-size:10px;">To</th>
  <th style="padding:6px 4px;border:1px solid #333;text-align:center;width:68px;font-size:10px;">Pickup<br/>Date</th>
  <th style="padding:6px 4px;border:1px solid #333;text-align:center;width:68px;font-size:10px;">Drop Date</th>
  <th style="padding:6px 4px;border:1px solid #333;text-align:right;width:62px;font-size:10px;">Freight</th>
</tr>`

function eRow(e, sNo, idx) {
  const bg = idx%2===0?'#fff':'#f9f9f9'
  return `<tr style="background:${bg};">
  <td style="padding:4px 4px;border:1px solid #ccc;text-align:center;font-size:10px;">${sNo}</td>
  <td style="padding:4px 4px;border:1px solid #ccc;font-weight:700;font-size:9.5px;white-space:nowrap;">${e.vehicleNo||''}</td>
  <td style="padding:4px 4px;border:1px solid #ccc;font-size:10px;">${e.model||''}</td>
  <td style="padding:4px 4px;border:1px solid #ccc;font-size:10px;">${e.from||''}</td>
  <td style="padding:4px 4px;border:1px solid #ccc;font-size:10px;">${e.to||''}</td>
  <td style="padding:4px 4px;border:1px solid #ccc;text-align:center;font-size:10px;white-space:nowrap;">${fmtDate(e.pickupDate)}</td>
  <td style="padding:4px 4px;border:1px solid #ccc;text-align:center;font-size:10px;white-space:nowrap;">${fmtDate(e.dropDate)}</td>
  <td style="padding:4px 4px;border:1px solid #ccc;text-align:right;font-weight:700;font-size:10px;">${Number(e.freight||0).toLocaleString('en-IN')}</td>
</tr>`
}

function hdr(inv, logo) {
  const logoTag = logo
    ? `<img src="${logo}" style="width:88px;height:auto;display:block;"/>`
    : `<div style="border:2px solid #1a3a6e;padding:5px 8px;text-align:center;display:inline-block;"><div style="font-size:20px;font-weight:900;color:#1a3a6e;letter-spacing:-1px;line-height:1;">GCC</div><div style="font-size:7px;color:#1a3a6e;font-weight:700;margin-top:2px;white-space:nowrap;">GOYAL CAR CARRIER</div></div>`
  return `
<div style="text-align:center;font-size:17px;font-weight:900;text-decoration:underline;letter-spacing:3px;margin-bottom:7px;">INVOICE</div>
<table style="width:100%;border-collapse:collapse;border:1px solid #333;margin-bottom:0;">
  <tr>
    <td style="width:150px;padding:5px 8px;vertical-align:middle;border-right:1px solid #333;">
      ${logoTag}
      <div style="font-size:12px;font-weight:900;color:#111;margin-top:4px;">${CO.name}</div>
      <div style="font-size:9px;font-weight:700;margin-top:1px;">GSTIN : ${CO.gstin}</div>
    </td>
    <td style="padding:5px 8px;vertical-align:middle;text-align:center;">
      <div style="font-size:10px;font-weight:700;">Mobile: ${CO.mobile} | Website: ${CO.website}</div>
      <div style="font-size:9px;margin-top:3px;">Registered Address:${CO.address}</div>
    </td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:1px solid #333;border-top:none;padding:4px 8px;width:28%;font-size:10px;"><b>Bill No:</b> ${inv.billNo||''}</td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:4px 8px;width:22%;font-size:10px;"><b>HSN CODE:</b> ${CO.hsnCode}</td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:4px 8px;width:28%;font-size:10px;"><b>Date:</b> ${fmtDate(inv.date)}</td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:4px 8px;width:22%;font-size:10px;"><b>State Code:</b> ${CO.stateCode}</td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:1px solid #333;border-top:none;padding:5px 8px;width:55%;vertical-align:top;font-size:10px;line-height:1.7;">
      <b>Customer/Receiver/Bill To Details</b><br/>
      <b>Name :</b>${inv.customer?.name||''}<br/>
      ${inv.customer?.address?`<b>Address :</b>${inv.customer.address}<br/>`:''}
      ${inv.customer?.gstin?`<b>GSTIN :</b>${inv.customer.gstin}`:''}
    </td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:5px 8px;vertical-align:middle;font-size:10px;">
      ${inv.customer?.gstin?`<b>GSTIN :${inv.customer.gstin}</b>`:'&nbsp;'}
    </td>
  </tr>
</table>`
}

function footer(subtotal, gstRate, gstAmt, grand) {
  return `
<div style="display:flex;justify-content:flex-end;margin-top:0;">
  <table style="border-collapse:collapse;width:310px;">
    <tr><td style="border:1px solid #333;padding:4px 10px;font-weight:700;font-size:11px;">SUB TOTAL :</td><td style="border:1px solid #333;border-left:none;padding:4px 10px;text-align:right;font-weight:700;font-size:11px;">${fmt2(subtotal)}</td></tr>
    <tr><td style="border:1px solid #333;border-top:none;padding:4px 10px;font-weight:700;font-size:11px;">IGST @${gstRate}% :</td><td style="border:1px solid #333;border-left:none;border-top:none;padding:4px 10px;text-align:right;font-weight:700;font-size:11px;">${fmt2(gstAmt)}</td></tr>
    <tr style="background:#111;color:#fff;"><td style="border:1px solid #333;padding:5px 10px;font-weight:700;font-size:12px;">GRAND TOTAL :</td><td style="border:1px solid #333;border-left:none;padding:5px 10px;text-align:right;font-weight:700;font-size:12px;">${fmt2(grand)}</td></tr>
  </table>
</div>
<div style="border:1px solid #333;padding:5px 10px;font-size:10px;margin-top:4px;">
  <b>BILL AMOUNT IN WORDS : </b><span style="font-style:italic;">${numberToWords(grand)}</span>
</div>
<div style="display:flex;gap:10px;margin-top:8px;align-items:flex-start;">
  <div style="flex:1;border:1px solid #333;padding:7px 10px;font-size:10px;">
    <div style="font-weight:700;margin-bottom:5px;">BANK DETAILS</div>
    <table style="border-collapse:collapse;width:100%;"><tr>
      <td style="font-size:9.5px;padding:1px 8px 1px 0;"><b>Bank Name:</b> ${CO.bank}</td>
      <td style="font-size:9.5px;padding:1px 8px;"><b>Bank A/c No:</b> ${CO.accNo}</td>
      <td style="font-size:9.5px;padding:1px 8px;"><b>IFSC Code:</b> ${CO.ifsc}</td>
      <td style="font-size:9.5px;padding:1px 0;"><b>SWIFT Code:</b> ${CO.swift}</td>
    </tr></table>
  </div>
  <div style="min-width:150px;text-align:right;padding-top:2px;">
    <div style="font-weight:700;font-size:10px;">For ${CO.name}</div>
    <div style="height:38px;"></div>
    <div style="border-top:1px solid #333;padding-top:3px;font-size:10px;">(Authorised Signatory)</div>
  </div>
</div>
<div style="text-align:center;margin-top:8px;font-size:9px;color:#555;font-style:italic;">This is a computer generated invoice and doesn't require any signature</div>`
}
function buildHTML(invoice, logoBase64) {
  const entries    = invoice.entries || []
  const gstRate    = invoice.gstRate || 18
  const subtotal   = entries.reduce((s,e)=>s+Number(e.freight||0),0)
  const gstAmt     = Math.round(subtotal*gstRate/100*100)/100
  const grandTotal = subtotal+gstAmt

  const logo = logoBase64 || getLogoBase64()

  const logoTag = logo
    ? `<img src="${logo}" style="width:88px;height:auto;display:block;"/>`
    : `<div style="border:2px solid #1a3a6e;padding:5px 8px;text-align:center;display:inline-block;"><div style="font-size:20px;font-weight:900;color:#1a3a6e;letter-spacing:-1px;line-height:1;">GCC</div><div style="font-size:7px;color:#1a3a6e;font-weight:700;margin-top:2px;white-space:nowrap;">GOYAL CAR CARRIER</div></div>`

  const rows = entries.map((e, i) => eRow(e, i+1, i)).join('')

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
table{border-collapse:collapse;}
thead{display:table-header-group;}
tr{page-break-inside:avoid;}
@page{size:A4;margin:12mm 15mm;}
</style>
</head><body>
<div style="text-align:center;font-size:17px;font-weight:900;letter-spacing:3px;margin-bottom:7px;">INVOICE</div>
<table style="width:100%;border:1px solid #333;">
  <tr>
    <td style="width:150px;padding:5px 8px;vertical-align:middle;border-right:1px solid #333;">
      ${logoTag}
      <div style="font-size:12px;font-weight:900;color:#111;margin-top:4px;">${CO.name}</div>
      <div style="font-size:9px;font-weight:700;margin-top:1px;">GSTIN : ${CO.gstin}</div>
    </td>
    <td style="padding:5px 8px;vertical-align:middle;text-align:center;">
      <div style="font-size:10px;font-weight:700;">Mobile: ${CO.mobile} | Website: ${CO.website}</div>
      <div style="font-size:9px;margin-top:3px;">Registered Address: ${CO.address}</div>
    </td>
  </tr>
</table>
<table style="width:100%;">
  <tr>
    <td style="border:1px solid #333;border-top:none;padding:4px 8px;width:28%;font-size:10px;"><b>Bill No:</b> ${invoice.billNo||''}</td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:4px 8px;width:22%;font-size:10px;"><b>HSN CODE:</b> ${CO.hsnCode}</td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:4px 8px;width:28%;font-size:10px;"><b>Date:</b> ${fmtDate(invoice.date)}</td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:4px 8px;width:22%;font-size:10px;"><b>State Code:</b> ${CO.stateCode}</td>
  </tr>
</table>
<table style="width:100%;">
  <tr>
    <td style="border:1px solid #333;border-top:none;padding:5px 8px;width:55%;vertical-align:top;font-size:10px;line-height:1.7;">
      <b>Customer/Receiver/Bill To Details</b><br/>
      <b>Name :</b> ${invoice.customer?.name||''}<br/>
      ${invoice.customer?.address?`<b>Address :</b> ${invoice.customer.address}<br/>`:''}
      ${invoice.customer?.gstin?`<b>GSTIN :</b> ${invoice.customer.gstin}`:''}
    </td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:5px 8px;vertical-align:middle;font-size:10px;">
      ${invoice.customer?.gstin?`<b>GSTIN: ${invoice.customer.gstin}</b>`:'&nbsp;'}
    </td>
  </tr>
</table>
<table style="width:100%;margin-top:0;">
  <thead>${TH}</thead>
  <tbody>${rows}</tbody>
</table>
${footer(subtotal, gstRate, gstAmt, grandTotal)}
</body></html>`
}

async function generateInvoicePDF(invoice) {
  const logo = getLogoBase64()
  const browser = await puppeteer.launch({
    headless:'new',
    args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(buildHTML(invoice, logo), { waitUntil:'networkidle0' })
    const buf = await page.pdf({ format:'A4', printBackground:true, preferCSSPageSize:true, margin:{top:'0',bottom:'0',left:'0',right:'0'} })
    return buf
  } finally { await browser.close() }
}

module.exports = { generateInvoicePDF, buildHTML, numberToWords }