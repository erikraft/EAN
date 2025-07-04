// Funções de validação e normalização de códigos de barras
function calcularDigitoVerificador(codigo) {
    let soma = 0;
    for (let i = 0; i < codigo.length; i++) {
        soma += parseInt(codigo[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (soma % 10)) % 10;
}

// Valida o formato do código de barras
function validarCodigoBarras(codigo) {
    // Remove todos os caracteres não numéricos
    const codigoLimpo = codigo.replace(/\D/g, '');

    // Verifica o comprimento
    if (codigoLimpo.length < 8 || codigoLimpo.length > 13) {
        return { valido: false, mensagem: 'O código deve ter entre 8 e 13 dígitos' };
    }

    // Verifica se são apenas números
    if (!/^\d+$/.test(codigoLimpo)) {
        return { valido: false, mensagem: 'O código deve conter apenas números' };
    }

    return {
        valido: true,
        codigo: codigoLimpo,
        tipo: identificarTipoCodigo(codigoLimpo)
    };
}

// Identifica o tipo de código de barras
function identificarTipoCodigo(codigo) {
    const len = codigo.length;

    // ISBN-10 (10 dígitos)
    if (len === 10) return 'ISBN-10';

    // UPC-A (12 dígitos)
    if (len === 12) return 'UPC-A';

    // EAN-13 (13 dígitos)
    if (len === 13) {
        // Verifica se é um ISBN-13 (começa com 978 ou 979)
        if (codigo.startsWith('978') || codigo.startsWith('979')) {
            return 'ISBN-13';
        }
        return 'EAN-13';
    }

    // EAN-8 (8 dígitos)
    if (len === 8) return 'EAN-8';

    // Outros formatos
    return `Código de ${len} dígitos`;
}

// Converte entre formatos de código de barras
function converterCodigo(codigo, formatoAlvo) {
    const { tipo } = validarCodigoBarras(codigo);

    // Se já está no formato desejado, retorna o código original
    if (tipo === formatoAlvo) return codigo;

    // Conversões suportadas
    if (formatoAlvo === 'EAN-13') {
        if (tipo === 'UPC-A') {
            return '0' + codigo; // Adiciona um zero no início
        }
    } else if (formatoAlvo === 'UPC-A') {
        if (tipo === 'EAN-13' && codigo.startsWith('0')) {
            return codigo.substring(1); // Remove o primeiro zero
        }
    } else if (formatoAlvo === 'ISBN-13' && tipo === 'ISBN-10') {
        // Converte ISBN-10 para ISBN-13
        const isbnBase = '978' + codigo.substring(0, 9);
        const digitoVerificador = calcularDigitoVerificador(isbnBase);
        return isbnBase + digitoVerificador;
    } else if (formatoAlvo === 'ISBN-10' && tipo === 'ISBN-13' &&
              (codigo.startsWith('978') || codigo.startsWith('979'))) {
        // Converte ISBN-13 para ISBN-10 (apenas para códigos que começam com 978/979)
        const isbnBase = codigo.substring(3, 12);
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(isbnBase[i]) * (10 - i);
        }
        const digito = (11 - (soma % 11)) % 11;
        return isbnBase + (digito === 10 ? 'X' : digito);
    }

    // Se não houver conversão suportada, retorna o código original
    return codigo;
}

// Normaliza um código de barras para o formato mais comum (EAN-13 quando possível)
function normalizarCodigo(codigo) {
    const { tipo } = validarCodigoBarras(codigo);

    switch (tipo) {
        case 'UPC-A':
            return '0' + codigo; // Converte para EAN-13
        case 'ISBN-10':
            return converterCodigo(codigo, 'ISBN-13');
        default:
            return codigo;
    }
}

// Função para converter entre formatos e atualizar a busca
function converterEAtualizar(codigoAtual, novoFormato) {
    event.preventDefault();
    const novoCodigo = converterCodigo(codigoAtual, novoFormato);
    if (novoCodigo !== codigoAtual) {
        document.getElementById('searchBarcode').value = novoCodigo;
        buscarProduto();
    }
    return false;
}

function gerarCodigos() {
    let countryCode = document.getElementById("countrySelect").value;
    let codigoBase = document.getElementById("codigoBase").value.replace(/\D/g, "");
    if (codigoBase.length < 1 || codigoBase.length > 8) {
        alert("✏️ Insira um código do produto com até 8 dígitos.");
        return;
    }
    let base = countryCode + codigoBase.padStart(8, "0");
    let lista = document.getElementById("listaCodigos");
    lista.innerHTML = "";
    for (let i = 0; i < 10; i++) {
        let codigo12 = base.slice(0, 11) + i.toString();
        let dv = calcularDigitoVerificador(codigo12);
        let codigoCompleto = codigo12 + dv;
        let li = document.createElement("li");
        li.textContent = codigoCompleto;
        lista.appendChild(li);
    }
}

async function buscarProduto() {
    let codigoInput = document.getElementById("searchBarcode").value.trim();
    let resultado = document.getElementById("searchResult");

    // Valida o código de barras
    const validacao = validarCodigoBarras(codigoInput);
    if (!validacao.valido) {
        resultado.innerHTML = `<p class='error'>✏️ ${validacao.mensagem || 'Código de barras inválido'}</p>`;
        return;
    }

    // Normaliza o código para o formato mais comum
    const codigo = normalizarCodigo(validacao.codigo);
    const tipoCodigo = identificarTipoCodigo(codigo);

    // Atualiza a interface para mostrar o tipo de código detectado
    document.getElementById('barcode-type').textContent = `Tipo: ${tipoCodigo}`;

    // Mostrar estado de carregamento
    resultado.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <div class="searching-message">
                <p>🔍 Buscando informações do produto...</p>
                <p class="searching-sources">Código: ${codigo} (${tipoCodigo})</p>
                <p class="searching-sources">Consultando fontes disponíveis...</p>
            </div>
            <div class="barcode-formats">
                <small>Formatos alternativos:
                    ${['EAN-13', 'UPC-A', 'ISBN-13', 'ISBN-10'].map(fmt =>
                        `<a href="#" onclick="event.preventDefault(); converterEAtualizar('${codigo}', '${fmt}');">${fmt}</a>`
                    ).join(' | ')}
                </small>
            </div>
        </div>
    `;

    try {
        // Array de todas as funções de busca
        const searchFunctions = [
            searchOpenFoodFacts,
            searchUpcItemDb,
            searchGoogleShopping,
            searchWwWOpenProductData,
            searchUpcDatabase,
            searchGoogleShoppingScraper
        ];

        // Se for um ISBN, prioriza as APIs de livros
        if (tipoCodigo.includes('ISBN')) {
            searchFunctions.unshift(searchGoogleBooks);
            searchFunctions.unshift(searchOpenLibrary);
        }

        let productInfo = { found: false };
        let currentSearchIndex = 0;

        // Função para tentar a próxima busca
        const tryNextSearch = async () => {
            if (currentSearchIndex >= searchFunctions.length) return false;

            const searchFunc = searchFunctions[currentSearchIndex];
            const sourceName = searchFunc.name.replace('search', '').replace(/([A-Z])/g, ' $1').trim();

            // Atualiza a mensagem mostrando qual fonte está sendo consultada
            const searchingElement = document.querySelector('.searching-sources');
            if (searchingElement) {
                searchingElement.textContent = `Consultando: ${sourceName}...`;
            }

            try {
                const result = await searchFunc(codigo);
                if (result.found) {
                    return result;
                }
            } catch (error) {
                console.error(`Erro na busca ${sourceName}:`, error);
            }

            currentSearchIndex++;
            return tryNextSearch();
        };

        // Inicia a cadeia de buscas
        productInfo = await tryNextSearch();

        if (productInfo.found) {
            resultado.innerHTML = formatProductInfo(productInfo);
        } else {
            resultado.innerHTML = `
                <div class='product-not-found'>
                    <p>❌ Produto não encontrado nas bases de dados.</p>
                    <p>Você pode tentar pesquisar em outros sites:</p>
                    <ul>
                        <li><a href='https://www.google.com/search?q=${codigo}+barcode' target='_blank'>Pesquisar no Google</a></li>
                        <li><a href='https://www.barcodelookup.com/${codigo}' target='_blank'>Barcode Lookup</a></li>
                        <li><a href='https://www.upcitemdb.com/upc/${codigo}' target='_blank'>UPC ItemDB</a></li>
                        <li><a href='https://www.google.com/shopping/product/1?q=${codigo}' target='_blank'>Google Shopping</a></li>
                        <li><a href='https://barcodes.tec-it.com/pt/?barcode=${codigo}' target='_blank'>TEC-IT Barcode</a></li>
                    </ul>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        resultado.innerHTML = `
            <div class='error'>
                <p>⚠️ Ocorreu um erro ao buscar o produto.</p>
                <p>Detalhes: ${error.message || 'Erro desconhecido'}</p>
                <p>Tente novamente mais tarde ou verifique sua conexão com a internet.</p>
            </div>
        `;
    }
}

async function searchOpenFoodFacts(barcode) {
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1) {
            const product = data.product;
            return {
                found: true,
                name: product.product_name || 'Produto não identificado',
                brand: product.brands || 'Marca não especificada',
                category: product.categories || 'Categoria não especificada',
                image: product.image_url || '',
                details: {
                    quantidade: product.quantity || 'Não informado',
                    países: product.countries || 'Não informado',
                    ingredientes: product.ingredients_text || 'Não disponível',
                    'código de barras': barcode
                },
                source: 'Open Food Facts',
                barcode: barcode
            };
        }
    } catch (error) {
        console.error('Erro na API Open Food Facts:', error);
    }
    return { found: false };
}



// Função de busca na API do UPC ItemDB via proxy
async function searchUpcItemDb(barcode) {
    try {
        const response = await fetch(`/api/upc-itemdb/${barcode}`);
        const data = await response.json();

        if (data.code === 'OK' && data.items && data.items.length > 0) {
            const item = data.items[0];
            return {
                found: true,
                name: item.title || 'Produto não identificado',
                brand: item.brand || 'Marca não especificada',
                category: item.category || 'Categoria não especificada',
                image: item.images && item.images.length > 0 ? item.images[0] : '',
                details: {
                    descrição: item.description || 'Não disponível',
                    'código de barras': barcode,
                    'preço médio': item.lowest_recorded_price ? `$${item.lowest_recorded_price} - $${item.highest_recorded_price}` : 'Não disponível',
                    'cor': item.color || 'Não especificado',
                    'dimensões': item.dimension || 'Não disponível',
                    'peso': item.weight || 'Não disponível'
                },
                source: 'UPC ItemDB',
                barcode: barcode
            };
        }
    } catch (error) {
        console.error('Erro na API UPC ItemDB:', error);
    }
    return { found: false };
}

// Função de busca na API do Google Shopping (via RapidAPI)
async function searchGoogleShopping(barcode) {
    try {
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '497a68a614msh6e2d3b3f0609093p12ba49jsnfc0a5338235f', // Em produção, use uma variável de ambiente
                'x-rapidapi-host': 'google-data-scraper.p.rapidapi.com'
            },
            credentials: 'include'
        };

        const response = await fetch(`https://google-data-scraper.p.rapidapi.com/search/shop/${encodeURIComponent(barcode)}`, options);
        const data = await response.json();

        console.log('Resposta da API Google Shopping:', data); // Para depuração

        // Verifica se a resposta tem a estrutura esperada
        if (data && data.shopping_results && data.shopping_results.length > 0) {
            const product = data.shopping_results[0];
            return {
                found: true,
                name: product.title || 'Produto não identificado',
                brand: product.source || 'Marca não especificada',
                category: product.extracted_category || 'Categoria não especificada',
                image: product.thumbnail || '',
                details: {
                    preço: product.price_raw || 'Não disponível',
                    loja: product.source || 'Não especificada',
                    avaliação: product.rating ? `${product.rating}/5` : 'Não avaliado',
                    'código de barras': barcode,
                    'link': product.link || ''
                },
                source: 'Google Shopping',
                barcode: barcode
            };
        }
    } catch (error) {
        console.error('Erro na API Google Shopping:', error);
    }
    return { found: false };
}

// Função de busca na World Wide Open Product Database
async function searchWwWOpenProductData(barcode) {
    try {
        const response = await fetch(`https://world.openproductdata.com/api/v0/product/${barcode}.json`);
        const data = await response.json();

        if (data.status === 'success' && data.product) {
            const product = data.product;
            return {
                found: true,
                name: product.product_name || 'Produto não identificado',
                brand: product.brands || 'Marca não especificada',
                category: product.categories || 'Categoria não especificada',
                image: product.image_url || '',
                details: {
                    quantidade: product.quantity || 'Não informado',
                    'países disponíveis': product.countries || 'Não informado',
                    'código de barras': barcode
                },
                source: 'World Wide Open Product Database',
                barcode: barcode
            };
        }
    } catch (error) {
        console.error('Erro na API World Wide Open Product Database:', error);
    }
    return { found: false };
}

// Função de busca na API Google Shopping Scraper (via RapidAPI)
async function searchGoogleShoppingScraper(barcode) {
    try {
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '497a68a614msh6e2d3b3f0609093p12ba49jsnfc0a5338235f', // Em produção, use uma variável de ambiente
                'x-rapidapi-host': 'google-shopping-scraper2.p.rapidapi.com'
            },
            credentials: 'include'
        };

        const response = await fetch(`https://google-shopping-scraper2.p.rapidapi.com/products?q=${encodeURIComponent(barcode)}&country=br&language=pt-br`, options);
        const data = await response.json();

        console.log('Resposta da API Google Shopping Scraper:', data); // Para depuração

        if (data.data && data.data.length > 0) {
            const product = data.data[0];
            return {
                found: true,
                name: product.title || 'Produto não identificado',
                brand: product.brand || 'Marca não especificada',
                category: product.category || 'Categoria não especificada',
                image: product.image || '',
                details: {
                    preço: product.price ? `R$ ${product.price}` : 'Preço não disponível',
                    loja: product.seller || 'Loja não especificada',
                    avaliação: product.rating ? `${product.rating} estrelas` : 'Não avaliado',
                    'código de barras': barcode,
                    'disponibilidade': product.availability || 'Disponibilidade não informada',
                    'frete grátis': product.free_shipping ? 'Sim' : 'Não'
                },
                source: 'Google Shopping Scraper',
                barcode: barcode,
                productUrl: product.url || ''
            };
        }
    } catch (error) {
        console.error('Erro na API Google Shopping Scraper:', error);
    }
    return { found: false };
}

// Função de busca na API do Google Books
async function searchGoogleBooks(isbn) {
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
        const data = await response.json();

        if (data.totalItems > 0 && data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;
            return {
                found: true,
                name: book.title || 'Livro não identificado',
                brand: book.publisher || 'Editora não especificada',
                category: book.categories ? book.categories.join(', ') : 'Livro',
                image: book.imageLinks ? book.imageLinks.thumbnail : '',
                details: {
                    autores: book.authors ? book.authors.join(', ') : 'Autor desconhecido',
                    'ano de publicação': book.publishedDate || 'Não informado',
                    'número de páginas': book.pageCount ? `${book.pageCount} páginas` : 'Não informado',
                    idioma: book.language ? book.language.toUpperCase() : 'Não informado',
                    'código ISBN': isbn,
                    'descrição': book.description ?
                        (book.description.length > 200 ?
                         book.description.substring(0, 200) + '...' :
                         book.description) :
                        'Descrição não disponível'
                },
                source: 'Google Books',
                barcode: isbn
            };
        }
    } catch (error) {
        console.error('Erro na API Google Books:', error);
    }
    return { found: false };
}

// Função de busca na Open Library
async function searchOpenLibrary(isbn) {
    try {
        const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
        const data = await response.json();
        const bookKey = `ISBN:${isbn}`;

        if (data[bookKey]) {
            const book = data[bookKey];
            return {
                found: true,
                name: book.title || 'Livro não identificado',
                brand: book.publishers ? book.publishers.map(p => p.name).join(', ') : 'Editora não especificada',
                category: book.subjects ? book.subjects.map(s => s.name).join(', ') : 'Livro',
                image: book.cover ? book.cover.medium || book.cover.large || '' : '',
                details: {
                    autores: book.authors ? book.authors.map(a => a.name).join(', ') : 'Autor desconhecido',
                    'ano de publicação': book.publish_date || 'Não informado',
                    'número de páginas': book.number_of_pages ? `${book.number_of_pages} páginas` : 'Não informado',
                    'código ISBN': isbn,
                    'identificadores': book.identifiers ?
                        Object.entries(book.identifiers).map(([key, value]) =>
                            `${key}: ${value.join(', ')}`).join(' | ') :
                        'Não disponível'
                },
                source: 'Open Library',
                barcode: isbn
            };
        }
    } catch (error) {
        console.error('Erro na API Open Library:', error);
    }
    return { found: false };
}

// Função de busca na API do UPCDatabase.org
async function searchUpcDatabase(barcode) {
    try {
        const response = await fetch(`https://api.upcdatabase.org/product/${barcode}?apikey=${process.env.UPC_DATABASE_KEY}`);
        const data = await response.json();

        if (data.valid === true) {
            return {
                found: true,
                name: data.title || 'Produto não identificado',
                brand: data.brand || 'Marca não especificada',
                category: data.category || 'Categoria não especificada',
                image: data.image || '',
                details: {
                    descrição: data.description || 'Não disponível',
                    'código de barras': barcode,
                    'tamanho': data.size || 'Não especificado',
                    'cor': data.color || 'Não especificado',
                    'preço': data.msrp ? `$${data.msrp}` : 'Não disponível'
                },
                source: 'UPC Database',
                barcode: barcode
            };
        }
    } catch (error) {
        console.error('Erro na API UPC Database:', error);
    }
    return { found: false };
}

function formatProductInfo(productInfo) {
    let detailsHtml = '';
    for (const [key, value] of Object.entries(productInfo.details)) {
        detailsHtml += `<p><strong>${key}:</strong> ${value}</p>`;
    }

    // Adiciona link para o produto se disponível
    const productLink = productInfo.productUrl ?
        `<p class='product-link'><a href='${productInfo.productUrl}' target='_blank' class='btn'>Ver no Google Shopping →</a></p>` : '';

    return `
        <div class='product-info'>
            <div class='product-header'>
                ${productInfo.image ? `<img src='${productInfo.image}' alt='${productInfo.name}' class='product-image' />` : ''}
                <div>
                    <h3>${productInfo.name}</h3>
                    <p><strong>Marca:</strong> ${productInfo.brand}</p>
                    <p><strong>Categoria:</strong> ${productInfo.category}</p>
                    <p><small>Fonte: ${productInfo.source}</small></p>
                    ${productLink}
                </div>
            </div>
            <div class='product-details'>
                ${detailsHtml}
            </div>
        </div>
    `;
}

function gerarCodigoPersonalizado() {
    let countryCode = document.getElementById("customCountrySelect").value;
    let productCode = document.getElementById("customProductCode").value.replace(/\D/g, "");
    if (productCode.length < 1 || productCode.length > 8) {
        alert("✏️ Insira um código do produto com até 8 dígitos.");
        return;
    }
    let base = countryCode + productCode.padStart(8, "0");
    let codigo12 = base.slice(0, 11) + "0"; // last digit before check digit set to 0
    let dv = calcularDigitoVerificador(codigo12);
    let codigoCompleto = codigo12 + dv;
    let resultado = document.getElementById("customCodeResult");
    resultado.textContent = "Código de Barras Gerado: " + codigoCompleto;
}

// Função para filtrar a lista de países
function setupCountrySearch() {
    const searchInput = document.getElementById('countrySearch');
    const countrySelect = document.getElementById('countrySelect');
    const options = Array.from(countrySelect.options);

    // Armazena todas as opções originais
    const originalOptions = options.map(option => ({
        value: option.value,
        text: option.text,
        element: option
    }));

    // Função para filtrar as opções
    function filterOptions(searchTerm) {
        const term = searchTerm.toLowerCase().trim();

        // Remove todas as opções atuais
        while (countrySelect.options.length > 0) {
            countrySelect.remove(0);
        }

        // Filtra as opções originais
        const filteredOptions = originalOptions.filter(option =>
            option.text.toLowerCase().includes(term) ||
            option.value.includes(term)
        );

        // Adiciona as opções filtradas de volta ao select
        filteredOptions.forEach(option => {
            countrySelect.add(option.element);
        });

        // Se não houver resultados, mostra uma mensagem
        if (filteredOptions.length === 0) {
            const noResults = document.createElement('option');
            noResults.value = '';
            noResults.textContent = 'Nenhum país encontrado';
            noResults.disabled = true;
            countrySelect.add(noResults);
        }
    }

    // Adiciona o evento de input para a busca
    searchInput.addEventListener('input', (e) => {
        filterOptions(e.target.value);
    });

    // Adiciona foco ao campo de busca quando a página carrega
    searchInput.focus();
}

// Função para verificar se o Quagga está carregado
function waitForQuagga(callback, maxAttempts = 30, attempt = 1) {
    console.log(`Checking Quagga (attempt ${attempt}/${maxAttempts})...`);

    if (window.quaggaLoaded && typeof Quagga !== 'undefined') {
        console.log('Quagga is loaded and ready');
        callback();
    } else if (window.quaggaLoadError) {
        console.error('Failed to load Quagga');
        showError('Não foi possível carregar o scanner. Por favor, recarregue a página.');
    } else if (attempt >= maxAttempts) {
        console.error('Timed out waiting for Quagga to load');
        showError('Tempo esgotado ao carregar o scanner. Por favor, recarregue a página.');
    } else {
        setTimeout(() => waitForQuagga(callback, maxAttempts, attempt + 1), 500);
    }
}

// Inicializa a busca de países e os listeners do scanner quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Mostra o indicador de carregamento
        const loadingIndicator = document.getElementById('loadingIndicator');
        const loadingText = document.getElementById('loadingText');

        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
            loadingText.textContent = 'Inicializando o aplicativo...';
        }

        // Configura a busca de países
        setupCountrySearch();

        // Configura os controles do scanner
        setupScannerControls();

        // Verifica se o Quagga foi carregado corretamente
        waitForQuagga(function() {
            console.log('Quagga carregado com sucesso');

            // Esconde o indicador de carregamento após um curto atraso
            setTimeout(() => {
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }

                // Mostra mensagem de boas-vindas
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'success-message';
                welcomeMsg.innerHTML = '<i class="fas fa-check-circle"></i> Aplicativo pronto para uso! O scanner está carregado.';
                document.body.prepend(welcomeMsg);

                // Habilita os botões do scanner
                const scannerButtons = document.querySelectorAll('.scanner-buttons button');
                scannerButtons.forEach(button => {
                    button.disabled = false;
                });

                // Remove a mensagem após 5 segundos
                setTimeout(() => {
                    welcomeMsg.style.opacity = '0';
                    setTimeout(() => welcomeMsg.remove(), 500);
                }, 5000);

            }, 500);
        });

    } catch (error) {
        console.error('Erro durante a inicialização:', error);

        // Mostra mensagem de erro
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Erro ao inicializar o aplicativo: ${error.message || 'Erro desconhecido'}`;
        document.body.prepend(errorMsg);

        // Esconde o indicador de carregamento em caso de erro
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
});

// Configura os controles do scanner
function setupScannerControls() {
    console.log('Setting up scanner controls...');

    const actions = {
        start: function() {
            waitForQuagga(function() {
                iniciarScanner();
            });
        },
        pause: pausarCamera,
        resume: retomarCamera,
        stop: pararScanner
    };

    const buttons = document.querySelectorAll('[data-action]');
    console.log('Found buttons:', buttons.length);

    buttons.forEach(button => {
        const action = button.getAttribute('data-action');
        console.log('Adding listener for button:', button.id, 'with action:', action);

        // Adiciona um listener de mouseover para verificar se o botão está visível
        button.addEventListener('mouseover', function() {
            console.log('Mouse over button:', this.id, 'display:', window.getComputedStyle(this).display);
        });

        // Adiciona o listener de clique com tratamento de erro
        button.addEventListener('click', function(e) {
            try {
                e.preventDefault();
                e.stopPropagation();

                // Verifica se o Quagga está disponível para ações que o requerem
                if ((action === 'start' || action === 'resume' || action === 'stop') && typeof Quagga === 'undefined') {
                    showError('O scanner ainda não foi carregado. Por favor, aguarde...');
                    return false;
                }

                // Mostra feedback visual de clique
                const originalBg = this.style.backgroundColor;
                this.style.backgroundColor = '#e0e0e0';
                setTimeout(() => {
                    this.style.backgroundColor = originalBg;
                }, 200);

                console.log('Button clicked:', this.id, 'action:', action);

                if (actions[action]) {
                    console.log('Executing action:', action);

                    // Mostra indicador de carregamento para ações que podem demorar
                    if (['start', 'resume', 'stop'].includes(action)) {
                        const loadingText = document.getElementById('loadingText');
                        if (loadingText) {
                            loadingText.textContent =
                                action === 'start' ? 'Iniciando scanner...' :
                                action === 'resume' ? 'Retomando scanner...' : 'Parando scanner...';
                            const loadingIndicator = document.getElementById('loadingIndicator');
                            if (loadingIndicator) loadingIndicator.style.display = 'flex';
                        }
                    }

                    // Executa a ação com tratamento de erro
                    try {
                        actions[action]();
                    } catch (error) {
                        console.error(`Erro ao executar ação ${action}:`, error);
                        showError(`Erro ao ${action} o scanner: ${error.message || 'Erro desconhecido'}`);

                        // Esconde o indicador de carregamento em caso de erro
                        const loadingIndicator = document.getElementById('loadingIndicator');
                        if (loadingIndicator) loadingIndicator.style.display = 'none';
                    }
                } else {
                    console.error('No action found for:', action);
                    showError(`Ação não suportada: ${action}`);
                }
            } catch (error) {
                console.error('Erro no manipulador de clique do botão:', error);
                showError(`Erro ao processar o clique: ${error.message || 'Erro desconhecido'}`);

                // Esconde o indicador de carregamento em caso de erro
                const loadingIndicator = document.getElementById('loadingIndicator');
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            }

            return false;
        });
    });
}

// Barcode scanner using QuaggaJS
let scannerRunning = false;
let isCameraPaused = false;
let lastScanned = null;
let lastScanTime = 0;
let stream = null;
let quaggaInitialized = false;
let quaggaConfig = null;
let currentQuaggaInstance = null;

function iniciarScanner() {
    try {
        console.log('Iniciando scanner...');

        // Verifica se o Quagga está disponível
        if (typeof Quagga === 'undefined') {
            throw new Error('Biblioteca do scanner não carregada corretamente');
        }

        // Verifica se já existe um scanner em execução
        if (window.quaggaInitialized) {
            console.log('Scanner já está em execução');
            return;
        }

        // Mostra o indicador de carregamento
        const loadingText = document.getElementById('loadingText');
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingText && loadingIndicator) {
            loadingText.textContent = 'Iniciando o scanner...';
            loadingIndicator.style.display = 'flex';
        }

        // Limpa o container do scanner
        const scannerContainer = document.getElementById('scannerContainer');
        if (scannerContainer) {
            scannerContainer.innerHTML = `
                <div style="position: relative; width: 100%; max-width: 640px; margin: 0 auto;">
                    <video style="width: 100%; border-radius: 8px;" playsinline></video>
                    <div style="position: absolute; top: 10px; left: 0; width: 100%; text-align: center; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
                        <i class="fas fa-barcode" style="font-size: 24px;"></i>
                        <p>Aponte para um código de barras</p>
                    </div>
                </div>`;
        }

        // Configuração do Quagga
        const config = {
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: scannerContainer ? scannerContainer.querySelector('video') : null,
                constraints: {
                    width: { min: 640 },
                    height: { min: 480 },
                    facingMode: "environment",
                    aspectRatio: { min: 1, max: 2 }
                },
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "code_128_reader"],
                debug: {
                    showCanvas: true,
                    showPatches: true,
                    showFoundPatches: true,
                    showSkeleton: true,
                    showLabels: true,
                    showPatchLabels: true,
                    showRemainingPatchLabels: true,
                    boxFromPatches: {
                        showTransformed: true,
                        showTransformedBox: true,
                        showBB: true
                    }
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: Math.max(1, navigator.hardwareConcurrency || 2),
            frequency: 10,
            debug: false,
            multiple: false
        };

        console.log('Inicializando Quagga com a configuração:', config);

        // Adiciona o manipulador de detecção antes de iniciar
        Quagga.onDetected(function(result) {
            try {
                if (!result || !result.codeResult || !result.codeResult.code) {
                    console.warn('Código detectado inválido:', result);
                    return;
                }

                const code = result.codeResult.code;
                console.log('Código detectado:', code);

                // Atualiza o campo de busca e inicia a busca
                const searchInput = document.getElementById('searchBarcode');
                if (searchInput) {
                    searchInput.value = code;
                    buscarProduto();
                }

                // Pausa o scanner após a detecção
                pausarCamera();

                // Mostra feedback visual
                if (scannerContainer) {
                    scannerContainer.style.border = '5px solid #4CAF50';
                    setTimeout(() => {
                        scannerContainer.style.border = 'none';
                    }, 500);
                }

            } catch (error) {
                console.error('Erro ao processar código detectado:', error);
            }
        });

        // Inicializa o Quagga
        try {
            return new Promise((resolve, reject) => {
                Quagga.init(config, function(err) {
                    if (err) {
                        console.error('Erro ao inicializar o Quagga:', err);
                        reject(err);
                        return;
                    }
                    console.log('Quagga inicializado com sucesso');
                    resolve();
                });
            })
            .then(() => {
                // Inicia o scanner após a inicialização bem-sucedida
                console.log('Iniciando o scanner...');
                return Quagga.start();
            })
            .then(() => {
                console.log('Scanner iniciado com sucesso');
                window.quaggaInitialized = true;
                window.quaggaPaused = false;
                scannerRunning = true;

                // Atualiza a UI
                document.getElementById('startScannerBtn').style.display = 'none';
                document.getElementById('stopScannerBtn').style.display = 'inline-flex';
                document.getElementById('pauseScannerBtn').style.display = 'inline-flex';
                document.getElementById('resumeScannerBtn').style.display = 'none';

                // Mostra mensagem de sucesso
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Scanner iniciado com sucesso!';
                document.body.prepend(successMsg);
                setTimeout(() => {
                    successMsg.style.opacity = '0';
                    setTimeout(() => successMsg.remove(), 500);
                }, 3000);

                // Esconde o indicador de carregamento
                if (loadingIndicator) loadingIndicator.style.display = 'none';

                return true;
            })
            .catch((error) => {
                console.error('Erro ao iniciar o scanner:', error);

                let errorMessage = 'Erro ao iniciar o scanner: ';
                if (error.message && error.message.includes('NotAllowedError')) {
                    errorMessage += 'Permissão de câmera negada. Por favor, verifique as permissões do navegador.';
                } else if (error.message && error.message.includes('NotFoundError')) {
                    errorMessage += 'Nenhuma câmera encontrada. Certifique-se de que uma câmera está conectada.';
                } else if (error.message && error.message.includes('NotReadableError')) {
                    errorMessage += 'Não foi possível acessar a câmera. Pode estar em uso por outro aplicativo.';
                } else {
                    errorMessage += error.message || 'Erro desconhecido';
                }

                showError(errorMessage);

                // Tenta parar o scanner em caso de erro
                try {
                    if (typeof Quagga !== 'undefined') {
                        Quagga.stop();
                        window.quaggaInitialized = false;
                        scannerRunning = false;
                    }
                } catch (e) {
                    console.error('Erro ao parar o scanner após erro:', e);
                }

                // Reseta o estado dos botões
                document.getElementById('startScannerBtn').style.display = 'inline-flex';
                document.getElementById('stopScannerBtn').style.display = 'none';
                document.getElementById('pauseScannerBtn').style.display = 'none';
                document.getElementById('resumeScannerBtn').style.display = 'none';

                // Esconde o indicador de carregamento em caso de erro
                if (loadingIndicator) loadingIndicator.style.display = 'none';

                return false;
            });
        } catch (error) {
            console.error('Erro inesperado ao iniciar o scanner:', error);
            showError('Ocorreu um erro inesperado ao iniciar o scanner: ' + error.message);

            // Esconde o indicador de carregamento em caso de erro
            if (loadingIndicator) loadingIndicator.style.display = 'none';

            return false;
        }
    } catch (error) {
        console.error('Erro na função iniciarScanner:', error);
        showError('Ocorreu um erro ao tentar iniciar o scanner: ' + error.message);
        return false;
    }
}

// Função para processar códigos detectados
function processarCodigoDetectado(result) {
    if (!result || !result.codeResult || !result.codeResult.code) {
        console.error('Resultado de leitura inválido:', result);
        return;
    }

    const code = result.codeResult.code;
    const now = Date.now();

    // Evita leituras duplicadas em curto período
    if (lastScanned === code && (now - lastScanTime) < 1000) {
        console.log('Leitura duplicada ignorada:', code);
        return;
    }

    console.log('Código lido:', code);
    lastScanned = code;
    lastScanTime = now;

    // Atualiza o campo de busca
    const barcodeInput = document.getElementById('barcode');
    if (barcodeInput) {
        barcodeInput.value = code;
        barcodeInput.focus();
        barcodeInput.select();

        // Pesquisar automaticamente após um pequeno atraso
        setTimeout(() => {
            buscarProduto();
        }, 300);
    }
}

function pausarCamera() {
    console.log('Pausando câmera...');
    if (!scannerRunning || isCameraPaused) {
        console.log('Scanner não está em execução ou já está pausado');
        return;
    }

    try {
        // Pausa o scanner
        if (quaggaInitialized && typeof Quagga !== 'undefined') {
            try {
                // Pausa o Quagga
                Quagga.pause();
                window.quaggaPaused = true;

                // Para a visualização da câmera, mas mantém o estado
                const videoElement = document.querySelector('video');
                if (videoElement) {
                    videoElement.pause();
                }

                isCameraPaused = true;

                // Atualiza a interface
                const scannerContainer = document.getElementById('scannerContainer');
                if (scannerContainer) {
                    scannerContainer.innerHTML = `
                        <div style="color: white; text-align: center; padding: 20px;">
                            <div style="background-color: #f39c12; color: #fff; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                                <i class="fas fa-pause"></i> Câmera pausada
                            </div>
                            <p>Clique em "Retomar" para continuar escaneando.</p>
                        </div>
                    `;
                }

                // Atualiza a UI
                document.getElementById('pauseScannerBtn').style.display = 'none';
                document.getElementById('resumeScannerBtn').style.display = 'inline-flex';

                console.log('Câmera pausada');

                // Esconde o indicador de carregamento
                const loadingIndicator = document.getElementById('loadingIndicator');
                if (loadingIndicator) loadingIndicator.style.display = 'none';

            } catch (e) {
                console.error('Erro ao pausar o scanner:', e);
                throw new Error('Não foi possível pausar o scanner: ' + (e.message || 'Erro desconhecido'));
            }
        }

    } catch (error) {
        console.error('Erro ao pausar a câmera:', error);
        showError('Não foi possível pausar a câmera: ' + (error.message || 'Erro desconhecido'));

        // Tenta parar o scanner em caso de erro
        try {
            if (typeof Quagga !== 'undefined') {
                Quagga.stop();
                window.quaggaInitialized = false;
            }
        } catch (e) {
            console.error('Erro ao parar o scanner após erro:', e);
        }

        // Esconde o indicador de carregamento em caso de erro
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

function retomarCamera() {
    console.log('Retomando câmera...');

    try {
        if (typeof Quagga === 'undefined') {
            throw new Error('Biblioteca do scanner não carregada');
        }

        Quagga.start();
        window.quaggaPaused = false;

        // Atualiza a UI
        document.getElementById('resumeScannerBtn').style.display = 'none';
        document.getElementById('pauseScannerBtn').style.display = 'inline-flex';

        console.log('Câmera retomada');

        // Esconde o indicador de carregamento
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';

    } catch (error) {
        console.error('Erro ao retomar a câmera:', error);
        showError('Erro ao retomar a câmera: ' + (error.message || 'Erro desconhecido'));

        // Tenta parar o scanner em caso de erro
        try {
            if (typeof Quagga !== 'undefined') {
                Quagga.stop();
                window.quaggaInitialized = false;
            }
        } catch (e) {
            console.error('Erro ao parar o scanner após erro:', e);
        }

        // Esconde o indicador de carregamento em caso de erro
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

function resetScannerState() {
    // Para a stream da câmera se existir
    if (stream) {
        try {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        } catch (e) {
            console.error('Erro ao parar as tracks da câmera:', e);
        }
        stream = null;
    }

    // Para o Quagga se estiver inicializado
    if (quaggaInitialized && Quagga) {
        try {
            Quagga.offDetected();
            Quagga.offProcessed();
            Quagga.stop();
        } catch (e) {
            console.error('Erro ao parar o Quagga:', e);
        }
    }

    // Reseta os estados
    scannerRunning = false;
    isCameraPaused = false;
    quaggaInitialized = false;

    // Atualiza a interface
    updateCameraStatus(false);

    // Atualiza a visibilidade dos botões
    document.getElementById('startScannerBtn').style.display = 'inline-flex';
    document.getElementById('pauseScannerBtn').style.display = 'none';
    document.getElementById('resumeScannerBtn').style.display = 'none';
    document.getElementById('stopScannerBtn').style.display = 'none';

    return true;
}

function pararScanner() {
    console.log('Parando scanner...');

    try {
        // Mostra o indicador de carregamento
        const loadingText = document.getElementById('loadingText');
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingText && loadingIndicator) {
            loadingText.textContent = 'Parando scanner...';
            loadingIndicator.style.display = 'flex';
        }

        // Para o scanner se estiver em execução
        if (window.quaggaInitialized && typeof Quagga !== 'undefined') {
            Quagga.stop().then(function() {
                console.log('Scanner parado com sucesso');

                // Limpa o estado
                window.quaggaInitialized = false;
                window.quaggaPaused = false;

                // Limpa os listeners
                Quagga.offDetected();
                Quagga.offProcessed();

                // Atualiza a UI
                document.getElementById('startScannerBtn').style.display = 'inline-flex';
                document.getElementById('pauseScannerBtn').style.display = 'none';
                document.getElementById('resumeScannerBtn').style.display = 'none';
                document.getElementById('stopScannerBtn').style.display = 'none';

                // Limpa o container do scanner
                const scannerContainer = document.getElementById('scannerContainer');
                if (scannerContainer) {
                    scannerContainer.innerHTML = '<p style="color: white;">O scanner será exibido aqui</p>';
                }

                // Limpa o resultado
                const scannerResult = document.getElementById('scannerResult');
                if (scannerResult) {
                    scannerResult.innerHTML = '';
                }

                // Esconde o indicador de carregamento
                if (loadingIndicator) loadingIndicator.style.display = 'none';

            }).catch(function(error) {
                console.error('Erro ao parar o scanner:', error);
                showError('Erro ao parar o scanner: ' + (error.message || 'Erro desconhecido'));

                // Força a limpeza em caso de erro
                window.quaggaInitialized = false;
                window.quaggaPaused = false;

                // Esconde o indicador de carregamento em caso de erro
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            });
        } else {
            console.log('Scanner já estava parado');

            // Atualiza a UI mesmo se o scanner não estiver inicializado
            document.getElementById('startScannerBtn').style.display = 'inline-flex';
            document.getElementById('pauseScannerBtn').style.display = 'none';
            document.getElementById('resumeScannerBtn').style.display = 'none';
            document.getElementById('stopScannerBtn').style.display = 'none';

            // Esconde o indicador de carregamento
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }

        if (scannerContainer) {
            scannerContainer.innerHTML = `
                <div style="color: white; text-align: center; padding: 20px;">
                    <div style="background-color: #e74c3c; color: #fff; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                        <i class="fas fa-stop"></i> Scanner desativado
                    </div>
                    <p>Clique em "Iniciar Scanner" para ativar novamente.</p>
                </div>`;
        }

        document.getElementById("scannerResult").innerHTML = "<p>Scanner desativado.</p>";
        console.log('Scanner parado');
    } catch (error) {
        console.error("Erro ao parar o scanner:", error);
        document.getElementById("scannerResult").innerHTML = "<p class='error'>Ocorreu um erro ao desativar o scanner: " + (error.message || 'Erro desconhecido') + "</p>";
    } finally {
        resetScannerState();
    }
}

function updateCameraStatus(active) {
    const statusElement = document.getElementById('cameraStatus');
    if (!statusElement) return;

    // Atualiza o indicador de status
    const indicator = document.getElementById('cameraStatusIndicator');
    if (indicator) {
        indicator.style.backgroundColor = active ? '#2ecc71' : '#e74c3c';
        indicator.title = active ? 'Câmera ativa' : 'Câmera inativa';
    }
    if (statusElement) {
        if (active) {
            statusElement.innerHTML = '<i class="fas fa-circle" style="color: #2ecc71;"></i> Câmera ativa';
            statusElement.className = 'active';
        } else {
            statusElement.innerHTML = '<i class="fas fa-circle" style="color: #e74c3c;"></i> Câmera inativa';
            statusElement.className = 'inactive';
        }
    }
}

function showError(message) {
    console.error('Erro:', message);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#721c24';
    errorDiv.style.margin = '10px 0';
    errorDiv.style.padding = '10px';
    errorDiv.style.border = '1px solid #f5c6cb';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.backgroundColor = '#f8d7da';
    errorDiv.style.maxWidth = '600px';
    errorDiv.style.marginLeft = 'auto';
    errorDiv.style.marginRight = 'auto';
    errorDiv.textContent = message;

    // Adiciona o erro ao scannerResult ou ao container apropriado
    const resultDiv = document.getElementById('scannerResult');
    if (resultDiv) {
        resultDiv.innerHTML = '';
        resultDiv.appendChild(errorDiv);
    }
}