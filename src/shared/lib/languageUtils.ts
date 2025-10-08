export const fetchLanguages = async (): Promise<string[]> => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/independent?status=true&fields=languages');
    if (!response.ok) throw new Error('Network response was not ok');
    const countries = await response.json();
    const languageMap = new Map<string, boolean>();
    countries.forEach((country: any) => {
      if (country.languages) {
        for (const code in country.languages) {
          const name = country.languages[code];
          if (!languageMap.has(name)) {
            languageMap.set(name, true);
          }
        }
      }
    });
    return [...languageMap.keys()].sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Failed to fetch languages:', error);
    // Fallback to a basic list in case of an API error
    return ['English', 'Vietnamese', 'Spanish', 'French', 'German', 'Japanese', 'Korean'];
  }
};
