// Mã minh họa chạy thử.
const API_KEY = 'NHẬP_API_KEY_VÀO_ĐÂY'; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash-preview:generateContent?key=${API_KEY}`;

// System Prompt định hình AI Toán 2026 (5-7 điểm)
const systemInstruction = `Bạn là gia sư Toán THPT ôn thi tốt nghiệp 2026. Mục tiêu: giúp học sinh đạt 5-7 điểm. 
Chỉ tập trung kiến thức cơ bản (Nhận biết, Thông hiểu). 
Khuyên bỏ qua câu Vận dụng cao. 
Cấu trúc 2026: Nhắc nhở ăn điểm Phần 1 (4 lựa chọn) và 2 ý đầu của Phần 2 (Đúng/Sai).
Trình bày từng bước, ngôn ngữ dễ hiểu.
Kết thúc luôn có 1 dòng: "Lưu ý chống sai ngu: [lỗi thường gặp]".`;

async function sendMessage() {
    const inputField = document.getElementById("user-input");
    const message = inputField.value.trim();
    if (!message) return;

    // 1. Hiển thị tin nhắn
    displayMessage(message, "user");
    inputField.value = "";

    // 2. Chuẩn bị dữ liệu gửi cho AI 
    const requestBody = {
        system_instruction: {
            parts: { text: systemInstruction }
        },
        contents: [{
            parts: [{ text: message }]
        }]
    };

    // 3. Gọi API và hiển thị kết quả
    try {
        displayMessage("Đang tính toán...", "ai", "loading");
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        
        // Xóa dòng "Đang tính toán..." và hiện kết quả thật
        document.getElementById("loading").remove();
        displayMessage(aiText, "ai");

    } catch (error) {
        document.getElementById("loading").remove();
        displayMessage("Lỗi kết nối. Vui lòng kiểm tra lại API Key hoặc mạng internet.", "ai");
    }
}

function displayMessage(text, sender, id = "") {
    const chatBox = document.getElementById("chat-box");
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;
    // Chuyển đổi các dấu xuống dòng thành thẻ <br> trong HTML
    msgDiv.innerHTML = text.replace(/\n/g, "<br>"); 
    if (id) msgDiv.id = id;
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Tự động cuộn xuống cuối
}
