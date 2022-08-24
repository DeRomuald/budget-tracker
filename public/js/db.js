let db;
const request = indexedDB.open('pro-budget', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore('budget_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadBudgetTransaction();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(['budget_transaction'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('budget_transaction');

  budgetObjectStore.add(record);
}

function uploadBudgetTransaction() {
  const transaction = db.transaction(['budget_transaction'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('budget_transaction');

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(serverResponse => {

          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['budget_transaction'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('budget_transaction');
          budgetObjectStore.clear();

          alert('All saved budget transactions have been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadBudgetTransaction);