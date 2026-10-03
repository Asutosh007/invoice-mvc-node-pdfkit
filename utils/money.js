function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function money(value) {
  return `₹${round2(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function amountInWordsIndian(amount) {
  amount = round2(amount);
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
    "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen",
    "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty",
    "Seventy", "Eighty", "Ninety"
  ];

  function twoDigits(n) {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`;
  }

  function underThousand(n) {
    if (n < 100) return twoDigits(n);
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " + twoDigits(n % 100) : ""}`;
  }

  function indian(n) {
    if (n >= 10000000) {
      return `${indian(Math.floor(n / 10000000))} Crore${n % 10000000 ? " " + indian(n % 10000000) : ""}`;
    }
    if (n >= 100000) {
      return `${indian(Math.floor(n / 100000))} Lakh${n % 100000 ? " " + indian(n % 100000) : ""}`;
    }
    if (n >= 1000) {
      return `${indian(Math.floor(n / 1000))} Thousand${n % 1000 ? " " + indian(n % 1000) : ""}`;
    }
    return underThousand(n);
  }

  let result = `${indian(rupees)} Rupees`;
  if (paise) result += ` and ${twoDigits(paise)} Paise`;
  return `${result} Only`;
}

module.exports = { round2, money, amountInWordsIndian };