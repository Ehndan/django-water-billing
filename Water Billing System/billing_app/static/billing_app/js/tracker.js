function redirectConcessionaire() {
    window.location.href = "/concessionaire/";
}

function redirectStaff() {
    window.location.href = "/staff/";
}

function qr_scan() {
    // Adjust this if you implement QR logic later
    window.location.href = "/scan-qr/";
}

function validID() {
    const id = document.getElementById("user_id").value;

    if (id === "") {
        alert("Please enter input");
    } else {
        // Example: redirect to a Django view using the ID
        window.location.href = `/billing-tracker/records/${id}/`;
    }
}

/* Load billing records on page load */
document.addEventListener("DOMContentLoaded", () => {
    fetchBillingRecords();
});

function fetchBillingRecords() {
    fetch("/api/billings/")  // Django URL to your JSON API endpoint
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok.");
            return response.json();
        })
        .then(data => {
            populateTable(data);
        })
        .catch(error => {
            console.error("Failed to fetch billing records:", error);
        });
}

function populateTable(records) {
    const tableBody = document.querySelector("table tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";  // Clear old data

    records.forEach(record => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${record.name}</td>
            <td>${record.address}</td>
            <td>${record.last_reading}</td>
            <td>${record.amount_due}</td>
            <td>${record.status}</td>
            <td>${record.additional_fee}</td>
        `;

        tableBody.appendChild(row);
    });
}
