/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/home/khoa/ProjectSeason/my-app/backend/season_data/All-Products.json', 'utf8'));

data.products = data.products.map(product => {
  if (product.price && product.price.amount) {
    const amountStr = product.price.amount.toString();
    // If it's a duplicated string like 25000002500000
    if (amountStr.length % 2 === 0) {
      const half1 = amountStr.slice(0, amountStr.length / 2);
      const half2 = amountStr.slice(amountStr.length / 2);
      if (half1 === half2) {
        product.price.amount = parseInt(half1, 10);
      } else {
         // Maybe try to parse from formatted
         const match = product.price.formatted.match(/([0-9,]+)\s*VND/i);
         if (match) {
             product.price.amount = parseInt(match[1].replace(/,/g, ''), 10);
         }
      }
    }
  }

  if (product.price && product.price.formatted) {
    const match = product.price.formatted.match(/([0-9,]+)\s*VND/i);
    if (match) {
        product.price.formatted = match[0].trim();
    } else {
        product.price.formatted = product.price.amount.toLocaleString('en-US') + ' VND';
    }
  }

  // Ensure collection is derived correctly or just leave as is

  return product;
});

fs.writeFileSync('/home/khoa/ProjectSeason/my-app/backend/season_data/All-Products.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Normalization complete!');
