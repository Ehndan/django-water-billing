// Modal handling
function openModal() {
    document.getElementById("addCustomerModal").style.display = "block";
}
function closeModal() {
    document.getElementById("addCustomerModal").style.display = "none";
}

function openCreateBillingPopup() {
    document.getElementById("createBillingPopup").style.display = "block";
}
function closeCreateBillingPopup() {
    document.getElementById("createBillingPopup").style.display = "none";
}

function openViewBillingPopup(customerId) {
    fetch(`/validate-id?id=${customerId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const latestBill = data.data.bills[0];
                document.getElementById("consumer_name").value = data.data.name;
                document.getElementById("customer_id").value = customerId;
                document.getElementById("billing_id").value = latestBill.id || "";
                document.getElementById("view_billing_amount").value = latestBill.amount_due;
                document.getElementById("view_billing_status").value = latestBill.status;
                document.getElementById("view_billing_due_date").value = latestBill.due_date;
                document.getElementById("view_billing_consumption").value = latestBill.consumption || "";
                document.getElementById("view_billing_generated_at").value = latestBill.generated_at || "";
                document.getElementById("view_total_amount").value = latestBill.amount_due;
                document.getElementById("viewBillingPopup").style.display = "block";
            } else {
                alert("Consumer not found.");
            }
        });
}

function closeViewBillingPopup() {
    document.getElementById("viewBillingPopup").style.display = "none";
}

document.getElementById("addCustomerForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch("/create-consumer/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        body: formData
    })
        .then(res => {
            if (res.ok) {
                alert("Customer added.");
                window.location.reload();
            } else {
                alert("Error adding customer.");
            }
        });
});

// Create Billing
function createBillingRecord() {
    const data = {
        consumer_name: document.getElementById("customer_name").value,
        billing_period: document.getElementById("billing_period").value,
        due_date: document.getElementById("due_date").value,
        current_reading: document.getElementById("billing_consumption").value,
        meter_number: document.getElementById("billing_customer_id").value
    };

    const form = new FormData();
    for (const key in data) {
        form.append(key, data[key]);
    }

    fetch("/generate-bill/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        body: form
    }).then(res => {
        if (res.ok) {
            alert("Billing record created.");
            window.location.reload();
        } else {
            alert("Failed to create billing.");
        }
    });
}

function markAsPaid() {
    document.getElementById("active").value = "Paid";
}

// Util to get CSRF token
function getCSRFToken() {
    const cookie = document.cookie.split("; ").find(row => row.startsWith("csrftoken="));
    return cookie ? cookie.split("=")[1] : "";
}

// Logout redirect
function backLogin() {
    window.location.href = "/logout/";
}
