(function(){
   const key = 'izi-recent-teachers';
   const byName = new Map(faculty.map(person => [person.name, person]));
   function readRecent() {
     try {
       const stored = JSON.parse(localStorage.getItem(key));
       return Array.isArray(stored) ? [...new Set(stored)].filter(name => byName.has(name)).slice(0, 3) : [];
     } catch {
       return [];
     }
   }
   function remember(name) {
     if (!byName.has(name)) return;
     const latest = [name, ...readRecent().filter(previous => previous !== name)].slice(0, 3);
     try { localStorage.setItem(key, JSON.stringify(latest)); }
     catch { /* Profiles remain available when browser storage is disabled. */ }
   }
   const section = document.getElementById('recentTeachers');
   if (!section) {
     const name = new URLSearchParams(location.search).get('name');
     window.addEventListener('pageshow', () => remember(name));
     return;
   }
   const links = document.getElementById('recentTeacherLinks');
   function renderRecent() {
     const names = readRecent();
     links.replaceChildren();
     for (const name of names) {
       const item = document.createElement('li');
       const link = document.createElement('a');
       link.href = 'teacher2.html?' + new URLSearchParams({name});
       link.textContent = name;
       item.append(link);
       links.append(item);
     }
     section.hidden = names.length === 0;
   }
   // Some browsers isolate storage for each file when the site is opened from disk.
   if (location.protocol === 'file:') {
     function rememberLocalClick(event) {
       const link = event.target.closest('a[href]');
       if (!link || (event.type === 'auxclick' && event.button !== 1)) return;
       const url = new URL(link.href);
       if (url.pathname === new URL('teacher2.html', location.href).pathname) remember(url.searchParams.get('name'));
     }
     document.addEventListener('click', rememberLocalClick);
     document.addEventListener('auxclick', rememberLocalClick);
   }
   document.getElementById('clearRecentTeachers').addEventListener('click', () => {
     try { localStorage.removeItem(key); } catch { return; }
     document.getElementById('teacherSearch').focus({preventScroll:true});
     renderRecent();
   });
   renderRecent();
   window.addEventListener('pageshow', renderRecent);
   window.addEventListener('storage', event => {
     if (event.key === key || event.key === null) renderRecent();
   });
 })();
