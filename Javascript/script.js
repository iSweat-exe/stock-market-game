class StockMarketGame {
    constructor() {
        // load
        this.loadGame();

        if (!this.history) this.history = [];
        if (!this.maxPrice) this.maxPrice = 50;

        setInterval(() => {
            this.nextTurn();
            this.saveGame();
        }, 2000);
    }

    getRandomPrice(min, max) {
        return Math.random() * (max - min) + min;
    }

    displayStatus() {
        const statusElement = document.getElementById('status');
        let status = `<p>Solde: ${this.balance.toFixed(2)} EUR</p>`;
        status += `<p>Prix de l'action: ${this.stockPrice.toFixed(2)} EUR</p>`;
        if (this.shares > 0) {
            const totalSharesValue = this.shares * this.stockPrice;
            status += `<p>Actions possédées: ${this.shares} (prix moyen d'achat: ${this.averageBuyPrice.toFixed(2)} EUR)</p>`;
            status += `<p>Valeur totale des actions: ${totalSharesValue.toFixed(2)} EUR</p>`;
        } else {
            status += `<p>Actions possédées: ${this.shares}</p>`;
        }
        statusElement.innerHTML = status;
    }

    buyShares(amount) {
        const cost = this.stockPrice * amount;
        if (cost > this.balance) {
            this.displayMessage("Fonds insuffisants pour acheter ces actions.", "red");
        } else {
            const totalCost = (this.averageBuyPrice * this.shares) + cost;
            this.shares += amount;
            this.balance -= cost;
            this.averageBuyPrice = totalCost / this.shares;
            this.displayMessage(`Achat de ${amount} actions à ${this.stockPrice.toFixed(2)} EUR chacune.`);
            this.displayStatus();
        }
    }

    sellShares(amount) {
        if (amount > this.shares) {
            this.displayMessage("Pas assez d'actions à vendre.", "red");
        } else {
            const earnings = this.stockPrice * amount;
            this.shares -= amount;
            this.balance += earnings;
            if (this.shares === 0) {
                this.averageBuyPrice = 0;
            }
            this.displayMessage(`Vente de ${amount} actions à ${this.stockPrice.toFixed(2)} EUR chacune.`);
            this.displayStatus();
        }
    }

    buyMax() {
        const maxAmount = Math.floor(this.balance / this.stockPrice);
        if (maxAmount > 0) {
            this.buyShares(maxAmount);
        } else {
            this.displayMessage("Fonds insuffisants pour acheter des actions.", "red");
        }
    }

    sellMax() {
        if (this.shares > 0) {
            this.sellShares(this.shares);
        } else {
            this.displayMessage("Pas d'actions à vendre.", "red");
        }
    }

    updateStockPrice() {
        const fluctuation = this.getRandomPrice(-5, 5);
        this.stockPrice += fluctuation;
        if (this.stockPrice < 1) {
            this.stockPrice = 1;
        }
        
        this.history.push({
            minute: this.minute,
            price: this.stockPrice.toFixed(2),
            color: this.stockPrice > this.previousPrice ? 'green' : this.stockPrice < this.previousPrice ? 'red' : 'lightblue'
        });

        this.previousPrice = this.stockPrice;
        this.updateChart();
    }

    displayMessage(message, color = "green") {
        const messageElement = document.getElementById('message');
        messageElement.style.color = color;
        messageElement.textContent = message;
    }

    nextTurn() {
        this.minute++;
        this.updateStockPrice();
        this.displayStatus();
        this.displayMessage(`Jour ${this.minute}: Prix de l'action mis à jour.`, "blue");
    }

    updateChart() {
        const chartCanvas = document.getElementById('chart');
        const chartContext = chartCanvas.getContext('2d');
    
        if (this.chart) {
            this.chart.destroy();
        }
    
        // Préparer les données pour le graphique
        const labels = this.history.map(entry => entry.minute);
        const data = this.history.map(entry => parseFloat(entry.price));
    
        // Créer le graphique
        this.chart = new Chart(chartContext, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Prix de l\'action',
                    data: data,
                    borderColor: '#091057',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    pointBackgroundColor: this.history.map(entry => entry.color),
                    borderWidth: 4,
                    tension: 0,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                elements: {
                    point: {
                        radius: 5,
                        hoverRadius: 8,
                    }
                },
                plugins: {
                    tooltip: {
                        caretSize: 10,
                        bodyFont: {
                            size: 16,
                        },
                        callbacks: {
                            label: function(context) {
                                const price = context.raw.toFixed(2);
                                return ` Prix: ${price} EUR`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Temps ( Jour(s) )'
                        },
                        min: 1,
                        max: this.minute,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Prix'
                        },
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: this.maxPrice
                    }
                }
            }
        });
    }

    // Save LS
    saveGame() {
        const gameState = {
            balance: this.balance,
            stockPrice: this.stockPrice,
            shares: this.shares,
            averageBuyPrice: this.averageBuyPrice,
            minute: this.minute,
            history: this.history,
            previousPrice: this.previousPrice
        };
        localStorage.setItem('stockMarketGame', JSON.stringify(gameState));
    }

    clearChart() {
        this.history = [];
        this.minute = 0;
        this.updateChart();
        console.log("clear graph");
    }

    loadGame() {
        const savedGame = localStorage.getItem('stockMarketGame');
        if (savedGame) {
            const gameState = JSON.parse(savedGame);
            this.balance = gameState.balance;
            this.stockPrice = gameState.stockPrice;
            this.shares = gameState.shares;
            this.averageBuyPrice = gameState.averageBuyPrice;
            this.minute = gameState.minute;
            this.history = gameState.history;
            this.previousPrice = gameState.previousPrice;
        } else {
            this.balance = 1000;
            this.stockPrice = this.getRandomPrice(10, 50);
            this.shares = 0;
            this.averageBuyPrice = 0;
            this.minute = 1;
            this.previousPrice = this.stockPrice;
        }
    }

    // DL JSON
    downloadJSON() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ prices: this.history }));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "historique_prix.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
    }
}

const game = new StockMarketGame();
game.displayStatus();

function buyShares() {
    const amount = parseInt(document.getElementById('amount').value);
    if (amount > 0) {
        game.buyShares(amount);
    }
}

function sellShares() {
    const amount = parseInt(document.getElementById('amount').value);
    if (amount > 0) {
        game.sellShares(amount);
    }
}

function buyMax() {
    game.buyMax();
}

function sellMax() {
    game.sellMax();
}

function nextTurn() {
    game.nextTurn();
}

function downloadJSON() {
    game.downloadJSON();
}

function clearChart() {
    game.clearChart();
}

