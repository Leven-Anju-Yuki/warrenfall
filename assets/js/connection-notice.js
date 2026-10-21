(() => {
    const notice = document.createElement('dialog');
    notice.id = 'connectionNotice';
    notice.setAttribute('aria-label', 'Connexion Internet interrompue');
    notice.innerHTML = '<div class="error-art error-art--offline"><img src="./assets/icons/error-offline.png" alt="Pas de connexion Internet. Le lien avec le terrier est interrompu."><button class="error-hotspot" type="button" data-retry aria-label="Réessayer" title="Réessayer"></button></div><button class="connection-close" type="button" data-continue aria-label="Fermer et continuer hors connexion" title="Continuer hors connexion">×</button><p role="status"></p>';
    document.body.append(notice);
    notice.querySelector('[data-continue]').onclick = () => notice.close();
    notice.querySelector('[data-retry]').onclick = () => {
        if (navigator.onLine) location.reload();
        else notice.querySelector('[role=status]').textContent = 'La connexion est toujours indisponible. Tu peux continuer avec les ressources déjà chargées.';
    };
    addEventListener('offline', () => { if (!notice.open) notice.showModal(); });
    addEventListener('online', () => notice.close());
    if (!navigator.onLine) notice.showModal();
})();
