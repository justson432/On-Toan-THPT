// Không còn gán cứng API_KEY ở đây nữa!
const systemInstruction = `Bạn là gia sư Toán THPT ôn thi tốt nghiệp 2026. Mục tiêu: giúp học sinh đạt 5-7 điểm. 
Chỉ tập trung kiến thức cơ bản (Nhận biết, Thông hiểu). Khuyên bỏ qua câu Vận dụng cao. 
Cấu trúc 2026: Nhắc nhở ăn điểm Phần 1 (4 lựa chọn) và 2 ý đầu của Phần 2 (Đúng/Sai).
Trình bày từng bước, ngôn ngữ dễ hiểu.
Kết thúc luôn có 1 dòng: "Lưu ý chống sai ngu: [lỗi thường gặp]".`;

let selectedImageBase64 = null;
let selectedImageMimeType = null;

// ==========================================
// KHỞI TẠO: Tải Key từ bộ nhớ (nếu có) khi vừa mở web
// ==========================================
window.onload = function() {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        document.getElementById('api-key-input').value = savedKey;
    }
};

// Hàm lưu Key vào trình duyệt
function saveApiKey() {
    const keyInput = document.getElementById('api-key-input').value.trim();
    if (keyInput) {
        localStorage.setItem('gemini_api_key', keyInput);
        alert('Đã lưu API Key vào trình duyệt thành công!');
    } else {
        alert('Vui lòng nhập Key trước khi lưu!');
    }
}

// ==========================================
// TÍNH NĂNG CHỌN VÀ DÁN ẢNH (Giữ nguyên)
// ==========================================
document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) processImageFile(file);
});

document.addEventListener('paste', function(event) {
    const items = (event.clipboardData || window.clipboardData).items;
    for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.includes('image/')) {
            const file = item.getAsFile();
            processImageFile(file);
        }
    }
});

function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('image-preview').src = e.target.result;
        document.getElementById('preview-area').style.display = 'block';
        selectedImageBase64 = e.target.result.split(',')[1];
        selectedImageMimeType = file.type;
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    document.getElementById('file-input').value = "";
    document.getElementById('preview-area').style.display = 'none';
    selectedImageBase64 = null;
    selectedImageMimeType = null;
}

// ==========================================
// XỬ LÝ GỬI TIN NHẮN ĐI
// ==========================================
async function sendMessage() {
    // 1. Kiểm tra xem người dùng đã nhập Key chưa
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (!apiKey) {
        alert("Bạn chưa nhập Gemini API Key ở phía trên!");
        return;
    }

    const inputField = document.getElementById("user-input");
    const message = inputField.value.trim();
    
    if (!message && !selectedImageBase64) return; 

    // Hiển thị tin nhắn người dùng
    let displayHtml = message;
    if (selectedImageBase64) {
        displayHtml += `<br><img src="data:${selectedImageMimeType};base64,${selectedImageBase64}">`;
    }
    displayMessage(displayHtml, "user");
    inputField.value = ""; 

    // Đóng gói dữ liệu
    const parts = [];
    if (message) {
        parts.push({ text: message });
    } else {
        parts.push({ text: "Giải giúp mình bài toán trong ảnh này với mức độ 5-7 điểm nhé." }); 
    }

    if (selectedImageBase64) {
        parts.push({
            inline_data: { mime_type: selectedImageMimeType, data: selectedImageBase64 }
        });
    }

    const requestBody = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: parts }]
    };

    removeImage(); 

    // 2. Tạo URL động gắn API Key người dùng vừa nhập
    const dynamicApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    // Gọi API
    try {
        displayMessage("Đang tính toán...", "ai", "loading");
        
        const response = await fetch(dynamicApiUrl, {
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

function displayMessage(text, sender, id = "") {
    const chatBox = document.getElementById("chat-box");
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = text.replace(/\n/g, "<br>"); 
    if (id) msgDiv.id = id;
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
