const API_KEY = "9492ac22b7c14f8ab9488061684dc0fb"; // вставь свой ключ
const BASE_URL = "https://newsapi.org/v2/top-headlines?language=en&pageSize=5";

export const fetchFacts = async () => {
  try {
    const res = await fetch(`${BASE_URL}&apiKey=${API_KEY}`);
    const data = await res.json();

    // Преобразуем новости в формат для контракта
    const facts = data.articles.map((a, index) => ({
      id: 1000 + index,
      description: a.title,
      source: a.source.name,
      disputed: false,
      resolved: false,
      outcome: null,
      trueShares: 0,
      falseShares: 0,
      deadline: Math.floor(Date.now() / 1000) + 60 * 5, // через 5 минут
    }));

    return facts;
  } catch (err) {
    console.error("Ошибка fetchFacts:", err);
    return [];
  }
};
