// upload.js
const recognizerManager = require('../utils/recognizerManager');

Page({
  data: {
    imagePath: '',
    hasImage: false,
    isLoading: false
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        console.log('选择的图片路径:', tempFilePath);
        this.setData({
          imagePath: tempFilePath,
          hasImage: true
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        // 检查是否是权限问题
        if (err.errMsg && (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('permission') >= 0)) {
          wx.showModal({
            title: '提示',
            content: '需要访问相册权限才能上传图片，是否前往设置？',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        }
      }
    });
  },

  // 上传并识别
  recognizeImage() {
    if (!this.data.hasImage || this.data.isLoading) return;
    
    this.setData({ isLoading: true });
    console.log('开始识别图片:', this.data.imagePath);
    
    // 在开始识别前检查图片是否合法
    wx.getFileInfo({
      filePath: this.data.imagePath,
      success: (res) => {
        console.log('图片文件信息:', res);
        if (res.size <= 0) {
          wx.showToast({
            title: '图片文件无效',
            icon: 'none'
          });
          this.setData({ isLoading: false });
          return;
        }
        
        // 调用车牌识别服务
        this.recognizePlateImage(this.data.imagePath);
      },
      fail: (err) => {
        console.error('获取图片信息失败:', err);
        wx.showToast({
          title: '图片无效',
          icon: 'none'
        });
        this.setData({ isLoading: false });
      }
    });
  },
  
  // 识别车牌图片
  recognizePlateImage(imagePath) {
    console.log('调用识别器进行识别，图片路径:', imagePath);
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
        
        // 调用上一个页面的方法传递结果
        prevPage.onResultReceived(plateNumber, imagePath);
        
        // 返回主页
        wx.navigateBack();
      })
      .catch(error => {
        console.error('识别失败，错误详情:', error);
        wx.hideLoading();
        this.setData({ isLoading: false });
        
        // 显示更详细的错误
        let errorMsg = '识别失败';
        if (error && error.message) {
          errorMsg = error.message;
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2500
        });
      });
  },
  
  // 清除已选图片
  clearImage() {
    this.setData({
      imagePath: '',
      hasImage: false
    });
  },
  
  // 返回主页
  goBack() {
    wx.navigateBack();
  }
}) 