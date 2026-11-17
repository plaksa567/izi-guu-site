const reviewRatings = (() => {
  // Keep the existing storage keys for reviews submitted under the earlier form.
  const categories = [
    { key: 'clarity', label: 'Лекции и объяснения' },
    { key: 'seminars', label: 'Семинары и практики' },
    { key: 'organization', label: 'Организация' },
    { key: 'feedback', label: 'Оценивание' }
  ];

  function score(review, key) {
    const value = Number(review[key]);
    return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
  }

  function mean(values) {
    const scores = values.filter(value => value !== null);
    if (!scores.length) return null;
    return scores.reduce((total, value) => total + value, 0) / scores.length;
  }

  function overall(review) {
    return mean(categories.map(({ key }) => score(review, key)));
  }

  function reviewCount(count) {
    const last = count % 10, teen = count % 100;
    const noun = teen >= 11 && teen <= 14 ? 'отзывов' : last === 1 ? 'отзыв' : last >= 2 && last <= 4 ? 'отзыва' : 'отзывов';
    return count + ' ' + noun;
  }

  return { categories, score, mean, overall, reviewCount };
})();
