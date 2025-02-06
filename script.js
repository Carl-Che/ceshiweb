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
    scanBtn.addEventListener('click', async () => {
        resultBox.innerHTML = '';
        resultBox.classList.add('loading');
        scanBtn.disabled = true;

        try {
            // 获取图片文件
            const response = await fetch(previewImage.src);
            const blob = await response.blob();
            const formData = new FormData();
            formData.append('image', blob);

            // 发送图片数据到后端API
            const apiResponse = await fetch('http://localhost:3000/api/image', {
                method: 'POST',
                body: formData
            });
            
            const data = await apiResponse.json();
            if (!apiResponse.ok || data.error) {
                const errorDetails = data.details ? `\n详细信息：${data.details}` : '';
                const requestInfo = data.requestData ? `\n请求数据：${JSON.stringify(data.requestData, null, 2)}` : '';
                throw new Error(`${data.error || '请求失败'}${errorDetails}${requestInfo}`);
            }
            const aiResponse = data.choices?.[0]?.message?.content || '无法解析药品信息';
            
            resultBox.innerHTML = `<div class="result-content">
                <h3>分析结果：</h3>
                <p>${aiResponse.replace(/\n/g, '<br>')}</p>
            </div>`;
        } catch (error) {
            resultBox.innerHTML = `<p style="color: red;">分析失败：${error.message}</p>`;
        } finally {
            resultBox.classList.remove('loading');
            scanBtn.disabled = false;
        }
    });
});