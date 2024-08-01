document.getElementById('filter').addEventListener('click', () => {
    const name = document.getElementById('name-filter').value;
    const company = document.getElementById('company-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    fetch(`/admin-data?name=${name}&company=${company}&startDate=${startDate}&endDate=${endDate}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('submissions-table').querySelector('tbody');
            tableBody.innerHTML = '';
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.phone}</td>
                    <td>${item.company}</td>
                    <td>${item.plate}</td>
                    <td><img src="${item.signature}" alt="签名" width="100"></td>
                    <td>${item.created_at}</td>
                `;
                tableBody.appendChild(row);
            });
        });
});

document.getElementById('download').addEventListener('click', () => {
    window.location.href = '/download-data';
});

document.getElementById('create-user-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;
    const company = document.getElementById('new-company').value;

    fetch('/create-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role, company })
    }).then(response => response.json())
      .then(data => {
          if (data.success) {
              alert('用户创建成功！');
          } else {
              alert('用户创建失败。');
          }
      });
});