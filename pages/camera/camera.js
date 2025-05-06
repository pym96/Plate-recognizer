// camera.js
const recognizerManager = require('../utils/recognizerManager');

Page({
  data: {
    devicePosition: 'back', // 默认后置摄像头
    isLoading: false,
    hasCamera: false, // 是否有相机权限
    errorMsg: '' // 错误信息
  },

  onLoad() {
    // 加载时检查相机权限
    this.checkCameraAuth();
  },

  // 检查相机权限
  checkCameraAuth() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.camera']) {
          // 已有相机权限
          this.setData({
            hasCamera: true,
            errorMsg: ''
          });
        } else {
          // 没有相机权限，尝试获取
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              // 授权成功
              this.setData({
                hasCamera: true,
                errorMsg: ''
              });
            },
            fail: (err) => {
              console.error('相机授权失败:', err);
              this.setData({
                hasCamera: false,
                errorMsg: '需要相机权限才能使用拍照识别功能'
              });
            }
          });
        }
      }
    });
  },

  // 重新申请权限
  requestAuth() {
    wx.openSetting({
      success: (res) => {
        if (res.authSetting['scope.camera']) {
          this.setData({
            hasCamera: true,
            errorMsg: ''
          });
        }
      }
    });
  },

  // 翻转摄像头
  toggleCamera() {
    this.setData({
      devicePosition: this.data.devicePosition === 'back' ? 'front' : 'back'
    });
  },

  // 裁剪图像只保留框内区域
  cropImageToGuideBox(imagePath) {
    return new Promise((resolve, reject) => {
      try {
        console.log('开始裁剪图像，原图路径:', imagePath);
        
        // 获取系统信息用于计算屏幕尺寸
        const systemInfo = wx.getSystemInfoSync();
        const screenWidth = systemInfo.windowWidth;
        const screenHeight = systemInfo.windowHeight;
        
        // 在WXSS中，guide-box的宽度是600rpx，高度是200rpx
        // 将rpx转换为px (rpx = px * 750 / screenWidth)
        const guideBoxWidth = 600 * (screenWidth / 750);
        const guideBoxHeight = 200 * (screenWidth / 750);
        
        // 计算引导框的位置（居中）
        const guideBoxLeft = (screenWidth - guideBoxWidth) / 2;
        const guideBoxTop = (screenHeight - guideBoxHeight) / 2;
        
        console.log('裁剪区域:', {
          left: guideBoxLeft,
          top: guideBoxTop,
          width: guideBoxWidth,
          height: guideBoxHeight
        });
        
        // 创建offscreenCanvas并获取上下文
        const query = wx.createSelectorQuery();
        query.select('#offscreenCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0] || !res[0].node) {
              console.error('无法获取canvas节点');
              reject(new Error('无法获取canvas节点'));
              return;
            }
            
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            
            // 设置canvas大小为裁剪区域大小
            canvas.width = guideBoxWidth;
            canvas.height = guideBoxHeight;
            
            // 创建图片对象
            const img = canvas.createImage();
            img.onload = () => {
              // 计算图片缩放比例以适应屏幕
              const imgRatio = img.width / img.height;
              let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
              
              if (screenWidth / screenHeight > imgRatio) {
                // 屏幕比图片更宽，图片高度填充屏幕
                drawHeight = screenHeight;
                drawWidth = screenHeight * imgRatio;
                offsetX = (screenWidth - drawWidth) / 2;
              } else {
                // 屏幕比图片更窄，图片宽度填充屏幕
                drawWidth = screenWidth;
                drawHeight = screenWidth / imgRatio;
                offsetY = (screenHeight - drawHeight) / 2;
              }
              
              // 计算源图像中对应于引导框的区域
              const sx = ((guideBoxLeft - offsetX) / drawWidth) * img.width;
              const sy = ((guideBoxTop - offsetY) / drawHeight) * img.height;
              const sWidth = (guideBoxWidth / drawWidth) * img.width;
              const sHeight = (guideBoxHeight / drawHeight) * img.height;
              
              console.log('裁剪源区域:', { sx, sy, sWidth, sHeight });
              
              // 清空canvas
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // 绘制裁剪后的图像到canvas
              ctx.drawImage(
                img,
                sx, sy, sWidth, sHeight,  // 源图像裁剪区域
                0, 0, canvas.width, canvas.height  // 目标区域（整个canvas）
              );
              
              // 将canvas内容转为临时文件
              wx.canvasToTempFilePath({
                canvas: canvas,
                success: (res) => {
                  console.log('裁剪成功，裁剪后图片路径:', res.tempFilePath);
                  resolve(res.tempFilePath);
                },
                fail: (err) => {
                  console.error('保存裁剪图像失败:', err);
                  reject(err);
                }
              });
            };
            
            img.onerror = (err) => {
              console.error('加载图像到canvas失败:', err);
              reject(err);
            };
            
            img.src = imagePath;
          });
      } catch (err) {
        console.error('裁剪过程出错:', err);
        reject(err);
      }
    });
  },

  // 拍照
  takePhoto() {
    if (this.data.isLoading || !this.data.hasCamera) return;
    
    const cameraContext = wx.createCameraContext();
    
    this.setData({ isLoading: true });
    
    cameraContext.takePhoto({
      quality: 'high',
      success: (res) => {
        console.log('拍照成功，原始图片路径:', res.tempImagePath);
        // 裁剪图像后再进行识别
        this.cropImageToGuideBox(res.tempImagePath)
          .then(croppedImagePath => {
            // 使用裁剪后的图像进行识别
            this.recognizePlateImage(croppedImagePath, res.tempImagePath);
          })
          .catch(err => {
            console.error('裁剪失败，使用原图进行识别:', err);
            // 裁剪失败时回退到使用原图
            this.recognizePlateImage(res.tempImagePath, res.tempImagePath);
          });
      },
      fail: (err) => {
        console.error(err);
        wx.showToast({
          title: '拍照失败',
          icon: 'error'
        });
        this.setData({ isLoading: false });
      }
    });
  },
  
  // 识别车牌图片，添加原始图片参数用于传回主页
  recognizePlateImage(imagePath, originalImagePath) {
    wx.showLoading({
      title: '识别中...',
    });
    
    // 使用识别器管理器识别车牌
    recognizerManager.recognizePlate(imagePath)
      .then(plateNumber => {
        console.log('识别成功，结果:', plateNumber);
        wx.hideLoading();
        this.setData({ isLoading: false });
        
        // 获取页面栈
        const pages = getCurrentPages();
        // 获取上一个页面（主页）
        const prevPage = pages[pages.length - 2];
        
        // 传回裁剪后的识别结果，但展示原始图片
        prevPage.onResultReceived(plateNumber, originalImagePath || imagePath);
        
        // 返回主页
        wx.navigateBack();
      })
      .catch(error => {
        console.error('识别失败:', error);
        wx.hideLoading();
        this.setData({ isLoading: false });
        wx.showToast({
          title: '识别失败: ' + (error.message || '未知错误'),
          icon: 'none',
          duration: 2500
        });
      });
  },
  
  // 返回主页
  goBack() {
    wx.navigateBack();
  },
  
  // 错误处理
  error(e) {
    console.error('相机错误:', e.detail);
  }
}) 