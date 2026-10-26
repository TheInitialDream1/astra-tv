if (new URLSearchParams(location.search).get('mode') === 'space') {
  await import('./spatial-main.js');
} else {
  await import('./tv-home.js');
}
