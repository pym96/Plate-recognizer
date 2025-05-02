# 车牌识别微信小程序

本项目是一个支持拍照识别与上传图片识别功能的微信小程序，使用本地模拟模型或云函数调用 Python 模型进行车牌识别。

---

## 📱 功能概览

- **主页面展示识别入口与结果**
- **拍照识别**：通过相机拍摄车牌图像
- **上传识别**：从相册选择图片进行识别
- **识别方式切换**：支持模拟识别、本地ONNX模型、云函数识别

---

## 📁 项目结构

```
miniprogram-2/
├── assets/                    # 静态资源，包含ONNX模型等
│   └── best.onnx             
├── cloud/                     # 云开发函数
│   └── functions/
│       └── recognizePlate/    # 云函数（Python识别逻辑）
├── pages/
│   ├── camera/                # 拍照页面
│   ├── upload/                # 上传页面
│   ├── index/                 # 首页
│   └── utils/
│       ├── localRecognizer.js    # 模拟/本地模型识别逻辑
│       └── onnx-processor.js     # ONNX模型处理器（当前为预留）
├── utils/                     # 公共工具函数
├── app.js                     # 小程序主入口
└── app.json                   # 小程序配置
```

---

## ⚙️ 部署步骤

### 1. 微信开发者工具配置

1. 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入该项目目录
3. 在 `project.config.json` 中配置你的 AppID

### 2. 权限配置

- 在 `app.json` 中添加相机权限
- 确保用户授权访问相机和相册

---

## 🤖 模型与识别说明

### 当前实现（演示版）

- 本地 ONNX 模型仅作存放展示
- 实际识别为 **模拟输出**，返回固定格式的虚拟车牌号（用于演示界面流程）

### 微信小程序限制说明

- 不支持直接加载 ONNX Runtime 或 WebAssembly 推理引擎
- 无法执行 Python 推理逻辑
- 模型包体过大会影响加载速度和编译通过率

### 推荐的实际部署方案

| 方式           | 描述                                                    |
| -------------- | ------------------------------------------------------- |
| TensorFlow.js  | 将模型转换为 TF.js 格式，可尝试运行于小程序中（实验性） |
| 云函数部署     | 通过云开发函数运行 Python 模型，推荐方式                |
| 云托管容器服务 | 使用微信云托管部署 Python 服务，通过 REST API 识别      |

---

## ☁️ 云函数识别部署指南（推荐）

1. 开启云开发功能，创建云环境
2. 修改 `app.js` 中云环境ID：

```js
wx.cloud.init({
  env: 'your-env-id', // 替换为实际环境ID
  traceUser: true
});
```

3. 将 `cloud/functions/recognizePlate` 上传并部署至云函数
4. 在云函数内替换默认模拟识别逻辑为 Python 调用：

```js
// 示例（Node.js 调用 Python 脚本）
const child_process = require('child_process');
child_process.exec('python3 plate_infer.py path/to/image.jpg', callback);
```

或使用 HTTP 请求方式调用容器服务中的 Python API。

---

## 📤 识别调用流程示意

```
用户操作 → 小程序页面选择识别方式 →
    → 拍照/上传图片 →
        → 识别模块判断使用哪种模式 →
            → 若云识别，调用云函数 recognizePlate →
                → Python 模型推理 →
                    → 返回车牌号给前端展示
```

---

## 📦 示例返回结果

```json
{
  "plate_number": "粤B12345",
  "confidence": 0.98,
  "region": "Guangdong"
}
```

---

## 🔧 模型训练说明（可选）

如本项目中的 best.onnx 为自训练模型，请附上：

- 训练数据集简介
- 模型结构
- 输入输出格式（如 image → text）
- 转换方法：如 PyTorch → ONNX 转换脚本

---

## 📌 注意事项

- 请勿将大型模型直接打包进小程序发布包（建议服务器部署）
- 小程序中的图片权限需要用户授权，否则无法访问相册/拍照
- 云函数调用返回需在前端增加 loading 状态与超时处理

---

## 👤 开发者信息

- 作者：潘一鸣
- 邮箱：pym66@outlook.com
- GitHub：[pym96/plate_recognizer](https://github.com/pym96/plate_recognizer)