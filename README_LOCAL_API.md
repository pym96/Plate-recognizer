# 本地Python API服务器配置指南

本文档介绍如何设置本地Python API服务器，用于微信小程序的车牌识别功能。

## 1. 配置环境

### 安装依赖

```bash
# 创建虚拟环境（可选）
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

### 准备模型

将车牌识别模型文件(best.onnx)放置在合适的位置，例如:
```
./assets/best.onnx
```

## 2. 启动API服务器

```bash
# 启动API服务器（默认端口5000）
python python_api_server.py

# 指定端口启动
PORT=8000 python python_api_server.py
```

服务器启动后会监听在`http://localhost:5000`。

## 3. 测试API服务器

可以使用以下方法测试API服务器:

### 使用curl测试
```bash
# 健康检查
curl http://localhost:5000/health

# 车牌识别测试（需要提供base64编码的图片）
curl -X POST http://localhost:5000/recognize_plate \
  -H "Content-Type: application/json" \
  -d '{"image": "base64编码的图片数据"}'
```

### 使用Python测试
```python
import requests
import base64

# 读取图片并进行base64编码
with open("test_image.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode("utf-8")

# 发送请求
response = requests.post(
    "http://localhost:5000/recognize_plate",
    json={"image": image_data}
)

# 打印结果
print(response.json())
```

## 4. 与微信小程序集成

### 开发环境集成

在开发环境中，需要:

1. 找出您的本地IP地址（例如192.168.1.100）
2. 在微信开发者工具中勾选"不校验合法域名"选项
3. 修改`cloud/functions/recognizePlate/index.js`中的API地址:

```javascript
const apiUrl = 'http://192.168.1.100:5000/recognize_plate';
```

4. 部署云函数
5. 在小程序中测试识别功能

### 生产环境集成

在生产环境中，微信小程序只能请求已配置的域名，且必须使用HTTPS。请参考以下步骤:

1. 将Python API服务部署到公网服务器上（如云服务器、云托管等）
2. 配置域名和SSL证书，确保可以通过HTTPS访问
3. 在微信小程序管理后台添加该域名到服务器域名列表
4. 修改`cloud/functions/recognizePlate/index.js`中的API地址为公网域名

## 5. 增强模型

要使用真实的ONNX模型进行车牌识别，请修改`python_api_server.py`中的模型加载和推理部分:

```python
# 加载模型
def load_model():
    logger.info("加载车牌识别模型...")
    import onnxruntime as ort
    session = ort.InferenceSession("./assets/best.onnx")
    return session

# 识别函数中替换模拟代码
img = preprocess_image(image_data)  # 根据模型需求预处理图像
input_name = model.get_inputs()[0].name
output = model.run(None, {input_name: img})
plate_number = decode_output(output)  # 根据模型输出格式解码结果
```

## 6. 故障排除

常见问题及解决方案:

1. **CORS错误**: 确保Python API服务器启用了CORS支持
2. **云函数无法访问本地API**: 云函数运行在腾讯云环境，无法直接访问localhost或内网IP
3. **模型加载错误**: 检查模型路径和格式是否正确
4. **内存不足**: 对于大型模型，可能需要增加服务器内存

## 7. 性能优化

1. 使用模型量化减小模型体积
2. 添加图像缓存避免重复处理
3. 使用生产级Web服务器(如Gunicorn+Nginx)部署Flask应用
4. 考虑使用异步处理框架提高并发处理能力 