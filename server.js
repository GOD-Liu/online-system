const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const app = express();
const port = 3000;

const SALT_ROUNDS = 10;

const pool = new Pool({
    user: 'your_db_user',
    host: 'localhost',
    database: 'your_db_name',
    password: 'your_db_password',
    port: 5432,
});

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// 中间件：检查是否为管理员
function checkAdminAuth(req, res, next) {
    if (req.session.loggedIn && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
}

// 管理员登录
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    pool.query('SELECT * FROM users WHERE username = $1', [username], (error, results) => {
        if (error || results.rows.length === 0) {
            res.status(401).json({ success: false });
        } else {
            const user = results.rows[0];
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    req.session.loggedIn = true;
                    req.session.role = user.role_name;
                    req.session.company = user.company;
                    res.status(200).json({ success: true });
                } else {
                    res.status(401).json({ success: false });
                }
            });
        }
    });
});

// 创建子管理员（仅admin可访问）
app.post('/create-user', checkAdminAuth, (req, res) => {
    const { username, password, role, company } = req.body;
    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
        if (err) throw err;
        pool.query('INSERT INTO users (username, password, role_id, company) VALUES ($1, $2, (SELECT id FROM roles WHERE role_name = $3), $4)',
            [username, hash, role, company],
            (error, results) => {
                if (error) {
                    res.status(500).json({ success: false });
                } else {
                    res.status(200).json({ success: true });
                }
            });
    });
});

// 获取后台数据（根据角色限制数据访问）
app.get('/admin-data', (req, res) => {
    const { name, company, startDate, endDate } = req.query;
    let query = 'SELECT * FROM submissions WHERE 1=1';
    let queryParams = [];

    // 筛选条件
    if (req.session.role === 'sub_admin') {
        queryParams.push(req.session.company);
        query += ` AND company = $${queryParams.length}`;
    } else if (company) { // 总管理员可以选择公司进行筛选
        queryParams.push(company);
        query += ` AND company = $${queryParams.length}`;
    }

    if (name) {
        queryParams.push(`%${name}%`);
        query += ` AND name ILIKE $${queryParams.length}`;
    }

    if (startDate) {
        queryParams.push(startDate);
        query += ` AND created_at >= $${queryParams.length}`;
    }

    if (endDate) {
        queryParams.push(endDate);
        query += ` AND created_at <= $${queryParams.length}`;
    }

    query += ' ORDER BY created_at DESC';

    pool.query(query, queryParams, (error, results) => {
        if (error) {
            res.status(500).send(error.toString());
        } else {
            res.status(200).json(results.rows);
        }
    });
});

// 下载数据
app.get('/download-data', (req, res) => {
    const { name, company, startDate, endDate } = req.query;
    let query = 'SELECT * FROM submissions WHERE 1=1';
    let queryParams = [];

    // 筛选条件
    if (req.session.role === 'sub_admin') {
        queryParams.push(req.session.company);
        query += ` AND company = $${queryParams.length}`;
    } else if (company) { // 总管理员可以选择公司进行筛选
        queryParams.push(company);
        query += ` AND company = $${queryParams.length}`;
    }

    if (name) {
        queryParams.push(`%${name}%`);
        query += ` AND name ILIKE $${queryParams.length}`;
    }

    if (startDate) {
        queryParams.push(startDate);
        query += ` AND created_at >= $${queryParams.length}`;
    }

    if (endDate) {
        queryParams.push(endDate);
        query += ` AND created_at <= $${queryParams.length}`;
    }

    query += ' ORDER BY created_at DESC';

    pool.query(query, queryParams, (error, results) => {
        if (error) {
            res.status(500).send(error.toString());
        } else {
            const csvData = results.rows.map(row => ({
                name: row.name,
                phone: row.phone,
                company: row.company,
                plate: row.plate,
                signature: row.signature,
                created_at: row.created_at,
            }));

            const csvContent = "data:text/csv;charset=utf-8," 
                + csvData.map(e => Object.values(e).join(",")).join("\n");

            const filePath = path.join(__dirname, 'public', 'data.csv');
            fs.writeFileSync(filePath, csvContent);

            res.download(filePath, 'data.csv', (err) => {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    fs.unlinkSync(filePath); // 下载后删除临时文件
                }
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});