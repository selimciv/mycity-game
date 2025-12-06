const express = require('express');
const app = express();
app.use(express.json()); // JSON veri alabilmek için middleware
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const db = require('./db'); // DB modülünü dahil ediyoruz
const bcrypt = require('bcrypt'); // Şifre hashleme için

// Tüm bağlı oyuncuların verilerini tutacak obje
// Key: Socket ID, Value: Oyuncu verileri {x: 100, y: 100}
// Key: Socket ID, Value: Oyuncu verileri {x: 100, y: 100}
let players = {};

// Kristaller
let crystals = {};
let crystalIdCounter = 0;

function generateRandomCrystal() {
    // Inegol koordinatları etrafında rastgele
    const centerLat = 40.0789;
    const centerLon = 29.5133;
    const range = 0.005; // Yaklaşık 500m yarıçap

    crystalIdCounter++;
    const id = crystalIdCounter;

    return {
        id: id,
        lat: centerLat + (Math.random() - 0.5) * range,
        lon: centerLon + (Math.random() - 0.5) * range,
        value: 50
    };
}

// Başlangıçta 10 kristal oluştur
for (let i = 0; i < 10; i++) {
    const c = generateRandomCrystal();
    crystals[c.id] = c;
}

// İstemci dosyalarını (index.html, oyun kodları vb.) sunmak için:
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. Kayıt Rotası
// 2. Kayıt Rotası (MOCK)
app.post('/kayit', async (req, res) => {
    try {
        const { eposta, sifre, kullaniciAdi } = req.body;

        if (!eposta || !sifre) {
            return res.status(400).json({ mesaj: "E-posta ve şifre zorunludur." });
        }

        console.log(`[MOCK] Yeni kullanıcı kayıt oldu: ${eposta} (${kullaniciAdi || 'Anonim'})`);

        // Veritabanı yerine başarılı yanıt dönüyoruz
        res.status(201).json({ mesaj: "Kayıt Başarılı (Mock)" });

    } catch (err) {
        console.error("Kayıt Hatası:", err);
        res.status(500).json({ mesaj: "Sunucu hatası oluştu." });
    }
});

// 3. Giriş Rotası
// 3. Giriş Rotası (MOCK)
app.post('/giris', async (req, res) => {
    try {
        const { eposta, sifre } = req.body;

        if (!eposta || !sifre) {
            return res.status(400).json({ mesaj: "E-posta ve şifre zorunludur." });
        }

        // Mock Giriş Başarılı
        console.log(`[MOCK] Kullanıcı giriş yaptı: ${eposta}`);

        // Rastgele bir ID verelim (veya sabit)
        const mockId = Math.floor(Math.random() * 1000) + 1;

        res.status(200).json({ mesaj: "Giriş Başarılı (Mock)", dbId: mockId });

    } catch (err) {
        console.error("Giriş Hatası:", err);
        res.status(500).json({ mesaj: "Sunucu hatası oluştu." });
    }
});

// 4. Bina Satın Alma Rotası (MOCK)
app.post('/api/satin-al', (req, res) => {
    try {
        const { userId, buildingId } = req.body;

        console.log(`[MOCK] Bina satın alındı: ${buildingId} by User ${userId}`);

        // Mock Başarılı Yanıt
        res.json({
            success: true,
            mesaj: 'Mülk başarıyla satın alındı (Mock)',
            yeniBakiye: 4500
        });

        // Tüm istemcilere bildir
        io.emit('mulkSatinAlindi', {
            mulkId: buildingId,
            sahibiId: userId
        });

    } catch (err) {
        console.error("Satın alma hatası:", err);
        res.status(500).json({ mesaj: "Sunucu hatası." });
    }
});

// Socket.IO Bağlantı Yönetimi
io.on('connection', async (socket) => {
    console.log(`[BAĞLANDI] Yeni bir kullanıcı bağlandı: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    let character = null;

    if (userId) {
        try {
            // 1. Karakteri Ara
            const findCharSql = 'SELECT * FROM karakterler WHERE oyuncu_id = $1';
            const charResult = await db.query(findCharSql, [userId]);

            if (charResult.rows.length > 0) {
                // Karakter Varsa: Mevcut konumu kullan
                character = charResult.rows[0];
                console.log(`Karakter yüklendi: ${character.karakter_adi} (${character.mevcut_x}, ${character.mevcut_y})`);
            } else {
                // Karakter Yoksa: Yeni oluştur
                const randomX = Math.floor(Math.random() * 800);
                const randomY = Math.floor(Math.random() * 600);

                // Karakter adını şimdilik "Oyuncu X" yapalım veya epostadan çekebiliriz (burada basit tutuyoruz)
                const createCharSql = `
                    INSERT INTO karakterler (oyuncu_id, karakter_adi, tur_id, seviye, tecrube_puani, para, mevcut_x, mevcut_y)
                    VALUES ($1, $2, 1, 1, 0, 100, $3, $4) RETURNING *
                `;
                // NOT: Mock kayıtta 'kullaniciAdi' backend'e ulaşmıyor çünkü /kayit sadece logluyor.
                // Gerçek senaryoda buraya req.body'den değil, registration sırasında DB'ye yazılan veri gelmeli.
                // Şimdilik 'Oyuncu userId' yerine varsayılan bir isim atıyoruz.
                const created = await db.query(createCharSql, [userId, `Oyuncu ${userId}`, randomX, randomY]);
                character = created.rows[0];
                console.log(`Yeni karakter oluşturuldu: ${character.karakter_adi}`);
            }
        } catch (err) {
            console.error("Karakter yükleme hatası:", err);
            // Hata durumunda varsayılan bir konum verelim ki oyun çökmesin (DB kapalıyken test için)
        }
    }

    // Oyuncular listesine ekle (DB'den geldiyse oradan, yoksa varsayılan)
    // Oyuncular listesine ekle
    players[socket.id] = {
        x: character ? character.mevcut_x : Math.floor(Math.random() * 800),
        y: character ? character.mevcut_y : Math.floor(Math.random() * 600),
        lat: character ? character.lat : 40.0789,
        lon: character ? character.lon : 29.5133,
        username: character ? character.karakter_adi : `Misafir ${socket.id.substr(0, 4)}`,
        playerId: socket.id,
        dbId: userId,
        balance: character ? character.para : 1000,
        color: 0xff0000
    };

    // Bağlantı Mesajı Yayınla
    socket.broadcast.emit('yeniMesaj', { senderId: 'Sistem', text: `${players[socket.id].username} oyuna katıldı.` });

    // Mevcut oyuncuları yeni bağlanana gönder
    socket.emit('mevcutOyuncular', players);

    // Yeni oyuncuyu diğerlerine bildir
    socket.broadcast.emit('yeniOyuncu', players[socket.id]);

    // Bakiyeyi oyuncuya bildir
    socket.emit('bakiyeGuncellendi', players[socket.id].balance);

    // Oyuncu hareket ettiğinde
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].lat = movementData.lat; // Lat sakla
            players[socket.id].lon = movementData.lon; // Lon sakla
            players[socket.id].angle = movementData.angle;

            // Diğer oyunculara güncelleme gönder
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Sohbet Mesajı
    socket.on('sohbetMesaji', (mesaj) => {
        console.log(`Mesaj (${socket.id}): ${mesaj}`);
        io.emit('yeniMesaj', {
            senderId: socket.id,
            text: mesaj
        });
    });

    // Kullanıcı Ayrıldığında
    socket.on('disconnect', () => {
        console.log(`[AYRILDI] Bir kullanıcı ayrıldı: ${socket.id}`);

        // Oyuncuyu 'players' objesinden sil
        delete players[socket.id];

        // Ayrılan oyuncunun ID'sini tüm diğer oyunculara bildir
        io.emit('oyuncuAyrildi', socket.id);
    });

    // Mevcut kristalleri gönder
    socket.emit('mevcutKristaller', crystals);

    // Kristal Toplama Olayı
    socket.on('kristalToplandi', (kristalId) => {
        if (crystals[kristalId]) {
            console.log(`Kristal toplandı: ${kristalId} - Oyuncu: ${socket.id}`);

            // Kristali sil
            delete crystals[kristalId];

            // Tüm oyunculara bildir
            io.emit('kristalYokOldu', kristalId);

            // Oyuncunun bakiyesini artır (Sanal)
            if (players[socket.id]) {
                const val = crystals[kristalId] ? crystals[kristalId].value : 50;
                players[socket.id].balance += val;

                // Oyuncuya güncel bakiyesini bildir
                socket.emit('bakiyeGuncellendi', players[socket.id].balance);
            }

            // Yeni kristal oluşturma (Gecikmeli)
            setTimeout(() => {
                const newCrystal = generateRandomCrystal();
                crystals[newCrystal.id] = newCrystal;
                io.emit('yeniKristal', newCrystal);
            }, 5000); // 5 saniye sonra yenisi çıkar
        }
    });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);

    // 3. Adım: Sunucu başladığında veritabanı bağlantısını test et
    db.testDbConnection();
});
