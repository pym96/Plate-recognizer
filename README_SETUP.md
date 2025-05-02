# 车牌识别小程序 - 设置指南

## 模型文件放置

为了使车牌识别模型正常工作，请按照以下步骤放置模型文件：

1. 在微信开发者工具中，确保项目根目录下存在 `saved_model` 文件夹
2. 将 `best.onnx` 文件放置在 `saved_model` 文件夹中
3. 文件结构应如下所示：

```
miniprogram-2/
├── saved_model/
│   └── best.onnx
├── pages/
│   ├── index/
│   ├── camera/
│   ├── upload/
│   └── ...
└── app.js
```

## 常见问题排查

如果遇到 "readFile:fail permission denied" 错误，可能是因为：

1. **模型文件路径错误**：确保文件名和路径完全匹配（区分大小写）
2. **文件未包含在项目中**：确保模型文件被正确地添加到项目中
   - 在微信开发者工具中右键点击项目根目录
   - 选择"新建文件夹"，创建 `saved_model` 文件夹
   - 将 `best.onnx` 文件拖放到此文件夹中

3. **文件权限问题**：
   - 退出并重新启动微信开发者工具
   - 清除项目缓存：工具 -> 清除缓存 -> 编译缓存

4. **手动验证文件访问**：
   - 在页面中添加以下代码进行测试：
   ```javascript
   onLoad() {
     const fs = wx.getFileSystemManager();
     fs.access({
       path: 'saved_model/best.onnx',
       success: () => {
         console.log('模型文件存在');
       },
       fail: (err) => {
         console.error('模型文件不存在:', err);
       }
     });
   }
   ```

## 注意事项

1. 微信小程序中，文件路径不能以"/"开头，必须使用相对路径
2. 模型文件大小可能会影响小程序包体积，请确保符合微信小程序的大小限制
3. 由于微信小程序的限制，实际上无法直接在小程序中运行ONNX模型，目前的实现使用模拟数据

## 如何修改为实际识别

当希望实现实际的车牌识别时，您可以考虑以下方案：

1. **使用微信云开发**：将模型部署在云函数中
2. **使用外部API**：通过HTTP接口调用外部的车牌识别服务
3. **使用TensorFlow.js**：将ONNX模型转换为TensorFlow.js格式，微信小程序支持一定程度的TensorFlow.js 