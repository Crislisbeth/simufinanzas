// --- FINANZAFLOW CORE v5 (CLEAN SLATE) ---

let state = {
    challengeBudget: 1.00,
    health: 100,
    currentDay: 1,
    flowPoints: 150,
    transactions: [],
    goals: []
};

// DOM Cache
const budgetEl = document.getElementById('challenge-budget');
const healthFill = document.getElementById('health-fill');
const healthStatus = document.getElementById('health-percent');
const flowPointsEl = document.getElementById('flow-points');
const txList = document.getElementById('transactions-list');
const goalsContainer = document.getElementById('goals-container');
const modalExpense = document.getElementById('modal-container');
const modalGoal = document.getElementById('modal-goal-container');
const txForm = document.getElementById('transaction-form');
const goalForm = document.getElementById('goal-form');

function init() {
    const saved = localStorage.getItem('finanzaflow_v5_clean');
    if (saved) {
        state = JSON.parse(saved);
    } else {
        document.getElementById('tutorial-container').classList.remove('hidden');
    }
    updateUI();
}

function updateUI() {
    budgetEl.innerText = `$${state.challengeBudget.toFixed(2)}`;
    healthFill.style.width = `${state.health}%`;
    healthStatus.innerText = `${state.health}%`;
    flowPointsEl.innerText = state.flowPoints;

    // Render Transactions
    txList.innerHTML = '';
    if (state.transactions.length === 0) {
        txList.innerHTML = '<div style="text-align:center; padding:30px; color:#cbd5e1; font-weight:600;">No hay movimientos todavía.</div>';
    } else {
        state.transactions.slice(0, 5).forEach(tx => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            const colorClass = tx.type === 'vital' ? 'vibrant-green' : 'vibrant-red';
            item.innerHTML = `
                <div class="tx-desc">
                    <strong>${tx.concept}</strong>
                    <span style="font-size:0.7rem; color:#94a3b8;">${tx.date} • ${tx.time}</span>
                </div>
                <div class="tx-val ${colorClass}">
                    -${tx.amount.toFixed(2)}
                </div>
            `;
            txList.appendChild(item);
        });
    }

    // Render Goals
    goalsContainer.innerHTML = '';
    if (state.goals.length === 0) {
        goalsContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#cbd5e1; font-size:0.8rem;">Añade tu primera meta para empezar.</div>';
    } else {
        state.goals.forEach(goal => {
            const progress = Math.min(100, (goal.current / goal.target) * 100);
            const div = document.createElement('div');
            div.style = 'background: #f8fafc; padding: 20px; border-radius: 20px; margin-bottom: 15px; border: 1px solid #e2e8f0;';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-weight:800; font-size:0.9rem; margin-bottom:10px;">
                    <span>${goal.name}</span>
                    <span style="color:var(--primary)">$${goal.target.toFixed(2)}</span>
                </div>
                <div style="height:8px; background:#e2e8f0; border-radius:10px; overflow:hidden;">
                    <div style="height:100%; width:${progress}%; background:var(--primary); border-radius:10px;"></div>
                </div>
                <div style="margin-top:10px; font-size:0.75rem; color:#64748b;">
                    Meta: $${goal.target.toFixed(2)}
                </div>
            `;
            goalsContainer.appendChild(div);
        });
    }
}

// Global Help
document.getElementById('btn-help')?.addEventListener('click', () => {
    document.getElementById('tutorial-container').classList.remove('hidden');
});

document.getElementById('btn-close-tutorial')?.addEventListener('click', () => {
    document.getElementById('tutorial-container').classList.add('hidden');
});

// Expense Logic
document.getElementById('btn-open-expense')?.addEventListener('click', () => {
    modalExpense.classList.remove('hidden');
});

document.getElementById('btn-close-modal')?.addEventListener('click', () => modalExpense.classList.add('hidden'));

txForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const concept = document.getElementById('concept').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('expense-type').value;

    if (amount > state.challengeBudget) {
        triggerToast("⚠️ Tu bóveda no tiene suficiente dinero.");
        return;
    }

    processTransaction(concept, amount, type);
    modalExpense.classList.add('hidden');
    txForm.reset();
});

function processTransaction(concept, amount, type) {
    const now = new Date();
    const tx = {
        id: Date.now(),
        concept,
        amount,
        type,
        date: 'Hoy',
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.transactions.unshift(tx);
    state.challengeBudget -= amount;
    
    if (type === 'luxury') {
        state.health = Math.max(0, state.health - 20);
        state.flowPoints += 2;
        triggerToast("🔴 Gasto Hormiga: Salud -20%");
    } else {
        state.health = Math.max(0, state.health - 5);
        state.flowPoints += 25;
        triggerToast("🟢 Gasto Vital: +25 FlowPoints");
    }

    save();
    updateUI();
}

// Income Logic
document.getElementById('btn-add-income')?.addEventListener('click', () => {
    const val = prompt("¿Cuánto dinero vas a añadir? ($)");
    const amount = parseFloat(val);
    if (!isNaN(amount) && amount > 0) {
        state.challengeBudget += amount;
        save();
        updateUI();
        triggerToast(`💰 Ingreso de $${amount.toFixed(2)} aceptado.`);
    }
});

// Goal Logic (MODAL)
document.getElementById('btn-new-goal')?.addEventListener('click', () => {
    modalGoal.classList.remove('hidden');
});

document.getElementById('btn-close-goal-modal')?.addEventListener('click', () => {
    modalGoal.classList.add('hidden');
});

goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('goal-name').value;
    const target = parseFloat(document.getElementById('goal-target').value);

    if (name && !isNaN(target) && target > 0) {
        state.goals.push({ id: Date.now(), name, target, current: 0 });
        save();
        updateUI();
        modalGoal.classList.add('hidden');
        goalForm.reset();
        triggerToast(`🚀 Meta "${name}" creada.`);
    }
});

function triggerToast(msg) {
    const toast = document.createElement('div');
    toast.style = `
        position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
        background: #1e293b; color: white; padding: 15px 25px;
        border-radius: 20px; font-weight: 800; z-index: 5000;
        font-size: 0.85rem; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: slideUpToast 0.4s ease-out;
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function save() {
    localStorage.setItem('finanzaflow_v5_clean', JSON.stringify(state));
}

init();
