const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
let isDrawing = false;

canvas.addEventListener('mousedown', () => {
    isDrawing = true;
    ctx.beginPath();
});

canvas.addEventListener('mousemove', (event) => {
    if (isDrawing) {
        ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
        ctx.stroke();
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

document.getElementById('clear-signature').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const company = document.getElementById('company').value;
    const plate = document.getElementById('plate').value;
    const signature = canvas.toDataURL();

    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, phone, company, plate, signature })
    }).then(response => response.json())
      .then(data => alert('表单已提交！'))
      .catch(error => console.error('Error:', error));
});