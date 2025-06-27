// Funções globais para controle do scanner
window.pararScanner = function() {
    if (window.Quagga) {
        Quagga.stop();
        Quagga.offDetected();
        Quagga.offProcessed();
    }
    window.scannerRunning = false;
    window.isCameraPaused = false;
    
    const scannerContainer = document.getElementById('scannerContainer');
    if (scannerContainer) {
        scannerContainer.innerHTML = '';
    }
    
    updateScannerButtons('initial');
};

window.pausarCamera = function() {
    if (!window.scannerRunning || window.isCameraPaused) return;
    
    const video = document.querySelector('#scannerVideo');
    if (video) {
        video.pause();
    }
    
    if (window.Quagga) {
        Quagga.pause();
    }
    
    window.isCameraPaused = true;
    updateScannerButtons('paused');
    
    const cameraStatus = document.getElementById('cameraStatus');
    if (cameraStatus) {
        cameraStatus.innerHTML = '<i class="fas fa-pause"></i> Câmera Pausada';
        cameraStatus.style.color = '#ffa500';
    }
    
    const indicator = document.getElementById('cameraStatusIndicator');
    if (indicator) {
        indicator.style.background = '#ffa500';
        indicator.style.boxShadow = '0 0 10px #ffa500';
        indicator.style.animation = 'none';
    }
};

window.retomarCamera = function() {
    if (!window.scannerRunning || !window.isCameraPaused) return;
    
    const video = document.querySelector('#scannerVideo');
    if (video) {
        video.play().catch(e => console.error('Erro ao retomar o vídeo:', e));
    }
    
    if (window.Quagga) {
        Quagga.start();
    }
    
    window.isCameraPaused = false;
    updateScannerButtons('active');
    
    const cameraStatus = document.getElementById('cameraStatus');
    if (cameraStatus) {
        cameraStatus.innerHTML = '<i class="fas fa-video"></i> Câmera Ativa';
        cameraStatus.style.color = '#4CAF50';
    }
    
    const indicator = document.getElementById('cameraStatusIndicator');
    if (indicator) {
        indicator.style.background = '#4CAF50';
        indicator.style.boxShadow = '0 0 10px #4CAF50';
        indicator.style.animation = 'pulse 2s infinite';
    }
};

// Parar qualquer scanner em execução
if (window.Quagga && window.scannerRunning) {
    window.pararScanner();
}

// Atualizar a configuração do Quagga
const config = {
    inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#scannerVideo'),
        constraints: {
            facingMode: "environment",
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            aspectRatio: { ideal: 1.7777777778 }
        },
        area: {
            top: "25%",
            right: "10%",
            left: "10%",
            bottom: "25%"
        },
        willReadFrequently: true,
        singleChannel: false
    },
    decoder: {
        readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "code_128_reader",
            "code_39_reader"
        ]
    },
    locate: true,
    numOfWorkers: navigator.hardwareConcurrency || 4,
    frequency: 10,
    debug: false
};

// Inicializar o Quagga
Quagga.init(config, function(err) {
    if (err) {
        console.error('Erro ao inicializar o scanner:', err);
        const scannerContainer = document.getElementById('scannerContainer');
        if (scannerContainer) {
            scannerContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #f44336;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 15px;"></i>
                    <h3>Erro ao acessar a câmera</h3>
                    <p>${err.message || 'Não foi possível acessar a câmera. Por favor, verifique as permissões e tente novamente.'}</p>
                    <button onclick="iniciarScanner()" class="btn btn-primary" style="margin-top: 15px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-sync-alt"></i> Tentar novamente
                    </button>
                </div>`;
        }
        return;
    }

    console.log('Scanner inicializado com sucesso');
    window.scannerRunning = true;
    window.isCameraPaused = false;
    
    // Atualizar a interface
    updateScannerButtons('active');
    
    // Garantir que o vídeo está visível
    const video = document.querySelector('#scannerVideo');
    if (video) {
        video.style.display = 'block';
    }
    
    // Atualizar o status da câmera
    const cameraStatus = document.getElementById('cameraStatus');
    if (cameraStatus) {
        cameraStatus.innerHTML = '<i class="fas fa-video"></i> Câmera Ativa';
        cameraStatus.style.color = '#4CAF50';
    }
    
    // Atualizar o indicador de status
    const indicator = document.getElementById('cameraStatusIndicator');
    if (indicator) {
        indicator.style.background = '#4CAF50';
        indicator.style.boxShadow = '0 0 10px #4CAF50';
        indicator.style.animation = 'pulse 2s infinite';
    }
    
    // Iniciar a detecção
    Quagga.start();
    
    // Configurar o manipulador de códigos detectados
    Quagga.onDetected(function(result) {
        if (result.codeResult && result.codeResult.code) {
            const code = result.codeResult.code;
            console.log('Código detectado:', code);
            
            // Processar o código com debounce
            if (window.debounceScan && window.processBarcode) {
                window.debounceScan(code, window.processBarcode);
            }
        }
    });
});
