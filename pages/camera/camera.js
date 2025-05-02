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

  // 拍照
  takePhoto() {
    if (this.data.isLoading || !this.data.hasCamera) return;
    
    const cameraContext = wx.createCameraContext();
    
    this.setData({ isLoading: true });
    
    cameraContext.takePhoto({
      quality: 'high',
      success: (res) => {
        // 调用车牌识别服务
        this.recognizePlateImage(res.tempImagePath);
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
  
  // 识别车牌图片
  recognizePlateImage(imagePath) {
    wx.showLoading({
      title: '识别中...',
    });
    
    // 使用识别器管理器识别车牌
    recognizerManager.recognizePlate(imagePath)
      .then(plateNumber => {
        wx.hideLoading();
        this.setData({ isLoading: false });
        
        // 获取页面栈
        const pages = getCurrentPages();
        // 获取上一个页面（主页）
        const prevPage = pages[pages.length - 2];
        
        // 调用上一个页面的方法传递结果
        prevPage.onResultReceived(plateNumber, imagePath);
        
        // 返回主页
        wx.navigateBack();
      })
      .catch(error => {
        console.error('识别失败:', error);
        wx.hideLoading();
        this.setData({ isLoading: false });
        wx.showToast({
          title: '识别失败',
          icon: 'error'
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