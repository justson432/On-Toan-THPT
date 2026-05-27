const API_KEY = 'NHẬP_API_KEY_VÀO_ĐÂY'; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash-preview:generateContent?key=${API_KEY}`;

const systemInstruction = `Bạn là gia sư Toán THPT ôn thi tốt nghiệp 2026. Mục tiêu: giúp học sinh đạt 5-7 điểm. 
Chỉ tập trung kiến thức cơ bản (Nhận biết, Thông hiểu). Khuyên bỏ qua câu Vận dụng cao. 
Cấu trúc 2026: Nhắc nhở ăn điểm Phần 1 (4 lựa chọn) và 2 ý đầu của Phần 2 (Đúng/Sai).
Trình bày từng bước, ngôn ngữ dễ hiểu.
Kết thúc luôn có 1 dòng: "Lưu ý chống sai ngu: [lỗi thường gặp]".`;

let selectedImageBase64 = null;
let selectedImageMimeType = null;

// Xử lý khi người dùng chọn ảnh
document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Hiển thị ảnh xem trước
            document.getElementById('image-preview').src = e.target.result;
            document.getElementById('preview-area').style.display = 'block';
            
            // Tách lấy chuỗi base64 (bỏ phần data:image/jpeg;base64, ở đầu)
            selectedImageBase64 = e.target.result.split(',')[1];
            selectedImageMimeType = file.type;
        };
        reader.readAsDataURL(file); // Đọc file dưới dạng Data URL
    }
});

// Hàm hủy chọn ảnh
function removeImage() {
    document.getElementById('file-input').value = "";
    document.getElementById('preview-area').style.display = 'none';
    selectedImageBase64 = null;
    selectedImageMimeType = null;
}

async function sendMessage() {
    const inputField = document.getElementById("user-input");
    const message = inputField.value.trim();
    
    // Nếu không có chữ và cũng không có ảnh thì không làm gì cả
    if (!message && !selectedImageBase64) return; 

    // 1. Hiển thị tin nhắn người dùng lên giao diện
    let displayHtml = message;
    if (selectedImageBase64) {
        displayHtml += `<br><img src="data:${selectedImageMimeType};base64,${selectedImageBase64}">`;
    }
    displayMessage(displayHtml, "user");
    inputField.value = "";

    // 2. Đóng gói dữ liệu gửi cho AI (Kết hợp Text và Image)
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

    // Xóa ảnh xem trước sau khi đã bấm gửi
    removeImage(); 

    // 3. Gọi API
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

function displayMessage(text, sender, id = "") {
    const chatBox = document.getElementById("chat-box");
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;
    // Cho phép hiển thị HTML (để load thẻ <img> và <br>)
    msgDiv.innerHTML = text.replace(/\n/g, "<br>"); 
    if (id) msgDiv.id = id;
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
