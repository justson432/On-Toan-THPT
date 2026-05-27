// Thay bằng API Key thật của bạn
const API_KEY = 'NHẬP_API_KEY_CỦA_BẠN_VÀO_ĐÂY'; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash-preview:generateContent?key=${API_KEY}`;

const systemInstruction = `Bạn là gia sư Toán THPT ôn thi tốt nghiệp 2026. Mục tiêu: giúp học sinh đạt 5-7 điểm. 
Chỉ tập trung kiến thức cơ bản (Nhận biết, Thông hiểu). Khuyên bỏ qua câu Vận dụng cao. 
Cấu trúc 2026: Nhắc nhở ăn điểm Phần 1 (4 lựa chọn) và Phần 2 (Đúng/Sai).
Trình bày từng bước, ngôn ngữ dễ hiểu.
Kết thúc luôn có 1 dòng: "Lưu ý chống sai ngu: [lỗi thường gặp]".`;

let selectedImageBase64 = null;
let selectedImageMimeType = null;

// ==========================================
// 1. TÍNH NĂNG CHỌN ẢNH TỪ NÚT BẤM (🖼️)
// ==========================================
document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        processImageFile(file);
    }
});

// ==========================================
// 2. TÍNH NĂNG COPY/PASTE ẢNH VÀO Ô CHAT (Ctrl+V)
// ==========================================
window.addEventListener('paste', function(e) {
    // Mở F12 -> tab Console sẽ thấy dòng này để biết code có chạy không
    console.log("🔥 Đã nhận thao tác dán (Ctrl+V)!"); 
    
    // Lấy dữ liệu từ khay nhớ tạm
    const clipboardItems = (e.clipboardData || window.clipboardData).items;
    let foundImage = false;

    for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        
        // Nếu phát hiện ra đây là ảnh (pixel)
        if (item.type.indexOf("image") !== -1) {
            foundImage = true;
            const file = item.getAsFile();
            console.log("✅ Đã tóm được ảnh:", file);
            
            // CỰC KỲ QUAN TRỌNG: Ngăn chặn trình duyệt cố gắng dán ảnh vào ô text gây lỗi ngầm
            e.preventDefault(); 
            
            // Gọi hàm hiển thị ảnh lên màn hình
            processImageFile(file);
            break; // Tìm thấy ảnh rồi thì dừng vòng lặp
        }
    }

    if (!foundImage) {
        console.log("❌ Trong khay nhớ tạm hiện tại không có ảnh dạng pixel.");
    }
});
// ==========================================
// 3. CÁC HÀM XỬ LÝ CHUNG
// ==========================================

// Hàm xử lý file ảnh (dùng chung cho cả 2 cách trên)
function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        // Hiện ảnh xem trước lên màn hình
        document.getElementById('image-preview').src = e.target.result;
        document.getElementById('preview-area').style.display = 'block';
        
        // Lưu dữ liệu để chuẩn bị gửi cho AI
        selectedImageBase64 = e.target.result.split(',')[1];
        selectedImageMimeType = file.type;
    };
    reader.readAsDataURL(file);
}

// Hàm hủy chọn ảnh (khi bấm dấu X)
function removeImage() {
    document.getElementById('file-input').value = "";
    document.getElementById('preview-area').style.display = 'none';
    selectedImageBase64 = null;
    selectedImageMimeType = null;
}

// Hàm gửi tin nhắn và ảnh cho AI
async function sendMessage() {
    const inputField = document.getElementById("user-input");
    const message = inputField.value.trim();
    
    // Nếu không có chữ và cũng không có ảnh thì không làm gì cả
    if (!message && !selectedImageBase64) return; 

    // Hiển thị tin nhắn của người dùng lên màn hình
    let displayHtml = message;
    if (selectedImageBase64) {
        displayHtml += `<br><img src="data:${selectedImageMimeType};base64,${selectedImageBase64}">`;
    }
    displayMessage(displayHtml, "user");
    inputField.value = ""; // Xóa trắng ô nhập liệu

    // Chuẩn bị gói dữ liệu gửi đi
    const parts = [];
    if (message) {
        parts.push({ text: message });
    } else {
        parts.push({ text: "Giải giúp mình bài toán trong ảnh này với mức độ 5-7 điểm nhé." }); 
    }

    if (selectedImageBase64) {
        parts.push({
            inline_data: {
                mime_type: selectedImageMimeType,
                data: selectedImageBase64
            }
        });
    }

    const requestBody = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: parts }]
    };

    // Dọn dẹp khu vực xem trước ảnh
    removeImage(); 

    // Gọi API của Google Gemini
    try {
        displayMessage("Đang tính toán...", "ai", "loading");
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error(data.error);
            document.getElementById("loading").remove();
            displayMessage("Lỗi API: " + data.error.message, "ai");
            return;
        }

        const aiText = data.candidates[0].content.parts[0].text;
        
        document.getElementById("loading").remove();
        displayMessage(aiText, "ai");

    } catch (error) {
        document.getElementById("loading").remove();
        displayMessage("Lỗi kết nối. Vui lòng kiểm tra lại mạng hoặc API Key.", "ai");
    }
}

// Hàm in tin nhắn ra khung chat
function displayMessage(text, sender, id = "") {
    const chatBox = document.getElementById("chat-box");
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = text.replace(/\n/g, "<br>"); 
    if (id) msgDiv.id = id;
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
