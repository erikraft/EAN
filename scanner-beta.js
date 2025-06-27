// Gerenciamento do aviso beta do scanner
document.addEventListener('DOMContentLoaded', function() {
    const betaWarning = document.getElementById('betaWarning');
    const acceptBeta = document.getElementById('acceptBeta');
    const scannerBetaContent = document.getElementById('scannerBetaContent');
    const scannerSection = document.getElementById('scannerSection');
    const startScannerBtn = document.getElementById('startScannerBtn');
    
    // Sempre mostrar o aviso beta ao carregar a página
    betaWarning.style.display = 'block';
    if (scannerSection) scannerSection.style.display = 'none';
    
    // Configura o botão de aceite do aviso beta
    if (acceptBeta) {
        acceptBeta.addEventListener('click', function() {
            // Esconde o aviso e mostra a seção do scanner
            if (betaWarning) betaWarning.style.display = 'none';
            if (scannerSection) scannerSection.style.display = 'block';
            
            // Mostra informações adicionais sobre o uso do scanner
            if (scannerBetaContent) scannerBetaContent.style.display = 'block';
            
            // Rola a página até a seção do scanner
            if (scannerSection) {
                scannerSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Configura o botão de iniciar scanner
    if (startScannerBtn) {
        startScannerBtn.addEventListener('click', function() {
            if (typeof iniciarScanner === 'function') {
                iniciarScanner();
            }
        });
    }
    
    // Limpa o localStorage para garantir que o aviso sempre apareça
    try {
        localStorage.removeItem('betaAccepted');
    } catch (e) {
        console.warn('Não foi possível limpar o localStorage', e);
    }
});
