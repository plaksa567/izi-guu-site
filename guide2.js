(function(){
  const lookup = document.querySelector('.quick-lookup');
  const input = document.getElementById('quickName');
  const results = document.getElementById('quickResults');
  function suggest() {
    const words = searchWords(input.value);
    results.replaceChildren();
    results.hidden = true;
    if (words.join('').length < 2) return;
    const names = new Set();
    for (const person of faculty) {
      if (names.has(person.name) || !words.every(word => indexedNames.get(person.name).some(part => part.startsWith(word)))) continue;
      names.add(person.name);
      const link = document.createElement('a');
      link.href = 'teacher2.html?' + new URLSearchParams({
        name: person.name,
        list: new URLSearchParams({q: person.name, card: 'teacher-card-' + facultyIds.get(person)}).toString()
      });
      link.textContent = person.name;
      const department = document.createElement('small');
      department.textContent = person.dept;
      link.append(department);
      results.append(link);
      if (names.size === 4) break;
    }
    results.hidden = names.size === 0;
  }
  input.addEventListener('input', suggest);
  input.addEventListener('focus', suggest);
  lookup.addEventListener('focusout', event => { if (!lookup.contains(event.relatedTarget)) results.hidden = true; });
  document.addEventListener('pointerdown', event => { if (!lookup.contains(event.target)) results.hidden = true; });
  lookup.addEventListener('keydown', event => {
    if (event.key === 'Escape') { input.focus(); results.hidden = true; }
    if (results.hidden || !['ArrowDown','ArrowUp'].includes(event.key)) return;
    const items = [input, ...results.children];
    const next = items.indexOf(document.activeElement) + (event.key === 'ArrowDown' ? 1 : -1);
    event.preventDefault();
    items[(next + items.length) % items.length].focus();
  });
  lookup.addEventListener('submit', () => {results.hidden = true;});
  const labels = {b8:'ГУК', b4:'ЛК', cuvp:'ЦУВП', b5:'ПА', b1:'А', b2:'Общежитие № 2'};
  const bridges = [['b8','b4','ul'], ['b4','cuvp','lc'], ['b4','b5','lp'], ['b5','b1','ap'], ['b1','b2','ad']];
  const from = document.getElementById('routeFrom'), to = document.getElementById('routeTo');
  const swap = document.getElementById('routeSwap');
  for (const [id, short] of Object.entries(labels)) {
    const full = campusPlaces[id].name.replace(/^\d+ · /,'');
    const text = short === full ? full : short + ' · ' + full;
    for (const select of [from, to]) select.add(new Option(text,id));
  }
  function pathBetween(start,end) {
    const queue = [{id:start, steps:[]}], visited = new Set([start]);
    for (const {id,steps} of queue) {
      if (id === end) return steps;
      for (const [a,b,bridge] of bridges) {
        const next = id === a ? b : id === b ? a : null;
        if (!next || visited.has(next)) continue;
        visited.add(next);
        queue.push({id:next, steps:[...steps,{start:id,end:next,bridge}]});
      }
    }
    return [];
  }
  function renderRoute() {
    const steps = document.getElementById('routeSteps');
    const message = document.getElementById('routeMessage');
    const route = pathBetween(from.value,to.value);
    const lit = new Set();
    steps.replaceChildren();
    message.textContent = to.value === from.value ? 'Ты уже в этом корпусе.' : '';
    swap.disabled = !to.value || from.value === to.value;
    for (const {start,end,bridge} of route) {
      [start,end,bridge].forEach(id => lit.add(id));
      const item = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = labels[start] + ' → ' + labels[end];
      const floor = document.createElement('span');
      floor.textContent = campusPlaces[bridge].name.split(' · ')[1];
      item.append(title, floor);
      steps.append(item);
    }
    planNodes.forEach(node => node.classList.toggle('on-route', lit.has(node.dataset.place)));
  }
  [from,to].forEach(select => select.addEventListener('change',renderRoute));
  swap.addEventListener('click', () => {
    const previous = from.value;
    from.value = to.value;
    to.value = previous;
    renderRoute();
  });
  renderRoute();
})();