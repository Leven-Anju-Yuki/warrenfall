(() => {
  const key = 'lapinous_welcome_egg_v1';
  window.LapinousWelcomeGift = game => {
    if (game.welcomeEggGranted) return false;
    try {
      if (localStorage.getItem(key)) { game.welcomeEggGranted = true; return false; }
      localStorage.setItem(key, 'claimed');
    } catch { return false; }
    game.eggs = (Number(game.eggs) || 0) + 1;
    game.welcomeEggGranted = true;
    return true;
  };
})();
