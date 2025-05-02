# 车牌识别微信小程序

这是一个用于识别车牌的微信小程序，提供拍照识别和上传图片识别两种方式。该小程序使用本地ONNX模型进行车牌识别。

## 功能

- 主页面：显示拍照识别和上传识别两个入口，展示识别结果
- 拍照识别：使用相机拍摄车牌照片并识别
- 上传识别：从相册选择车牌照片并识别

## 部署步骤

### 1. 微信开发者工具配置

1. 下载并安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目
3. 在`project.config.json`中配置您的AppID

### 2. 模型配置

1. 确保ONNX模型文件位于`saved_model/best.onnx`
2. 模型路径已在`app.js`中配置

### 3. 识别实现

本项目使用微信小程序的原生能力读取ONNX模型文件，但由于以下限制，实际推理采用模拟方式：

1. 限制说明：
   - 微信小程序不直接支持ONNX Runtime
   - WebAssembly支持有限
   - 不允许直接引入大型第三方库

2. 实际项目中的可能解决方案：
   - 将ONNX模型转换为TensorFlow.js格式（微信小程序支持）
   - 使用微信官方提供的AI插件（如有支持车牌识别的）
   - 将模型部署在服务器上，通过API调用

3. 当前实现：
   - 读取模型文件并预处理图像
   - 使用模拟数据作为识别结果

## 项目结构

```
miniprogram-2/
├── pages/
│   ├── index/             # 主页面
│   ├── camera/            # 相机拍照页面
│   ├── upload/            # 图片上传页面
│   └── utils/
│       ├── localRecognizer.js    # 车牌识别工具类
│       └── onnx-processor.js     # ONNX模型处理器
├── saved_model/
│   └── best.onnx          # 车牌识别模型
└── app.js                 # 应用入口
```

## 注意事项

1. 模型实现:
   - 当前版本使用模拟识别结果
   - 真实项目中需要根据模型规格修改预处理和后处理代码
   - 需要考虑模型大小对小程序包体积的影响

2. 权限配置：
   - 确保在`app.json`中正确配置了相机权限
   - 确保用户授权访问相册和相机

## 参考资料

- [微信小程序相机组件文档](https://developers.weixin.qq.com/miniprogram/dev/component/camera.html)
- [微信小程序Canvas文档](https://developers.weixin.qq.com/miniprogram/dev/component/canvas.html)

## 车牌识别小程序

这是一个车牌识别微信小程序，支持多种识别方式：
- 模拟识别（生成随机车牌号）
- ONNX模型本地识别
- 云函数后端识别（Python推理）

### 主要功能
- 拍照识别车牌
- 上传图片识别车牌
- 多种识别模式切换

### 技术架构
- 前端：微信小程序
- 后端：云函数 + Python识别模型

### 项目结构
```
├── assets/                # 资源文件
│   └── best.onnx          # ONNX模型文件
├── cloud/                 # 云函数
│   └── functions/         
│       └── recognizePlate/ # 车牌识别云函数
├── pages/                 # 小程序页面
│   ├── camera/            # 相机拍照页面
│   ├── index/             # 首页
│   ├── upload/            # 上传图片页面
│   └── utils/             # 工具类
├── utils/                 # 公共工具类
├── app.js                 # 应用入口
└── app.json               # 应用配置
```

### 使用说明
1. 首页可以选择拍照识别或上传照片识别
2. 点击首页顶部的识别模式文本可以切换识别方式
3. 识别结果将显示在首页

### 云函数部署
要完成云函数的部署，请按以下步骤操作：

1. 在微信开发者工具中，确保已开通云开发功能
2. 打开云开发控制台，创建一个新的云环境（如未创建）
3. 修改app.js中的云环境ID为你自己的环境ID
   ```js
   wx.cloud.init({
     env: 'your-env-id', // 替换为您的云环境ID
     traceUser: true
   });
   ```
4. 右键点击cloud/functions/recognizePlate目录，选择"上传并部署"
5. 完成部署后，云函数就可以被小程序调用了

### Python模型接入说明
如需使用真实的Python模型进行识别，需要：

1. 在云函数recognizePlate中，替换模拟识别逻辑为实际调用Python模型的代码
2. 方案一：使用云函数Node.js调用系统命令执行Python脚本
3. 方案二：部署独立的Python API服务，在云函数中通过HTTP请求调用
4. 方案三：使用云开发云托管部署Python容器服务

### 注意事项
- 本地ONNX模型识别功能在微信小程序环境中有限制，主要为演示用途
- 实际应用推荐使用云函数方式，将识别逻辑部署在服务端

### 开发者
@您的名字 