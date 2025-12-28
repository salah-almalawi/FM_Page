document.addEventListener('DOMContentLoaded', () => {
    // تحديد العناصر
    const modal = document.getElementById('modal');
    const addBtn = document.getElementById('add-btn');
    const exportBtn = document.getElementById('export-btn');
    const closeValBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const totalAmountEl = document.getElementById('total-amount');
    const transactionCountEl = document.getElementById('transaction-count');
    const emptyState = document.getElementById('empty-state');

    // الحالة الأولية (State)
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // تهيئة التطبيق
    init();

    // الدوال المساعدة للواجهة (UI Helpers)
    function openModal() {
        modal.classList.remove('hidden');
        // Small timeout to allow the browser to register the removal of 'hidden' before adding 'active' for transition
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden'; // منع التمرير في الخلفية
    }

    function closeModal() {
        modal.classList.remove('active');
        // Wait for transition to finish before hiding
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300); // Matches CSS transition speed
        document.body.style.overflow = ''; // إعادة التمرير
        expenseForm.reset();
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-SA', options);
    }

    // إدارة البيانات (Data Management)
    function saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateUI();
    }

    function addExpense(e) {
        e.preventDefault();

        const amountInput = document.getElementById('amount');
        const reasonInput = document.getElementById('reason');

        const amount = parseFloat(amountInput.value);
        const reason = reasonInput.value.trim();

        if (amount <= 0 || reason === '') {
            alert('يرجى إدخال مبلغ صحيح وسبب للصرف');
            return;
        }

        const newExpense = {
            id: Date.now(), // معرف فريد
            amount: amount,
            reason: reason,
            date: new Date().toISOString()
        };

        expenses.unshift(newExpense); // إضافة في البداية
        saveExpenses();
        closeModal();
    }

    function deleteExpense(id) {
        if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
            expenses = expenses.filter(expense => expense.id !== id);
            saveExpenses();
        }
    }

    // تحديث الواجهة (Update UI)
    function updateUI() {
        // مسح القائمة الحالية
        expenseList.innerHTML = '';

        // حساب الإجمالي
        const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        totalAmountEl.textContent = formatCurrency(total);
        transactionCountEl.textContent = expenses.length;

        // إظهار/إخفاء الحالة الفارغة
        if (expenses.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        // عرض المصاريف
        expenses.forEach(expense => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${formatDate(expense.date)}</td>
                <td>${expense.reason}</td>
                <td class="amount">${formatCurrency(expense.amount)}</td>
                <td>
                    <button class="btn-icon delete" data-id="${expense.id}" aria-label="حذف">
                        <i class="las la-trash"></i>
                    </button>
                </td>
            `;

            expenseList.appendChild(tr);
        });

        // إضافة مستمعي الأحداث لأزرار الحذف (Event Delegation is better but this works for small scale)
        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                deleteExpense(id);
            });
        });
    }

    function exportToTxt() {
        if (expenses.length === 0) {
            alert('لا توجد مصاريف لتصديرها');
            return;
        }

        let content = "سجل المصاريف\n";
        content += "====================\n\n";

        expenses.forEach(expense => {
            content += `التاريخ: ${formatDate(expense.date)}\n`;
            content += `السبب: ${expense.reason}\n`;
            content += `المبلغ: ${formatCurrency(expense.amount)}\n`;
            content += "--------------------\n";
        });

        const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        content += `\nالإجمالي: ${formatCurrency(total)}`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `مصاريف_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function init() {
        updateUI();

        // مستمعي الأحداث
        addBtn.addEventListener('click', openModal);
        exportBtn.addEventListener('click', exportToTxt);
        closeValBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        expenseForm.addEventListener('submit', addExpense);

        // إغلاق النافذة عند النقر خارجها
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});
