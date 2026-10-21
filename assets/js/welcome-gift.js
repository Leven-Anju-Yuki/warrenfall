(() => {
  window.LapinousWelcomeGift = game => {
    if (game.welcomeEggReceipt === 'v2') return false;
    // Rattrapage unique des anciennes parties dont l’ancien verrou navigateur pouvait bloquer le cadeau.
    game.eggs = (Number(game.eggs) || 0) + 1;
    game.welcomeEggGranted = true;
    game.welcomeEggReceipt = 'v2';
    return true;
  };
})();
