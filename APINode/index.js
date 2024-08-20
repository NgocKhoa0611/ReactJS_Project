// const { adminAuth } = require('./adminAuth.js');
const mysql = require('mysql');
const exp = require("express");
const app = exp();
var cors = require('cors');
const jwt = require('node-jsonwebtoken');
const fs = require("fs");
const PRIVATE_KEY = fs.readFileSync("private-key.txt");

app.use([exp.json()]);

const corsOpt = {
    origin: "*",
    methods: "GET, PUT, POST, DELETE",
    allowedHeaders: [ 'Content-Type', 'Authorization' ],
    credentials: true,
};
app.use(cors(corsOpt));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    database: 'laptop_react'
});
db.connect( err => {
    if(err) throw err;
    console.log('Đã kết nối Database thầnh công');
});

app.post("/login", function(req, res){
    const un = req.body.un;
    const pw = req.body.pw;
    if(checkUserPass(un, pw) == true){
        const userInfo = getUserInfo(un);
        const jwtBearToken = jwt.sign({}, PRIVATE_KEY, { algorithm: "RS256", expiresIn: 120, subject: userInfo.id });
        res.status(200).json({ token: jwtBearToken, expiresIn: 120, userInfo: userInfo });
    }
    else res.status(401).json({ thongbao:"Đăng nhập thất bại" });
});

const checkUserPass = (un, pw) => {
    if(un == "aa" && pw == "123")
        return true;
    if(un == "bb" && pw == "321")
        return true;
    return false;
}
const getUserInfo = (username) => {
    if(username = "aa")
        return{
            "id":"1",
            "hoten":"Và Ngọc Khoa"
        };
    if(username = "bb")
        return{
            "id":"2",
            "hoten":"Nguyễn Thị Lượm"
        };
    return{
        "id":"-1",
        "hoten":""
    };
}

app.listen(3000, () => 
    console.log(`Ứng dụng đang chạy với port 3000`)
);

//nơi định nghĩa các đường route
app.get('/spmoi/:sosp?', function(req, res) {
    let sosp = parseInt(req.params.sosp || 6);
    if(sosp <= 1) sosp = 6;
    let sql = `SELECT id, ten_sp, gia, gia_km, hinh, ngay, luot_xem FROM san_pham WHERE an_hien = 1 ORDER BY ngay desc LIMIT 0, ?`;
    db.query(sql, sosp, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy list sp", err});
        else res.json(data);
    });
});
app.get('/sp/:id', function(req, res) {
    let id = parseInt(req.params.id || 0);
    if(isNaN(id) || id <= 0){
        res.json({"thongbao":"Không biết sản phẩm", "id":id});
        return;
    }
    let sql = `SELECT id, ten_sp, gia, gia_km, hinh, ngay, luot_xem FROM san_pham WHERE id=?`;
    db.query(sql, id, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy 1 sp", err});
        else res.json(data[0]);
    });
});
app.get('/spxemnhieu/:sosp?', function(req, res) {
    let sosp = parseInt(req.params.sosp || 6);
    if(sosp <= 1) sosp = 6;
    let sql = `SELECT id, ten_sp, gia, gia_km, hinh, ngay, luot_xem FROM san_pham WHERE an_hien = 1 ORDER BY luot_xem desc LIMIT 0, ?`;
    db.query(sql, sosp, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy list sp", err});
        else res.json(data);
    });
});
app.get('/sptrongloai/:id_loai', function(req, res){
    let id_loai = parseInt(req.params.id_loai);
    if(isNaN(id_loai) || id_loai <= 0){
        res.json({"thongbao":"Không biết loại", "id_loai": id_loai});
        return;
    }
    let sql = `SELECT id, ten_sp, gia, gia_km, hinh, ngay FROM san_pham WHERE id_loai=? AND an_hien = 1 ORDER BY id desc`;
    db.query(sql, id_loai, (err, data) => {   
        if(err) res.json({"thongbao":"Lỗi lấy sp trong loại", err});
        else res.json(data);
    });
});
app.get('/loai/:id_loai', function(req, res){
    let id_loai = parseInt(req.params.id_loai);
    if(isNaN(id_loai) || id_loai <= 0){
        res.json({"thongbao":"Không biết loại", "id_loai": id_loai});
        return;
    }
    let sql = `SELECT id, ten_loai FROM loai WHERE id=?`;
    db.query(sql, id_loai, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy loại", err});
        else res.json(data[0]);
    });
});
app.get('/loai', function(req, res){
    let sql = `SELECT id, ten_loai FROM loai`;
    db.query(sql, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy loại", err});
        else res.json(data);
    });
});

app.post('/luudonhang/', function(req, res){
    let data = req.body;
    let sql = `INSERT INTO don_hang SET ?`;
    db.query(sql, data, function(err, data){
        if(err) res.json({"id_dh": -1, "thongbao":"Lỗi lưu đơn hàng", err})
        else{
            id_dh = data.insertId
            res.json({"id_dh": id_dh, "thongbao":"Đã lưu đơn hàng"});
        }
    });
});
app.post('/luudonhang/', function(req, res){
    let data = req.body;
    let sql = `INSERT INTO chi_tiet_don_hang SET?`;
    db.query(sql, data, function(err, d){
        if(err) res.json({"thongbao":"Lỗi lưu sản phẩm", err})
        else res.json({"thongbao":"Đã lưu sản phẩm vào db", "id_sp": data.id_sp});
    });
});

//admin
app.get('/admin/sp', function(req, res){
    let sql = `SELECT id, ten_sp, gia, hinh, ngay, luot_xem FROM san_pham ORDER BY id desc`;
    db.query(sql, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy list sp", err});
        else res.json(data);
    });
});
app.get('/admin/sp/:id', function(req, res){
    let id = parseInt(req.params.id);
    if(id <= 0){
        res.json({"thongbao":"Không biết sản phẩm", "id": id});
        return;
    }
    let sql = `SELECT * FROM san_pham WHERE id=?`;
    db.query(sql, id, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy 1 sp", err});
        else res.json(data[0]);
    });
});

app.post('/admin/sp', function(req, res){
    let data = req.body;
    let sql = `INSERT INTO san_pham SET ?`;
    db.query(sql, data, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi chèn 1 sp", err});
        else res.json({"thongbao":"Đã chèn 1 sp", "id": data.insertId});
    });
});
app.put('/admin/sp/:id', function(req, res){
    let data = req.body;
    let id = req.params.id;
    let sql = `UPDATE san_pham SET ? WHERE id=?`;
    db.query(sql, [data, id], (err, d) => {
        if(err) res.json({"thongbao":"Lỗi cập nhật sp", err});
        else res.json({"thongbao":"Đã cập nhật sp"});
    });
});
app.delete('/admin/sp/:id', function(req, res){
    let id = req.params.id;
    let sql = `DELETE FROM san_pham WHERE id=?`;
    db.query(sql, id, (err, d) => {
        if(err) res.json({"thongbao":"Lỗi khi xóa sp", err});
        else res.json({"thongbao":"Đã xóa sp"});
    });
});
app.get('/admin/loai', function(req, res){
    let sql = `SELECT id, ten_loai, thu_tu, an_hien FROM loai ORDER BY id desc`;
    db.query(sql, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy list loại", err});
        else res.json(data);
    });
});
app.get('/admin/loai/:id', function(req, res){
    let id = parseInt(req.params.id);
    if(id <= 0){
        res.json({"thongbao":"Không biết loại", "id": id});
        return;
    }
    let sql = `SELECT * FROM loại WHERE id=?`;
    db.query(sql, id, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy 1 loại", err});
        else res.json(data[0]);
    });
});

app.post('/admin/loai', function(req, res){
    let data = req.body;
    let sql = `INSERT INTO loai SET ?`;
    db.query(sql, data, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi chèn 1 loại", err});
        else res.json({"thongbao":"Đã chèn 1 loại", "id": data.insertId});
    });
});
app.put('/admin/loai/:id', function(req, res){
    let data = req.body;
    let id = req.params.id;
    let sql = `UPDATE loai SET ? WHERE id=?`;
    db.query(sql, [data, id], (err, d) => {
        if(err) res.json({"thongbao":"Lỗi cập nhật loại", err});
        else res.json({"thongbao":"Đã cập nhật loại"});
    });
});
app.delete('/admin/loai/:id', function(req, res){
    let id = req.params.id;
    let sql = `DELETE FROM loai WHERE id=?`;
    db.query(sql, id, (err, d) => {
        if(err) res.json({"thongbao":"Lỗi khi xóa loại", err});
        else res.json({"thongbao":"Đã xóa loại"});
    });
});
app.get('/admin/sp/count', function(req, res){
    let sql = `SELECT COUNT(*) FROM AS count FROM san_pham WHERE an_hien = 1`;
    db.query(sql, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy số lượng sp", err});
        else res.json({count: data[0].count});
    });
});
app.get('/admin/loai/count', function(req, res){
    let sql = `SELECT COUNT(*) AS count FROM loai`;
    db.query(sql, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy số lượng loại", err});
        else res.json(data[0]);
    });
});
app.get('/admin/don_hang/count', function(req, res){
    let sql = `SELECT COUNT(*) AS count FROM don_hang`;
    db.query(sql, (err, data) => {
        if(err) res.json({"thongbao":"Lỗi lấy số lượng đơn hàng", err});
        else res.json(data[0]);
    });
});
