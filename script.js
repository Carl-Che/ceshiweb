document.addEventListener('DOMContentLoaded', function() {
    const uploadBox = document.getElementById('uploadBox');
    const fileInput = document.getElementById('fileInput');
    const previewBox = document.getElementById('previewBox');
    const previewImage = document.getElementById('previewImage');
    const clearBtn = document.getElementById('clearBtn');
    const scanBtn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');

    // 处理点击上传
    uploadBox.addEventListener('click', () => {
        fileInput.click();
    });

    // 处理拖拽上传
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '#1976D2';
    });

    uploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '#2196F3';
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '#2196F3';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 处理文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // 处理文件预览
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件！');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadBox.style.display = 'none';
            previewBox.hidden = false;
            scanBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // 清除按钮事件
    clearBtn.addEventListener('click', () => {
        previewImage.src = '';
        uploadBox.style.display = 'block';
        previewBox.hidden = true;
        scanBtn.disabled = true;
        resultBox.innerHTML = '';
        fileInput.value = '';
    });

    // 识别按钮事件
    scanBtn.addEventListener('click', () => {
        resultBox.innerHTML = '';
        resultBox.classList.add('loading');
        scanBtn.disabled = true;

        Tesseract.recognize(
            previewImage.src,
            'chi_sim+eng', // 设置为中文和英文
            {
                logger: info => console.log(info)
            }
        ).then(async ({ data: { text } }) => {
            try {
                // 发送识别文本到后端API
                const response = await fetch('http://localhost:3000/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: [
                            {
                                role: 'user',
                                content: `这是一个药品说明书的文本内容，请帮我分析主要信息：\n${text}`
                            }
                        ]
                    })
                });
                
                const data = await response.json();
                const aiResponse = data.output.text || '无法解析药品信息';
                resultBox.innerHTML = `<div class="result-content">
                    <h3>原始文本：</h3>
                    <p>${text}</p>
                    <h3>分析结果：</h3>
                    <p>${aiResponse}</p>
                </div>`;
            } catch (error) {
                resultBox.innerHTML = `<p style="color: red;">分析失败：${error.message}</p>`;
            }
        }).catch(error => {
            resultBox.innerHTML = `<p style="color: red;">识别失败：${error.message}</p>`;
        }).finally(() => {
            scanBtn.disabled = false;
        });
    });
});