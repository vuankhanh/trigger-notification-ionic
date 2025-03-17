export class StringAnalysisUtil {
  static extractMonetaryAmounts(text: string) {
    text = text.replace(/₫/g, 'd');
    const regex = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:\s?)(VND|d)\b/g;
    const matches = text.match(regex);
    return matches || [];
  }

  static convertToIntegers(monetaryAmounts: string[]) {
    return monetaryAmounts.map(amount => {
      const numericString = amount.replace(/[^\d]/g, '');
      return parseInt(numericString, 10);
    });
  }
}