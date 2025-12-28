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
    let editingId = null;

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

        // Reset editing state
        editingId = null;
        const titleEl = document.querySelector('.modal-header h2');
        if (titleEl) titleEl.textContent = 'إضافة مصروف جديد';
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
            id: editingId ? editingId : Date.now(), // Use existing ID if editing
            amount: amount,
            reason: reason,
            date: editingId ? expenses.find(e => e.id === editingId).date : new Date().toISOString()
        };

        if (editingId) {
            // Update existing expense
            const index = expenses.findIndex(e => e.id === editingId);
            if (index !== -1) {
                expenses[index] = newExpense;
            }
        } else {
            // Add new expense
            expenses.unshift(newExpense);
        }

        saveExpenses();
        closeModal();
    }

    function editExpense(id) {
        const expense = expenses.find(e => e.id === id);
        if (expense) {
            document.getElementById('amount').value = expense.amount;
            document.getElementById('reason').value = expense.reason;
            editingId = id;

            // Update modal title logic could go here or via separate element, 
            // but for simplicity we'll just open the modal.
            // Ideally change title to "تعديل مصروف"
            const titleEl = document.querySelector('.modal-header h2');
            if (titleEl) titleEl.textContent = 'تعديل مصروف';

            openModal();
        }
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
                    <button class="btn-icon edit" data-id="${expense.id}" aria-label="تعديل">
                        <i class="las la-pen"></i>
                    </button>
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

        document.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                editExpense(id);
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
